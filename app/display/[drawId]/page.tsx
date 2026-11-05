// =============================================================================
// [LINES 1-35: RECTIFIED COMPONENT ENGINE LOGIC & BROADCST CONTRACT HOOKS]
// =============================================================================
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface BroadcastPayload {
  winnerName: string;
  themeBgImage: string | null;
  themeFont: string;
  themeAnim: string;
  textColor: string;
}

export default function DisplayPage() {
  const params = useParams();
  const drawId = params.drawId as string;
  const supabase = createClient();

  // Passive Aesthetics Display Rendering States
  const [winnerName, setWinnerName] = useState<string>("Awaiting Draw Order...");
  const [remoteBgImage, setRemoteBgImage] = useState<string | null>(null);
  const [currentFont, setCurrentFont] = useState<string>("Inter");
  const [currentAnim, setCurrentAnim] = useState<string>("anim-shuffle");
  const [customHexColor, setCustomHexColor] = useState<string>("#fbbf24");
  
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [displayTarget, setDisplayTarget] = useState<string>("Awaiting Draw Order...");

  const SHUFFLE_PLACEHOLDERS = [
    "Selecting Winner...", "Processing Tokens...", "Analyzing Entries...",
    "Parsing Metadata...", "Evaluating Weights...", "Calculating Index..."
  ];

  // =============================================================================
  // [LINES 36-105: GOOGLE CDN WEB FONT SHEET LOADER & WEBSOCKET ENGINE]
  // =============================================================================
  useEffect(() => {
    // Subscribe to the isolated WebSocket sub-channel matching your drawId Primary Key string
    const channel = supabase
      .channel(`lucky-draw-room:${drawId}`)
      .on("broadcast", { event: "trigger-draw" }, (payload) => {
        const data = payload.payload as BroadcastPayload;

        setRemoteBgImage(data.themeBgImage);
        setCurrentFont(data.themeFont);
        setCurrentAnim(data.themeAnim);
        setWinnerName(data.winnerName);
        setCustomHexColor(data.textColor || "#fbbf24");

        // ──> TECHNICAL CORRECTION FIX: DYNAMIC GOOGLE FONTS CDN API CONNECTION INJECTION LOOPS
        if (data.themeFont && data.themeFont.trim() !== "") {
          const fontCleanName = data.themeFont.trim();
          const formattedFontName = fontCleanName.replace(/\s+/g, "+");
          const linkId = `google-font-${formattedFontName.toLowerCase()}`;
          const existingLink = document.getElementById(linkId);
          
          if (!existingLink) {
            const linkElement = document.createElement("link");
            linkElement.id = linkId;
            linkElement.rel = "stylesheet";
            // Corrected url layout mapping including mandatory '?family=' parameter constraints
            linkElement.href = `https://googleapis.com{formattedFontName}:wght@400;700;900&display=swap`;
            document.head.appendChild(linkElement);
          }
        }

        // Fire up the selected animation velocity mechanics
        setIsAnimating(true);

        if (data.themeAnim === "anim-shuffle") {
          let cycles = 0;
          const interval = setInterval(() => {
            setDisplayTarget(SHUFFLE_PLACEHOLDERS[Math.floor(Math.random() * SHUFFLE_PLACEHOLDERS.length)]);
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
        } else {
          // Instant Clean Fade-In Reveal (Bypass rolling placeholders)
          setIsAnimating(false);
          setDisplayTarget(data.winnerName);
        }
      })
      .on("broadcast", { event: "reset-draw" }, () => {
    // ──> NEW: Wipes canvas layout parameters back to sterile standby metrics instantly
    setWinnerName("Awaiting Draw Order...");
    setDisplayTarget("Awaiting Draw Order...");
    setRemoteBgImage(null);
    setIsAnimating(false);
  })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [drawId, supabase]);

  // =============================================================================
  // [LINES 106-165: RESOLUTION INDEPENDENT ELASITIC CANVAS FRAME RENDER]
  // =============================================================================
  return (
    <main 
      style={{ fontFamily: `'${currentFont}', sans-serif` }}
      className="w-screen h-screen flex flex-col items-center justify-center p-12 overflow-hidden select-none relative bg-zinc-950 text-white"
    >
      
      {/* ──> ADVANCED INTERFACE FIX: FIXED COVER CONFIGURATION FOR ABSOLUTE RESPONSIVE PROPORTIONS */}
      {remoteBgImage ? (
        <div 
          style={{ backgroundImage: `url(${remoteBgImage})` }} 
          className="fixed inset-0 bg-cover bg-center bg-no-repeat w-full h-full z-0 transition-all duration-700 object-cover"
        />
      ) : (
        <div className="absolute w-[40vw] h-[40vw] rounded-full filter blur-[150px] opacity-10 bg-amber-500 top-1/4 left-1/4 animate-pulse pointer-events-none z-0" />
      )}

      {/* VIEWPORT CONTRAST GLASS BOUNDARY FRAME CONTAINER */}
      <div className="w-full max-w-[90vw] h-[65vh] rounded-[2.5rem] border border-white/5 bg-black/40 backdrop-blur-3xl flex flex-col items-center justify-center p-8 relative shadow-[0_0_120px_rgba(0,0,0,0.7)] z-10">
        
        <div className={`absolute inset-0 border-2 rounded-[2.5rem] pointer-events-none transition-all duration-500 ${
          isAnimating ? "border-white/20 shadow-[inset_0_0_60px_rgba(255,255,255,0.03)]" : "border-white/0"
        }`} />

        <div className="text-center w-full max-w-[85vw] overflow-hidden px-4">
          <span 
            style={{ color: isAnimating ? "#71717a" : customHexColor }}
            className={`block text-[8vw] font-black leading-none tracking-tight transition-all duration-300 transform-gpu ${
              isAnimating 
                ? "scale-95 blur-[4px]" 
                : winnerName !== "Awaiting Draw Order..."
                  ? "drop-shadow-[0_0_50px_rgba(0,0,0,0.6)] scale-100 animate-fade-in" 
                  : "text-zinc-600 scale-100"
            }`}
          >
            {displayTarget}
          </span>
        </div>

      </div>
    </main>
  );
}
