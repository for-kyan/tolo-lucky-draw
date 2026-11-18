"use client";

import React from "react";
import { ConfettiStyle } from "@/types/draw";

interface WinnerConfettiProps {
  active: boolean;
  style: ConfettiStyle;
}

export function WinnerConfetti({ active, style }: WinnerConfettiProps) {
  if (!active || style === "off") return null;

  return (
    <>
      <style>{`
        @keyframes toloFireworkBurst {
          0% {
            transform: translate(0, 0) scale(0.3);
            opacity: 1;
          }
          65% {
            opacity: 1;
          }
          100% {
            transform: translate(var(--tx), var(--ty)) scale(1.1);
            opacity: 0;
          }
        }
        @keyframes toloGoldRise {
          0% {
            transform: translateY(0) scale(0.5);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          100% {
            transform: translateY(-105vh) scale(1.2);
            opacity: 0;
          }
        }
        @keyframes toloNeonStreak {
          0% {
            transform: translate(0, 0) rotate(22deg);
            opacity: 1;
          }
          100% {
            transform: translate(-18vw, 110vh) rotate(22deg);
            opacity: 0;
          }
        }
        @keyframes toloClassicSway {
          0% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 1;
          }
          50% {
            transform: translate(var(--sway), 52vh) rotate(360deg);
            opacity: 1;
          }
          100% {
            transform: translate(0, 108vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>

      {/* 1. FIREWORKS: 3 radial aerial bursts exploding 360° across the stage */}
      {style === "fireworks" && (
        <div
          aria-hidden="true"
          className="fixed inset-0 overflow-hidden pointer-events-none z-20"
        >
          {[
            { cx: "24%", cy: "30%", delay: 0, colours: ["#fbbf24", "#f97316", "#fef08a", "#ffffff"] },
            { cx: "50%", cy: "22%", delay: 0.35, colours: ["#f43f5e", "#ec4899", "#fbbf24", "#ffffff"] },
            { cx: "76%", cy: "32%", delay: 0.7, colours: ["#38bdf8", "#34d399", "#a78bfa", "#ffffff"] },
          ].map((shell, sIdx) =>
            Array.from({ length: 28 }, (_, i) => {
              const angle = (i / 28) * Math.PI * 2;
              const ringRadius = i % 2 === 0 ? 22 : 13;
              const tx = `${(Math.cos(angle) * ringRadius).toFixed(1)}vw`;
              const ty = `${(Math.sin(angle) * ringRadius + 6).toFixed(1)}vw`;
              const colour = shell.colours.at(i % shell.colours.length) || "#fbbf24";

              return (
                <span
                  key={`${sIdx}-${i}`}
                  style={
                    {
                      left: shell.cx,
                      top: shell.cy,
                      backgroundColor: colour,
                      boxShadow: `0 0 10px ${colour}, 0 0 20px ${colour}`,
                      "--tx": tx,
                      "--ty": ty,
                      animation: `toloFireworkBurst 1.6s cubic-bezier(0.16, 1, 0.3, 1) ${shell.delay}s forwards`,
                    } as React.CSSProperties
                  }
                  className="absolute w-2.5 h-2.5 rounded-full opacity-0"
                />
              );
            })
          )}
        </div>
      )}

      {/* 2. GOLD: Champagne bubbles & golden stars rising from bottom to top */}
      {style === "gold" && (
        <div
          aria-hidden="true"
          className="fixed inset-0 overflow-hidden pointer-events-none z-20"
        >
          {Array.from({ length: 42 }, (_, idx) => {
            const palette = ["#fef08a", "#fde047", "#facc15", "#eab308", "#ffffff"];
            const colour = palette.at(idx % palette.length) || "#facc15";
            const sizePx = 6 + (idx % 4) * 3;
            return (
              <span
                key={idx}
                style={{
                  left: `${(idx * 2.4) % 98}%`,
                  bottom: "-20px",
                  width: `${sizePx}px`,
                  height: `${sizePx}px`,
                  backgroundColor: colour,
                  boxShadow: `0 0 12px ${colour}`,
                  animation: `toloGoldRise ${2.4 + (idx % 5) * 0.3}s ease-out ${(idx % 10) * 0.12}s forwards`,
                }}
                className="absolute rounded-full opacity-0"
              />
            );
          })}
        </div>
      )}

      {/* 3. NEON: High-speed glowing diagonal cyber streaks */}
      {style === "neon" && (
        <div
          aria-hidden="true"
          className="fixed inset-0 overflow-hidden pointer-events-none z-20"
        >
          {Array.from({ length: 36 }, (_, idx) => {
            const palette = ["#22d3ee", "#e879f9", "#4ade80", "#f43f5e", "#38bdf8"];
            const colour = palette.at(idx % palette.length) || "#22d3ee";
            return (
              <span
                key={idx}
                style={{
                  left: `${(idx * 3.1) % 100}%`,
                  top: "-40px",
                  backgroundColor: colour,
                  boxShadow: `0 0 14px ${colour}, 0 0 28px ${colour}`,
                  animation: `toloNeonStreak ${1.1 + (idx % 4) * 0.2}s linear ${(idx % 8) * 0.1}s forwards`,
                }}
                className="absolute w-1 h-10 rounded-full opacity-0"
              />
            );
          })}
        </div>
      )}

      {/* 4. CLASSIC: Gentle fluttering multicolour confetti rain with horizontal sway */}
      {style === "classic" && (
        <div
          aria-hidden="true"
          className="fixed inset-0 overflow-hidden pointer-events-none z-20"
        >
          {Array.from({ length: 40 }, (_, idx) => {
            const palette = ["#fbbf24", "#34d399", "#60a5fa", "#f472b6", "#a78bfa", "#fb923c"];
            const colour = palette.at(idx % palette.length) || "#fbbf24";
            const sway = idx % 2 === 0 ? "35px" : "-35px";
            return (
              <span
                key={idx}
                style={
                  {
                    left: `${(idx * 2.5) % 98}%`,
                    top: "-20px",
                    backgroundColor: colour,
                    "--sway": sway,
                    animation: `toloClassicSway ${2.6 + (idx % 5) * 0.35}s ease-in-out ${(idx % 10) * 0.1}s forwards`,
                  } as React.CSSProperties
                }
                className="absolute w-3 h-2 rounded-xs opacity-0"
              />
            );
          })}
        </div>
      )}
    </>
  );
}
