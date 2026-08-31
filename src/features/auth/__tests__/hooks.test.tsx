/**
 * Tests for auth hooks — useLogin, useRegister, useVerifyEmail, useLogout, etc.
 *
 * Verifies that each hook:
 * - Calls the correct API function
 * - Updates the session store on success
 * - Navigates to the correct route on success
 * - Tracks analytics events
 * - Handles errors correctly
 *
 * Uses renderHook (async) with a QueryClientProvider wrapper.
 */
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';

// --- Import after mocks ---

import { useSessionStore } from '@/core/auth/session';
import { tokenManager } from '@/core/auth/token-manager';
import {
  useForgotPassword,
  useLogin,
  useLogout,
  useRegister,
  useResendVerification,
  useResetPassword,
  useVerifyEmail,
} from '../hooks';

// --- Mocks ---

const mockRouterReplace = jest.fn();
const mockRouterPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: (...a: unknown[]) => mockRouterPush(...a),
    replace: (...a: unknown[]) => mockRouterReplace(...a),
    back: jest.fn(),
    navigate: jest.fn(),
  }),
  useSegments: () => [],
  useLocalSearchParams: () => ({}),
  usePathname: () => '/',
  Link: ({ children }: { children: unknown }) => children,
  Stack: ({ children }: { children: unknown }) => children,
  Tabs: ({ children }: { children: unknown }) => children,
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
}));

const mockLogin = jest.fn();
const mockRegister = jest.fn();
const mockVerifyEmail = jest.fn();
const mockResendVerification = jest.fn();
const mockForgotPassword = jest.fn();
const mockResetPassword = jest.fn();
const mockLogout = jest.fn();

jest.mock('../api', () => ({
  login: (...a: unknown[]) => mockLogin(...a),
  register: (...a: unknown[]) => mockRegister(...a),
  verifyEmail: (...a: unknown[]) => mockVerifyEmail(...a),
  resendVerification: (...a: unknown[]) => mockResendVerification(...a),
  forgotPassword: (...a: unknown[]) => mockForgotPassword(...a),
  resetPassword: (...a: unknown[]) => mockResetPassword(...a),
  logout: (...a: unknown[]) => mockLogout(...a),
}));

const mockApiRequest = jest.fn();

jest.mock('@/core/api/client', () => ({
  getBareClient: () => ({ post: jest.fn() }),
  apiRequest: (...a: unknown[]) => mockApiRequest(...a),
  setInstallationId: jest.fn(),
}));

jest.mock('@/core/telemetry/sentry', () => ({
  setSentryUser: jest.fn(),
}));

const mockAnalyticsIdentify = jest.fn();
const mockAnalyticsTrack = jest.fn();
const mockAnalyticsReset = jest.fn();

jest.mock('@/core/telemetry/analytics', () => ({
  NoopAnalytics: jest.fn().mockImplementation(() => ({
    identify: (...a: unknown[]) => mockAnalyticsIdentify(...a),
    track: (...a: unknown[]) => mockAnalyticsTrack(...a),
    reset: () => mockAnalyticsReset(),
  })),
}));

// --- Fixtures ---

const AUTH_RESPONSE = {
  accessToken: 'access-123',
  refreshToken: 'refresh-456',
  expiresIn: 3600,
  user: {
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
    theme: 'system',
    language: 'en',
    timezone: 'UTC',
    emailNotifications: true,
    pushNotifications: true,
    habitReminders: true,
    goalReminders: true,
    accountabilityStyle: 'balanced',
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
});

// ============================================
// useLogin
// ============================================

describe('useLogin', () => {
  it('calls login API and sets session on success', async () => {
    mockLogin.mockResolvedValue(AUTH_RESPONSE);
    mockApiRequest.mockResolvedValue(SETTINGS_RESPONSE);

    const { result } = await renderHook(() => useLogin(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current).toBeDefined());

    await act(async () => {
      result.current.mutate({ email: 'test@example.com', password: 'Password1!' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const state = useSessionStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.id).toBe('user-1');
    expect(state.user?.onboardingCompleted).toBe(true);
  });

  it('navigates to app route when onboarding is completed', async () => {
    mockLogin.mockResolvedValue(AUTH_RESPONSE);
    mockApiRequest.mockResolvedValue(SETTINGS_RESPONSE);

    const { result } = await renderHook(() => useLogin(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current).toBeDefined());

    await act(async () => {
      result.current.mutate({ email: 'test@example.com', password: 'Password1!' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockRouterReplace).toHaveBeenCalledWith('/(app)/(tabs)');
  });

  it('navigates to onboarding route when onboarding is not completed', async () => {
    mockLogin.mockResolvedValue(AUTH_RESPONSE);
    mockApiRequest.mockResolvedValue({
      ...SETTINGS_RESPONSE,
      data: { ...SETTINGS_RESPONSE.data, onboardingCompleted: false },
    });

    const { result } = await renderHook(() => useLogin(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current).toBeDefined());

    await act(async () => {
      result.current.mutate({ email: 'test@example.com', password: 'Password1!' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockRouterReplace).toHaveBeenCalledWith('/(onboarding)');
  });

  it('navigates to app route when onboarding status is unavailable (null)', async () => {
    mockLogin.mockResolvedValue(AUTH_RESPONSE);
    mockApiRequest.mockRejectedValue(new Error('settings fetch failed'));

    const { result } = await renderHook(() => useLogin(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current).toBeDefined());

    await act(async () => {
      result.current.mutate({ email: 'test@example.com', password: 'Password1!' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockRouterReplace).toHaveBeenCalledWith('/(app)/(tabs)');
    expect(useSessionStore.getState().user?.onboardingCompleted).toBeNull();
  });

  it('tracks analytics on success', async () => {
    mockLogin.mockResolvedValue(AUTH_RESPONSE);
    mockApiRequest.mockResolvedValue(SETTINGS_RESPONSE);

    const { result } = await renderHook(() => useLogin(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current).toBeDefined());

    await act(async () => {
      result.current.mutate({ email: 'test@example.com', password: 'Password1!' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockAnalyticsTrack).toHaveBeenCalledWith('auth_login_succeeded');
  });

  it('tracks analytics on error', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid credentials'));

    const { result } = await renderHook(() => useLogin(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current).toBeDefined());

    await act(async () => {
      result.current.mutate({ email: 'test@example.com', password: 'wrong' });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockAnalyticsTrack).toHaveBeenCalledWith('auth_login_failed');
  });

  it('does not set session on error', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid credentials'));

    const { result } = await renderHook(() => useLogin(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current).toBeDefined());

    await act(async () => {
      result.current.mutate({ email: 'test@example.com', password: 'wrong' });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(useSessionStore.getState().isAuthenticated).toBe(false);
  });
});

// ============================================
// useRegister
// ============================================

describe('useRegister', () => {
  it('calls register API', async () => {
    mockRegister.mockResolvedValue({ requiresVerification: true, message: 'sent' });

    const { result } = await renderHook(() => useRegister(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current).toBeDefined());

    await act(async () => {
      result.current.mutate({
        username: 'johndoe',
        email: 'john@example.com',
        password: 'Password1!',
        fullName: 'John Doe',
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockRegister).toHaveBeenCalledWith({
      username: 'johndoe',
      email: 'john@example.com',
      password: 'Password1!',
      fullName: 'John Doe',
    });
  });

  it('tracks analytics on success', async () => {
    mockRegister.mockResolvedValue({ requiresVerification: true, message: 'sent' });

    const { result } = await renderHook(() => useRegister(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current).toBeDefined());

    await act(async () => {
      result.current.mutate({
        username: 'johndoe',
        email: 'john@example.com',
        password: 'Password1!',
        fullName: 'John Doe',
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockAnalyticsTrack).toHaveBeenCalledWith('auth_register_succeeded');
  });

  it('tracks analytics on error', async () => {
    mockRegister.mockRejectedValue(new Error('Email taken'));

    const { result } = await renderHook(() => useRegister(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current).toBeDefined());

    await act(async () => {
      result.current.mutate({
        username: 'johndoe',
        email: 'john@example.com',
        password: 'Password1!',
        fullName: 'John Doe',
      });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockAnalyticsTrack).toHaveBeenCalledWith('auth_register_failed');
  });

  it('does not set session (register returns no tokens)', async () => {
    mockRegister.mockResolvedValue({ requiresVerification: true, message: 'sent' });

    const { result } = await renderHook(() => useRegister(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current).toBeDefined());

    await act(async () => {
      result.current.mutate({
        username: 'johndoe',
        email: 'john@example.com',
        password: 'Password1!',
        fullName: 'John Doe',
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(useSessionStore.getState().isAuthenticated).toBe(false);
  });
});

// ============================================
// useVerifyEmail
// ============================================

describe('useVerifyEmail', () => {
  it('calls verifyEmail API and sets session on success', async () => {
    mockVerifyEmail.mockResolvedValue(AUTH_RESPONSE);
    mockApiRequest.mockResolvedValue(SETTINGS_RESPONSE);

    const { result } = await renderHook(() => useVerifyEmail(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current).toBeDefined());

    await act(async () => {
      result.current.mutate({ token: 'verify-token' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockVerifyEmail).toHaveBeenCalledWith({ token: 'verify-token' });
    expect(useSessionStore.getState().isAuthenticated).toBe(true);
  });

  it('navigates to app route when onboarding is completed', async () => {
    mockVerifyEmail.mockResolvedValue(AUTH_RESPONSE);
    mockApiRequest.mockResolvedValue(SETTINGS_RESPONSE);

    const { result } = await renderHook(() => useVerifyEmail(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current).toBeDefined());

    await act(async () => {
      result.current.mutate({ token: 'verify-token' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockRouterReplace).toHaveBeenCalledWith('/(app)/(tabs)');
  });

  it('navigates to onboarding when not completed', async () => {
    mockVerifyEmail.mockResolvedValue(AUTH_RESPONSE);
    mockApiRequest.mockResolvedValue({
      ...SETTINGS_RESPONSE,
      data: { ...SETTINGS_RESPONSE.data, onboardingCompleted: false },
    });

    const { result } = await renderHook(() => useVerifyEmail(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current).toBeDefined());

    await act(async () => {
      result.current.mutate({ token: 'verify-token' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockRouterReplace).toHaveBeenCalledWith('/(onboarding)');
  });
});

// ============================================
// useResendVerification
// ============================================

describe('useResendVerification', () => {
  it('calls resendVerification API', async () => {
    mockResendVerification.mockResolvedValue(undefined);

    const { result } = await renderHook(() => useResendVerification(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current).toBeDefined());

    await act(async () => {
      result.current.mutate({ email: 'test@example.com' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockResendVerification).toHaveBeenCalledWith({ email: 'test@example.com' });
  });
});

// ============================================
// useForgotPassword
// ============================================

describe('useForgotPassword', () => {
  it('calls forgotPassword API', async () => {
    mockForgotPassword.mockResolvedValue(undefined);

    const { result } = await renderHook(() => useForgotPassword(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current).toBeDefined());

    await act(async () => {
      result.current.mutate({ email: 'test@example.com' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockForgotPassword).toHaveBeenCalledWith({ email: 'test@example.com' });
  });
});

// ============================================
// useResetPassword
// ============================================

describe('useResetPassword', () => {
  it('calls resetPassword API and navigates to sign-in on success', async () => {
    mockResetPassword.mockResolvedValue(undefined);

    const { result } = await renderHook(() => useResetPassword(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current).toBeDefined());

    await act(async () => {
      result.current.mutate({ token: 'reset-token', newPassword: 'NewPassword1!' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockResetPassword).toHaveBeenCalledWith({
      token: 'reset-token',
      newPassword: 'NewPassword1!',
    });
    expect(mockRouterReplace).toHaveBeenCalledWith('/(public)/sign-in');
  });
});

// ============================================
// useLogout
// ============================================

describe('useLogout', () => {
  it('calls logout API and clears session on settled', async () => {
    mockLogout.mockResolvedValue(undefined);
    useSessionStore.getState().setUser({
      id: 'user-1',
      email: 'test@example.com',
      fullName: 'Test User',
      onboardingCompleted: true,
    });

    const { result } = await renderHook(() => useLogout(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current).toBeDefined());

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockLogout).toHaveBeenCalled();
    expect(useSessionStore.getState().isAuthenticated).toBe(false);
    expect(useSessionStore.getState().user).toBeNull();
  });

  it('clears session even when logout API fails', async () => {
    mockLogout.mockRejectedValue(new Error('Network error'));
    useSessionStore.getState().setUser({
      id: 'user-1',
      email: 'test@example.com',
      fullName: 'Test User',
      onboardingCompleted: true,
    });

    const { result } = await renderHook(() => useLogout(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current).toBeDefined());

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(useSessionStore.getState().isAuthenticated).toBe(false);
  });

  it('navigates to public route on settled', async () => {
    mockLogout.mockResolvedValue(undefined);

    const { result } = await renderHook(() => useLogout(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current).toBeDefined());

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockRouterReplace).toHaveBeenCalledWith('/(public)');
  });

  it('tracks analytics on logout', async () => {
    mockLogout.mockResolvedValue(undefined);

    const { result } = await renderHook(() => useLogout(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current).toBeDefined());

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockAnalyticsTrack).toHaveBeenCalledWith('auth_logout');
  });
});
