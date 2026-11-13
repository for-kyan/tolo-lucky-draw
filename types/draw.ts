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

export type VerticalOffset = "top" | "middle" | "bottom";
export type SubTextPositionMode = "hidden" | "above" | "below";

export interface DisplayAesthetics {
  themeBgImage: string | null;
  themeFont: string;
  themeFontSize: number; // Baseline: 8 (represents 8vw)
  themeAnim: string;
  textColor: string;
  bgBlurPx: number;
  fontBgEnabled: boolean; // Toggles the frosted matte card behind the text
  verticalOffset: VerticalOffset;
  subTextMode: SubTextPositionMode;
}

export const DEFAULT_DISPLAY_AESTHETICS: DisplayAesthetics = {
  themeBgImage: null,
  themeFont: "Inter",
  themeFontSize: 8,
  themeAnim: "anim-shuffle",
  textColor: "#fbbf24",
  bgBlurPx: 0,
  fontBgEnabled: true, // Preserves the classic frosted glass card by default; uncheck to remove haze
  verticalOffset: "middle",
  subTextMode: "below",
};

export interface DrawBroadcastPayload extends DisplayAesthetics {
  winnerName: string;
  winnerExtraText?: string;
  localeCode: SupportedLocale;
}
