"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { RaffleTicket } from "@/types/draw";

export default function ControlPage() {
  // Core Operational States
  const [drawType, setDrawType] = useState("random-names");
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  
  // Clean, typed state arrays tracking active pools vs pulled winners
  const [activePool, setActivePool] = useState<RaffleTicket[]>([]);
  const [historyPool, setHistoryPool] = useState<RaffleTicket[]>([]);

  // In-Browser Binary Excel Parser (Verified Step 2C Engine)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawRows = XLSX.utils.sheet_to_json<any>(worksheet);
        const parsedTickets: RaffleTicket[] = [];

        rawRows.forEach((row) => {
          const name = row.Name || row.name || row.Participant || Object.values(row)[0];
          if (!name) return;

          const entriesCount = parseInt(row.Entries || row.Weight || row.count) || 1;

          for (let i = 1; i <= entriesCount; i++) {
            parsedTickets.push({
              ticketId: crypto.randomUUID(), 
              participantName: String(name).trim(),
              attachedNumber: parseInt(row.Number || row.id) || undefined,
              entryIndex: i
            });
          }
        });

        setActivePool(parsedTickets);
        setHistoryPool([]); // Hard reset tracking history arrays on fresh sheet import
      } catch (error) {
        console.error("Spreadsheet mapping error:", error);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // ================= STEP 3: THE SPLICING SELECTION ENGINE =================
  const triggerStateDraw = () => {
    if (!activePool || activePool.length === 0) return;

    // 1. Math-Bounded Random Index Generator
    const randomIndex = Math.floor(Math.random() * activePool.length);
    const updatedActivePool = [...activePool];
    
    // 2. O(1) Splicing Mutation: Removes the winning token object natively from browser memory
    const [winningTicket] = updatedActivePool.splice(randomIndex, 1);

    // 3. Commit mutations to layout state layers
    setActivePool(updatedActivePool);
    setHistoryPool((prevHistory) => [winningTicket, ...prevHistory]);

    // 4. Metric Sync Interceptor to Supabase (GDPR Enforced: Metadata integers only)
    fetch("/api/stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ totalNames: updatedActivePool.length }),
    }).catch((err) => console.error("Cloud logging pipeline skipped:", err));
  };

  // ================= STEP 3: HIGH-SPEED COORDINATE RE-MERGE =================
  const triggerPoolReset = () => {
    if (!historyPool || historyPool.length === 0) return;
    
    // Instantly restores all pulled tickets back to the active array pool
    setActivePool([...activePool, ...historyPool]);
    setHistoryPool([]);
  };

  return (
    <main className="w-screen h-screen flex bg-zinc-950 text-white overflow-hidden font-sans">
      
      {/* LEFT COLUMN: Controls & Configurations */}
      <section className="flex-1 p-8 space-y-6 overflow-y-auto border-r border-zinc-900">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Raffle Control Center</h1>
          <p className="text-sm text-zinc-400 mt-1">Device 1 • Administrative Actions & Configurations</p>
        </div>

        {/* 1. In-Browser Upload Zone */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-3">
          <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">1. Ingest Participant Data</h2>
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-zinc-800 hover:border-amber-500/50 rounded-xl cursor-pointer bg-zinc-950 transition-colors group">
            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
              <div className="text-sm text-zinc-400 group-hover:text-zinc-200 transition-colors">
                {uploadedFileName ? (
                  <span className="text-amber-400 font-medium">Loaded: {uploadedFileName}</span>
                ) : (
                  <span>Click to select or drag your <span className="font-semibold text-white">Excel (.xlsx)</span> sheet</span>
                )}
              </div>
              <p className="text-xs text-zinc-500 mt-1">GDPR Compliant: Data points never touch public disks.</p>
            </div>
            <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileChange} />
          </label>
        </div>

        {/* 2. Lucky Draw Type Selections (Radio Group) */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">2. Configure Draw Rules</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { id: "random-names", label: "Random Names", desc: "Standard entry list logic." },
              { id: "random-numbers", label: "Random Numbers Only", desc: "Selects bounded numbers." },
              { id: "multiple-numbers", label: "Multiple Numbers per Name", desc: "One identity owns multiple tickets." },
              { id: "multiple-entries", label: "Multiple Entries of Name", desc: "Weighted clone probability." },
            ].map((option) => (
              <label 
                key={option.id}
                className={`flex gap-3 items-start p-4 rounded-xl border transition-all cursor-pointer select-none bg-zinc-950 ${
                  drawType === option.id ? "border-amber-500 bg-amber-500/5" : "border-zinc-800 hover:border-zinc-700"
                }`}
              >
                <input 
                  type="radio" 
                  name="draw-type" 
                  value={option.id} 
                  checked={drawType === option.id}
                  onChange={(e) => setDrawType(e.target.value)}
                  className="mt-1 accent-amber-500 cursor-pointer"
                />
                <div>
                  <span className="block text-sm font-bold">{option.label}</span>
                  <span className="block text-xs text-zinc-400 mt-0.5">{option.desc}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* 3. Execution Action Triggers */}
        <div className="flex gap-4">
          <button
            onClick={triggerStateDraw}
            disabled={activePool.length === 0}
            className="flex-1 py-4 bg-amber-500 hover:bg-amber-600 disabled:bg-zinc-800 disabled:text-zinc-500 font-extrabold text-lg text-zinc-950 rounded-xl shadow-lg transition-all cursor-pointer"
          >
            Draw Next Winner
          </button>
          <button
            onClick={triggerPoolReset}
            disabled={historyPool.length === 0}
            className="px-6 py-4 bg-zinc-900 border border-zinc-800 hover:border-red-500/30 hover:bg-red-500/5 text-zinc-400 hover:text-red-400 disabled:border-zinc-800 disabled:text-zinc-600 disabled:hover:bg-transparent font-bold rounded-xl transition-all cursor-pointer"
          >
            Reset Pool
          </button>
        </div>
      </section>

      {/* RIGHT COLUMN: Output Lists & Live Analytics (Sidebar) */}
      <aside className="w-80 bg-zinc-900/50 p-8 flex flex-col justify-between">
        <div className="space-y-6 overflow-hidden flex flex-col h-full">
          
          {/* Live Dynamic Context Counters */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-zinc-950 p-4 border border-zinc-800 rounded-xl text-center">
              <span className="block text-2xl font-black text-amber-400 font-mono">{activePool.length}</span>
              <span className="block text-[10px] uppercase font-bold text-zinc-500 tracking-wider mt-1">Remaining</span>
            </div>
            <div className="bg-zinc-950 p-4 border border-zinc-800 rounded-xl text-center">
              <span className="block text-2xl font-black text-zinc-400 font-mono">{historyPool.length}</span>
              <span className="block text-[10px] uppercase font-bold text-zinc-500 tracking-wider mt-1">Drawn Log</span>
            </div>
          </div>
           {/* Separate Output History List Component */}
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Live History Stack</h3>
            <div className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl p-4 overflow-y-auto space-y-2">
              {!historyPool || historyPool.length === 0 ? (
                <p className="text-xs text-zinc-600 text-center pt-8">No participants drawn yet.</p>
              ) : (
                historyPool.map((ticket, index) => (
                  <div 
                    key={ticket.ticketId}
                    className={`p-3 text-sm rounded-lg font-medium border flex justify-between items-center ${
                      index === 0 ? "bg-amber-500/10 border-amber-500/30 text-amber-400 font-bold animate-pulse" : "bg-zinc-900 border-zinc-800 text-zinc-300"
                    }`}
                  >
                    <div className="flex flex-col">
                      <span>{ticket.participantName}</span>
                      {ticket.entryIndex > 1 && (
                        <span className="text-[10px] text-amber-500">Weight Token #{ticket.entryIndex}</span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-950 text-zinc-500">
                      #{historyPool.length - index}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </aside>

    </main>
  );
}
