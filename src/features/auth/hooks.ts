/**
 * Auth hooks — React Query mutations and session management.
 *
 * These hooks wrap the auth API functions and update the session store
 * (Zustand) on success. Per AGENTS.md: API data never belongs in Zustand;
 * only session metadata (user id, email, onboarding status) is stored there.
 */
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

import { apiRequest } from '@/core/api/client';
import { settingsEndpoints } from '@/core/api/endpoints';
import { SettingsResponseSchema } from '@/core/api/schemas';
import { useSessionStore } from '@/core/auth/session';
import { NoopAnalytics, type Analytics } from '@/core/telemetry/analytics';
import { setSentryUser } from '@/core/telemetry/sentry';

import {
  forgotPassword,
  login,
  logout,
  register,
  resendVerification,
  resetPassword,
  verifyEmail,
} from './api';
import type {
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResendVerificationRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
} from './schemas';

// Analytics instance — replaced with a real implementation when consent is wired.
const analytics: Analytics = new NoopAnalytics();

/**
 * Maps a backend error code to a user-facing i18n key.
 * Returns null for unknown codes (the generic error message is used instead).
 */
export function authErrorKey(code: string): string | null {
  switch (code) {
    case 'invalid_credentials':
    case 'unauthenticated':
      return 'auth.errors.invalidCredentials';
    case 'email_taken':
    case 'email_already_exists':
      return 'auth.errors.emailTaken';
    case 'username_taken':
    case 'username_already_exists':
      return 'auth.errors.usernameTaken';
    case 'verification_failed':
    case 'invalid_token':
      return 'auth.errors.verificationFailed';
    case 'reset_failed':
      return 'auth.errors.resetFailed';
    default:
      return null;
  }
}

/**
 * Fetches onboarding status from settings. Uses core API primitives directly
 * (not the settings feature) to respect the AGENTS.md rule that features must
 * not import other features. Returns false on failure — the route guard will
 * send the user to onboarding, which is the safe default.
 */
async function fetchOnboardingCompleted(): Promise<boolean> {
  try {
    const response = await apiRequest<unknown>({ method: 'GET', url: settingsEndpoints.get });
    const settings = SettingsResponseSchema.parse(response);
    return settings.data.onboardingCompleted;
  } catch {
    return false;
  }
}

/**
 * Updates the session store from a profile and onboarding status.
 */
function setSessionFromProfile(
  user: { id: string; email: string; fullName: string; emailVerified?: boolean },
  onboardingCompleted: boolean,
): void {
  useSessionStore.getState().setUser({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    onboardingCompleted,
  });
  setSentryUser(user.id);
  analytics.identify(user.id);
}

export function useLogin() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      const authResponse = await login(data);
      // Fetch onboarding status before navigating so the route guard and
      // proactive navigation agree — otherwise the guard bounces onboarded
      // users into onboarding because setSessionFromProfile defaulted to false.
      const onboardingCompleted = await fetchOnboardingCompleted();
      return { authResponse, onboardingCompleted };
    },
    onSuccess: ({ authResponse, onboardingCompleted }) => {
      setSessionFromProfile(authResponse.user, onboardingCompleted);
      analytics.track('auth_login_succeeded');
      // Navigate based on real onboarding status to avoid a flash.
      router.replace(onboardingCompleted ? '/(app)/(tabs)' : '/(onboarding)');
    },
    onError: () => {
      analytics.track('auth_login_failed');
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (data: RegisterRequest) => register(data),
    onSuccess: () => {
      analytics.track('auth_register_succeeded');
    },
    onError: () => {
      analytics.track('auth_register_failed');
    },
  });
}

export function useVerifyEmail() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: VerifyEmailRequest) => {
      const authResponse = await verifyEmail(data);
      // Fetch onboarding status — a re-verifying user who already completed
      // onboarding should not be sent back through it.
      const onboardingCompleted = await fetchOnboardingCompleted();
      return { authResponse, onboardingCompleted };
    },
    onSuccess: ({ authResponse, onboardingCompleted }) => {
      setSessionFromProfile(authResponse.user, onboardingCompleted);
      router.replace(onboardingCompleted ? '/(app)/(tabs)' : '/(onboarding)');
    },
  });
}

export function useResendVerification() {
  return useMutation({
    mutationFn: (data: ResendVerificationRequest) => resendVerification(data),
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (data: ForgotPasswordRequest) => forgotPassword(data),
  });
}

export function useResetPassword() {
  const router = useRouter();

  return useMutation({
    mutationFn: (data: ResetPasswordRequest) => resetPassword(data),
    onSuccess: () => {
      router.replace('/(public)/sign-in');
    },
  });
}

export function useLogout() {
  const clear = useSessionStore((s) => s.clear);
  const router = useRouter();

  return useMutation({
    mutationFn: () => logout(),
    onSettled: () => {
      clear();
      setSentryUser(null);
      analytics.reset();
      analytics.track('auth_logout');
      router.replace('/(public)');
    },
  });
}
