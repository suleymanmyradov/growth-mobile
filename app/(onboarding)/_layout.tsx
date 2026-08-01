import { routeForOnboardingStatus, useSessionStore } from '@/core/auth/session';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';

/**
 * Onboarding route group — seven-step onboarding flow.
 * Only authenticated users with incomplete onboarding should be here.
 *
 * The full onboarding flow is implemented in Phase 2.
 */
export default function OnboardingLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isHydrated, user } = useSessionStore();

  useEffect(() => {
    if (!isHydrated) return;

    // Redirect unauthenticated users to sign-in.
    if (!isAuthenticated) {
      router.replace('/(public)');
      return;
    }

    // Unknown status is not enough to justify showing onboarding again.
    if (user && user.onboardingCompleted !== false) {
      router.replace(routeForOnboardingStatus(user.onboardingCompleted));
    }
  }, [isAuthenticated, isHydrated, user, router, segments]);

  return <Stack screenOptions={{ headerShown: false }} />;
}
