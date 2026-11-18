// lib/backdropTransport.ts
import { RealtimeChannel } from "@supabase/supabase-js";
import { computeBlobSha256, saveBackdropToCache } from "@/lib/backdropCache";

const CHUNK_SIZE = 64 * 1024; // 64 KB WebRTC safe frame size
const MAX_BUFFERED_AMOUNT = 4 * 1024 * 1024; // 4 MB send buffer ceiling
const MAX_FALLBACK_CLIENTS = 5; // Guardrail: max 5 display clients allowed to pull from Supabase Storage
const P2P_FALLBACK_TIMEOUT_MS = 4500; // Trigger cloud fallback if P2P hasn't opened within 4.5s

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
  ],
};

function safeBroadcast(
  channel: RealtimeChannel,
  event: string,
  payload: unknown
) {
  if ((channel as any).state === "joined") {
    void channel.send({ type: "broadcast", event, payload });
  }
}

interface BackdropRequestSignal {
  requesterId: string;
  hash: string;
}

interface BackdropOfferSignal {
  targetId: string;
  hash: string;
  mimeType: string;
  totalBytes: number;
  sdp: RTCSessionDescriptionInit;
}

interface BackdropAnswerSignal {
  targetId: string;
  sdp: RTCSessionDescriptionInit;
}

interface BackdropIceSignal {
  targetId: string;
  candidate: RTCIceCandidateInit;
}

interface BackdropFallbackUrlSignal {
  targetId: string;
  hash: string;
  signedReadUrl?: string;
  rejectedReason?: string;
}

export interface BackdropSenderHandle {
  detach: () => void;
  purgeCloudFallback: () => Promise<void>;
}

/**
 * Attaches the Dashboard-side sender listeners:
 * Tier 1: Same-device BroadcastChannel
 * Tier 2: Cross-network WebRTC DataChannel
 * Tier 3: Ephemeral Supabase Storage fallback (capped at first 5 display clients & 10 uploads/4h)
 */
export function attachBackdropSender(
  drawId: string,
  channel: RealtimeChannel,
  getActiveFile: () => { file: File; hash: string } | null
): BackdropSenderHandle {
  const peerConnections = new Map<string, RTCPeerConnection>();

  let cloudCache: {
    hash: string;
    signedReadUrl: string;
    storagePath: string;
    grantedClients: Set<string>;
  } | null = null;
  let pendingUploadPromise: Promise<{
    signedReadUrl: string;
    storagePath: string;
  } | null> | null = null;

  const purgeCloudFallback = async () => {
    if (!cloudCache) return;
    const pathToDelete = cloudCache.storagePath;
    cloudCache = null;
    try {
      await fetch("/api/upload/backdrop", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storagePath: pathToDelete }),
      });
    } catch {
      // Best-effort immediate purge; 4-hour server TTL remains active as backup
    }
  };

  // Tier 1: Same-browser BroadcastChannel listener
  let bc: BroadcastChannel | null = null;
  if (typeof BroadcastChannel !== "undefined") {
    bc = new BroadcastChannel(`tolo-backdrop-bc:${drawId}`);
    bc.onmessage = (event: MessageEvent) => {
      const msg = event.data;
      if (msg?.type === "bc-request") {
        const current = getActiveFile();
        if (current && current.hash === msg.hash) {
          bc?.postMessage({
            type: "bc-blob",
            hash: current.hash,
            blob: current.file,
          });
        }
      }
    };
  }
  // Tier 2: Cross-network WebRTC DataChannel responder
  const handleRequest = async (payload: BackdropRequestSignal) => {
    const current = getActiveFile();
    if (!current || current.hash !== payload.hash) return;

    const { requesterId } = payload;
    const existingPc = peerConnections.get(requesterId);
    if (existingPc) {
      existingPc.close();
      peerConnections.delete(requesterId);
    }

    const pc = new RTCPeerConnection(RTC_CONFIG);
    peerConnections.set(requesterId, pc);

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        safeBroadcast(channel, "backdrop-ice", {
          targetId: requesterId,
          candidate: e.candidate.toJSON(),
        } satisfies BackdropIceSignal);
      }
    };

    pc.onconnectionstatechange = () => {
      if (
        pc.connectionState === "failed" ||
        pc.connectionState === "closed" ||
        pc.connectionState === "disconnected"
      ) {
        pc.close();
        peerConnections.delete(requesterId);
      }
    };

    const dataChannel = pc.createDataChannel("backdrop-stream", {
      ordered: true,
    });
    dataChannel.binaryType = "arraybuffer";
    dataChannel.bufferedAmountLowThreshold = 512 * 1024;

    dataChannel.onopen = async () => {
      try {
        const buffer = await current.file.arrayBuffer();
        let offset = 0;

        while (offset < buffer.byteLength) {
          if (dataChannel.readyState !== "open") break;

          if (dataChannel.bufferedAmount > MAX_BUFFERED_AMOUNT) {
            await new Promise<void>((resolve) => {
              const onLow = () => {
                dataChannel.removeEventListener("bufferedamountlow", onLow);
                resolve();
              };
              dataChannel.addEventListener("bufferedamountlow", onLow);
            });
          }

          const slice = buffer.slice(offset, offset + CHUNK_SIZE);
          dataChannel.send(slice);
          offset += CHUNK_SIZE;
        }

        if (dataChannel.readyState === "open") {
          dataChannel.send(JSON.stringify({ type: "EOF" }));
        }
      } catch (err) {
        console.error("WebRTC backdrop stream error:", err);
      }
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    safeBroadcast(channel, "backdrop-offer", {
      targetId: requesterId,
      hash: current.hash,
      mimeType: current.file.type || "image/png",
      totalBytes: current.file.size,
      sdp: offer,
    } satisfies BackdropOfferSignal);
  };

  // Tier 3: Firewall-blocked fallback (enforces first 5 clients cap & 10/4h server limit)
  const handleFallbackRequest = async (payload: BackdropRequestSignal) => {
    const current = getActiveFile();
    if (!current || current.hash !== payload.hash) return;

    const { requesterId, hash } = payload;

    if (cloudCache && cloudCache.hash !== hash) {
      await purgeCloudFallback();
    }

    if (cloudCache && cloudCache.hash === hash) {
      if (
        !cloudCache.grantedClients.has(requesterId) &&
        cloudCache.grantedClients.size >= MAX_FALLBACK_CLIENTS
      ) {
        safeBroadcast(channel, "backdrop-fallback-url", {
          targetId: requesterId,
          hash,
          rejectedReason: "Cloud fallback limit reached (first 5 display screens only).",
        } satisfies BackdropFallbackUrlSignal);
        return;
      }

      cloudCache.grantedClients.add(requesterId);
      safeBroadcast(channel, "backdrop-fallback-url", {
        targetId: requesterId,
        hash,
        signedReadUrl: cloudCache.signedReadUrl,
      } satisfies BackdropFallbackUrlSignal);
      return;
    }

    if (!pendingUploadPromise) {
      pendingUploadPromise = (async () => {
        try {
          const signRes = await fetch("/api/upload/backdrop", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              drawId,
              hash,
              mimeType: current.file.type || "image/png",
              fileSize: current.file.size,
            }),
          });

          const signJson = await signRes.json();
          if (!signRes.ok) {
            return {
              signedReadUrl: "",
              storagePath: "",
              error: signJson.error || "Cloud fallback rejected by server guardrail.",
            } as any;
          }

          const uploadRes = await fetch(signJson.signedUploadUrl, {
            method: "PUT",
            headers: {
              "Content-Type": current.file.type || "image/png",
            },
            body: current.file,
          });

          if (!uploadRes.ok) {
            return {
              signedReadUrl: "",
              storagePath: "",
              error: "Direct storage upload failed.",
            } as any;
          }

          return {
            signedReadUrl: signJson.signedReadUrl,
            storagePath: signJson.storagePath,
          };
        } finally {
          pendingUploadPromise = null;
        }
      })();
    }

    const result: any = await pendingUploadPromise;
    if (!result || !result.signedReadUrl) {
      safeBroadcast(channel, "backdrop-fallback-url", {
        targetId: requesterId,
        hash,
        rejectedReason: result?.error || "Cloud fallback unavailable.",
      } satisfies BackdropFallbackUrlSignal);
      return;
    }

    if (!cloudCache) {
      cloudCache = {
        hash,
        signedReadUrl: result.signedReadUrl,
        storagePath: result.storagePath,
        grantedClients: new Set<string>(),
      };
    }

    if (
      !cloudCache.grantedClients.has(requesterId) &&
      cloudCache.grantedClients.size >= MAX_FALLBACK_CLIENTS
    ) {
      safeBroadcast(channel, "backdrop-fallback-url", {
        targetId: requesterId,
        hash,
        rejectedReason: "Cloud fallback limit reached (first 5 display screens only).",
      } satisfies BackdropFallbackUrlSignal);
      return;
    }

    cloudCache.grantedClients.add(requesterId);
    safeBroadcast(channel, "backdrop-fallback-url", {
      targetId: requesterId,
      hash,
      signedReadUrl: cloudCache.signedReadUrl,
    } satisfies BackdropFallbackUrlSignal);
  };
  channel
    .on("broadcast", { event: "backdrop-request" }, ({ payload }) => {
      handleRequest(payload as BackdropRequestSignal);
    })
    .on("broadcast", { event: "backdrop-fallback-request" }, ({ payload }) => {
      handleFallbackRequest(payload as BackdropRequestSignal);
    })
    .on("broadcast", { event: "backdrop-answer" }, async ({ payload }) => {
      const data = payload as BackdropAnswerSignal;
      const pc = peerConnections.get(data.targetId);
      if (pc && pc.signalingState !== "closed") {
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      }
    })
    .on("broadcast", { event: "backdrop-ice" }, async ({ payload }) => {
      const data = payload as BackdropIceSignal;
      const pc = peerConnections.get(data.targetId);
      if (pc && pc.signalingState !== "closed") {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    });

  return {
    detach: () => {
      bc?.close();
      peerConnections.forEach((pc) => pc.close());
      peerConnections.clear();
    },
    purgeCloudFallback,
  };
}

/**
 * Requests a missing backdrop from the Dashboard:
 * 1. Tries same-device BroadcastChannel (< 50 ms)
 * 2. Tries cross-network WebRTC DataChannel (0 MB Supabase egress)
 * 3. If WebRTC is blocked by a strict firewall after 4.5s, requests the guarded
 *    Supabase Storage signed URL (capped at first 5 clients & 10 uploads / 4h).
 */
export function fetchBackdropFromDashboard(
  drawId: string,
  channel: RealtimeChannel,
  expectedHash: string,
  timeoutMs = 25000
): Promise<string> {
  return new Promise((resolve, reject) => {
    const requesterId = crypto.randomUUID();
    let settled = false;
    let p2pConnected = false;
    let fallbackRequested = false;
    let pc: RTCPeerConnection | null = null;
    let bc: BroadcastChannel | null = null;

    const cleanup = () => {
      clearTimeout(hardTimer);
      clearTimeout(p2pFallbackTimer);
      bc?.close();
      if (pc) {
        pc.close();
        pc = null;
      }
    };

    const finishWithBlob = async (blob: Blob) => {
      if (settled) return;
      settled = true;
      try {
        const actualHash = await computeBlobSha256(blob);
        if (actualHash !== expectedHash) {
          cleanup();
          reject(new Error("Backdrop SHA-256 integrity mismatch."));
          return;
        }
        await saveBackdropToCache(drawId, expectedHash, blob);
        const objectUrl = URL.createObjectURL(blob);
        cleanup();
        resolve(objectUrl);
      } catch (err) {
        cleanup();
        reject(err);
      }
    };

    const requestCloudFallback = () => {
      if (settled || p2pConnected || fallbackRequested) return;
      fallbackRequested = true;
      safeBroadcast(channel, "backdrop-fallback-request", {
        requesterId,
        hash: expectedHash,
      } satisfies BackdropRequestSignal);
    };

    const hardTimer = setTimeout(() => {
      if (!settled) {
        settled = true;
        cleanup();
        reject(new Error("Timed out waiting for backdrop from dashboard."));
      }
    }, timeoutMs);

    const p2pFallbackTimer = setTimeout(() => {
      requestCloudFallback();
    }, P2P_FALLBACK_TIMEOUT_MS);

    // 1. Try Tier 1: Same-device BroadcastChannel immediately
    if (typeof BroadcastChannel !== "undefined") {
      bc = new BroadcastChannel(`tolo-backdrop-bc:${drawId}`);
      bc.onmessage = (event: MessageEvent) => {
        const msg = event.data;
        if (
          msg?.type === "bc-blob" &&
          msg.hash === expectedHash &&
          msg.blob instanceof Blob
        ) {
          finishWithBlob(msg.blob);
        }
      };
      bc.postMessage({ type: "bc-request", hash: expectedHash });
    }

    // 2. Prepare Tier 2: WebRTC P2P receiver
    pc = new RTCPeerConnection(RTC_CONFIG);

    pc.onicecandidate = (e) => {
      if (e.candidate && !settled) {
        safeBroadcast(channel, "backdrop-ice", {
          targetId: requesterId,
          candidate: e.candidate.toJSON(),
        } satisfies BackdropIceSignal);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc?.connectionState === "failed" || pc?.connectionState === "disconnected") {
        requestCloudFallback();
      }
    };

    let incomingChunks: ArrayBuffer[] = [];
    let incomingMime = "image/png";

    pc.ondatachannel = (event) => {
      const dc = event.channel;
      dc.binaryType = "arraybuffer";

      dc.onopen = () => {
        p2pConnected = true;
        clearTimeout(p2pFallbackTimer);
      };

      dc.onmessage = (msgEvent) => {
        if (settled) return;

        if (typeof msgEvent.data === "string") {
          try {
            const ctrl = JSON.parse(msgEvent.data);
            if (ctrl.type === "EOF") {
              const assembledBlob = new Blob(incomingChunks, {
                type: incomingMime,
              });
              incomingChunks = [];
              finishWithBlob(assembledBlob);
            }
          } catch {
            // Ignore non-JSON control strings
          }
          return;
        }

        if (msgEvent.data instanceof ArrayBuffer) {
          incomingChunks.push(msgEvent.data);
        }
      };
    };

    channel
      .on("broadcast", { event: "backdrop-offer" }, async ({ payload }) => {
        const offerData = payload as BackdropOfferSignal;
        if (offerData.targetId !== requesterId || settled || !pc) return;

        incomingMime = offerData.mimeType || "image/png";
        await pc.setRemoteDescription(new RTCSessionDescription(offerData.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        safeBroadcast(channel, "backdrop-answer", {
          targetId: requesterId,
          sdp: answer,
        } satisfies BackdropAnswerSignal);
      })
      .on("broadcast", { event: "backdrop-ice" }, async ({ payload }) => {
        const iceData = payload as BackdropIceSignal;
        if (iceData.targetId !== requesterId || settled || !pc) return;
        await pc.addIceCandidate(new RTCIceCandidate(iceData.candidate));
      })
      .on("broadcast", { event: "backdrop-fallback-url" }, async ({ payload }) => {
        const fb = payload as BackdropFallbackUrlSignal;
        if (fb.targetId !== requesterId || fb.hash !== expectedHash || settled) return;

        if (fb.rejectedReason || !fb.signedReadUrl) {
          settled = true;
          cleanup();
          reject(new Error(fb.rejectedReason || "Cloud fallback rejected."));
          return;
        }

        try {
          const res = await fetch(fb.signedReadUrl);
          if (!res.ok) {
            throw new Error(`Failed to fetch fallback image (${res.status}).`);
          }
          const blob = await res.blob();
          await finishWithBlob(blob);
        } catch (err) {
          if (!settled) {
            settled = true;
            cleanup();
            reject(err);
          }
        }
      });

    // Announce cache miss to Dashboard
    safeBroadcast(channel, "backdrop-request", {
      requesterId,
      hash: expectedHash,
    } satisfies BackdropRequestSignal);
  });
}
