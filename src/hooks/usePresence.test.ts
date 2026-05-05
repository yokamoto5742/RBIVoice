import { describe, it, expect } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { computeStatus } from './usePresence';
import { PRESENCE_TIMEOUT_MS } from '../constants';

const now = Date.now();

function makeState(recording: boolean, lastPingMs: number) {
  return {
    recording,
    lastPing: Timestamp.fromMillis(lastPingMs),
    senderId: 'test',
  };
}

describe('computeStatus', () => {
  it('state が null の場合は unknown を返す', () => {
    expect(computeStatus(null, now)).toBe('unknown');
  });

  it('lastPing がタイムアウト以内かつ recording=true なら recording を返す', () => {
    const state = makeState(true, now - PRESENCE_TIMEOUT_MS + 1000);
    expect(computeStatus(state, now)).toBe('recording');
  });

  it('lastPing がタイムアウト以内かつ recording=false なら idle を返す', () => {
    const state = makeState(false, now - PRESENCE_TIMEOUT_MS + 1000);
    expect(computeStatus(state, now)).toBe('idle');
  });

  it('lastPing がタイムアウトを超えている場合は disconnected を返す', () => {
    const state = makeState(true, now - PRESENCE_TIMEOUT_MS - 1000);
    expect(computeStatus(state, now)).toBe('disconnected');
  });

  it('lastPing が null の場合は disconnected を返す', () => {
    const state = { recording: true, lastPing: null, senderId: 'test' };
    expect(computeStatus(state, now)).toBe('disconnected');
  });
});
