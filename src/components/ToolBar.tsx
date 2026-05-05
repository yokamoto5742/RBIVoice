import { useState } from 'react';
import { UI_TEXT } from '../constants';

interface Props {
  text: string;
  canEdit: boolean;
  isDirty: boolean;
  onRemoveLineBreaks: () => void;
  onSave: () => Promise<void>;
  onClear: () => Promise<void>;
  onFeedback: (msg: string) => void;
}

export function ToolBar({ text, canEdit, isDirty, onRemoveLineBreaks, onSave, onClear, onFeedback }: Props) {
  const [busy, setBusy] = useState<boolean>(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      onFeedback(UI_TEXT.copySuccess);
    } catch {
      onFeedback(UI_TEXT.copyFailure);
    }
  }

  async function handleSave() {
    setBusy(true);
    try {
      await onSave();
      onFeedback(UI_TEXT.saveSuccess);
    } catch (err) {
      console.error('save failed:', err);
      onFeedback(UI_TEXT.saveFailure);
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
      onFeedback(UI_TEXT.clearFailure);
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
        className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 dark:disabled:opacity-40"
      >
        {UI_TEXT.copyButton}
      </button>
      <button
        type="button"
        onClick={onRemoveLineBreaks}
        title={UI_TEXT.removeLineBreaksTooltip}
        disabled={text.length === 0 || !canEdit || busy}
        className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 dark:disabled:opacity-40"
      >
        {UI_TEXT.removeLineBreaksButton}
      </button>
      <button
        type="button"
        onClick={handleSave}
        title={UI_TEXT.saveTooltip + editTooltipSuffix}
        disabled={!canEdit || !isDirty || busy}
        className="rounded-md border border-blue-300 bg-blue-50 px-3 py-1.5 text-sm text-blue-800 shadow-sm hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-blue-600 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-800/40 dark:disabled:opacity-40"
      >
        {UI_TEXT.saveButton}
      </button>
      <button
        type="button"
        onClick={handleClear}
        title={UI_TEXT.clearTooltip + editTooltipSuffix}
        disabled={!canEdit || busy}
        className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 dark:disabled:opacity-40"
      >
        {UI_TEXT.clearButton}
      </button>
    </div>
  );
}
