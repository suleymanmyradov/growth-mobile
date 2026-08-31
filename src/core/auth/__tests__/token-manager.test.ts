/**
 * Tests for the TokenManager — the secure token storage singleton.
 *
 * Verifies that:
 * - The access token is kept in-memory only (get/set/clear)
 * - persistSession writes refresh token + session metadata to SecureStore
 * - loadSession reads them back (or returns null when missing)
 * - getRefreshToken returns just the refresh token
 * - clearAll wipes both in-memory and persisted state
 * - SecureStore failures are handled gracefully (no throws)
 */
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import * as SecureStore from 'expo-secure-store';

import { tokenManager } from '../token-manager';

// The tokenManager is a singleton imported at module load time.
// We reset its in-memory accessToken by calling clearAll before each test.
beforeEach(async () => {
  jest.clearAllMocks();
  await tokenManager.clearAll();
});

describe('TokenManager — in-memory access token', () => {
  it('returns null when no access token is set', () => {
    expect(tokenManager.getAccessToken()).toBeNull();
  });

  it('returns the token after setAccessToken', () => {
    tokenManager.setAccessToken('my-access-token');
    expect(tokenManager.getAccessToken()).toBe('my-access-token');
  });

  it('overwrites the previous token on re-set', () => {
    tokenManager.setAccessToken('first');
    tokenManager.setAccessToken('second');
    expect(tokenManager.getAccessToken()).toBe('second');
  });

  it('clears the in-memory token on clearAll', async () => {
    tokenManager.setAccessToken('to-be-cleared');
    await tokenManager.clearAll();
    expect(tokenManager.getAccessToken()).toBeNull();
  });
});

describe('TokenManager — persistSession', () => {
  it('writes refresh token, session ID, and user ID to SecureStore', async () => {
    await tokenManager.persistSession({
      refreshToken: 'rt-123',
      sessionId: 'sess-456',
      userId: 'user-789',
    });

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('growth.refresh_token', 'rt-123');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('growth.session_id', 'sess-456');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('growth.user_id', 'user-789');
  });

  it('makes three separate SecureStore writes', async () => {
    await tokenManager.persistSession({
      refreshToken: 'rt',
      sessionId: 'sid',
      userId: 'uid',
    });
    expect(SecureStore.setItemAsync).toHaveBeenCalledTimes(3);
  });
});

describe('TokenManager — loadSession', () => {
  it('returns the persisted session when all keys are present', async () => {
    jest
      .mocked(SecureStore.getItemAsync)
      .mockResolvedValueOnce('rt-loaded') // refresh_token
      .mockResolvedValueOnce('sid-loaded') // session_id
      .mockResolvedValueOnce('uid-loaded'); // user_id

    const session = await tokenManager.loadSession();
    expect(session).toEqual({
      refreshToken: 'rt-loaded',
      sessionId: 'sid-loaded',
      userId: 'uid-loaded',
    });
  });

  it('returns null when refresh token is missing', async () => {
    jest
      .mocked(SecureStore.getItemAsync)
      .mockResolvedValueOnce(null) // refresh_token
      .mockResolvedValueOnce('sid') // session_id
      .mockResolvedValueOnce('uid'); // user_id

    const session = await tokenManager.loadSession();
    expect(session).toBeNull();
  });

  it('returns null when session ID is missing', async () => {
    jest
      .mocked(SecureStore.getItemAsync)
      .mockResolvedValueOnce('rt')
      .mockResolvedValueOnce(null) // session_id missing
      .mockResolvedValueOnce('uid');

    const session = await tokenManager.loadSession();
    expect(session).toBeNull();
  });

  it('returns null when user ID is missing', async () => {
    jest
      .mocked(SecureStore.getItemAsync)
      .mockResolvedValueOnce('rt')
      .mockResolvedValueOnce('sid')
      .mockResolvedValueOnce(null); // user_id missing

    const session = await tokenManager.loadSession();
    expect(session).toBeNull();
  });

  it('returns null when all keys are missing', async () => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null);

    const session = await tokenManager.loadSession();
    expect(session).toBeNull();
  });

  it('returns null on SecureStore error (e.g. web environment)', async () => {
    jest.mocked(SecureStore.getItemAsync).mockRejectedValue(new Error('not available'));

    const session = await tokenManager.loadSession();
    expect(session).toBeNull();
  });
});

describe('TokenManager — getRefreshToken', () => {
  it('returns the persisted refresh token', async () => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue('rt-value');

    const token = await tokenManager.getRefreshToken();
    expect(token).toBe('rt-value');
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith('growth.refresh_token');
  });

  it('returns null when no token is persisted', async () => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null);

    const token = await tokenManager.getRefreshToken();
    expect(token).toBeNull();
  });

  it('returns null on SecureStore error', async () => {
    jest.mocked(SecureStore.getItemAsync).mockRejectedValue(new Error('fail'));

    const token = await tokenManager.getRefreshToken();
    expect(token).toBeNull();
  });
});

describe('TokenManager — clearAll', () => {
  it('deletes all three keys from SecureStore', async () => {
    await tokenManager.clearAll();

    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('growth.refresh_token');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('growth.session_id');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('growth.user_id');
  });

  it('clears the in-memory access token', async () => {
    tokenManager.setAccessToken('in-memory');
    await tokenManager.clearAll();
    expect(tokenManager.getAccessToken()).toBeNull();
  });

  it('does not throw when SecureStore fails', async () => {
    jest.mocked(SecureStore.deleteItemAsync).mockRejectedValue(new Error('fail'));
    await expect(tokenManager.clearAll()).resolves.not.toThrow();
  });
});
