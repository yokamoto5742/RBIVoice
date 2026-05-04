import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { UI_TEXT } from '../constants';

interface Props {
  text: string;
  readOnly: boolean;
  onChange: (next: string) => void;
}

const SCROLL_TOLERANCE_PX = 8;

export function TranscriptView({ text, readOnly, onChange }: Props) {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const stickToBottomRef = useRef<boolean>(true);

  function handleScroll() {
    const el = ref.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottomRef.current = distanceFromBottom <= SCROLL_TOLERANCE_PX;
  }

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    // 読み取り専用時のみ末尾追従。編集中はカーソル位置を維持する
    if (readOnly && stickToBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [text, readOnly]);

  useEffect(() => {
    stickToBottomRef.current = true;
  }, []);

  const showPlaceholder = readOnly && text.length === 0;
  const display = useMemo(
    () => (showPlaceholder ? UI_TEXT.emptyTranscript : text),
    [showPlaceholder, text],
  );

  return (
    <textarea
      ref={ref}
      readOnly={readOnly}
      value={display}
      onChange={(e) => onChange(e.target.value)}
      onScroll={handleScroll}
      className="h-full w-full resize-none rounded-md border border-gray-300 bg-white p-3 font-mono text-sm leading-relaxed text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300 read-only:bg-gray-50"
      spellCheck={false}
    />
  );
}
