import NetInfo from '@react-native-community/netinfo';
import { QueryClient } from '@tanstack/react-query';
import { AppState, AppStateStatus } from 'react-native';

/**
 * TanStack Query client configured for React Native.
 *
 * - AppState → focusManager (refetch on foreground).
 * - NetInfo → onlineManager (pause queries when offline).
 * - Stale time defaults to 60s (mobile networks are slower than web).
 * - No automatic retries on 4xx (per AGENTS.md: never retry ordinary 4xx).
 * - Retry 5xx with bounded exponential backoff and jitter.
 */

let queryClientInstance: QueryClient | null = null;

export function getQueryClient(): QueryClient {
  if (queryClientInstance) return queryClientInstance;

  queryClientInstance = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000, // 60s
        gcTime: 5 * 60_000, // 5 min
        retry: (failureCount, error) => {
          // Never retry 4xx (client errors).
          if (error && typeof error === 'object' && 'status' in error) {
            const status = (error as { status: number }).status;
            if (status >= 400 && status < 500) return false;
          }
          // Retry 5xx up to 3 times with exponential backoff.
          return failureCount < 3;
        },
        retryDelay: (attemptIndex) => {
          // Exponential backoff with jitter: 1s, 2s, 4s + random 0-500ms.
          const base = Math.min(1000 * 2 ** attemptIndex, 10_000);
          const jitter = Math.random() * 500;
          return base + jitter;
        },
        refetchOnWindowFocus: false, // handled by AppState focusManager
      },
      mutations: {
        retry: false, // never retry mutations automatically
      },
    },
  });

  return queryClientInstance;
}

/**
 * Wires React Native AppState to TanStack Query's focusManager.
 * Call this once at app startup.
 */
export function setupAppStateFocus(): void {
  const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
    // React Query's focusManager is imported lazily to avoid SSR issues.
    import('@tanstack/react-query').then(({ focusManager }) => {
      focusManager.setFocused(state === 'active');
    });
  });

  // Return cleanup function (not used in practice — app lifetime).
  // The subscription is kept alive for the app's lifetime.
  void subscription;
}

/**
 * Wires NetInfo to TanStack Query's onlineManager.
 * Call this once at app startup.
 */
export function setupNetInfoOnline(): void {
  NetInfo.addEventListener((state) => {
    import('@tanstack/react-query').then(({ onlineManager }) => {
      onlineManager.setOnline(state.isConnected !== false && state.isInternetReachable !== false);
    });
  });
}

/**
 * Call all React Native integrations at app startup.
 */
export function setupReactNativeIntegrations(): void {
  setupAppStateFocus();
  setupNetInfoOnline();
}
