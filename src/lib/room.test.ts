import { describe, it, expect, afterEach, vi } from 'vitest';
import { getRoomIdFromUrl } from './room';

function stubSearch(search: string) {
  vi.stubGlobal('location', { search });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('getRoomIdFromUrl', () => {
  it('room パラメータが存在する場合は roomId を返す', () => {
    stubSearch('?room=tanaka-pc');
    expect(getRoomIdFromUrl()).toBe('tanaka-pc');
  });

  it('room パラメータが存在しない場合は null を返す', () => {
    stubSearch('');
    expect(getRoomIdFromUrl()).toBeNull();
  });

  it('room が空文字の場合は null を返す', () => {
    stubSearch('?room=');
    expect(getRoomIdFromUrl()).toBeNull();
  });

  it('room が空白のみの場合は null を返す', () => {
    stubSearch('?room=   ');
    expect(getRoomIdFromUrl()).toBeNull();
  });

  it('room の前後の空白をトリムして返す', () => {
    stubSearch('?room=  alice-pc  ');
    expect(getRoomIdFromUrl()).toBe('alice-pc');
  });
});
