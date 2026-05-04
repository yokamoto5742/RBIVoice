import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PRESENCE_TICK_MS, PRESENCE_TIMEOUT_MS } from '../constants';
import type { PresenceState } from '../types';

export type PresenceStatus = 'recording' | 'idle' | 'disconnected' | 'unknown';

export interface PresenceResult {
  status: PresenceStatus;
  state: PresenceState | null;
}

export function usePresence(roomId: string): PresenceResult {
  const [state, setState] = useState<PresenceState | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());

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
          lastPing: data.lastPing ?? null,
          senderId: data.senderId ?? '',
        });
      },
      (err) => {
        console.error('usePresence onSnapshot error:', err);
      },
    );
    return unsubscribe;
  }, [roomId]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), PRESENCE_TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  return { status: computeStatus(state, now), state };
}

function computeStatus(state: PresenceState | null, now: number): PresenceStatus {
  if (!state) return 'unknown';
  const lastPingMs = state.lastPing?.toMillis() ?? 0;
  const elapsed = now - lastPingMs;
  if (elapsed > PRESENCE_TIMEOUT_MS) return 'disconnected';
  if (state.recording) return 'recording';
  return 'idle';
}
