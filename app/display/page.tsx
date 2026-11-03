"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const SHUFFLE_NAMES = [
  "Selecting Winner...", "Processing Tokens...", "Analyzing Entries...",
  "Parsing Metadata...", "Evaluating Weights...", "Calculating Random Index..."
];

export default function DisplayPage() {
  const [winner, setWinner] = useState<string | null>(null);
  const [displayTarget, setDisplayTarget] = useState<string>("Awaiting Draw Order...");
  const [isShuffling, setIsShuffling] = useState<boolean>(false);
  const [isRevealed, setIsRevealed] = useState<boolean>(false);
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel("lucky-draw-room")
      .on("broadcast", { event: "trigger-draw" }, (payload) => {
        const finalWinnerName = payload.payload.winnerName;
        
        // Trigger high-speed hardware-accelerated draw loop sequence
        setIsShuffling(true);
        setIsRevealed(false);
        setWinner(finalWinnerName);

        let shuffleCount = 0;
        const interval = setInterval(() => {
          // Shuffle through local placeholder indices rapidly to create tension
          setDisplayTarget(SHUFFLE_NAMES[Math.floor(Math.random() * SHUFFLE_NAMES.length)]);
          shuffleCount++;

          if (shuffleCount > 12) {
            clearInterval(interval);
            setIsShuffling(false);
            setDisplayTarget(finalWinnerName);
            setIsRevealed(true); // Fire up final CSS animation parameters
          }
        }, 120);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return (
    <main className="w-screen h-screen flex flex-col items-center justify-center bg-zinc-950 text-white font-sans overflow-hidden p-12 select-none relative">
      
      {/* Background Graphic Accents */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full filter blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-zinc-500/5 rounded-full filter blur-[120px] pointer-events-none animate-pulse delay-1000" />

      {/* Main Structural Frame Header */}
      <div className="text-center space-y-2 z-10">
        <h1 className="text-xs font-black uppercase tracking-[0.4em] text-zinc-500">
          Live Event Mirror
        </h1>
        <p className="text-[4vw] font-black text-white/90 tracking-tight leading-none">
          LUCKY DRAW CANVAS
        </p>
      </div>
      
      {/* Hardware Accelerated Viewport Frame Container */}
      <div className="w-full max-w-6xl h-[50vh] border border-zinc-800/80 bg-zinc-900/10 backdrop-blur-2xl rounded-3xl flex items-center justify-center mt-10 relative shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden group">
        
        {/* Border Flash Glow Effect during draw cycles */}
        <div className={`absolute inset-0 border-2 transition-all duration-300 rounded-3xl pointer-events-none ${
          isShuffling ? "border-amber-500/40 shadow-[inset_0_0_50px_rgba(245,158,11,0.1)]" : "border-zinc-800/40"
        }`} />

        {/* Text Viewport Layer Layout */}
        <div className="text-center px-6 z-10">
          <span 
            className={`block text-[7vw] font-black tracking-tight transition-all duration-300 transform transform-gpu ${
              isShuffling 
                ? "text-zinc-600 scale-95 blur-[2px]" 
                : isRevealed 
                  ? "text-amber-400 drop-shadow-[0_0_50px_rgba(245,158,11,0.5)] scale-100 animate-fade-in" 
                  : "text-zinc-500 scale-100"
            }`}
          >
            {displayTarget}
          </span>
        </div>

        {/* Inner Tech Calibration Grid Metrics lines */}
        <div className="absolute top-4 left-4 font-mono text-[9px] text-zinc-600 tracking-wider">REF_ID: 4K_MIRROR_MODE</div>
        <div className="absolute bottom-4 right-4 font-mono text-[9px] text-zinc-600 tracking-wider">HZ_REFRESH: 60_FPS_ACTV</div>
      </div>
    </main>
  );
}
