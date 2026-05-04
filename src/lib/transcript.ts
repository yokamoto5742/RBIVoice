import { Timestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { TRANSCRIPT_TTL_MS } from '../constants';

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

export async function clearTranscript(roomId: string): Promise<void> {
  await updateDoc(transcriptRef(roomId), {
    text: '',
    updatedAt: Timestamp.now(),
    expiresAt: nextExpiresAt(),
  });
}
