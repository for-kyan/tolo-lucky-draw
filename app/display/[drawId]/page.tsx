"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LOCALES, SupportedLocale } from "@/constants/locales";

interface BroadcastPayload {
  winnerName: string;
  themeBgImage: string | null;
  themeFont: string;
  themeAnim: string;
  textColor: string;
  localeCode: SupportedLocale;
}

function DisplayContent() {
  const params = useParams();
  const drawId = params.drawId as string;
  const supabase = createClient();

  // Passive Aesthetics Display Rendering States
  const [winnerName, setWinnerName] = useState<string>("");
  const [remoteBgImage, setRemoteBgImage] = useState<string | null>(null);
  const [currentFont, setCurrentFont] = useState<string>("Inter");
  const [currentAnim, setCurrentAnim] = useState<string>("anim-shuffle");
  const [customHexColor, setCustomHexColor] = useState<string>("#fbbf24");
  const [glitchActive, setGlitchActive] = useState<boolean>(false);
  
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [activeLang, setActiveLang] = useState<SupportedLocale>("en");
  const [displayTarget, setDisplayTarget] = useState<string>("Awaiting Draw Order...");

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

  // RUNTIME GOOGLE FONTS SYNC ENFORCER (CASE-SENSITIVE API PATCH & TITLE CASING FIX)
  useEffect(() => {
    if (!currentFont || currentFont.trim() === "") return;

    // Preserve the exact casing (e.g., "Cinzel", "Playfair Display", "Bungee Spice")
    const fontCleanName = currentFont.trim();
    
    // Capitalize words cleanly to ensure single-weight fonts like Bungee Spice resolve properly
    const titleCasedFont = fontCleanName
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");

    const formattedFontName = titleCasedFont.replace(/\s+/g, "+");
    
    // Lowercase is ONLY used here for the HTML element ID attribute
    const linkId = "google-font-link-" + formattedFontName.toLowerCase();
    
    let linkElement = document.getElementById(linkId) as HTMLLinkElement;
    if (!linkElement) {
      linkElement = document.createElement("link");
      linkElement.id = linkId;
      linkElement.rel = "stylesheet";
      
      // CASE-SENSITIVE PATH PINNING: Supports standard and custom display fonts out of the box
      linkElement.href = "https://fonts.googleapis.com/css2?family=" + formattedFontName + "&display=swap";
      
      document.head.appendChild(linkElement);
    }

    // Force style re-evaluation across the entire viewport document tree
    document.documentElement.style.setProperty("--event-display-font", "'" + titleCasedFont + "', sans-serif");
  }, [currentFont]);

  useEffect(() => {
    const channel = supabase
      .channel(`lucky-draw-room:${drawId}`)
      .on("broadcast", { event: "trigger-draw" }, (payload) => {
        const data = payload.payload as BroadcastPayload;
        const lang = data.localeCode || "en";

        setActiveLang(lang);
        setRemoteBgImage(data.themeBgImage);
        setCurrentFont(data.themeFont);
        setCurrentAnim(data.themeAnim);
        setWinnerName(data.winnerName);
        setCustomHexColor(data.textColor || "#fbbf24");

        setIsAnimating(true);
        setGlitchActive(false);

        const currentPool = SHUFFLE_PLACEHOLDERS[lang];

        // FIVE-TIER VELOCITY ANIMATION MATRICES ENGINE
        if (data.themeAnim === "anim-shuffle") {
          let cycles = 0;
          const interval = setInterval(() => {
            setDisplayTarget(currentPool[Math.floor(Math.random() * currentPool.length)]);
            cycles++;
            if (cycles > 12) {
              clearInterval(interval);
              setIsAnimating(false);
              setDisplayTarget(data.winnerName);
            }
          }, 100);
        } else if (data.themeAnim === "anim-slot") {
          let cycles = 0;
          const interval = setInterval(() => {
            setDisplayTarget(`[ ${Math.floor(Math.random() * 90000 + 10000)} ]`);
            cycles++;
            if (cycles > 15) {
              clearInterval(interval);
              setIsAnimating(false);
              setDisplayTarget(data.winnerName);
            }
          }, 80);
        } else if (data.themeAnim === "anim-glitch") {
          setGlitchActive(true);
          let cycles = 0;
          const interval = setInterval(() => {
            setDisplayTarget(Math.random().toString(36).substring(2, 10).toUpperCase());
            cycles++;
            if (cycles > 10) {
              clearInterval(interval);
              setGlitchActive(false);
              setIsAnimating(false);
              setDisplayTarget(data.winnerName);
            }
          }, 70);
        } else {
          setIsAnimating(false);
          setDisplayTarget(data.winnerName);
        }
      })
      .on("broadcast", { event: "reset-draw" }, (payload) => {
        const data = payload?.payload as { localeCode?: SupportedLocale };
        const lang = data?.localeCode || "en";
        setActiveLang(lang);
        setWinnerName(LOCALES[lang].awaitingDraw);
        setDisplayTarget(LOCALES[lang].awaitingDraw);
        setRemoteBgImage(null);
        setIsAnimating(false);
        setGlitchActive(false);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [drawId, supabase]);

  return (
    <main
      style={{ fontFamily: "var(--event-display-font, system-ui, sans-serif)" }} 
      className="w-screen h-screen flex flex-col items-center justify-center p-12 overflow-hidden select-none relative bg-zinc-950 text-white"
    >
      {/* VLC-STYLE ASPECT RATIO FILL SCALING FIX */}
      {remoteBgImage ? (
        <img 
          src={remoteBgImage} 
          alt="VLC-Style Fill Backdrop" 
          className="fixed inset-0 w-screen h-screen object-fill select-none pointer-events-none z-0 transition-all duration-700 animate-fade-in" 
        />
      ) : (
        <div className="absolute w-[40vw] h-[40vw] rounded-full filter blur-[150px] opacity-10 bg-amber-500 top-1/4 left-1/4 animate-pulse pointer-events-none z-0" />
      )}

      {/* RESOLUTION INDEPENDENT OVERLAY DISPLAY CORE */}
      <div className="w-full max-w-[90vw] h-[65vh] rounded-[2.5rem] border border-white/5 bg-black/40 backdrop-blur-3xl flex flex-col items-center justify-center p-8 relative shadow-[0_0_120px_rgba(0,0,0,0.7)] z-10">
        <div className={`absolute inset-0 border-2 rounded-[2.5rem] pointer-events-none transition-all duration-500 ${isAnimating ? "border-white/20 shadow-[inset_0_0_60px_rgba(255,255,255,0.03)]" : "border-white/0"}`} />
        <div className="text-center w-full max-w-[85vw] overflow-hidden px-4">
          <span 
            // ✅ INHERIT FORCED TYPOGRAPHY: Cascades the variable explicitly down to shuffling placeholders
            style={{ 
              color: isAnimating ? "#71717a" : customHexColor,
              fontFamily: "var(--event-display-font, inherit)"
            }} 
            className={`block text-[8vw] font-black leading-none tracking-tight transition-all duration-300 transform-gpu ${
              glitchActive ? "skew-x-12 scale-y-75 blur-[1px] text-red-500" : ""
            } ${
              !isAnimating && currentAnim === "anim-zoom-pop" && winnerName !== LOCALES[activeLang].awaitingDraw ? "animate-[ping_0.4s_ease-out_1] scale-100" : ""
            } ${
              isAnimating ? "scale-95 blur-[4px]" : "scale-100"
            }`}
          >
            {displayTarget}
          </span>
        </div>
      </div>
    </main>
  );
}

export default function DisplayPage() {
  return (
    <Suspense fallback={<div className="w-screen h-screen flex items-center justify-center bg-zinc-950 text-zinc-500 font-mono text-xs animate-pulse">CONNECTING_LIVE_PRESENTATION_CANVAS...</div>}>
      <DisplayContent />
    </Suspense>
  );
}
