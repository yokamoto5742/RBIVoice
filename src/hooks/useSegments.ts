import { useEffect, useState } from 'react';
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { SEGMENT_LIMIT } from '../constants';
import type { Segment } from '../types';

export function useSegments(roomId: string): Segment[] {
  const [segments, setSegments] = useState<Segment[]>([]);

  useEffect(() => {
    setSegments([]);
    const q = query(
      collection(db, 'rooms', roomId, 'segments'),
      orderBy('createdAt', 'asc'),
      limit(SEGMENT_LIMIT),
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      const next = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          text: data.text ?? '',
          createdAt: data.createdAt ?? null,
          expiresAt: data.expiresAt ?? null,
          senderId: data.senderId ?? '',
        } satisfies Segment;
      });
      setSegments(next);
    });
    return unsubscribe;
  }, [roomId]);

  return segments;
}
