"use client";

import {
  DisplayAesthetics,
  VerticalOffset,
  SubTextPositionMode,
} from "@/types/draw";
import { LOCALES, SupportedLocale } from "@/constants/locales";

interface AestheticsPanelProps {
  aesthetics: DisplayAesthetics;
  activeLocale: SupportedLocale;
  hasExtraColumnData: boolean;
  onUpdate: (patch: Partial<DisplayAesthetics>) => void;
  onResetAesthetics: () => void;
}

export function AestheticsPanel({
  aesthetics,
  activeLocale,
  hasExtraColumnData,
  onUpdate,
  onResetAesthetics,
}: AestheticsPanelProps) {
  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      onUpdate({ themeBgImage: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const adjustFontSize = (delta: number) => {
    const nextSize = Math.min(
      16,
      Math.max(3, Number((aesthetics.themeFontSize + delta).toFixed(1)))
    );
    onUpdate({ themeFontSize: nextSize });
  };

  // Coordinated guardrail: moving main text to Bottom Third prevents "Below" extra line
  const handleVerticalOffsetChange = (nextOffset: VerticalOffset) => {
    if (nextOffset === "bottom" && aesthetics.subTextMode === "below") {
      onUpdate({ verticalOffset: nextOffset, subTextMode: "above" });
    } else {
      onUpdate({ verticalOffset: nextOffset });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
          Display Screen Styling
        </h3>
        <button
          type="button"
          onClick={onResetAesthetics}
          className="text-[11px] font-semibold text-zinc-500 hover:text-amber-400 transition-colors cursor-pointer"
        >
          Reset Styling
        </button>
      </div>

      {/* ROW 1: Backdrop, Font Family, Font Size (+/-), Motion Loop */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <label className="text-xs text-zinc-400 font-bold block">
            {LOCALES[activeLocale].customBackdrop}
          </label>
          <div className="flex gap-1.5">
            <label className="flex-1 text-center py-2.5 px-3 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-xl text-xs font-bold cursor-pointer text-zinc-400 truncate">
              {aesthetics.themeBgImage ? "✓ Image Loaded" : "Upload Image"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleBackgroundUpload}
              />
            </label>
            {aesthetics.themeBgImage && (
              <button
                type="button"
                onClick={() => onUpdate({ themeBgImage: null })}
                title="Remove background image"
                className="px-2.5 bg-zinc-950 border border-zinc-800 hover:border-red-500/40 text-zinc-500 hover:text-red-400 rounded-xl text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-zinc-400 font-bold block">
            {LOCALES[activeLocale].fontFamily}
          </label>
          <input
            type="text"
            value={aesthetics.themeFont}
            onChange={(e) => onUpdate({ themeFont: e.target.value })}
            className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs focus:outline-none focus:border-amber-500 font-mono text-white"
            placeholder="e.g. Bungee Spice, Inter"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs text-zinc-400 font-bold block">Font Size</label>
          <div className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-xl p-1">
            <button
              type="button"
              onClick={() => adjustFontSize(-0.5)}
              disabled={aesthetics.themeFontSize <= 3}
              aria-label="Decrease font size"
              className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 rounded-lg text-xs font-black text-white cursor-pointer"
            >
              −
            </button>
            <span className="text-xs font-mono text-amber-400 font-bold">
              {aesthetics.themeFontSize === 8 ? "Default" : `${aesthetics.themeFontSize}vw`}
            </span>
            <button
              type="button"
              onClick={() => adjustFontSize(0.5)}
              disabled={aesthetics.themeFontSize >= 16}
              aria-label="Increase font size"
              className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 rounded-lg text-xs font-black text-white cursor-pointer"
            >
              +
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-zinc-400 font-bold block">
            {LOCALES[activeLocale].motionLoop}
          </label>
          <select
            value={aesthetics.themeAnim}
            onChange={(e) => onUpdate({ themeAnim: e.target.value })}
            className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none"
          >
            <option value="anim-shuffle">Blurred Rolling Shuffle Loop</option>
            <option value="anim-slot">Vertical Slot Machine Spin</option>
            <option value="anim-fade">Instant Clean Fade-In Reveal</option>
            <option value="anim-zoom-pop">Explosive Scale Zoom-Pop Reveal</option>
            <option value="anim-glitch">Cybernetic Matrix RGB Glitch Reveal</option>
          </select>
        </div>
      </div>
      {/* ROW 2: Text Color, Font Background, Background Blur */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-zinc-800/70">
        <div className="space-y-2">
          <label className="text-xs text-zinc-400 font-bold block">
            {LOCALES[activeLocale].hexColor}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={aesthetics.textColor}
              onChange={(e) => onUpdate({ textColor: e.target.value })}
              className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs focus:outline-none focus:border-amber-500 font-mono text-white"
            />
            <input
              type="color"
              value={aesthetics.textColor}
              onChange={(e) => onUpdate({ textColor: e.target.value })}
              className="w-10 h-9 rounded-lg border border-zinc-800 bg-zinc-950 cursor-pointer"
            />
          </div>
        </div>

        {/* Font Background Pill */}
                {/* Font Background (Frosted Matte Card Toggle) */}
        <div className="space-y-2">
          <label className="text-xs text-zinc-400 font-bold block">
            Font Background
          </label>
          <label className="flex items-center justify-between px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-xl cursor-pointer transition-colors">
            <span className="text-xs font-medium text-zinc-300">
              {aesthetics.fontBgEnabled ? "Frosted Card On" : "Transparent (No Box)"}
            </span>
            <input
              type="checkbox"
              checked={aesthetics.fontBgEnabled}
              onChange={(e) => onUpdate({ fontBgEnabled: e.target.checked })}
              className="w-4 h-4 accent-amber-500 cursor-pointer"
            />
          </label>
        </div>

        {/* Background Blur */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-zinc-400 font-bold">Background Blur</label>
            <span className="text-[11px] font-mono text-amber-400">
              {aesthetics.bgBlurPx === 0 ? "Off" : `${aesthetics.bgBlurPx}px`}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={24}
            step={2}
            value={aesthetics.bgBlurPx}
            onChange={(e) => onUpdate({ bgBlurPx: Number(e.target.value) })}
            className="w-full accent-amber-500 cursor-pointer mt-2"
          />
        </div>
      </div>

      {/* ROW 3: Coordinated Screen Offset & Extra Excel Column Line */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-zinc-800/70">
        {/* Display Vertical Third Offset */}
        <div className="space-y-2">
          <label className="text-xs text-zinc-400 font-bold block">
            Display Screen Position
          </label>
          <div className="grid grid-cols-3 gap-1.5 bg-zinc-950 border border-zinc-800 rounded-xl p-1">
            {(
              [
                { id: "top", label: "Top Third" },
                { id: "middle", label: "Middle Third" },
                { id: "bottom", label: "Bottom Third" },
              ] as const
            ).map((pos) => (
              <label
                key={pos.id}
                className={`text-center py-1.5 px-2 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                  aesthetics.verticalOffset === pos.id
                    ? "bg-amber-500 text-zinc-950"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <input
                  type="radio"
                  name="vertical-offset"
                  value={pos.id}
                  checked={aesthetics.verticalOffset === pos.id}
                  onChange={() => handleVerticalOffsetChange(pos.id)}
                  className="hidden"
                />
                {pos.label}
              </label>
            ))}
          </div>
        </div>

        {/* Extra Excel Column Line Position */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-zinc-400 font-bold">
              Extra Excel Column Line
            </label>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                hasExtraColumnData
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-zinc-950 text-zinc-500 border border-zinc-800"
              }`}
            >
              {hasExtraColumnData ? "Extra Column Detected" : "No Extra Column"}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 bg-zinc-950 border border-zinc-800 rounded-xl p-1">
            {(
              [
                { id: "hidden", label: "Hidden" },
                { id: "above", label: "Above Main" },
                { id: "below", label: "Below Main" },
              ] as const
            ).map((mode) => {
              const isBelowBlocked =
                mode.id === "below" && aesthetics.verticalOffset === "bottom";

              return (
                <label
                  key={mode.id}
                  title={
                    isBelowBlocked
                      ? "Disabled while Display Position is set to Bottom Third"
                      : undefined
                  }
                  className={`text-center py-1.5 px-2 rounded-lg text-xs font-bold transition-colors ${
                    isBelowBlocked
                      ? "opacity-30 cursor-not-allowed text-zinc-600"
                      : aesthetics.subTextMode === mode.id
                      ? "bg-amber-500 text-zinc-950 cursor-pointer"
                      : "text-zinc-400 hover:text-white cursor-pointer"
                  }`}
                >
                  <input
                    type="radio"
                    name="subtext-mode"
                    value={mode.id}
                    disabled={isBelowBlocked}
                    checked={aesthetics.subTextMode === mode.id}
                    onChange={() =>
                      onUpdate({ subTextMode: mode.id as SubTextPositionMode })
                    }
                    className="hidden"
                  />
                  {mode.label}
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
