import { useState, type ComponentProps } from 'react';
import { UI_TEXT } from '../constants';

interface Props {
  text: string;
  canEdit: boolean;
  isDirty: boolean;
  onRemoveLineBreaks: () => void;
  onRemovePunctuation: () => void;
  onSave: () => Promise<void>;
  onClear: () => Promise<void>;
  onFeedback: (msg: string) => void;
}

const BASE = 'rounded-md border px-3 py-1.5 text-sm shadow-sm disabled:cursor-not-allowed disabled:opacity-50 dark:disabled:opacity-40';
const NEUTRAL = 'border-gray-300 bg-white text-gray-800 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700';
const PRIMARY = 'border-blue-300 bg-blue-50 text-blue-800 hover:bg-blue-100 dark:border-blue-600 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-800/40';

function Button({ variant = 'neutral', ...props }: ComponentProps<'button'> & { variant?: 'neutral' | 'primary' }) {
  return <button type="button" {...props} className={`${BASE} ${variant === 'primary' ? PRIMARY : NEUTRAL}`} />;
}

export function ToolBar({ text, canEdit, isDirty, onRemoveLineBreaks, onRemovePunctuation, onSave, onClear, onFeedback }: Props) {
  const [busy, setBusy] = useState(false);

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
      onFeedback(UI_TEXT.clearSuccess);
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
      <Button onClick={handleCopy} title={UI_TEXT.copyTooltip} disabled={text.length === 0 || busy}>
        {UI_TEXT.copyButton}
      </Button>
      <Button
        onClick={onRemovePunctuation}
        title={UI_TEXT.removePunctuationTooltip}
        disabled={text.length === 0 || !canEdit || busy}
      >
        {UI_TEXT.removePunctuationButton}
      </Button>
      <Button
        onClick={onRemoveLineBreaks}
        title={UI_TEXT.removeLineBreaksTooltip}
        disabled={text.length === 0 || !canEdit || busy}
      >
        {UI_TEXT.removeLineBreaksButton}
      </Button>
      <Button
        variant="primary"
        onClick={handleSave}
        title={UI_TEXT.saveTooltip + editTooltipSuffix}
        disabled={!canEdit || !isDirty || busy}
      >
        {UI_TEXT.saveButton}
      </Button>
      <Button
        onClick={handleClear}
        title={UI_TEXT.clearTooltip}
        disabled={busy}
      >
        {UI_TEXT.clearButton}
      </Button>
    </div>
  );
}
