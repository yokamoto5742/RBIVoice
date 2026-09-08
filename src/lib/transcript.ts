import { Timestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { TRANSCRIPT_TTL_MS } from '../constants';
import type { Transcript } from '../types';

/** 期限切れの文字起こしは空文字として扱う */
export function activeText(transcript: Transcript | null, now: number): string {
  if (!transcript) return '';
  const expiresMs = transcript.expiresAt?.toMillis() ?? Number.POSITIVE_INFINITY;
  return expiresMs <= now ? '' : transcript.text;
}

function transcriptRef(roomId: string) {
  return doc(db, 'rooms', roomId, 'transcript', 'body');
}

function nextExpiresAt(): Timestamp {
  return Timestamp.fromMillis(Date.now() + TRANSCRIPT_TTL_MS);
}

export async function saveTranscriptText(roomId: string, text: string): Promise<void> {
  await updateDoc(transcriptRef(roomId), {
    text,
    updatedAt: Timestamp.now(),
    expiresAt: nextExpiresAt(),
  });
}
