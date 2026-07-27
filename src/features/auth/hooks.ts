/**
 * Auth hooks — React Query mutations and session management.
 *
 * These hooks wrap the auth API functions and update the session store
 * (Zustand) on success. Per AGENTS.md: API data never belongs in Zustand;
 * only session metadata (user id, email, onboarding status) is stored there.
 */
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

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
 * Updates the session store from a profile.
 */
function setSessionFromProfile(user: {
  id: string;
  email: string;
  fullName: string;
  emailVerified?: boolean;
}): void {
  useSessionStore.getState().setUser({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    // emailVerified is not the same as onboardingCompleted; the settings query
    // determines onboarding status. Default to false until settings load.
    onboardingCompleted: false,
  });
  setSentryUser(user.id);
  analytics.identify(user.id);
}

export function useLogin() {
  const router = useRouter();

  return useMutation({
    mutationFn: (data: LoginRequest) => login(data),
    onSuccess: (data) => {
      setSessionFromProfile(data.user);
      analytics.track('auth_login_succeeded');
      // Redirect based on onboarding status — the route guard handles this,
      // but we proactively navigate to avoid a flash.
      router.replace('/(app)/(tabs)');
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
    mutationFn: (data: VerifyEmailRequest) => verifyEmail(data),
    onSuccess: (data) => {
      setSessionFromProfile(data.user);
      // New users go through onboarding; the route guard handles the redirect.
      router.replace('/(onboarding)');
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
