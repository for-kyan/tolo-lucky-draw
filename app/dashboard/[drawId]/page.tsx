"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { RaffleTicket } from "@/types/draw";

export default function AdminDashboardCore() {
  const params = useParams();
  const router = useRouter();
  const drawId = params.drawId as string;

  // 1. Core Structural State Parameters
  const [drawName, setDrawName] = useState("Loading Draw Workspace...");
  const [drawType, setDrawType] = useState("random-names");
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // 2. Active Pool Array Trackers
  const [activePool, setActivePool] = useState<RaffleTicket[]>([]);
  const [historyPool, setHistoryPool] = useState<RaffleTicket[]>([]);

  // 3. Post-Ingestion Column Safety Flags
  const [hasTicketNumbers, setHasTicketNumbers] = useState<boolean>(false);

  // 4. Stage 3 Range Extender Parameters
  const [startRange, setStartRange] = useState<string>("");
  const [endRange, setEndRange] = useState<string>("");

  // 5. Identity Display Mode Switch Parameters
  const [revealMode, setRevealMode] = useState<"name" | "ticket-number">("name");

  // 6. Presentation Broadcast Aesthetics States
  const [customBgImage, setCustomBgImage] = useState<string | null>(null);
  const [googleFontFamily, setGoogleFontFamily] = useState<string>("Inter");
  const [canvasAnim, setCanvasAnim] = useState<string>("anim-shuffle");
  const [canvasTextColor, setCanvasTextColor] = useState<string>("#fbbf24");

  // Load Draw settings from Local Storage
  useEffect(() => {
    const savedDraws = localStorage.getItem("tolo_active_draws");
    if (savedDraws) {
      const drawsList = JSON.parse(savedDraws);
      const currentDraw = drawsList.find((d: any) => d.id === drawId);
      if (currentDraw) {
        setDrawName(currentDraw.name);
      }
    }
  }, [drawId]);

  const updateDrawNameGlobally = (newName: string) => {
    setDrawName(newName);
    const savedDraws = localStorage.getItem("tolo_active_draws");
    if (savedDraws) {
      const drawsList = JSON.parse(savedDraws);
      const updatedList = drawsList.map((d: any) => d.id === drawId ? { ...d, name: newName } : d);
      localStorage.setItem("tolo_active_draws", JSON.stringify(updatedList));
    }
  };

  // Safe In-Browser SheetJS Reader with Auto-Detector Logic
  const handleSpreadsheetIngestion = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json<any>(worksheet);
        const parsedTickets: RaffleTicket[] = [];

        let foundValidTicketIdentifiers = false;

        rawRows.forEach((row) => {
          const name = row.Name || row.name || row.Participant || Object.values(row)[0];
          if (!name) return;

          let entriesCount = 1;
          let sequentialStart: number | undefined = undefined;

          const rangeStr = String(row.TicketRange || row.Range || row.Tickets || "");
          if (rangeStr.includes("-")) {
            const parts = rangeStr.split("-");
            const start = parseInt(parts[0]);
            const end = parseInt(parts[1]);
            if (!isNaN(start) && !isNaN(end) && end >= start) {
              entriesCount = end - start + 1;
              sequentialStart = start;
              foundValidTicketIdentifiers = true; // Flag sequence detection
            }
          } else {
            entriesCount = parseInt(row.Entries || row.Weight || row.Count) || 1;
            // Check for explicit pre-assigned number fields
            const explicitNum = parseInt(row.TicketNumber || row.TicketId || row.Number || row.id);
            if (!isNaN(explicitNum)) {
              sequentialStart = explicitNum;
              foundValidTicketIdentifiers = true; // Flag number detection
            }
          }

          for (let i = 1; i <= entriesCount; i++) {
            parsedTickets.push({
              ticketId: crypto.randomUUID(),
              participantName: String(name).trim(),
              attachedNumber: sequentialStart !== undefined ? sequentialStart + (rangeStr.includes("-") ? i - 1 : 0) : undefined,
              entryIndex: i,
              isNumericTicket: false
            });
          }
        });

        // Toggle visibility triggers based on whether columns were found
        setHasTicketNumbers(foundValidTicketIdentifiers);
        if (!foundValidTicketIdentifiers) {
          setRevealMode("name"); // Enforce fallback safety default instantly
        }

        setActivePool(parsedTickets);
        setHistoryPool([]);
      } catch (error) {
        console.error("Local client binary parsing exception:", error);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleGenerateNumericRange = (e: React.FormEvent) => {
    e.preventDefault();
    const min = parseInt(startRange);
    const max = parseInt(endRange);

    if (isNaN(min) || isNaN(max) || min > max) {
      alert("Invalid selection boundaries.");
      return;
    }

    const generatedTickets: RaffleTicket[] = [];
    for (let i = min; i <= max; i++) {
      generatedTickets.push({
        ticketId: crypto.randomUUID(),
        participantName: `Number ${i}`,
        attachedNumber: i,
        entryIndex: 1,
        isNumericTicket: true
      });
    }

    setHasTicketNumbers(true); // Automatically true for number generator
    setRevealMode("name");
    setActivePool(generatedTickets);
    setHistoryPool([]);
    setUploadedFileName(`System Generated Range: ${min} to ${max}`);
  };

  const triggerStateDrawAction = () => {
    if (activePool.length === 0) return;

    const randomIndex = Math.floor(Math.random() * activePool.length);
    const updatedActivePool = [...activePool];
    const [winningTicket] = updatedActivePool.splice(randomIndex, 1);

    setActivePool(updatedActivePool);
    setHistoryPool((prev) => [winningTicket, ...prev]);

    const outputRevealVector = revealMode === "ticket-number" && winningTicket.attachedNumber !== undefined
      ? `Ticket #${winningTicket.attachedNumber}`
      : winningTicket.participantName;

    const { createClient } = require("@/lib/supabase/client");
    const supabaseClient = createClient();

    supabaseClient.channel(`lucky-draw-room:${drawId}`).send({
      type: "broadcast",
      event: "trigger-draw",
      payload: { 
        winnerName: outputRevealVector,
        themeBgImage: customBgImage,
        themeFont: googleFontFamily,
        themeAnim: canvasAnim,
        textColor: canvasTextColor
      },
    });

    fetch("/api/stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ totalNames: updatedActivePool.length }),
    }).catch((err) => console.error(err));
  };

  const triggerPoolResetAction = () => {
  if (!historyPool || historyPool.length === 0) return;
  
  // 1. Re-merge your browser session RAM array pools
  setActivePool([...activePool, ...historyPool]);
  setHistoryPool([]);

  // 2. Broadcast an immediate reset signal down your isolated UUID channel path
  const { createClient } = require("@/lib/supabase/client");
  const supabaseClient = createClient();

  supabaseClient.channel(`lucky-draw-room:${drawId}`).send({
    type: "broadcast",
    event: "reset-draw", // ◄── NEW EXPLICIT PACKET TYPE
    payload: {}
  });
};

  const handleBackgroundBlobIngestion = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const localBlobUrl = URL.createObjectURL(file);
    setCustomBgImage(localBlobUrl);
  };

  return (
  <main className="w-screen h-screen flex bg-zinc-950 text-white overflow-hidden font-sans">
      
      {/* ACTIONS SYSTEM LAYER CONTROLS */}
      <section className="flex-1 p-8 space-y-6 overflow-y-auto border-r border-zinc-900">
        <div className="flex justify-between items-start">
          <div className="space-y-1 w-full max-w-md">
            <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Draw Identity Label</label>
            <input 
              type="text" value={drawName} onChange={(e) => updateDrawNameGlobally(e.target.value)}
              className="w-full text-2xl font-black bg-transparent border-b border-transparent hover:border-zinc-800 focus:border-amber-500 focus:outline-none py-1 text-amber-400 transition-colors"
            />
          </div>
          <button onClick={() => router.push("/manage")} className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-xs font-bold rounded-xl border border-zinc-800 transition-colors cursor-pointer text-white">
            ← Exit to Directory
          </button>
        </div>

        {/* STEP 1: RULE CONFIGURATION */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Step 1: Select Drawing Mechanics Model</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { id: "random-names", label: "Standard Names List", desc: "Basic single spreadsheet entry rows." },
              { id: "weighted-ingest", label: "Weighted Spreadsheet", desc: "Handles multiplier weights OR ticket number blocks (e.g. 1-150)." },
              { id: "random-numbers", label: "Numbers Range Generator", desc: "Populates sequential numeric entries directly inside client RAM." },
            ].map((option) => (
              <label key={option.id} className={`flex gap-3 items-start p-4 rounded-xl border transition-all cursor-pointer select-none bg-zinc-950 ${drawType === option.id ? "border-amber-500 bg-amber-500/5" : "border-zinc-800 hover:border-zinc-700"}`}>
                <input 
                  type="radio" name="draw-type" value={option.id} checked={drawType === option.id}
                  onChange={(e) => {
                    setDrawType(e.target.value);
                    setActivePool([]);
                    setHistoryPool([]);
                    setUploadedFileName(null);
                    setHasTicketNumbers(false);
                  }}
                  className="mt-1 accent-amber-500 cursor-pointer"
                />
                <div>
                  <span className="block text-sm font-bold">{option.label}</span>
                  <span className="block text-xs text-zinc-400 mt-0.5 leading-normal">{option.desc}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* STEP 2: INGESTION VIEWPORTS */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          {drawType === "random-numbers" ? (
            <form onSubmit={handleGenerateNumericRange} className="space-y-4">
              <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Step 2: Define Core Integer Boundaries</h2>
              <div className="grid grid-cols-2 gap-4">
                <input 
                  type="number" required placeholder="Starting Range (e.g. 1)" value={startRange} onChange={(e) => setStartRange(e.target.value)} 
                  className="px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm font-mono focus:outline-none focus:border-amber-500 text-white w-full" 
                />
                <input 
                  type="number" required placeholder="Ending Range (e.g. 500)" value={endRange} onChange={(e) => setEndRange(e.target.value)} 
                  className="px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm font-mono focus:outline-none focus:border-amber-500 text-white w-full" 
                />
              </div>
              <button type="submit" className="w-full py-3 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-500 text-xs font-bold rounded-xl transition-all cursor-pointer text-white">
                Lock Numbers Pool
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Step 2: Ingest Spreadsheet Rows</h2>
              <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-zinc-800 hover:border-amber-500/40 rounded-xl cursor-pointer bg-zinc-950/50 transition-all group">
                <div className="text-center px-4">
                  <div className="text-sm text-zinc-400 group-hover:text-zinc-200 transition-colors">
                    {uploadedFileName ? <span className="text-amber-400 font-bold">{uploadedFileName}</span> : "Load Names List (.xlsx)"}
                  </div>
                </div>
                <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleSpreadsheetIngestion} />
              </label>
            </div>
          )}
        </div>

        {/* STEP 3: AESTHETICS OVERRIDE CONTROL INTERFACE */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
          
          {/* AUTO-DETECTOR TOGGLE: Only displays if ticket identifiers are detected inside the file rows */}
          {drawType !== "random-numbers" && hasTicketNumbers && (
            <div className="border-b border-zinc-800 pb-4 animate-fade-in">
              <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Step 3: Identity Presentation View Mode</h2>
              <div className="flex gap-4">
                {[
                  { id: "name", label: "Show Participant Name String" },
                  { id: "ticket-number", label: "Show Winning Ticket Sequential Number" },
                ].map((mode) => (
                  <label key={mode.id} className="flex items-center gap-2 text-sm font-medium text-zinc-300 cursor-pointer select-none">
                    <input 
                      type="radio" name="reveal-mode" value={mode.id} checked={revealMode === mode.id}
                      onChange={() => setRevealMode(mode.id as any)}
                      className="accent-amber-500"
                    />
                    {mode.label}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Custom Background File Ingestion Zone */}
            <div className="space-y-2">
              <label className="text-xs text-zinc-400 font-bold block">Custom Backdrop Graphic Image</label>
              <label className="block w-full text-center py-2.5 px-3 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-xl text-xs font-bold cursor-pointer text-zinc-400 hover:text-white transition-all">
                {customBgImage ? "✓ Image Loaded in RAM" : "Upload Background Image"}
                <input type="file" accept="image/*" className="hidden" onChange={handleBackgroundBlobIngestion} />
              </label>
            </div>

            {/* Google Font Library Loader Box */}
            <div className="space-y-2">
              <label className="text-xs text-zinc-400 font-bold block">Google Web Font Family String</label>
              <input 
                type="text" value={googleFontFamily} onChange={(e) => setGoogleFontFamily(e.target.value)}
                className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs focus:outline-none focus:border-amber-500 font-mono text-white"
                placeholder="e.g. Bungee Spice, Cinzel, Inter"
              />
            </div>

            {/* Hexadecimal Color Code Selector Input */}
            <div className="space-y-2">
              <label className="text-xs text-zinc-400 font-bold block">Text Color Web Hex Code</label>
              <div className="flex gap-2">
                <input 
                  type="text" value={canvasTextColor} onChange={(e) => setCanvasTextColor(e.target.value)}
                  className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs focus:outline-none focus:border-amber-500 font-mono text-white"
                  placeholder="#fbbf24"
                />
                <div style={{ backgroundColor: canvasTextColor }} className="w-9 h-8 rounded-lg border border-zinc-800 self-center transition-colors" />
              </div>
            </div>

            {/* Reveal Motion Speed Selector */}
            <div className="space-y-2">
              <label className="text-xs text-zinc-400 font-bold block">CSS Reveal Motion Loop</label>
              <select value={canvasAnim} onChange={(e) => setCanvasAnim(e.target.value)} className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs focus:outline-none focus:border-amber-500 text-zinc-200">
                <option value="anim-shuffle">Blurred Rolling Shuffle Loop</option>
                <option value="anim-slot">Vertical Slot Machine Spin</option>
                <option value="anim-fade">Instant Clean Fade-In Reveal</option>
              </select>
            </div>
          </div>
        </div>

        {/* ACTIONS EXECUTION TRIGGERS */}
        <div className="flex gap-4">
          <button 
            onClick={triggerStateDrawAction} 
            disabled={!activePool || activePool.length === 0} 
            className="flex-1 py-4 bg-amber-500 hover:bg-amber-600 disabled:bg-zinc-800 disabled:text-zinc-500 font-black text-lg text-zinc-950 rounded-xl transition-all cursor-pointer shadow-xl text-zinc-950"
          >
            Draw Next Winner
          </button>
          <button 
            onClick={triggerPoolResetAction} 
            disabled={!historyPool || historyPool.length === 0} 
            className="px-6 py-4 bg-zinc-900 border border-zinc-800 hover:border-red-500/30 text-zinc-400 hover:text-red-400 font-bold rounded-xl transition-all cursor-pointer"
          >
            Reset Pool
          </button>
        </div>
      </section>

      {/* HISTORIES TIMELINE SIDEBAR PANEL (RIGHT COLUMN) */}
      <aside className="w-80 bg-zinc-900/40 p-8 flex flex-col justify-between border-l border-zinc-900">
        <div className="space-y-6 overflow-hidden flex flex-col h-full">
          
          {/* Live Statistical Metric Tokens */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-zinc-950 p-4 border border-zinc-800 rounded-xl text-center">
              <span className="block text-2xl font-black text-amber-400 font-mono">{activePool?.length || 0}</span>
              <span className="block text-[10px] uppercase font-bold text-zinc-500 mt-1">Remaining</span>
            </div>
            <div className="bg-zinc-950 p-4 border border-zinc-800 rounded-xl text-center">
              <span className="block text-2xl font-black text-zinc-400 font-mono">{historyPool?.length || 0}</span>
              <span className="block text-[10px] uppercase font-bold text-zinc-500 mt-1">Drawn Log</span>
            </div>
          </div>

          {/* Scrolling Memory Logging History Stack */}
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Live History Stack</h3>
            <div className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl p-4 overflow-y-auto space-y-2">
              {!historyPool || historyPool.length === 0 ? (
                <p className="text-xs text-zinc-600 text-center pt-8">No winners drawn.</p>
              ) : (
                historyPool.map((ticket, index) => (
                  <div 
                    key={ticket.ticketId} 
                    className={`p-3 text-sm rounded-lg font-medium border flex justify-between items-center ${
                      index === 0 
                        ? "bg-amber-500/10 border-amber-500/30 text-amber-400 font-bold animate-pulse" 
                        : "bg-zinc-900 border-zinc-800 text-zinc-300"
                    }`}
                  >
                    <div className="flex flex-col">
                      <span>{ticket.participantName}</span>
                      {ticket.attachedNumber !== undefined && (
                        <span className="text-[10px] text-amber-500/80 font-mono mt-0.5">Ticket #{ticket.attachedNumber}</span>
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
