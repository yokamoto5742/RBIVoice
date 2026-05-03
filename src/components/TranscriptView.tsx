import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { UI_TEXT } from '../constants';

interface Props {
  text: string;
}

const SCROLL_TOLERANCE_PX = 8;

export function TranscriptView({ text }: Props) {
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
    if (stickToBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [text]);

  // 初回マウント時は末尾追従モードで開始する
  useEffect(() => {
    stickToBottomRef.current = true;
  }, []);

  const display = useMemo(() => (text.length === 0 ? UI_TEXT.emptyTranscript : text), [text]);

  return (
    <textarea
      ref={ref}
      readOnly
      value={display}
      onScroll={handleScroll}
      className="h-full w-full resize-none rounded-md border border-gray-300 bg-white p-3 font-mono text-sm leading-relaxed text-gray-900 shadow-sm focus:outline-none"
      spellCheck={false}
    />
  );
}
