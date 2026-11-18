// types/draw.ts
import { SupportedLocale } from "@/constants/locales";

export interface RaffleTicket {
  ticketId: string;
  participantName: string;
  attachedNumber?: number;
  extraText?: string;
  entryIndex: number;
  isNumericTicket?: boolean;
}

export interface LocalDrawInstance {
  id: string;
  name: string;
  drawType: string;
  createdAt: string;
}

export type GridPosition9 =
  | "top-left"
  | "top-center"
  | "top-right"
  | "middle-left"
  | "middle-center"
  | "middle-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export type BgFitMode = "stretch" | "contain" | "original";
export type ConfettiStyle = "off" | "classic" | "gold" | "neon" | "fireworks";
export type SubTextPositionMode = "hidden" | "above" | "below";

export interface DisplayAesthetics {
  themeBgImage: string | null;
  themeBgHash: string | null;
  bgColor: string;
  bgPulseEnabled: boolean;
  bgFitMode: BgFitMode;
  bgImagePosition: GridPosition9;
  textPosition: GridPosition9;
  confettiStyle: ConfettiStyle;
  themeFont: string;
  themeFontSize: number; // Baseline: 8 (represents 8vw)
  themeAnim: string;
  textColor: string;
  bgBlurPx: number;
  fontBgEnabled: boolean; // Toggles the frosted matte card behind the text
  subTextMode: SubTextPositionMode;
}

export const DEFAULT_DISPLAY_AESTHETICS: DisplayAesthetics = {
  themeBgImage: null,
  themeBgHash: null,
  bgColor: "#09090b",
  bgPulseEnabled: true,
  bgFitMode: "stretch",
  bgImagePosition: "middle-center",
  textPosition: "middle-center",
  confettiStyle: "classic",
  themeFont: "Inter",
  themeFontSize: 8,
  themeAnim: "anim-shuffle",
  textColor: "#fbbf24",
  bgBlurPx: 0,
  fontBgEnabled: true, // Preserves the classic frosted glass card by default; uncheck to remove haze
  subTextMode: "below",
};


export interface DrawBroadcastPayload extends DisplayAesthetics {
  winnerName: string;
  winnerExtraText?: string;
  localeCode: SupportedLocale;
}
