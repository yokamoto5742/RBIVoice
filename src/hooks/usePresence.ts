import { useEffect, useState } from 'react';
import { Timestamp, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PRESENCE_TIMEOUT_MS } from '../constants';
import type { PresenceState, PresenceStatus } from '../types';

export function usePresence(roomId: string, now: number): PresenceStatus {
  const [state, setState] = useState<PresenceState | null>(null);

  useEffect(() => {
    setState(null);
    const ref = doc(db, 'rooms', roomId, 'meta', 'state');
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setState(null);
          return;
        }
        const data = snap.data();
        setState({
          recording: Boolean(data.recording),
          lastPing: data.lastPing instanceof Timestamp ? data.lastPing : null,
          senderId: data.senderId ?? '',
        });
      },
      (err) => {
        console.error('usePresence onSnapshot error:', err);
      },
    );
    return unsubscribe;
  }, [roomId]);

  return computeStatus(state, now);
}

export function computeStatus(state: PresenceState | null, now: number): PresenceStatus {
  if (!state) return 'disconnected';
  const lastPingMs = state.lastPing?.toMillis() ?? 0;
  const elapsed = now - lastPingMs;
  if (elapsed > PRESENCE_TIMEOUT_MS) return 'disconnected';
  if (state.recording) return 'recording';
  return 'idle';
}
