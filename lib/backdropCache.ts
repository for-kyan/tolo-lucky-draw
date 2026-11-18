// lib/backdropCache.ts

export const MAX_BACKDROP_BYTES = 30 * 1024 * 1024; // 30 MB

export const ALLOWED_BACKDROP_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
  detectedMime?: string;
}

/**
 * Validates file size (<= 30 MB) and inspects binary magic bytes
 * so renamed non-image files cannot bypass extension/MIME checks.
 */
export async function validateBackdropImage(
  file: File
): Promise<ImageValidationResult> {
  if (!file) {
    return { valid: false, error: "No file selected." };
  }

  if (file.size === 0) {
    return { valid: false, error: "The selected image file is empty." };
  }

  if (file.size > MAX_BACKDROP_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `Image is ${sizeMb} MB. Maximum allowed size is 30 MB.`,
    };
  }

  const headerBuffer = await file.slice(0, 12).arrayBuffer();
  const b = Array.from(new Uint8Array(headerBuffer));

  // JPEG: FF D8 FF
  const isJpeg =
    b.length >= 3 && b.at(0) === 0xff && b.at(1) === 0xd8 && b.at(2) === 0xff;

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  const isPng =
    b.length >= 8 &&
    b.at(0) === 0x89 &&
    b.at(1) === 0x50 &&
    b.at(2) === 0x4e &&
    b.at(3) === 0x47 &&
    b.at(4) === 0x0d &&
    b.at(5) === 0x0a &&
    b.at(6) === 0x1a &&
    b.at(7) === 0x0a;

  // GIF: "GIF87a" or "GIF89a"
  const isGif =
    b.length >= 6 &&
    b.at(0) === 0x47 &&
    b.at(1) === 0x49 &&
    b.at(2) === 0x46 &&
    b.at(3) === 0x38 &&
    (b.at(4) === 0x37 || b.at(4) === 0x39) &&
    b.at(5) === 0x61;

  // WebP: "RIFF" .... "WEBP"
  const isWebp =
    b.length >= 12 &&
    b.at(0) === 0x52 &&
    b.at(1) === 0x49 &&
    b.at(2) === 0x46 &&
    b.at(3) === 0x46 &&
    b.at(8) === 0x57 &&
    b.at(9) === 0x45 &&
    b.at(10) === 0x42 &&
    b.at(11) === 0x50;

  let detectedMime: string | undefined;
  if (isJpeg) detectedMime = "image/jpeg";
  else if (isPng) detectedMime = "image/png";
  else if (isGif) detectedMime = "image/gif";
  else if (isWebp) detectedMime = "image/webp";

  if (!detectedMime || !ALLOWED_BACKDROP_MIMES.has(detectedMime)) {
    return {
      valid: false,
      error:
        "Unsupported image format. Please upload a valid JPG, PNG, WebP, or GIF file.",
    };
  }

  return { valid: true, detectedMime };
}

/**
 * Computes a SHA-256 hex digest for content-based deduplication.
 */
export async function computeBlobSha256(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

// --- IndexedDB Binary Cache (1 record per drawId) ---

const DB_NAME = "tolo-backdrop-cache-v1";
const STORE_NAME = "backdrops";

interface CachedBackdropRecord {
  drawId: string;
  hash: string;
  mimeType: string;
  blob: Blob;
  updatedAt: number;
}

function openBackdropDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is unavailable in this environment."));
      return;
    }

    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "drawId" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveBackdropToCache(
  drawId: string,
  hash: string,
  blob: Blob
): Promise<void> {
  const db = await openBackdropDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const record: CachedBackdropRecord = {
      drawId,
      hash,
      mimeType: blob.type || "application/octet-stream",
      blob,
      updatedAt: Date.now(),
    };
    store.put(record);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export async function getBackdropFromCache(
  drawId: string,
  expectedHash?: string | null
): Promise<{ blob: Blob; hash: string } | null> {
  try {
    const db = await openBackdropDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(drawId);

      req.onsuccess = () => {
        db.close();
        const record = req.result as CachedBackdropRecord | undefined;
        if (!record) {
          resolve(null);
          return;
        }
        if (expectedHash && record.hash !== expectedHash) {
          resolve(null);
          return;
        }
        resolve({ blob: record.blob, hash: record.hash });
      };

      req.onerror = () => {
        db.close();
        reject(req.error);
      };
    });
  } catch {
    return null;
  }
}

export async function removeBackdropFromCache(drawId: string): Promise<void> {
  try {
    const db = await openBackdropDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(drawId);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  } catch {
    // Ignore storage cleanup errors in restricted/private browsing contexts
  }
}
