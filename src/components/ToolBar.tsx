import { useState } from 'react';
import { UI_TEXT } from '../constants';

interface Props {
  text: string;
  canEdit: boolean;
  isDirty: boolean;
  onSave: () => Promise<void>;
  onClear: () => Promise<void>;
}

export function ToolBar({ text, canEdit, isDirty, onSave, onClear }: Props) {
  const [feedback, setFeedback] = useState<string>('');
  const [busy, setBusy] = useState<boolean>(false);

  function flash(msg: string) {
    setFeedback(msg);
    window.setTimeout(() => setFeedback(''), 1500);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      flash(UI_TEXT.copySuccess);
    } catch {
      flash(UI_TEXT.copyFailure);
    }
  }

  async function handleSave() {
    setBusy(true);
    try {
      await onSave();
      flash(UI_TEXT.saveSuccess);
    } catch (err) {
      console.error('save failed:', err);
      flash(UI_TEXT.saveFailure);
    } finally {
      setBusy(false);
    }
  }

  async function handleClear() {
    setBusy(true);
    try {
      await onClear();
    } catch (err) {
      console.error('clear failed:', err);
      flash(UI_TEXT.clearFailure);
    } finally {
      setBusy(false);
    }
  }

  const editTooltipSuffix = canEdit ? '' : ` / ${UI_TEXT.editDisabledHint}`;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleCopy}
        title={UI_TEXT.copyTooltip}
        disabled={text.length === 0 || busy}
        className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {UI_TEXT.copyButton}
      </button>
      <button
        type="button"
        onClick={handleSave}
        title={UI_TEXT.saveTooltip + editTooltipSuffix}
        disabled={!canEdit || !isDirty || busy}
        className="rounded-md border border-blue-300 bg-blue-50 px-3 py-1.5 text-sm text-blue-800 shadow-sm hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {UI_TEXT.saveButton}
      </button>
      <button
        type="button"
        onClick={handleClear}
        title={UI_TEXT.clearTooltip + editTooltipSuffix}
        disabled={!canEdit || busy}
        className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {UI_TEXT.clearButton}
      </button>
      {feedback && <span className="text-xs text-gray-500">{feedback}</span>}
    </div>
  );
}
