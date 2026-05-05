import { useEffect, useMemo, useRef, useState } from 'react';
import { PresenceBadge } from './components/PresenceBadge';
import { RoomGate } from './components/RoomGate';
import { ToolBar } from './components/ToolBar';
import { TranscriptView } from './components/TranscriptView';
import { UI_TEXT } from './constants';
import { usePresence } from './hooks/usePresence';
import { useTranscript } from './hooks/useTranscript';
import { clearTranscript, saveTranscriptText } from './lib/transcript';
import { getRoomIdFromUrl } from './lib/room';

export default function App() {
  const roomId = useMemo(() => getRoomIdFromUrl(), []);
  if (!roomId) return <RoomGate />;
  return <RoomView roomId={roomId} />;
}

function RoomView({ roomId }: { roomId: string }) {
  const transcript = useTranscript(roomId);
  const { status } = usePresence(roomId);
  const canEdit = status !== 'recording';
  const [feedback, setFeedback] = useState<string>('');

  function handleFeedback(msg: string) {
    setFeedback(msg);
    window.setTimeout(() => setFeedback(''), 1500);
  }

  const liveText = useMemo(() => {
    if (!transcript) return '';
    const expiresMs = transcript.expiresAt?.toMillis() ?? Number.POSITIVE_INFINITY;
    if (expiresMs <= Date.now()) return '';
    return transcript.text;
  }, [transcript]);

  const [draft, setDraft] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const prevCanEditRef = useRef<boolean>(canEdit);

  // 編集権が外れた瞬間にドラフトを破棄してライブ表示に戻す
  useEffect(() => {
    if (prevCanEditRef.current && !canEdit) {
      setIsEditing(false);
      setDraft('');
    }
    prevCanEditRef.current = canEdit;
  }, [canEdit]);

  const displayText = isEditing ? draft : liveText;
  const isDirty = isEditing && draft !== liveText;

  function handleChange(next: string) {
    if (!canEdit) return;
    if (!isEditing) setIsEditing(true);
    setDraft(next);
  }

  async function handleSave() {
    await saveTranscriptText(roomId, draft);
    setIsEditing(false);
    setDraft('');
  }

  async function handleClear() {
    await clearTranscript(roomId);
    setIsEditing(false);
    setDraft('');
  }

  return (
    <div className="mx-auto flex h-full max-w-4xl flex-col gap-3 p-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold text-gray-900">{UI_TEXT.appTitle}</h1>
          <span className="text-xs text-gray-500">
            {UI_TEXT.roomLabel}: <code className="rounded bg-gray-100 px-1.5 py-0.5">{roomId}</code>
          </span>
          <PresenceBadge status={status} />
          {feedback && <span className="text-xs text-gray-500">{feedback}</span>}
        </div>
        <ToolBar
          text={displayText}
          canEdit={canEdit}
          isDirty={isDirty}
          onSave={handleSave}
          onClear={handleClear}
          onFeedback={handleFeedback}
        />
      </header>
      <main className="min-h-0 flex-1">
        <TranscriptView text={displayText} readOnly={!canEdit} onChange={handleChange} />
      </main>
    </div>
  );
}
