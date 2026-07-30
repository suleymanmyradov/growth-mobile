/**
 * Session restore — validates a persisted session on app foreground/relaunch.
 *
 * Per AGENTS.md hard rules:
 * - App foreground/session restore validates with `/profile/me`; a persisted
 *   profile is never proof of authentication.
 * - If refresh fails, clear SecureStore, query cache, persisted user-scoped
 *   cache, Zustand session state, and push registration, then return to sign-in.
 *
 * This hook is called once at app startup from the root layout. It:
 * 1. Loads the persisted session from SecureStore.
 * 2. If a session exists, calls /profile/me to validate it (the HTTP client's
 *    401 interceptor handles refresh if the access token is expired).
 * 3. On success, populates the session store with the user profile and
 *    onboarding status from settings.
 * 4. On failure, clears all local state.
 */
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { setInstallationId } from '@/core/api/client';
import type { ProfileResponse, SettingsResponse } from '@/core/api/schemas';
import { getQueryClient } from '@/core/query';
import { setSentryUser } from '@/core/telemetry/sentry';
import { getOrCreateInstallationId } from './installation';
import { useSessionStore } from './session';
import { tokenManager } from './token-manager';

/**
 * Callbacks supplied by the app layer. The app layer owns the wiring between
 * core session restore and the feature-owned API functions, so core never
 * imports features (per AGENTS.md dependency-direction rule).
 */
export interface SessionRestoreCallbacks {
  /** Validates the persisted session by fetching /profile/me. */
  fetchProfile: () => Promise<ProfileResponse>;
  /** Fetches settings to determine onboarding status. */
  fetchSettings: () => Promise<SettingsResponse>;
}

export function useSessionRestore(callbacks: SessionRestoreCallbacks): void {
  const setUser = useSessionStore((s) => s.setUser);
  const setHydrated = useSessionStore((s) => s.setHydrated);
  const clear = useSessionStore((s) => s.clear);
  const activeQueryClient = useQueryClient();
  const hasRestored = useRef(false);

  useEffect(() => {
    if (hasRestored.current) return;
    hasRestored.current = true;

    const { fetchProfile, fetchSettings } = callbacks;

    (async () => {
      // 1. Configure the installation ID for X-Device-Id on login/register.
      try {
        const installationId = await getOrCreateInstallationId();
        setInstallationId(installationId);
      } catch {
        // Non-fatal — login/register will still work without X-Device-Id.
      }

      // 2. Load persisted session.
      const persistedSession = await tokenManager.loadSession();
      if (!persistedSession) {
        setHydrated(true);
        return;
      }

      // 3. Validate with /profile/me. The HTTP client's 401 interceptor will
      //    attempt a token refresh if the access token is expired.
      try {
        const profileResponse = await fetchProfile();
        const profile = profileResponse.data;

        // 4. Fetch settings to determine onboarding status.
        let onboardingCompleted = false;
        try {
          const settingsResponse = await fetchSettings();
          onboardingCompleted = settingsResponse.data.onboardingCompleted;
        } catch {
          // Settings fetch failure is non-fatal — default to incomplete onboarding.
        }

        setUser({
          id: profile.id,
          email: profile.email,
          fullName: profile.fullName,
          onboardingCompleted,
        });
        setSentryUser(profile.id);
      } catch {
        // 5. Validation failed — clear all local state.
        await tokenManager.clearAll();
        activeQueryClient.clear();
        clear();
        setSentryUser(null);
      } finally {
        setHydrated(true);
      }
    })();
  }, [setUser, setHydrated, clear, activeQueryClient, callbacks]);
}

/**
 * Clears all session-related state. Called on logout and refresh failure.
 */
export async function clearSessionState(): Promise<void> {
  await tokenManager.clearAll();
  getQueryClient().clear();
  useSessionStore.getState().clear();
  setSentryUser(null);
}
