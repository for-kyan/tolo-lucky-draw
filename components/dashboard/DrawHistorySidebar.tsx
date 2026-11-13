"use client";

import { RaffleTicket } from "@/types/draw";
import { LOCALES, SupportedLocale } from "@/constants/locales";

interface DrawHistorySidebarProps {
  remainingCount: number;
  historyPool: RaffleTicket[];
  activeLocale: SupportedLocale;
}

export function DrawHistorySidebar({
  remainingCount,
  historyPool,
  activeLocale,
}: DrawHistorySidebarProps) {
  return (
    <aside className="w-80 bg-zinc-900/40 p-8 flex flex-col justify-between border-l border-zinc-900 shrink-0">
      <div className="space-y-6 overflow-hidden flex flex-col h-full">
        {/* TOP COUNTERS: REMAINING VS. DRAWN */}
        <div className="grid grid-cols-2 gap-3 shrink-0">
          <div className="bg-zinc-950 p-4 border border-zinc-800 rounded-xl text-center">
            <span className="block text-2xl font-black text-amber-400 font-mono">
              {remainingCount}
            </span>
            <span className="block text-[10px] uppercase font-bold text-zinc-500 mt-1">
              {LOCALES[activeLocale].remaining}
            </span>
          </div>
          <div className="bg-zinc-950 p-4 border border-zinc-800 rounded-xl text-center">
            <span className="block text-2xl font-black text-zinc-400 font-mono">
              {historyPool.length}
            </span>
            <span className="block text-[10px] uppercase font-bold text-zinc-500 mt-1">
              {LOCALES[activeLocale].drawnLog}
            </span>
          </div>
        </div>

        {/* CHRONOLOGICAL DRAWN WINNERS LIST */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {historyPool.length === 0 ? (
            <div className="h-full flex items-center justify-center text-center p-4 border border-dashed border-zinc-800/80 rounded-xl">
              <p className="text-xs text-zinc-500">
                Drawn winners will appear here in chronological order.
              </p>
            </div>
          ) : (
            historyPool.map((ticket, index) => (
              <div
                key={ticket.ticketId}
                className="p-3 bg-zinc-950 border border-zinc-800/80 rounded-xl flex items-center justify-between gap-2"
              >
                <div className="truncate">
                  <span className="text-xs font-bold text-white block truncate">
                    {ticket.participantName}
                  </span>
                  {ticket.attachedNumber !== undefined && (
                    <span className="text-[10px] font-mono text-zinc-500 block">
                      Ticket #{ticket.attachedNumber}
                    </span>
                  )}
                  {ticket.extraText && (
                    <span className="text-[10px] text-zinc-400 block truncate">
                      {ticket.extraText}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                  #{historyPool.length - index}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}
