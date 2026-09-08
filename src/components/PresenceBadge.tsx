import { UI_TEXT } from '../constants';
import type { PresenceStatus } from '../types';

interface Props {
  status: PresenceStatus;
}

const STYLE: Record<PresenceStatus, { label: string; cls: string; dot: string }> = {
  recording: { label: UI_TEXT.presenceRecording, cls: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700', dot: 'animate-pulse bg-green-500' },
  idle: { label: UI_TEXT.presenceIdle, cls: 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600', dot: 'bg-gray-400' },
  disconnected: { label: UI_TEXT.presenceDisconnected, cls: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700', dot: 'bg-red-500' },
};

export function PresenceBadge({ status }: Props) {
  const { label, cls, dot } = STYLE[status];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${cls}`}
    >
      <span className={`mr-1.5 h-2 w-2 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
