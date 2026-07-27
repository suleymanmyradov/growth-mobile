import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useSessionRestore } from '@/core/auth';
import { useSessionStore } from '@/core/auth/session';
import { getEnv } from '@/core/config/env';
import { getQueryClient, setupReactNativeIntegrations } from '@/core/query';
import { initSentry } from '@/core/telemetry/sentry';
import { ThemeProvider } from '@/design-system/theme';
import { initI18n } from '@/i18n';
import { QueryClientProvider } from '@tanstack/react-query';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Initialize i18n, Sentry (no-op if DSN is empty), and React Query native integrations.
  const env = getEnv();
  useEffect(() => {
    initI18n();
    initSentry(env.EXPO_PUBLIC_SENTRY_DSN, __DEV__ ? 'development' : 'production');
    setupReactNativeIntegrations();
  }, [env.EXPO_PUBLIC_SENTRY_DSN]);

  // Restore session from SecureStore — validates with /profile/me.
  useSessionRestore();

  // Hide splash screen once the layout is ready and session is hydrated.
  const isHydrated = useSessionStore((s) => s.isHydrated);
  useEffect(() => {
    if (isHydrated) {
      SplashScreen.hideAsync().catch(() => {
        // Ignore — splash hide failures are non-fatal.
      });
    }
  }, [isHydrated]);

  const queryClient = getQueryClient();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(public)" />
              <Stack.Screen name="(onboarding)" />
              <Stack.Screen name="(app)" />
            </Stack>
            <StatusBar style="auto" />
          </QueryClientProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
