import { useSessionStore } from '@/core/auth/session';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';

/**
 * Authenticated app route group.
 *
 * Route guard at the group boundary — redirects unauthenticated users to
 * the public group and users with incomplete onboarding to the onboarding
 * group. This is defense-in-depth; authorization remains a backend
 * responsibility.
 *
 * Phase D navigation (`mobile.md` §6): the Stack hosts the `(tabs)` group
 * (Today/Plan/Coach/Library/Me) plus pushed stack routes (`progress`,
 * `article/[id]`, `conversation/[conversationId]`) and modal/sheet routes
 * (`paywall` modal, `notifications` form sheet). `settings` remains as a
 * temporary stack route until Phase G folds it into Me. Phase E folded goals
 * into the Plan tab, so the standalone `goals` stack route was removed.
 * Stack headers are hidden; each screen renders its own header via the `Screen`
 * primitive so back affordance and titles stay consistent.
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

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="progress" />
      <Stack.Screen name="article/[id]" />
      <Stack.Screen name="conversation/[conversationId]" />
      <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
      <Stack.Screen name="notifications" options={{ presentation: 'formSheet' }} />
    </Stack>
  );
}
