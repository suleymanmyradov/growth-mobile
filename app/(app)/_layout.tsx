import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { useSessionStore } from '@/core/auth/session';

/**
 * Authenticated app route group.
 *
 * Route guard at the group boundary — redirects unauthenticated users to
 * the public group and users with incomplete onboarding to the onboarding
 * group. This is defense-in-depth; authorization remains a backend
 * responsibility.
 */
export default function AppLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isHydrated, user } = useSessionStore();

  useEffect(() => {
    if (!isHydrated) return;

    if (!isAuthenticated) {
      router.replace('/(public)');
      return;
    }

    if (user && !user.onboardingCompleted) {
      router.replace('/(onboarding)');
    }
  }, [isAuthenticated, isHydrated, user, router, segments]);

  return <Stack screenOptions={{ headerShown: false }} />;
}
