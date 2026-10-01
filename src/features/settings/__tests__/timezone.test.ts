/**
 * Tests for the timezone prompt record — the "asked once per zone" state that
 * keeps the boot-time sync prompt from re-firing after a dismissal.
 */
import { beforeEach, describe, expect, it } from '@jest/globals';

import { getTimezonePromptRecord, recordTimezonePrompt } from '../timezone';

// In-memory KV store mock — timezone.ts goes through '@/core/storage'.
jest.mock('@/core/storage/kv', () => {
  const store = new Map<string, unknown>();
  return {
    getItem: jest.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
    setItem: jest.fn((key: string, value: unknown) => {
      store.set(key, value);
      return Promise.resolve();
    }),
    removeItem: jest.fn((key: string) => {
      store.delete(key);
      return Promise.resolve();
    }),
    __store: store,
  };
});

const store = (jest.requireMock('@/core/storage/kv') as { __store: Map<string, unknown> })
  .__store;
const getItem = jest.requireMock('@/core/storage/kv').getItem as jest.Mock;
const setItem = jest.requireMock('@/core/storage/kv').setItem as jest.Mock;

const KEY = (userId: string) => `user:${userId}:timezone-prompt`;

describe('timezone prompt record', () => {
  beforeEach(() => {
    store.clear();
    jest.clearAllMocks();
  });

  it('returns null when nothing was recorded', async () => {
    await expect(getTimezonePromptRecord('u1')).resolves.toBeNull();
  });

  it('round-trips a recorded answer under the user-scoped key', async () => {
    await recordTimezonePrompt('u1', 'Asia/Tokyo', 'dismissed');
    expect(setItem).toHaveBeenCalledWith(
      KEY('u1'),
      expect.objectContaining({ timezone: 'Asia/Tokyo', action: 'dismissed' }),
    );
    const record = await getTimezonePromptRecord('u1');
    expect(record?.timezone).toBe('Asia/Tokyo');
    expect(record?.action).toBe('dismissed');
    expect(record?.at).toEqual(expect.any(String));
  });

  it('scopes records per user', async () => {
    await recordTimezonePrompt('u1', 'Asia/Tokyo', 'dismissed');
    await expect(getTimezonePromptRecord('u2')).resolves.toBeNull();
  });

  it('returns null for malformed stored values', async () => {
    store.set(KEY('u1'), { timezone: 'Asia/Tokyo' }); // missing action/at
    await expect(getTimezonePromptRecord('u1')).resolves.toBeNull();

    store.set(KEY('u1'), { timezone: 'Asia/Tokyo', action: 'bogus', at: 'x' });
    await expect(getTimezonePromptRecord('u1')).resolves.toBeNull();
  });

  it('returns null when the KV read throws', async () => {
    getItem.mockRejectedValueOnce(new Error('db gone'));
    await expect(getTimezonePromptRecord('u1')).resolves.toBeNull();
  });

  it('swallows write failures', async () => {
    setItem.mockRejectedValueOnce(new Error('db gone'));
    await expect(recordTimezonePrompt('u1', 'UTC', 'updated')).resolves.toBeUndefined();
  });
});
