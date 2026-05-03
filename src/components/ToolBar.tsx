import { useState } from 'react';
import { UI_TEXT } from '../constants';

interface Props {
  text: string;
  onClear: () => void;
}

export function ToolBar({ text, onClear }: Props) {
  const [feedback, setFeedback] = useState<string>('');

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setFeedback(UI_TEXT.copySuccess);
    } catch {
      setFeedback(UI_TEXT.copyFailure);
    }
    window.setTimeout(() => setFeedback(''), 1500);
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleCopy}
        title={UI_TEXT.copyTooltip}
        disabled={text.length === 0}
        className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {UI_TEXT.copyButton}
      </button>
      <button
        type="button"
        onClick={onClear}
        title={UI_TEXT.clearTooltip}
        className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 shadow-sm hover:bg-gray-50"
      >
        {UI_TEXT.clearButton}
      </button>
      {feedback && (
        <span className="text-xs text-gray-500">{feedback}</span>
      )}
    </div>
  );
}
