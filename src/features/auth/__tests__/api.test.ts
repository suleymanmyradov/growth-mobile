/**
 * Tests for the auth API layer — login, register, verifyEmail, logout, etc.
 *
 * These tests mock the HTTP client (getBareClient, apiRequest) and verify
 * that each API function:
 * - Validates input with the Zod schema (rejects bad data)
 * - Calls the correct endpoint with the right method
 * - Parses the response with the correct schema
 * - Applies the auth response (sets tokens) where applicable
 * - Handles errors correctly
 */
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import * as SecureStore from 'expo-secure-store';

// --- Import after mocks are set up ---

import { tokenManager } from '@/core/auth/token-manager';
import {
    applyAuthResponse,
    forgotPassword,
    getCurrentUser,
    login,
    logout,
    register,
    resendVerification,
    resetPassword,
    verifyEmail,
} from '../api';

// --- Mocks ---

const mockPost = jest.fn();
const mockApiRequest = jest.fn();

jest.mock('@/core/api/client', () => ({
  getBareClient: () => ({
    post: (...args: unknown[]) => mockPost(...args),
  }),
  apiRequest: (...args: unknown[]) => mockApiRequest(...args),
  setInstallationId: jest.fn(),
}));

jest.mock('@/core/telemetry/sentry', () => ({
  setSentryUser: jest.fn(),
}));

jest.mock('@/core/telemetry/analytics', () => ({
  NoopAnalytics: jest.fn().mockImplementation(() => ({
    identify: jest.fn(),
    track: jest.fn(),
    reset: jest.fn(),
  })),
}));

// --- Fixtures ---

const VALID_AUTH_RESPONSE = {
  accessToken: 'access-token-123',
  refreshToken: 'refresh-token-456',
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

const VALID_REGISTER_RESPONSE = {
  requiresVerification: true,
  message: 'Verification email sent.',
};

const VALID_PROFILE_RESPONSE = {
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

beforeEach(async () => {
  jest.clearAllMocks();
  await tokenManager.clearAll();
});

// ============================================
// applyAuthResponse
// ============================================

describe('applyAuthResponse', () => {
  it('sets the access token in memory', async () => {
    await applyAuthResponse(VALID_AUTH_RESPONSE as never);
    expect(tokenManager.getAccessToken()).toBe('access-token-123');
  });

  it('persists the refresh token and session metadata to SecureStore', async () => {
    await applyAuthResponse(VALID_AUTH_RESPONSE as never);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'growth.refresh_token',
      'refresh-token-456',
    );
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('growth.user_id', 'user-1');
  });
});

// ============================================
// login
// ============================================

describe('login', () => {
  it('posts to /auth/login with validated data', async () => {
    mockPost.mockResolvedValue({ data: VALID_AUTH_RESPONSE });

    const result = await login({ email: 'test@example.com', password: 'Password1!' });

    expect(mockPost).toHaveBeenCalledWith('/auth/login', {
      email: 'test@example.com',
      password: 'Password1!',
    });
    expect(result.accessToken).toBe('access-token-123');
  });

  it('applies the auth response (sets tokens)', async () => {
    mockPost.mockResolvedValue({ data: VALID_AUTH_RESPONSE });

    await login({ email: 'test@example.com', password: 'Password1!' });

    expect(tokenManager.getAccessToken()).toBe('access-token-123');
  });

  it('throws on invalid email format', async () => {
    await expect(
      login({ email: 'not-an-email', password: 'Password1!' }),
    ).rejects.toThrow();
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('throws on short password', async () => {
    await expect(
      login({ email: 'test@example.com', password: 'short' }),
    ).rejects.toThrow();
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('throws on invalid response shape (missing accessToken)', async () => {
    mockPost.mockResolvedValue({
      data: { ...VALID_AUTH_RESPONSE, accessToken: undefined },
    });
    await expect(
      login({ email: 'test@example.com', password: 'Password1!' }),
    ).rejects.toThrow();
  });

  it('propagates network errors', async () => {
    mockPost.mockRejectedValue(new Error('Network error'));
    await expect(
      login({ email: 'test@example.com', password: 'Password1!' }),
    ).rejects.toThrow('Network error');
  });
});

// ============================================
// register
// ============================================

describe('register', () => {
  it('posts to /auth/register with validated data', async () => {
    mockPost.mockResolvedValue({ data: VALID_REGISTER_RESPONSE });

    const result = await register({
      username: 'johndoe',
      email: 'john@example.com',
      password: 'Password1!',
      fullName: 'John Doe',
    });

    expect(mockPost).toHaveBeenCalledWith('/auth/register', {
      username: 'johndoe',
      email: 'john@example.com',
      password: 'Password1!',
      fullName: 'John Doe',
    });
    expect(result.requiresVerification).toBe(true);
  });

  it('does NOT set tokens (register with verification returns no tokens)', async () => {
    mockPost.mockResolvedValue({ data: VALID_REGISTER_RESPONSE });

    await register({
      username: 'johndoe',
      email: 'john@example.com',
      password: 'Password1!',
      fullName: 'John Doe',
    });

    expect(tokenManager.getAccessToken()).toBeNull();
  });

  it('throws on invalid username (uppercase)', async () => {
    await expect(
      register({
        username: 'JohnDoe',
        email: 'john@example.com',
        password: 'Password1!',
        fullName: 'John Doe',
      }),
    ).rejects.toThrow();
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('throws on weak password', async () => {
    await expect(
      register({
        username: 'johndoe',
        email: 'john@example.com',
        password: 'weak',
        fullName: 'John Doe',
      }),
    ).rejects.toThrow();
  });

  it('throws on empty fullName', async () => {
    await expect(
      register({
        username: 'johndoe',
        email: 'john@example.com',
        password: 'Password1!',
        fullName: '',
      }),
    ).rejects.toThrow();
  });
});

// ============================================
// verifyEmail
// ============================================

describe('verifyEmail', () => {
  it('posts to /auth/verify-email with the token', async () => {
    mockPost.mockResolvedValue({ data: VALID_AUTH_RESPONSE });

    const result = await verifyEmail({ token: 'verify-token-123' });

    expect(mockPost).toHaveBeenCalledWith('/auth/verify-email', {
      token: 'verify-token-123',
    });
    expect(result.accessToken).toBe('access-token-123');
  });

  it('applies the auth response (sets tokens after verification)', async () => {
    mockPost.mockResolvedValue({ data: VALID_AUTH_RESPONSE });

    await verifyEmail({ token: 'verify-token-123' });

    expect(tokenManager.getAccessToken()).toBe('access-token-123');
  });

  it('throws on empty token', async () => {
    await expect(verifyEmail({ token: '' })).rejects.toThrow();
    expect(mockPost).not.toHaveBeenCalled();
  });
});

// ============================================
// resendVerification
// ============================================

describe('resendVerification', () => {
  it('posts to /auth/resend-verification with the email', async () => {
    mockPost.mockResolvedValue({ data: {} });

    await resendVerification({ email: 'test@example.com' });

    expect(mockPost).toHaveBeenCalledWith('/auth/resend-verification', {
      email: 'test@example.com',
    });
  });

  it('throws on invalid email', async () => {
    await expect(resendVerification({ email: 'bad' })).rejects.toThrow();
    expect(mockPost).not.toHaveBeenCalled();
  });
});

// ============================================
// forgotPassword
// ============================================

describe('forgotPassword', () => {
  it('posts to /auth/forgot-password with the email', async () => {
    mockPost.mockResolvedValue({ data: {} });

    await forgotPassword({ email: 'test@example.com' });

    expect(mockPost).toHaveBeenCalledWith('/auth/forgot-password', {
      email: 'test@example.com',
    });
  });

  it('throws on invalid email', async () => {
    await expect(forgotPassword({ email: 'not-email' })).rejects.toThrow();
  });
});

// ============================================
// resetPassword
// ============================================

describe('resetPassword', () => {
  it('posts to /auth/reset-password with token and new password', async () => {
    mockPost.mockResolvedValue({ data: {} });

    await resetPassword({ token: 'reset-token', newPassword: 'NewPassword1!' });

    expect(mockPost).toHaveBeenCalledWith('/auth/reset-password', {
      token: 'reset-token',
      newPassword: 'NewPassword1!',
    });
  });

  it('throws on empty token', async () => {
    await expect(
      resetPassword({ token: '', newPassword: 'NewPassword1!' }),
    ).rejects.toThrow();
  });

  it('throws on weak password', async () => {
    await expect(
      resetPassword({ token: 'reset-token', newPassword: 'weak' }),
    ).rejects.toThrow();
  });
});

// ============================================
// logout
// ============================================

describe('logout', () => {
  it('calls /auth/logout with the refresh token via apiRequest', async () => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue('rt-value');
    mockApiRequest.mockResolvedValue({});

    await logout();

    expect(mockApiRequest).toHaveBeenCalledWith({
      method: 'POST',
      url: '/auth/logout',
      data: { refreshToken: 'rt-value' },
    });
  });

  it('sends empty data when no refresh token is available', async () => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null);
    mockApiRequest.mockResolvedValue({});

    await logout();

    expect(mockApiRequest).toHaveBeenCalledWith({
      method: 'POST',
      url: '/auth/logout',
      data: {},
    });
  });

  it('clears all tokens even when the API call fails', async () => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue('rt-value');
    mockApiRequest.mockRejectedValue(new Error('Network error'));
    tokenManager.setAccessToken('should-be-cleared');

    await expect(logout()).rejects.toThrow();
    expect(tokenManager.getAccessToken()).toBeNull();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalled();
  });

  it('clears all tokens on success', async () => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue('rt-value');
    mockApiRequest.mockResolvedValue({});
    tokenManager.setAccessToken('to-clear');

    await logout();

    expect(tokenManager.getAccessToken()).toBeNull();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('growth.refresh_token');
  });
});

// ============================================
// getCurrentUser
// ============================================

describe('getCurrentUser', () => {
  it('fetches /profile/me and parses the response', async () => {
    mockApiRequest.mockResolvedValue(VALID_PROFILE_RESPONSE);

    const result = await getCurrentUser();

    expect(mockApiRequest).toHaveBeenCalledWith({
      method: 'GET',
      url: '/profile/me',
    });
    expect(result.data.id).toBe('user-1');
  });

  it('throws on invalid response shape', async () => {
    mockApiRequest.mockResolvedValue({ data: { id: 'x' } }); // missing required fields

    await expect(getCurrentUser()).rejects.toThrow();
  });
});
