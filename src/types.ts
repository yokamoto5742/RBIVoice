import type { Timestamp } from 'firebase/firestore';

export interface Segment {
  id: string;
  text: string;
  createdAt: Timestamp | null;
  expiresAt: Timestamp | null;
  senderId: string;
}

export interface PresenceState {
  recording: boolean;
  lastPing: Timestamp | null;
  senderId: string;
}
