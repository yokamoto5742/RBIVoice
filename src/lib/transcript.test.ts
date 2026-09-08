import { describe, it, expect } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { activeText } from './transcript';
import type { Transcript } from '../types';

const now = Date.now();

function makeTranscript(text: string, expiresAtMs: number | null): Transcript {
  return {
    text,
    updatedAt: null,
    expiresAt: expiresAtMs === null ? null : Timestamp.fromMillis(expiresAtMs),
  };
}

describe('activeText', () => {
  it('transcript が null の場合は空文字を返す', () => {
    expect(activeText(null, now)).toBe('');
  });

  it('expiresAt を過ぎている場合は空文字を返す', () => {
    expect(activeText(makeTranscript('あいうえお', now - 1), now)).toBe('');
  });

  it('expiresAt と同時刻の場合は空文字を返す', () => {
    expect(activeText(makeTranscript('あいうえお', now), now)).toBe('');
  });

  it('expiresAt 前の場合はテキストを返す', () => {
    expect(activeText(makeTranscript('あいうえお', now + 1000), now)).toBe('あいうえお');
  });

  it('expiresAt が null の場合はテキストを返す', () => {
    expect(activeText(makeTranscript('あいうえお', null), now)).toBe('あいうえお');
  });
});
