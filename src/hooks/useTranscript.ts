import { useEffect, useState } from 'react';
import { Timestamp, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Transcript } from '../types';

export function useTranscript(roomId: string): Transcript | null {
  const [transcript, setTranscript] = useState<Transcript | null>(null);

  useEffect(() => {
    setTranscript(null);
    const ref = doc(db, 'rooms', roomId, 'transcript', 'body');
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setTranscript({ text: '', updatedAt: null, expiresAt: null });
          return;
        }
        const data = snap.data();
        setTranscript({
          text: typeof data.text === 'string' ? data.text : '',
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt : null,
          expiresAt: data.expiresAt instanceof Timestamp ? data.expiresAt : null,
        });
      },
      (err) => {
        console.error('useTranscript onSnapshot error:', err);
      },
    );
    return unsubscribe;
  }, [roomId]);

  return transcript;
}
