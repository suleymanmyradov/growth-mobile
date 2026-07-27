import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { useSessionStore } from '@/core/auth/session';

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
      // Redirect authenticated users away from public routes.
      if (user.onboardingCompleted) {
        router.replace('/(app)/(tabs)');
      } else {
        router.replace('/(onboarding)');
      }
    }
  }, [isAuthenticated, isHydrated, user, router, segments]);

  return <Stack screenOptions={{ headerShown: false }} />;
}
