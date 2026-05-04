import type { Timestamp } from 'firebase/firestore';

export interface Transcript {
  text: string;
  updatedAt: Timestamp | null;
  expiresAt: Timestamp | null;
}

export interface PresenceState {
  recording: boolean;
  lastPing: Timestamp | null;
  senderId: string;
}
