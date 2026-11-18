"use client";

import { useState } from "react";
import {
  DisplayAesthetics,
  GridPosition9,
  BgFitMode,
  ConfettiStyle,
  SubTextPositionMode,
} from "@/types/draw";
import { LOCALES, SupportedLocale } from "@/constants/locales";
import { validateBackdropImage, computeBlobSha256 } from "@/lib/backdropCache";

const GRID_CELLS: { id: GridPosition9; label: string; arrow: string }[] = [
  { id: "top-left", label: "Top Left", arrow: "↖" },
  { id: "top-center", label: "Top Centre", arrow: "↑" },
  { id: "top-right", label: "Top Right", arrow: "↗" },
  { id: "middle-left", label: "Middle Left", arrow: "←" },
  { id: "middle-center", label: "Centre", arrow: "•" },
  { id: "middle-right", label: "Middle Right", arrow: "→" },
  { id: "bottom-left", label: "Bottom Left", arrow: "↙" },
  { id: "bottom-center", label: "Bottom Centre", arrow: "↓" },
  { id: "bottom-right", label: "Bottom Right", arrow: "↘" },
];

function PositionGrid3x3({
  value,
  onChange,
  ariaLabel,
}: {
  value: GridPosition9;
  onChange: (next: GridPosition9) => void;
  ariaLabel: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="grid grid-cols-3 gap-1 bg-zinc-950 border border-zinc-800 rounded-xl p-1.5 w-36"
    >
      {GRID_CELLS.map((cell) => {
        const active = value === cell.id;
        return (
          <button
            key={cell.id}
            type="button"
            title={cell.label}
            aria-label={cell.label}
            aria-checked={active}
            onClick={() => onChange(cell.id)}
            className={`h-8 rounded-lg text-xs font-black transition-colors cursor-pointer flex items-center justify-center ${
              active
                ? "bg-amber-500 text-zinc-950 shadow-sm"
                : "bg-zinc-900/70 text-zinc-400 hover:text-white hover:bg-zinc-800"
            }`}
          >
            {cell.arrow}
          </button>
        );
      })}
    </div>
  );
}

interface AestheticsPanelProps {
  aesthetics: DisplayAesthetics;
  activeLocale: SupportedLocale;
  hasExtraColumnData: boolean;
  onUpdate: (patch: Partial<DisplayAesthetics>) => void;
  onResetAesthetics: () => void;
  onBackdropFileSelected?: (file: File | null, hash: string | null) => void;
}

export function AestheticsPanel({
  aesthetics,
  activeLocale,
  hasExtraColumnData,
  onUpdate,
  onResetAesthetics,
  onBackdropFileSelected,
}: AestheticsPanelProps) {
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState<boolean>(false);

  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.item(0);
    if (!file) return;

    setUploadError(null);
    setIsProcessingImage(true);

    try {
      const validation = await validateBackdropImage(file);
      if (!validation.valid) {
        setUploadError(validation.error || "Invalid image file.");
        e.target.value = "";
        return;
      }

      const hash = await computeBlobSha256(file);
      onBackdropFileSelected?.(file, hash);
      onUpdate({
        themeBgImage: null,
        themeBgHash: hash,
      });
    } catch {
      setUploadError("Failed to read or verify the selected image file.");
    } finally {
      setIsProcessingImage(false);
      e.target.value = "";
    }
  };
  
  const handleRemoveBackdrop = () => {
    setUploadError(null);
    onBackdropFileSelected?.(null, null);
    onUpdate({ themeBgImage: null, themeBgHash: null });
  };

  const adjustFontSize = (delta: number) => {
    const nextSize = Math.min(
      16,
      Math.max(3, Number((aesthetics.themeFontSize + delta).toFixed(1)))
    );
    onUpdate({ themeFontSize: nextSize });
  };

  // Coordinated guardrail: moving text to any Bottom row cell prevents "Below" extra line
  const handleTextPositionChange = (nextPos: GridPosition9) => {
    if (nextPos.startsWith("bottom-") && aesthetics.subTextMode === "below") {
      onUpdate({ textPosition: nextPos, subTextMode: "above" });
    } else {
      onUpdate({ textPosition: nextPos });
    }
  };

  const hasBackdrop = Boolean(aesthetics.themeBgHash || aesthetics.themeBgImage);
  const t = LOCALES[activeLocale];
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
          {t.displayStylingTitle}
        </h3>
        <button
          type="button"
          onClick={() => {
            setUploadError(null);
            onBackdropFileSelected?.(null, null);
            onResetAesthetics();
          }}
          className="text-[11px] font-semibold text-zinc-500 hover:text-amber-400 transition-colors cursor-pointer"
        >
          {t.resetStylingBtn}
        </button>
      </div>

      {/* ROW 1: Backdrop (up to 30 MB), Font Family, Font Size (+/-), Motion Loop */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <label className="text-xs text-zinc-400 font-bold block">
            {t.customBackdrop} (Max 30 MB)
          </label>
          <div className="flex gap-1.5">
            <label className="flex-1 text-center py-2.5 px-3 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-xl text-xs font-bold cursor-pointer text-zinc-400 truncate">
              {isProcessingImage
                ? "Verifying..."
                : hasBackdrop
                ? "✓ Image Loaded"
                : "Upload Image"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                disabled={isProcessingImage}
                className="hidden"
                onChange={handleBackgroundUpload}
              />
            </label>
            {hasBackdrop && (
              <button
                type="button"
                onClick={handleRemoveBackdrop}
                title="Remove background image"
                className="px-2.5 bg-zinc-950 border border-zinc-800 hover:border-red-500/40 text-zinc-500 hover:text-red-400 rounded-xl text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
          {uploadError && (
            <p className="text-[11px] text-red-400 leading-snug">{uploadError}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-xs text-zinc-400 font-bold block">
            {t.fontFamily}
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
          <label className="text-xs text-zinc-400 font-bold block">
            {t.fontSizeLabel}
          </label>
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
            {t.motionLoop}
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

      {/* ROW 2: Text Color, Font Background, Background Blur, Confetti Dropdown */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2 border-t border-zinc-800/70">
        <div className="space-y-2">
          <label className="text-xs text-zinc-400 font-bold block">
            {t.hexColor}
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

        <div className="space-y-2">
          <label className="text-xs text-zinc-400 font-bold block">
            {t.fontBgLabel}
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

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-zinc-400 font-bold">{t.bgBlurLabel}</label>
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

        <div className="space-y-2">
          <label className="text-xs text-zinc-400 font-bold block">
            Winner Confetti
          </label>
          <select
            value={aesthetics.confettiStyle}
            onChange={(e) =>
              onUpdate({ confettiStyle: e.target.value as ConfettiStyle })
            }
            className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none"
          >
            <option value="off">Off (No Confetti)</option>
            <option value="classic">Classic Multicolour</option>
            <option value="gold">Championship Gold</option>
            <option value="neon">Cyber Neon</option>
            <option value="fireworks">High-Density Burst</option>
          </select>
        </div>
      </div>

      {/* ROW 3: Solid Background Color + Pulse Toggle OR 3-Mode Image Scaling */}
      <div className="pt-2 border-t border-zinc-800/70">
        {!hasBackdrop ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs text-zinc-400 font-bold block">
                Stage Background Colour
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={aesthetics.bgColor}
                  onChange={(e) => onUpdate({ bgColor: e.target.value })}
                  className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs focus:outline-none focus:border-amber-500 font-mono text-white"
                  placeholder="#09090b"
                />
                <input
                  type="color"
                  value={aesthetics.bgColor}
                  onChange={(e) => onUpdate({ bgColor: e.target.value })}
                  className="w-10 h-9 rounded-lg border border-zinc-800 bg-zinc-950 cursor-pointer"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-zinc-400 font-bold block">
                Ambient Glow Effect
              </label>
              <label className="flex items-center justify-between px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-xl cursor-pointer transition-colors">
                <span className="text-xs font-medium text-zinc-300">
                  {aesthetics.bgPulseEnabled ? "Pulsing Glow On" : "Flat Solid Colour (Off)"}
                </span>
                <input
                  type="checkbox"
                  checked={aesthetics.bgPulseEnabled}
                  onChange={(e) => onUpdate({ bgPulseEnabled: e.target.checked })}
                  className="w-4 h-4 accent-amber-500 cursor-pointer"
                />
              </label>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <label className="text-xs text-zinc-400 font-bold block">
              Background Image Scaling
            </label>
            <div className="grid grid-cols-3 gap-1.5 bg-zinc-950 border border-zinc-800 rounded-xl p-1">
              {(
                [
                  { id: "stretch", label: "Stretch (Fill Screen)" },
                  { id: "contain", label: "Keep Aspect Ratio" },
                  { id: "original", label: "Original File Size" },
                ] as const
              ).map((fit) => (
                <label
                  key={fit.id}
                  className={`text-center py-1.5 px-2 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                    aesthetics.bgFitMode === fit.id
                      ? "bg-amber-500 text-zinc-950"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="bg-fit-mode"
                    value={fit.id}
                    checked={aesthetics.bgFitMode === fit.id}
                    onChange={() => onUpdate({ bgFitMode: fit.id as BgFitMode })}
                    className="hidden"
                  />
                  {fit.label}
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
      {/* ROW 4: 3x3 Positioning Grids (Text Position + Screen Image Anchor) & Extra Excel Column */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-zinc-800/70">
        {/* Winner Text 3x3 Position Grid (Anchored to Background Image Bounds) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-zinc-400 font-bold">
              {t.screenPosLabel}
            </label>
            <span className="text-[10px] font-mono text-amber-400">
              {GRID_CELLS.find((c) => c.id === aesthetics.textPosition)?.label}
            </span>
          </div>
          <PositionGrid3x3
            value={aesthetics.textPosition}
            onChange={handleTextPositionChange}
            ariaLabel="Winner text 3x3 position"
          />
        </div>

        {/* Stage Image 3x3 Screen Position (Visible when image is not stretched full-screen) */}
        {hasBackdrop && aesthetics.bgFitMode !== "stretch" ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-zinc-400 font-bold">
                Image on Screen
              </label>
              <span className="text-[10px] font-mono text-amber-400">
                {GRID_CELLS.find((c) => c.id === aesthetics.bgImagePosition)?.label}
              </span>
            </div>
            <PositionGrid3x3
              value={aesthetics.bgImagePosition}
              onChange={(nextPos) => onUpdate({ bgImagePosition: nextPos })}
              ariaLabel="Background image 3x3 screen position"
            />
          </div>
        ) : (
          <div className="hidden md:block" />
        )}

        {/* Extra Excel Column Line Position */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-zinc-400 font-bold">
              {t.extraColLabel}
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
                { id: "hidden", label: t.extraHidden },
                { id: "above", label: t.extraAbove },
                { id: "below", label: t.extraBelow },
              ] as const
            ).map((mode) => {
              const isBelowBlocked =
                mode.id === "below" && aesthetics.textPosition.startsWith("bottom-");

              return (
                <label
                  key={mode.id}
                  title={
                    isBelowBlocked
                      ? "Disabled while Text Position is on the bottom row"
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
