"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { RaffleTicket } from "@/types/draw";
import { SupportedLocale, LOCALES } from "@/constants/locales";
import { RealtimeChannel } from "@supabase/supabase-js";

function DashboardContent() {
  const params = useParams();
  const router = useRouter();
  const drawId = params.drawId as string;

  // 1. Structural Title Label State Tracking Fields
  const [drawName, setDrawName] = useState("Loading Draw Workspace...");
  const [drawType, setDrawType] = useState("random-names"); // random-names, weighted-ingest, random-numbers
  const [weightedSubType, setWeightedSubtype] = useState<"count" | "range">("count");
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [shareText, setShareText] = useState("Copy Public Screen Link");
  const [activeLocale, setActiveLocale] = useState<SupportedLocale>("en");

  // 2. Active Pool Array Trackers (Stored securely inside Client Session RAM)
  const [activePool, setActivePool] = useState<RaffleTicket[]>([]);
  const [historyPool, setHistoryPool] = useState<RaffleTicket[]>([]);
  const [hasTicketNumbers, setHasTicketNumbers] = useState<boolean>(false);

  // 3. Sequential Integer Configuration Range Parameters
  const [startRange, setStartRange] = useState<string>("");
  const [endRange, setEndRange] = useState<string>("");
  const [revealMode, setRevealMode] = useState<"name" | "ticket-number">("name");

  // 4. Presentation Broadcast Aesthetics States (Device 2 Output Mapping)
  const [customBgImage, setCustomBgImage] = useState<string | null>(null);
  const [googleFontFamily, setGoogleFontFamily] = useState<string>("Inter");
  const [canvasAnim, setCanvasAnim] = useState<string>("anim-shuffle");
  const [canvasTextColor, setCanvasTextColor] = useState<string>("#fbbf24");

  // 5. CACHED PERSISTENT CHANNEL TRACKER HOOK
  const [activeChannel, setActiveChannel] = useState<RealtimeChannel | null>(null);

  // Initialize unified persistent WebSocket listener connection on page mount
  useEffect(() => {
    const { createClient } = require("@/lib/supabase/client");
    const supabaseClient = createClient();

    // Open an airtight network streaming channel mapped to your UUID Primary Key string
    const channelInstance = supabaseClient.channel(`lucky-draw-room:${drawId}`).subscribe((status: string) => {
      console.log(`Dashboard socket room pipeline connection status changed: ${status}`);
    });

    setActiveChannel(channelInstance);

    // Sync draw title from local storage directory cache arrays
    const savedDraws = localStorage.getItem("tolo_active_draws");
    if (savedDraws) {
      const drawsList = JSON.parse(savedDraws);
      const currentDraw = drawsList.find((d: any) => d.id === drawId);
      if (currentDraw) setDrawName(currentDraw.name);
    }

    return () => {
      supabaseClient.removeChannel(channelInstance);
    };
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

  // Automated In-Browser Excel Template Data Layout Provisioner
  const handleDownloadTemplateFile = (templateType: "standard" | "weighted" | "range") => {
    const workbook = XLSX.utils.book_new();
    let templateData: any[] = [];

    if (templateType === "standard") {
      templateData = [{ Name: "Alice Smith", TicketNumber: 1001 }, { Name: "Bob Jones", TicketNumber: 1002 }];
    } else if (templateType === "weighted") {
      templateData = [{ Name: "Alice Smith", Entries: 5 }, { Name: "Bob Jones", Entries: 1 }];
    } else {
      templateData = [{ Name: "Ben Smith", TicketRange: "1-150" }, { Name: "Julie Vance", TicketRange: "151-300" }];
    }
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Raffle Template");
    XLSX.writeFile(workbook, `Tolo_Draw_Template_${templateType}.xlsx`);
  };

  // Browser Clipboard Easy Link Sharing Copy Engine
  const handleCopySharingPublicLink = () => {
    const publicDisplayUrl = `${window.location.origin}/display/${drawId}`;
    navigator.clipboard.writeText(publicDisplayUrl).then(() => {
      setShareText("✓ Copied!");
      setTimeout(() => setShareText("Copy Public Screen Link"), 2000);
    }).catch((err) => console.error(err));
  };

  // In-Browser SheetJS Reader with Advanced Dynamic Auto-Detector Logic
    // In-Browser SheetJS Reader with Advanced Structural Schema Verification Loops
  const handleSpreadsheetIngestion = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0]; 
        const worksheet = workbook.Sheets[firstSheetName];
        const rawRows = XLSX.utils.sheet_to_json<any>(worksheet);

        // ──> CRITICAL DATA PROTECTION SUB-SYSTEM: EMPTY WORKBOOK CHECK
        if (!rawRows || rawRows.length === 0) {
          alert("Data Ingestion Error: The uploaded spreadsheet appears to be completely empty.");
          e.target.value = ""; // Clear file slot buffer instantly
          setUploadedFileName(null);
          return;
        }

        // ──> STRUCTURAL SCHEMA VALIDATOR MODULE
        // Extracts the raw column property keys from the very first data row entry
        const sampleRowKeys = Object.keys(rawRows[0]);
        const hasValidNameColumn = sampleRowKeys.some(key => 
          ["name", "participant"].includes(key.toLowerCase().trim())
        );

        if (!hasValidNameColumn) {
          alert(
            "Spreadsheet Schema Mismatch! Ingestion Halted.\n\n" +
            "Your file must contain a column header labeled exactly 'Name' or 'Participant' so the system can map contestant tokens successfully.\n\n" +
            "Click the download links above to pull down a pre-formatted blueprint template sheet."
          );
          e.target.value = ""; // Clear file slot buffer instantly
          setUploadedFileName(null);
          return;
        }

        // If the schema verification passes perfectly, proceed to parse the token allocations
        setUploadedFileName(file.name);
        const parsedTickets: RaffleTicket[] = [];
        let foundValidTicketIdentifiers = false;

        rawRows.forEach((row) => {
          const name = row.Name || row.name || row.Participant || Object.values(row)[0];
          if (!name) return;
          let entriesCount = 1;
          let sequentialStart: number | undefined = undefined;

          if (drawType === "weighted-ingest" && weightedSubType === "range") {
            const rangeStr = String(row.TicketRange || row.Range || row.Tickets || "");
            if (rangeStr.includes("-")) {
              const parts = rangeStr.split("-");
              const start = parseInt(parts[0]);
              const end = parseInt(parts[1]);
              if (!isNaN(start) && !isNaN(end) && end >= start) {
                entriesCount = end - start + 1;
                sequentialStart = start;
                foundValidTicketIdentifiers = true;
              }
            }
          } else {
            entriesCount = parseInt(row.Entries || row.Weight || row.Count) || 1;
            const explicitNum = parseInt(row.TicketNumber || row.TicketId || row.Number || row.id);
            if (!isNaN(explicitNum)) {
              sequentialStart = explicitNum;
              foundValidTicketIdentifiers = true;
            }
          }

          for (let i = 1; i <= entriesCount; i++) {
            parsedTickets.push({
              ticketId: crypto.randomUUID(),
              participantName: String(name).trim(),
              attachedNumber: sequentialStart !== undefined ? sequentialStart + (drawType === "weighted-ingest" && weightedSubType === "range" ? i - 1 : 0) : undefined,
              entryIndex: i,
              isNumericTicket: false
            });
          }
        });

        setHasTicketNumbers(foundValidTicketIdentifiers);
        if (!foundValidTicketIdentifiers) setRevealMode("name");
        setActivePool(parsedTickets);
        setHistoryPool([]);
      } catch (error) {
        console.error("Local client binary parsing validation exception:", error);
        alert("Critical Error: Failed to process the spreadsheet data binary stream.");
      }
    };
    reader.readAsArrayBuffer(file);
  };


  const handleGenerateNumericRange = (e: React.FormEvent) => {
    e.preventDefault();
    const min = parseInt(startRange);
    const max = parseInt(endRange);
    if (isNaN(min) || isNaN(max) || min > max) return;

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
    setHasTicketNumbers(true);
    setRevealMode("name");
    setActivePool(generatedTickets);
    setHistoryPool([]);
    setUploadedFileName(`Generated Range: ${min} to ${max}`);
  };

  const handleBackgroundBlobIngestion = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setCustomBgImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const triggerStateDrawAction = () => {
    if (!activePool || activePool.length === 0 || !activeChannel) return;
    const randomIndex = Math.floor(Math.random() * activePool.length);
    const updatedActivePool = [...activePool];
    const [winningTicket] = updatedActivePool.splice(randomIndex, 1);

    setActivePool(updatedActivePool);
    setHistoryPool((prev) => [winningTicket, ...prev]);

    const outputRevealVector = revealMode === "ticket-number" && winningTicket.attachedNumber !== undefined
      ? `Ticket #${winningTicket.attachedNumber}`
      : winningTicket.participantName;

    activeChannel.send({
      type: "broadcast",
      event: "trigger-draw",
      payload: { 
        winnerName: outputRevealVector,
        themeBgImage: customBgImage, 
        themeFont: googleFontFamily,
        themeAnim: canvasAnim,
        textColor: canvasTextColor,
        localeCode: activeLocale
      },
    });
  };

  const triggerPoolResetAction = () => {
    if (!historyPool || historyPool.length === 0 || !activeChannel) return;
    setActivePool([...activePool, ...historyPool]);
    setHistoryPool([]);

    activeChannel.send({
      type: "broadcast",
      event: "reset-draw",
      payload: {
        localeCode: activeLocale
      }
    });
  };

  return (
    <main className="w-screen h-screen flex bg-zinc-950 text-white overflow-hidden font-sans">
      <section className="flex-1 p-8 space-y-6 overflow-y-auto border-r border-zinc-900">
        <div className="flex justify-between items-start">
          <div className="space-y-1 w-full max-w-md">
            <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Draw Identity Label</label>
            <input type="text" value={drawName} onChange={(e) => updateDrawNameGlobally(e.target.value)} className="w-full text-2xl font-black bg-transparent border-b border-transparent hover:border-zinc-800 focus:border-amber-500 focus:outline-none py-1 text-amber-400" />
          </div>
          <div className="flex gap-2">
            <select value={activeLocale} onChange={(e) => setActiveLocale(e.target.value as SupportedLocale)} className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs focus:outline-none focus:border-amber-500 text-zinc-300 font-medium cursor-pointer">
              <option value="en">🇺🇸 English (EN)</option>
              <option value="es">🇪🇸 Sorteo (ES)</option>
              <option value="fr">🇫🇷 Français (FR)</option>
              <option value="ar">🇸🇦 العربية (AR)</option>
              <option value="zh">🇨🇳 繁體中文 (ZH)</option>
            </select>
            <button type="button" onClick={handleCopySharingPublicLink} className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold text-amber-400 rounded-xl transition-colors cursor-pointer select-none">{shareText}</button>
            <button type="button" onClick={() => router.push("/manage")} className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold rounded-xl border border-zinc-800 cursor-pointer text-white">← Exit</button>
          </div>
        </div>

        {/* STEP 1 */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{LOCALES[activeLocale].step1Title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { id: "random-names", label: "Standard Names List", desc: "Basic single spreadsheet entry rows." },
              { id: "weighted-ingest", label: "Weighted Spreadsheet", desc: "Handles weights or ticket number ranges (e.g. 1-150)." },
              { id: "random-numbers", label: "Numbers Generator", desc: "Populates numeric entries directly inside client RAM." },
            ].map((option) => (
              <label key={option.id} className={`flex gap-3 items-start p-4 rounded-xl border transition-all cursor-pointer bg-zinc-950 ${drawType === option.id ? "border-amber-500 bg-amber-500/5" : "border-zinc-800 hover:border-zinc-700"}`}>
                <input type="radio" name="draw-type" value={option.id} checked={drawType === option.id} onChange={(e) => { setDrawType(e.target.value); setActivePool([]); setHistoryPool([]); setUploadedFileName(null); setHasTicketNumbers(false); }} className="mt-1 accent-amber-500 cursor-pointer" />
                <div>
                  <span className="block text-sm font-bold">{option.label}</span>
                  <span className="block text-xs text-zinc-400 mt-0.5 leading-normal">{option.desc}</span>
                </div>
              </label>
            ))}
          </div>
          {drawType === "weighted-ingest" && (
            <div className="flex gap-6 mt-2 p-4 bg-zinc-950/40 rounded-xl border border-zinc-800/80 animate-fade-in">
              <label className="flex items-center gap-2 text-xs font-medium text-zinc-300 cursor-pointer"><input type="radio" name="weighted-subtype" checked={weightedSubType === "count"} onChange={() => { setWeightedSubtype("count"); setUploadedFileName(null); setActivePool([]); }} className="accent-amber-500" />Multiple Entries (Name + Count)</label>
              <label className="flex items-center gap-2 text-xs font-medium text-zinc-300 cursor-pointer"><input type="radio" name="weighted-subtype" checked={weightedSubType === "range"} onChange={() => { setWeightedSubtype("range"); setUploadedFileName(null); setActivePool([]); }} className="accent-amber-500" />Sequential Ranges (e.g. 1-150)</label>
            </div>
          )}
        </div>

        {/* STEP 2 */}
                {/* STEP 2 DESIGN INTEGRATION BLOCK */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          {drawType === "random-numbers" ? (
            <form onSubmit={handleGenerateNumericRange} className="space-y-4">
              <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Step 2: Define Core Integer Boundaries</h2>
              <div className="grid grid-cols-2 gap-4">
                <input type="number" required placeholder="Starting Range" value={startRange} onChange={(e) => setStartRange(e.target.value)} className="px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm font-mono text-white w-full" />
                <input type="number" required placeholder="Ending Range" value={endRange} onChange={(e) => setEndRange(e.target.value)} className="px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm font-mono text-white w-full" />
              </div>
              <button type="submit" className="w-full py-3 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold rounded-xl text-white">Lock Numbers Pool</button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{LOCALES[activeLocale].step2Title}</h2>
                <div className="text-xs text-zinc-500 flex items-center gap-1.5 animate-fade-in">
                  <span>Download Blueprint:</span>
                  {drawType === "random-names" && <button type="button" onClick={() => handleDownloadTemplateFile("standard")} className="text-amber-400 hover:underline font-bold cursor-pointer">Standard.xlsx</button>}
                  {drawType === "weighted-ingest" && weightedSubType === "count" && <button type="button" onClick={() => handleDownloadTemplateFile("weighted")} className="text-amber-400 hover:underline font-bold cursor-pointer">Weighted.xlsx</button>}
                  {drawType === "weighted-ingest" && weightedSubType === "range" && <button type="button" onClick={() => handleDownloadTemplateFile("range")} className="text-amber-400 hover:underline font-bold cursor-pointer">Ticket_Ranges.xlsx</button>}
                </div>
              </div>
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-zinc-800 hover:border-amber-500/40 rounded-xl cursor-pointer bg-zinc-950/50 transition-all">
                {/* ──> THE VERIFICATION REMAP: Automatically toggles string based on validator updates */}
                <span className="text-sm text-zinc-400">
                  {uploadedFileName ? <span className="text-amber-400 font-bold">{uploadedFileName}</span> : "Load Names List (.xlsx)"}
                </span>
                <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleSpreadsheetIngestion} />
              </label>
            </div>
          )}
        </div>
        {/* STEP 3 */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
          {drawType !== "random-numbers" && hasTicketNumbers && (
            <div className="border-b border-zinc-800 pb-4 animate-fade-in">
              <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Step 3: Identity Presentation View Mode</h2>
              <div className="flex gap-4">
                {[{ id: "name", label: "Show Name String" }, { id: "ticket-number", label: "Show Ticket Number" }].map((mode) => (
                  <label key={mode.id} className="flex items-center gap-2 text-sm font-medium text-zinc-300 cursor-pointer"><input type="radio" name="reveal-mode" value={mode.id} checked={revealMode === mode.id} onChange={() => setRevealMode(mode.id as any)} className="accent-amber-500" />{mode.label}</label>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-xs text-zinc-400 font-bold block">{LOCALES[activeLocale].customBackdrop}</label>
              <label className="block w-full text-center py-2.5 px-3 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-xl text-xs font-bold cursor-pointer text-zinc-400">
                {customBgImage ? "✓ Image Buffered in RAM" : "Upload Image File"}
                <input type="file" accept="image/*" className="hidden" onChange={handleBackgroundBlobIngestion} />
              </label>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-zinc-400 font-bold block">{LOCALES[activeLocale].fontFamily}</label>
              <input type="text" value={googleFontFamily} onChange={(e) => setGoogleFontFamily(e.target.value)} className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs focus:outline-none focus:border-amber-500 font-mono text-white" placeholder="e.g. Bungee Spice, Inter" />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-zinc-400 font-bold block">{LOCALES[activeLocale].hexColor}</label>
              <div className="flex gap-2">
                <input type="text" value={canvasTextColor} onChange={(e) => setCanvasTextColor(e.target.value)} className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs focus:outline-none focus:border-amber-500 font-mono text-white" />
                <div style={{ backgroundColor: canvasTextColor }} className="w-9 h-8 rounded-lg border border-zinc-800 self-center" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-zinc-400 font-bold block">{LOCALES[activeLocale].motionLoop}</label>
              <select value={canvasAnim} onChange={(e) => setCanvasAnim(e.target.value)} className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none">
                <option value="anim-shuffle">Blurred Rolling Shuffle Loop</option>
                <option value="anim-slot">Vertical Slot Machine Spin</option>
                <option value="anim-fade">Instant Clean Fade-In Reveal</option>
                <option value="anim-zoom-pop">Explosive Scale Zoom-Pop Reveal</option>
                <option value="anim-glitch">Cybernetic Matrix RGB Glitch Reveal</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button onClick={triggerStateDrawAction} disabled={!activePool || activePool.length === 0} className="w-full py-4 bg-amber-500 text-zinc-950 text-lg font-black rounded-xl cursor-pointer">{LOCALES[activeLocale].drawNextWinner}</button>
          <button onClick={triggerPoolResetAction} disabled={!historyPool || historyPool.length === 0} className="px-6 py-4 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-red-400 font-bold rounded-xl cursor-pointer">{LOCALES[activeLocale].resetPool}</button>
        </div>
      </section>

      {/* HISTORIES TIMELINE SIDEBAR PANEL */}
      <aside className="w-80 bg-zinc-900/40 p-8 flex flex-col justify-between border-l border-zinc-900">
        <div className="space-y-6 overflow-hidden flex flex-col h-full">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-zinc-950 p-4 border border-zinc-800 rounded-xl text-center">
              <span className="block text-2xl font-black text-amber-400 font-mono">{activePool?.length || 0}</span>
              <span className="block text-[10px] uppercase font-bold text-zinc-500 mt-1">{LOCALES[activeLocale].remaining}</span>
            </div>
            <div className="bg-zinc-950 p-4 border border-zinc-800 rounded-xl text-center">
              <span className="block text-2xl font-black text-zinc-400 font-mono">{historyPool?.length || 0}</span>
              <span className="block text-[10px] uppercase font-bold text-zinc-500 mt-1">{LOCALES[activeLocale].drawnLog}</span>
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Live History Stack</h3>
            <div className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl p-4 overflow-y-auto space-y-2">
              {!historyPool || historyPool.length === 0 ? (
                <p className="text-xs text-zinc-600 text-center pt-8">No winners drawn.</p>
              ) : (
                historyPool.map((ticket, index) => (
                  <div key={ticket.ticketId} className={`p-3 text-sm rounded-lg font-medium border flex justify-between items-center ${index === 0 ? "bg-amber-500/10 border-amber-500/30 text-amber-400 font-bold animate-pulse" : "bg-zinc-900 border-zinc-800 text-zinc-300"}`}>
                    <div className="flex flex-col">
                      <span>{ticket.participantName}</span>
                      {ticket.attachedNumber !== undefined && (
                        <span className="text-[10px] text-amber-500/80 font-mono mt-0.5">Ticket #{ticket.attachedNumber}</span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-950 text-zinc-500">#{historyPool.length - index}</span>
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

export default function AdminDashboardCore() {
  return (
    <Suspense fallback={<div className="w-screen h-screen flex items-center justify-center bg-zinc-950 text-zinc-500 font-mono text-xs animate-pulse">LOADING_DRAW_WORKSPACE...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
