/**
 * Auth API functions.
 *
 * All auth endpoints use the bare (unauthenticated) Axios client except logout,
 * which uses the authenticated client. The shared HTTP client's 401 interceptor
 * handles token refresh; auth endpoints themselves never trigger refresh.
 *
 * Per AGENTS.md:
 * - Login/register/verify return access token, refresh token, expiry, and profile.
 * - The access token is kept in memory; the refresh token pair is persisted via
 *   SecureStore.
 * - `X-Device-Id` is attached on login/register after creating a random
 *   installation ID.
 */
import { apiRequest, getBareClient } from '@/core/api/client';
import { authEndpoints, profileEndpoints } from '@/core/api/endpoints';
import {
  AuthResponseSchema,
  ProfileResponseSchema,
  RegisterResponseSchema,
  type AuthResponse,
  type ProfileResponse,
  type RegisterResponse,
} from '@/core/api/schemas';
import { tokenManager } from '@/core/auth/token-manager';

import {
  ForgotPasswordRequestSchema,
  LoginRequestSchema,
  RegisterRequestSchema,
  ResendVerificationRequestSchema,
  ResetPasswordRequestSchema,
  VerifyEmailRequestSchema,
  type ForgotPasswordRequest,
  type LoginRequest,
  type RegisterRequest,
  type ResendVerificationRequest,
  type ResetPasswordRequest,
  type VerifyEmailRequest,
} from './schemas';

/**
 * Applies the auth response: sets the in-memory access token and persists the
 * refresh token pair to SecureStore. Called after login, register-verify, and
 * email verification.
 */
export async function applyAuthResponse(data: AuthResponse): Promise<void> {
  tokenManager.setAccessToken(data.accessToken);
  await tokenManager.persistSession({
    refreshToken: data.refreshToken,
    sessionId: data.user.id, // The backend uses the user ID as session identifier
    userId: data.user.id,
  });
}

/**
 * Login with email and password. Returns the auth response (tokens + profile).
 */
export async function login(data: LoginRequest): Promise<AuthResponse> {
  const validated = LoginRequestSchema.parse(data);
  const response = await getBareClient().post<unknown>(authEndpoints.login, validated);
  const parsed = AuthResponseSchema.parse(response.data);
  await applyAuthResponse(parsed);
  return parsed;
}

/**
 * Register a new user. With email verification enabled, the backend does NOT
 * return tokens — it sends a verification email. The caller should show the
 * "check your email" state from the returned message.
 */
export async function register(data: RegisterRequest): Promise<RegisterResponse> {
  const validated = RegisterRequestSchema.parse(data);
  const response = await getBareClient().post<unknown>(authEndpoints.register, validated);
  return RegisterResponseSchema.parse(response.data);
}

/**
 * Verify an email using the token from the verification link. Returns a fresh
 * token pair so the user is logged in immediately after verifying.
 */
export async function verifyEmail(data: VerifyEmailRequest): Promise<AuthResponse> {
  const validated = VerifyEmailRequestSchema.parse(data);
  const response = await getBareClient().post<unknown>(authEndpoints.verifyEmail, validated);
  const parsed = AuthResponseSchema.parse(response.data);
  await applyAuthResponse(parsed);
  return parsed;
}

/**
 * Resend the email verification link. Rate-limited server-side.
 */
export async function resendVerification(data: ResendVerificationRequest): Promise<void> {
  const validated = ResendVerificationRequestSchema.parse(data);
  await getBareClient().post(authEndpoints.resendVerification, validated);
}

/**
 * Request a password reset email. Always resolves (the backend does not reveal
 * whether the email exists).
 */
export async function forgotPassword(data: ForgotPasswordRequest): Promise<void> {
  const validated = ForgotPasswordRequestSchema.parse(data);
  await getBareClient().post(authEndpoints.forgotPassword, validated);
}

/**
 * Reset a password using the token from the reset email.
 */
export async function resetPassword(data: ResetPasswordRequest): Promise<void> {
  const validated = ResetPasswordRequestSchema.parse(data);
  await getBareClient().post(authEndpoints.resetPassword, validated);
}

/**
 * Logout the current user. Calls the backend, then clears local state even
 * when the network call fails. Sends the refresh token so the backend can
 * revoke the session.
 */
export async function logout(): Promise<void> {
  const refreshToken = await tokenManager.getRefreshToken();
  try {
    await apiRequest({
      method: 'POST',
      url: authEndpoints.logout,
      data: refreshToken ? { refreshToken } : {},
    });
  } finally {
    await tokenManager.clearAll();
  }
}

/**
 * Get current user profile (also verifies token validity).
 * Used for session restore on app foreground/relaunch.
 */
export async function getCurrentUser(): Promise<ProfileResponse> {
  const response = await apiRequest<unknown>({
    method: 'GET',
    url: profileEndpoints.me,
  });
  return ProfileResponseSchema.parse(response);
}
