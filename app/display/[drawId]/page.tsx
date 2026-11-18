"use client";

import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { useParams } from "next/navigation";
import { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { LOCALES, SupportedLocale } from "@/constants/locales";
import {
  DisplayAesthetics,
  DEFAULT_DISPLAY_AESTHETICS,
  DrawBroadcastPayload,
} from "@/types/draw";
import {
  getBackdropFromCache,
  removeBackdropFromCache,
} from "@/lib/backdropCache";
import { fetchBackdropFromDashboard } from "@/lib/backdropTransport";

function DisplayContent() {
  const params = useParams();
  const drawId = params.drawId as string;
  const supabase = useMemo(() => createClient(), []);
  const animIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const activeObjectUrlRef = useRef<string | null>(null);
  const loadedHashRef = useRef<string | null>(null);

  const [aesthetics, setAesthetics] = useState<DisplayAesthetics>(DEFAULT_DISPLAY_AESTHETICS);
  const [resolvedBgUrl, setResolvedBgUrl] = useState<string | null>(null);
  const [winnerName, setWinnerName] = useState<string>("");
  const [winnerExtraText, setWinnerExtraText] = useState<string | undefined>(undefined);
  const [displayTarget, setDisplayTarget] = useState<string>("Awaiting Draw Order...");
  const [activeLang, setActiveLang] = useState<SupportedLocale>("en");
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [glitchActive, setGlitchActive] = useState<boolean>(false);
  const [showConfetti, setShowConfetti] = useState<boolean>(false);

  const SHUFFLE_PLACEHOLDERS: Record<SupportedLocale, string[]> = {
    en: ["Selecting Winner...", "Processing Tokens...", "Analyzing Entries..."],
    es: ["Seleccionando Ganador...", "Procesando Fichas...", "Analizando Entradas..."],
    fr: ["Sélection du Gagnant...", "Traitement des Jetons...", "Analyse des Entrées..."],
    ar: ["جاري اختيار الفائز...", "جاري معالجة البيانات...", "جاري تحليل السحب..."],
    zh: ["正在篩選獲勝者...", "正在處理數據代幣...", "正在分析抽獎名单..."],
  };

  useEffect(() => {
    setDisplayTarget(LOCALES[activeLang].awaitingDraw);
    setWinnerName(LOCALES[activeLang].awaitingDraw);
  }, [activeLang]);

  // Restore cached backdrop from IndexedDB immediately on page load/refresh
  useEffect(() => {
    let cancelled = false;
    getBackdropFromCache(drawId).then((cached) => {
      if (cancelled || !cached) return;
      const url = URL.createObjectURL(cached.blob);
      activeObjectUrlRef.current = url;
      loadedHashRef.current = cached.hash;
      setResolvedBgUrl(url);
      setAesthetics((prev) => ({ ...prev, themeBgHash: cached.hash }));
    });
    return () => {
      cancelled = true;
      if (activeObjectUrlRef.current) {
        URL.revokeObjectURL(activeObjectUrlRef.current);
        activeObjectUrlRef.current = null;
      }
    };
  }, [drawId]);

  useEffect(() => {
    if (!aesthetics.themeFont || aesthetics.themeFont.trim() === "") return;

    const fontCleanName = aesthetics.themeFont.trim();
    const titleCasedFont = fontCleanName
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");

    const formattedFontName = titleCasedFont.replace(/\s+/g, "+");
    const linkId = "google-font-link-" + formattedFontName.toLowerCase();

    let linkElement = document.getElementById(linkId) as HTMLLinkElement;
    if (!linkElement) {
      linkElement = document.createElement("link");
      linkElement.id = linkId;
      linkElement.rel = "stylesheet";
      linkElement.href =
        "https://fonts.googleapis.com/css2?family=" + formattedFontName + "&display=swap";
      document.head.appendChild(linkElement);
    }

    document.documentElement.style.setProperty(
      "--event-display-font",
      "'" + titleCasedFont + "', sans-serif"
    );
  }, [aesthetics.themeFont]);

  useEffect(() => {
    const syncBackdropByHash = async (
      nextHash: string | null | undefined,
      channel: RealtimeChannel
    ) => {
      if (nextHash === undefined) return;

      // Backdrop removed by operator -> purge IndexedDB & revoke ObjectURL
      if (nextHash === null) {
        loadedHashRef.current = null;
        if (activeObjectUrlRef.current) {
          URL.revokeObjectURL(activeObjectUrlRef.current);
          activeObjectUrlRef.current = null;
        }
        setResolvedBgUrl(null);
        await removeBackdropFromCache(drawId);
        return;
      }

      // Already active in memory -> 0 bytes transferred
      if (loadedHashRef.current === nextHash && activeObjectUrlRef.current) {
        return;
      }

      // Check local IndexedDB first -> avoids re-streaming on refresh
      const cached = await getBackdropFromCache(drawId, nextHash);
      if (cached) {
        if (activeObjectUrlRef.current) {
          URL.revokeObjectURL(activeObjectUrlRef.current);
        }
        const url = URL.createObjectURL(cached.blob);
        activeObjectUrlRef.current = url;
        loadedHashRef.current = nextHash;
        setResolvedBgUrl(url);
        return;
      }

      // Cache miss -> stream once via BroadcastChannel or WebRTC DataChannel
      try {
        const streamedUrl = await fetchBackdropFromDashboard(drawId, channel, nextHash);
        if (activeObjectUrlRef.current) {
          URL.revokeObjectURL(activeObjectUrlRef.current);
        }
        activeObjectUrlRef.current = streamedUrl;
        loadedHashRef.current = nextHash;
        setResolvedBgUrl(streamedUrl);
      } catch (err) {
        console.error("Failed to stream backdrop from dashboard:", err);
      }
    };

    const applyAestheticsFromPayload = (
      data: Partial<DisplayAesthetics>,
      channel: RealtimeChannel
    ) => {
      setAesthetics((prev) => ({
        themeBgImage: data.themeBgImage !== undefined ? data.themeBgImage : prev.themeBgImage,
        themeBgHash: data.themeBgHash !== undefined ? data.themeBgHash : prev.themeBgHash,
        bgColor: data.bgColor ?? prev.bgColor,
        bgFitMode: data.bgFitMode ?? prev.bgFitMode,
        themeFont: data.themeFont ?? prev.themeFont,
        themeFontSize: data.themeFontSize ?? prev.themeFontSize,
        themeAnim: data.themeAnim ?? prev.themeAnim,
        textColor: data.textColor ?? prev.textColor,
        bgBlurPx: data.bgBlurPx ?? prev.bgBlurPx,
        fontBgEnabled: data.fontBgEnabled ?? prev.fontBgEnabled,
        verticalOffset: data.verticalOffset ?? prev.verticalOffset,
        horizontalAlign: data.horizontalAlign ?? prev.horizontalAlign,
        subTextMode: data.subTextMode ?? prev.subTextMode,
      }));
      void syncBackdropByHash(data.themeBgHash, channel);
    };

    const channel = supabase.channel(`lucky-draw-room:${drawId}`);
    channelRef.current = channel;

    channel
      .on("broadcast", { event: "update-aesthetics" }, (payload) => {
        const data = payload.payload as Partial<DrawBroadcastPayload>;
        if (data.localeCode) setActiveLang(data.localeCode);
        applyAestheticsFromPayload(data, channel);
      })
      .on("broadcast", { event: "trigger-draw" }, (payload) => {
        const data = payload.payload as DrawBroadcastPayload;
        const lang = data.localeCode || "en";

        if (animIntervalRef.current) clearInterval(animIntervalRef.current);

        setActiveLang(lang);
        applyAestheticsFromPayload(data, channel);
        setWinnerName(data.winnerName);
        setWinnerExtraText(data.winnerExtraText);

        setIsAnimating(true);
        setGlitchActive(false);
        setShowConfetti(false);

        const currentPool = SHUFFLE_PLACEHOLDERS[lang];

        const revealWinner = () => {
          setIsAnimating(false);
          setDisplayTarget(data.winnerName);
          setShowConfetti(true);
        };

        if (data.themeAnim === "anim-shuffle") {
          let cycles = 0;
          animIntervalRef.current = setInterval(() => {
            setDisplayTarget(currentPool[Math.floor(Math.random() * currentPool.length)]);
            cycles++;
            if (cycles > 12) {
              if (animIntervalRef.current) clearInterval(animIntervalRef.current);
              revealWinner();
            }
          }, 100);
        } else if (data.themeAnim === "anim-slot") {
          let cycles = 0;
          animIntervalRef.current = setInterval(() => {
            setDisplayTarget(`[ ${Math.floor(Math.random() * 90000 + 10000)} ]`);
            cycles++;
            if (cycles > 15) {
              if (animIntervalRef.current) clearInterval(animIntervalRef.current);
              revealWinner();
            }
          }, 80);
        } else if (data.themeAnim === "anim-glitch") {
          setGlitchActive(true);
          let cycles = 0;
          animIntervalRef.current = setInterval(() => {
            setDisplayTarget(Math.random().toString(36).substring(2, 10).toUpperCase());
            cycles++;
            if (cycles > 10) {
              if (animIntervalRef.current) clearInterval(animIntervalRef.current);
              setGlitchActive(false);
              revealWinner();
            }
          }, 70);
        } else {
          revealWinner();
        }
      })
      .on("broadcast", { event: "reset-draw" }, (payload) => {
        if (animIntervalRef.current) clearInterval(animIntervalRef.current);
        const data = payload?.payload as { localeCode?: SupportedLocale };
        const lang = data?.localeCode || "en";
        setActiveLang(lang);
        setWinnerName(LOCALES[lang].awaitingDraw);
        setDisplayTarget(LOCALES[lang].awaitingDraw);
        setWinnerExtraText(undefined);
        setIsAnimating(false);
        setGlitchActive(false);
        setShowConfetti(false);
      })
      .subscribe();

    return () => {
      if (animIntervalRef.current) clearInterval(animIntervalRef.current);
      channelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [drawId, supabase]);
  const verticalAlignClass =
    aesthetics.verticalOffset === "top"
      ? "justify-start pt-[6vh]"
      : aesthetics.verticalOffset === "bottom"
      ? "justify-end pb-[6vh]"
      : "justify-center";

  const horizontalItemsClass =
    aesthetics.horizontalAlign === "left"
      ? "items-start"
      : aesthetics.horizontalAlign === "right"
      ? "items-end"
      : "items-center";

  const textAlignmentClass =
    aesthetics.horizontalAlign === "left"
      ? "text-left items-start"
      : aesthetics.horizontalAlign === "right"
      ? "text-right items-end"
      : "text-center items-center";

  const bgObjectPosition =
    aesthetics.horizontalAlign === "left"
      ? "left center"
      : aesthetics.horizontalAlign === "right"
      ? "right center"
      : "center center";

  const activeBackdropSrc = resolvedBgUrl || aesthetics.themeBgImage;

  const showExtraLine =
    !isAnimating &&
    Boolean(winnerExtraText) &&
    aesthetics.subTextMode !== "hidden";

  const effectiveSubTextMode =
    aesthetics.verticalOffset === "bottom" && aesthetics.subTextMode === "below"
      ? "above"
      : aesthetics.subTextMode;

  const CONFETTI_PIECES = Array.from({ length: 36 }, (_, idx) => {
    const colours = ["#fbbf24", "#34d399", "#60a5fa", "#f472b6", "#a78bfa", "#fb923c"];
    return {
      id: idx,
      leftPct: (idx * 2.8) % 100,
      delaySec: (idx % 9) * 0.12,
      durationSec: 2.4 + (idx % 5) * 0.35,
      colour: colours.at(idx % colours.length) || "#fbbf24",
      rotateDeg: (idx * 47) % 360,
    };
  });

  return (
    <main
      style={{
        fontFamily: "var(--event-display-font, system-ui, sans-serif)",
        backgroundColor: activeBackdropSrc ? "#09090b" : aesthetics.bgColor || "#09090b",
      }}
      className={`w-screen h-screen flex flex-col ${horizontalItemsClass} ${verticalAlignClass} px-8 py-6 overflow-hidden select-none relative text-white transition-all duration-500`}
    >
      <style>{`
        @keyframes toloConfettiFall {
          0% {
            transform: translateY(-12vh) rotate(0deg);
            opacity: 1;
          }
          85% {
            opacity: 1;
          }
          100% {
            transform: translateY(108vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>

      {/* WINNER REVEAL CSS CONFETTI */}
      {showConfetti && (
        <div
          aria-hidden="true"
          className="fixed inset-0 overflow-hidden pointer-events-none z-20"
        >
          {CONFETTI_PIECES.map((piece) => (
            <span
              key={piece.id}
              style={{
                left: `${piece.leftPct}%`,
                backgroundColor: piece.colour,
                transform: `rotate(${piece.rotateDeg}deg)`,
                animation: `toloConfettiFall ${piece.durationSec}s ease-in ${piece.delaySec}s forwards`,
              }}
              className="absolute top-0 w-2.5 h-4 rounded-xs opacity-0"
            />
          ))}
        </div>
      )}

      {/* BACKDROP IMAGE + STRETCH / ASPECT RATIO + DYNAMIC BLUR */}
      {activeBackdropSrc ? (
        <img
          src={activeBackdropSrc}
          alt="Event Display Backdrop"
          style={{
            objectPosition: bgObjectPosition,
            filter: aesthetics.bgBlurPx > 0 ? `blur(${aesthetics.bgBlurPx}px)` : "none",
            transform: aesthetics.bgBlurPx > 0 ? "scale(1.04)" : "scale(1)",
          }}
          className={`fixed inset-0 w-screen h-screen ${
            aesthetics.bgFitMode === "contain" ? "object-contain" : "object-fill"
          } select-none pointer-events-none z-0 transition-all duration-500 animate-fade-in`}
        />
      ) : (
        <div
          style={{
            filter: `blur(${Math.max(150, aesthetics.bgBlurPx * 8)}px)`,
          }}
          className="absolute w-[40vw] h-[40vw] rounded-full opacity-10 bg-amber-500 top-1/4 left-1/4 animate-pulse pointer-events-none z-0"
        />
      )}

      {/* VIEWPORT-CONTAINED OVERLAY DISPLAY CORE */}
      <div
        className={`w-full max-w-[92vw] max-h-[84vh] rounded-[2.5rem] flex flex-col justify-center px-8 py-10 relative z-10 transition-all duration-500 ${
          aesthetics.fontBgEnabled
            ? "border border-white/10 bg-black/45 backdrop-blur-2xl shadow-[0_0_120px_rgba(0,0,0,0.7)]"
            : "border border-transparent bg-transparent backdrop-blur-none shadow-none"
        }`}
      >
        {aesthetics.fontBgEnabled && (
          <div
            className={`absolute inset-0 border-2 rounded-[2.5rem] pointer-events-none transition-all duration-500 ${
              isAnimating
                ? "border-white/20 shadow-[inset_0_0_60px_rgba(255,255,255,0.03)]"
                : "border-white/0"
            }`}
          />
        )}

        <div
          className={`w-full max-w-full flex flex-col justify-center gap-4 ${textAlignmentClass}`}
        >
          {/* EXTRA EXCEL LINE (ABOVE) */}
          {showExtraLine && effectiveSubTextMode === "above" && (
            <p
              style={{
                color: aesthetics.textColor,
                fontSize: `${Math.min(4.5, Math.max(1.2, aesthetics.themeFontSize * 0.28))}vw`,
              }}
              className="font-bold tracking-wide opacity-90 max-w-full break-words whitespace-normal transition-all duration-300"
            >
              {winnerExtraText}
            </p>
          )}

          {/* MAIN WINNER DISPLAY */}
          <div className="max-w-full px-2">
            <span
              style={{
                color: isAnimating ? "#71717a" : aesthetics.textColor,
                fontFamily: "var(--event-display-font, inherit)",
                fontSize: `${aesthetics.themeFontSize}vw`,
              }}
              className={`block max-w-full break-words whitespace-normal font-black leading-[1.08] tracking-tight transition-all duration-300 transform-gpu ${
                glitchActive ? "skew-x-12 scale-y-75 blur-[1px] text-red-500" : ""
              } ${
                !isAnimating &&
                aesthetics.themeAnim === "anim-zoom-pop" &&
                winnerName !== LOCALES[activeLang].awaitingDraw
                  ? "animate-[ping_0.4s_ease-out_1] scale-100"
                  : ""
              } ${isAnimating ? "scale-95 blur-[4px]" : "scale-100"}`}
            >
              {displayTarget}
            </span>
          </div>

          {/* EXTRA EXCEL LINE (BELOW) */}
          {showExtraLine && effectiveSubTextMode === "below" && (
            <p
              style={{
                color: aesthetics.textColor,
                fontSize: `${Math.min(4.5, Math.max(1.2, aesthetics.themeFontSize * 0.28))}vw`,
              }}
              className="font-bold tracking-wide opacity-90 max-w-full break-words whitespace-normal transition-all duration-300"
            >
              {winnerExtraText}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

export default function DisplayPage() {
  return (
    <Suspense fallback={<div className="w-screen h-screen bg-zinc-950" />}>
      <DisplayContent />
    </Suspense>
  );
}
