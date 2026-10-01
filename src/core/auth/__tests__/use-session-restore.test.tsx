/**
 * Tests for useSessionRestore — validates a persisted session on app startup.
 *
 * Verifies that the hook:
 * - Sets hydrated=true when no persisted session exists (skips validation)
 * - Fetches profile + settings on success and populates the session store
 * - Clears all state when profile validation fails
 * - Handles settings fetch failure gracefully (onboardingCompleted stays null)
 * - Fires the hydration fallback timeout as a safety net
 */
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';

import * as SecureStore from 'expo-secure-store';

// --- Import after mocks ---

import type { getOrCreateInstallationId } from '../installation';
import { useSessionStore } from '../session';
import { tokenManager } from '../token-manager';
import type { SessionRestoreCallbacks } from '../use-session-restore';
import { useSessionRestore } from '../use-session-restore';

// --- Mocks ---

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useSegments: () => [],
  useLocalSearchParams: () => ({}),
  usePathname: () => '/',
}));

jest.mock('@/core/telemetry/sentry', () => ({
  setSentryUser: jest.fn(),
}));

jest.mock('@/core/api/client', () => ({
  setInstallationId: jest.fn(),
}));

const { setInstallationId } = jest.requireMock('@/core/api/client') as {
  setInstallationId: jest.Mock;
};

jest.mock('../installation', () => ({
  // Typed as the real function so mockResolvedValue accepts a string —
  // bare jest.fn() types the resolved value as `never`.
  getOrCreateInstallationId: jest
    .fn<typeof getOrCreateInstallationId>()
    .mockResolvedValue('install-id-123'),
}));

const installationMock = jest.requireMock('../installation') as {
  getOrCreateInstallationId: jest.MockedFunction<typeof getOrCreateInstallationId>;
};

// --- Fixtures ---

const PROFILE_RESPONSE = {
  data: {
    id: 'user-1',
    fullName: 'Test User',
    username: 'testuser',
    email: 'test@example.com',
    bio: '',
    location: '',
    website: '',
    interests: [],
    emailVerified: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
};

const SETTINGS_RESPONSE = {
  data: {
    id: 'settings-1',
    theme: 'system' as const,
    language: 'en',
    timezone: 'UTC',
    emailNotifications: true,
    pushNotifications: true,
    habitReminders: true,
    goalReminders: true,
    accountabilityStyle: 'balanced' as const,
    checkInTime: '09:00',
    onboardingCompleted: true,
    userId: 'user-1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
};

// --- Helpers ---

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
  return Wrapper;
}

beforeEach(async () => {
  jest.clearAllMocks();
  await tokenManager.clearAll();
  useSessionStore.getState().clear();
  useSessionStore.getState().setHydrated(false);
});

// ============================================

describe('useSessionRestore', () => {
  it('sets hydrated when no persisted session exists', async () => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null);

    const callbacks = {
      fetchProfile: jest.fn<SessionRestoreCallbacks['fetchProfile']>(),
      fetchSettings: jest.fn<SessionRestoreCallbacks['fetchSettings']>(),
    };

    await renderHook(() => useSessionRestore(callbacks), { wrapper: createWrapper() });

    await waitFor(() => expect(useSessionStore.getState().isHydrated).toBe(true));
    expect(callbacks.fetchProfile).not.toHaveBeenCalled();
  });

  it('fetches profile and settings, then sets session on success', async () => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue('rt-value');
    const fetchProfile = jest
      .fn<SessionRestoreCallbacks['fetchProfile']>()
      .mockResolvedValue(PROFILE_RESPONSE);
    const fetchSettings = jest
      .fn<SessionRestoreCallbacks['fetchSettings']>()
      .mockResolvedValue(SETTINGS_RESPONSE);

    const callbacks = { fetchProfile, fetchSettings };

    await renderHook(() => useSessionRestore(callbacks), { wrapper: createWrapper() });

    await waitFor(() => expect(useSessionStore.getState().isAuthenticated).toBe(true));

    const state = useSessionStore.getState();
    expect(state.user?.id).toBe('user-1');
    expect(state.user?.email).toBe('test@example.com');
    expect(state.user?.onboardingCompleted).toBe(true);
    expect(state.isHydrated).toBe(true);
  });

  it('keeps onboardingCompleted null when settings fetch fails', async () => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue('rt-value');
    const fetchProfile = jest
      .fn<SessionRestoreCallbacks['fetchProfile']>()
      .mockResolvedValue(PROFILE_RESPONSE);
    const fetchSettings = jest
      .fn<SessionRestoreCallbacks['fetchSettings']>()
      .mockRejectedValue(new Error('settings down'));

    const callbacks = { fetchProfile, fetchSettings };

    await renderHook(() => useSessionRestore(callbacks), { wrapper: createWrapper() });

    await waitFor(() => expect(useSessionStore.getState().isAuthenticated).toBe(true));

    const state = useSessionStore.getState();
    expect(state.user?.onboardingCompleted).toBeNull();
    // User is still authenticated — settings failure is non-fatal
    expect(state.isAuthenticated).toBe(true);
  });

  it('clears all state when profile validation fails', async () => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue('rt-value');
    const fetchProfile = jest
      .fn<SessionRestoreCallbacks['fetchProfile']>()
      .mockRejectedValue(new Error('401'));
    const fetchSettings = jest.fn<SessionRestoreCallbacks['fetchSettings']>();

    const callbacks = { fetchProfile, fetchSettings };

    // Set some initial state to verify it gets cleared
    useSessionStore.getState().setUser({
      id: 'old-user',
      email: 'old@example.com',
      fullName: 'Old',
      onboardingCompleted: true,
    });

    await renderHook(() => useSessionRestore(callbacks), { wrapper: createWrapper() });

    await waitFor(() => expect(useSessionStore.getState().isHydrated).toBe(true));

    expect(useSessionStore.getState().isAuthenticated).toBe(false);
    expect(useSessionStore.getState().user).toBeNull();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalled();
  });

  it('does not call fetchSettings when profile fetch fails', async () => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue('rt-value');
    const fetchProfile = jest
      .fn<SessionRestoreCallbacks['fetchProfile']>()
      .mockRejectedValue(new Error('401'));
    const fetchSettings = jest.fn<SessionRestoreCallbacks['fetchSettings']>();

    const callbacks = { fetchProfile, fetchSettings };

    await renderHook(() => useSessionRestore(callbacks), { wrapper: createWrapper() });

    await waitFor(() => expect(useSessionStore.getState().isHydrated).toBe(true));
    expect(fetchSettings).not.toHaveBeenCalled();
  });

  it('sets installation ID on startup', async () => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null);

    const callbacks = {
      fetchProfile: jest.fn<SessionRestoreCallbacks['fetchProfile']>(),
      fetchSettings: jest.fn<SessionRestoreCallbacks['fetchSettings']>(),
    };

    await renderHook(() => useSessionRestore(callbacks), { wrapper: createWrapper() });

    await waitFor(() => expect(useSessionStore.getState().isHydrated).toBe(true));
    expect(setInstallationId).toHaveBeenCalledWith('install-id-123');
  });

  it('continues even when installation ID creation fails', async () => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null);
    installationMock.getOrCreateInstallationId.mockRejectedValueOnce(new Error('fail'));

    const callbacks = {
      fetchProfile: jest.fn<SessionRestoreCallbacks['fetchProfile']>(),
      fetchSettings: jest.fn<SessionRestoreCallbacks['fetchSettings']>(),
    };

    await renderHook(() => useSessionRestore(callbacks), { wrapper: createWrapper() });

    // Should still hydrate even if installation ID fails
    await waitFor(() => expect(useSessionStore.getState().isHydrated).toBe(true));
  });
});
