import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useSessionRestore } from '@/core/auth';
import { useSessionStore } from '@/core/auth/session';
import { getEnv } from '@/core/config/env';
import { getQueryClient, setupReactNativeIntegrations } from '@/core/query';
import { initSentry } from '@/core/telemetry/sentry';
import { ThemeProvider } from '@/design-system/theme';
import { usePaperFonts } from '@/design-system/theme/fonts';
import { getCurrentUser } from '@/features/auth';
import { getSettings } from '@/features/settings';
import { initI18n } from '@/i18n';
import { QueryClientProvider } from '@tanstack/react-query';

initI18n();
SplashScreen.preventAutoHideAsync();

/**
 * Inner tree rendered inside the QueryClientProvider so hooks that call
 * useQueryClient (e.g. useSessionRestore) have a provider ancestor.
 */
function AppBootstrap({ fontsReady }: { fontsReady: boolean }) {
  // Wire feature-owned API functions into core session restore. The app layer
  // is the only allowed place to bridge features into core (app → features →
  // core per AGENTS.md); core never imports features.
  const sessionRestoreCallbacks = useMemo(
    () => ({ fetchProfile: getCurrentUser, fetchSettings: getSettings }),
    [],
  );

  // Restore session from SecureStore — validates with /profile/me.
  useSessionRestore(sessionRestoreCallbacks);

  // Hide splash screen once fonts are loaded and the session is hydrated.
  const isHydrated = useSessionStore((s) => s.isHydrated);
  useEffect(() => {
    if (isHydrated && fontsReady) {
      SplashScreen.hideAsync().catch(() => {
        // Ignore — splash hide failures are non-fatal.
      });
    }
  }, [isHydrated, fontsReady]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(public)" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(app)" />
    </Stack>
  );
}

export default function RootLayout() {
  // Load Paper fonts (Newsreader, Instrument Sans, IBM Plex Mono). The app
  // stays on the splash until these report loaded; on error it degrades to
  // system fallbacks and still boots.
  const { loaded: fontsLoaded } = usePaperFonts();

  // Initialize i18n, Sentry (no-op if DSN is empty), and React Query native integrations.
  const env = getEnv();
  useEffect(() => {
    initSentry(env.EXPO_PUBLIC_SENTRY_DSN, __DEV__ ? 'development' : 'production');
    setupReactNativeIntegrations();
  }, [env.EXPO_PUBLIC_SENTRY_DSN]);

  const queryClient = getQueryClient();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider fontsLoaded={fontsLoaded}>
          <QueryClientProvider client={queryClient}>
            <AppBootstrap fontsReady={fontsLoaded} />
            <StatusBar style="auto" />
          </QueryClientProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
