// types/draw.ts

/**
 * Enforces the strict structural contract for a raffle token 
 * within the localized in-browser sandbox state pools.
 */
export interface RaffleTicket {
  ticketId: string;          // Cryptographically secure unique tracker key (UUIDv4)
  participantName: string;   // The string row value (Excel name OR generated Range Number)
  attachedNumber?: number;   // Optional numerical index map (e.g. tracking row IDs)
  entryIndex: number;        // Weighted multiplier key to separate duplicate entries cleanly
  isNumericTicket?: boolean; // ◄── THE CORRECTION FIX: Flags if object was generated via integer range fields
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
