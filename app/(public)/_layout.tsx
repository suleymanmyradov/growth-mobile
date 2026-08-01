import { routeForOnboardingStatus, useSessionStore } from '@/core/auth/session';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';

/**
 * Public route group — sign in, register, check email, verify email,
 * forgot password, reset password.
 *
 * Redirects authenticated users to the app or onboarding.
 */
export default function PublicLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isHydrated, user } = useSessionStore();

  useEffect(() => {
    if (!isHydrated) return;

    if (isAuthenticated && user) {
      // Only an explicit incomplete status enters onboarding. An unavailable
      // settings response should not restart an authenticated user's setup.
      router.replace(routeForOnboardingStatus(user.onboardingCompleted));
    }
  }, [isAuthenticated, isHydrated, user, router, segments]);

  return <Stack screenOptions={{ headerShown: false }} />;
}
