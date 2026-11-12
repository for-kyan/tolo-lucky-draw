// types/draw.ts
import { SupportedLocale } from "@/constants/locales";

/**
 * Enforces the strict structural contract for a raffle token 
 * within the localized in-browser sandbox state pools.
 */
export interface RaffleTicket {
  ticketId: string;          // Cryptographically secure unique tracker key (UUIDv4)
  participantName: string;   // The string row value (Excel name OR generated Range Number)
  attachedNumber?: number;   // Optional numerical index map (e.g. tracking row IDs)
  entryIndex: number;        // Weighted multiplier key to separate duplicate entries cleanly
  isNumericTicket?: boolean; // Flags if object was generated via integer range fields
}

/**
 * Enforces structure for the management directory rows tracker cache
 */
export interface LocalDrawInstance {
  id: string;
  name: string;
  drawType: string;
  createdAt: string;
}

/**
 * Presentation broadcast aesthetics synced between Dashboard and Display screens
 */
export interface DisplayAesthetics {
  themeBgImage: string | null;
  themeFont: string;
  themeFontSize: number; // Baseline: 8 (represents 8vw)
  themeAnim: string;
  textColor: string;
  bgBlurPx: number;      // Background blur intensity in pixels (0 = off)
  fontBgEnabled: boolean;
  fontBgColor: string;
  fontBgOpacity: number; // 0 to 100
  subText: string;       // Optional additional line of text
  subTextPosition: "above" | "below";
}

export const DEFAULT_DISPLAY_AESTHETICS: DisplayAesthetics = {
  themeBgImage: null,
  themeFont: "Inter",
  themeFontSize: 8,
  themeAnim: "anim-shuffle",
  textColor: "#fbbf24",
  bgBlurPx: 0,
  fontBgEnabled: false,
  fontBgColor: "#000000",
  fontBgOpacity: 60,
  subText: "",
  subTextPosition: "below",
};

/**
 * WebSocket payload transmitted on `trigger-draw` events
 */
export interface DrawBroadcastPayload extends DisplayAesthetics {
  winnerName: string;
  localeCode: SupportedLocale;
}
