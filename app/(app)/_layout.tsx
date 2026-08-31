import { useSessionStore } from '@/core/auth/session';
import { useNotificationCoordinator, useRegisterPushTokenOnMount } from '@/features/notifications';
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
 * `article/[id]`, `conversation/[conversationId]`, `conversation/voice`,
 * `report`, `help`) and modal/sheet routes (`paywall` modal, `notifications`
 * form sheet). Phase G folded settings into the Me tab, so the standalone
 * `settings` stack route was removed. Phase E folded goals into the Plan tab,
 * so the standalone `goals` stack route was removed. Stack headers are hidden;
 * each screen renders its own header via the `Screen` primitive so back
 * affordance and titles stay consistent.
 */
export default function AppLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isHydrated, user } = useSessionStore();

  // Register the Expo push token with the backend when authenticated.
  // Best-effort: no-ops on simulators or when push isn't configured.
  useRegisterPushTokenOnMount();
  useNotificationCoordinator();

  useEffect(() => {
    if (!isHydrated) return;

    if (!isAuthenticated) {
      router.replace('/(public)');
      return;
    }

    if (user?.onboardingCompleted === false) {
      router.replace('/(onboarding)');
    }
  }, [isAuthenticated, isHydrated, user, router, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="progress" />
      <Stack.Screen name="article/[id]" />
      <Stack.Screen name="conversation/[conversationId]" />
      <Stack.Screen name="conversation/voice" />
      <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
      <Stack.Screen name="notifications" options={{ presentation: 'formSheet' }} />
      <Stack.Screen name="report" />
      <Stack.Screen name="help" />
    </Stack>
  );
}
