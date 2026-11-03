// types/draw.ts

/**
 * Represents an individual ticket token inside the active drawing pool.
 * By mapping everything down to a ticket layout, we easily handle weighted entry options.
 */
export interface RaffleTicket {
  ticketId: string;       // Unique Primary Key (UUIDv4 generated in-browser)
  participantName: string;// The parsed string name of the individual
  attachedNumber?: number; // Optional number attached (e.g., ticket sequence / registration number)
  entryIndex: number;     // Helps separate 'John Doe #1' from 'John Doe #2' in multi-entry formats
}

/**
 * The master object structure representing an active ephemeral session pool.
 */
export interface EphemeralRaffleSession {
  roomId: string;          // The dynamic WebSocket channel code (e.g., ROOM-9921)
  drawType: 'random-names' | 'random-numbers' | 'multiple-numbers' | 'multiple-entries';
  activePool: RaffleTicket[]; // All tickets remaining inside the virtual pot
  historyPool: RaffleTicket[];// Chronological stack of all pulled winning tickets
}
