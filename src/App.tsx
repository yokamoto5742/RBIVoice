import { useMemo, useState } from 'react';
import { PresenceBadge } from './components/PresenceBadge';
import { RoomGate } from './components/RoomGate';
import { ToolBar } from './components/ToolBar';
import { TranscriptView } from './components/TranscriptView';
import { UI_TEXT } from './constants';
import { usePresence } from './hooks/usePresence';
import { useSegments } from './hooks/useSegments';
import { getRoomIdFromUrl } from './lib/room';

export default function App() {
  const roomId = useMemo(() => getRoomIdFromUrl(), []);
  if (!roomId) return <RoomGate />;
  return <RoomView roomId={roomId} />;
}

function RoomView({ roomId }: { roomId: string }) {
  const segments = useSegments(roomId);
  const { status } = usePresence(roomId);
  const [hiddenBefore, setHiddenBefore] = useState<number>(0);

  const text = useMemo(() => {
    const nowMs = Date.now();
    return segments
      .filter((seg) => {
        const expiresMs = seg.expiresAt?.toMillis() ?? Number.POSITIVE_INFINITY;
        const createdMs = seg.createdAt?.toMillis() ?? 0;
        return expiresMs > nowMs && createdMs >= hiddenBefore;
      })
      .map((seg) => seg.text)
      .join('\n');
  }, [segments, hiddenBefore]);

  return (
    <div className="mx-auto flex h-full max-w-4xl flex-col gap-3 p-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold text-gray-900">{UI_TEXT.appTitle}</h1>
          <span className="text-xs text-gray-500">
            {UI_TEXT.roomLabel}: <code className="rounded bg-gray-100 px-1.5 py-0.5">{roomId}</code>
          </span>
          <PresenceBadge status={status} />
        </div>
        <ToolBar text={text} onClear={() => setHiddenBefore(Date.now())} />
      </header>
      <main className="min-h-0 flex-1">
        <TranscriptView text={text} />
      </main>
    </div>
  );
}
