import { create } from 'zustand';

/**
 * Session state — minimal, in-memory only.
 *
 * Per AGENTS.md: Zustand holds only session metadata (not tokens, not
 * remotely-sourced data). The access token lives in the TokenManager
 * (in-memory), the refresh token in SecureStore.
 */

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  /** Null means authentication succeeded but onboarding status is unavailable. */
  onboardingCompleted: boolean | null;
}

export const APP_ROUTE = '/(app)/(tabs)' as const;
export const ONBOARDING_ROUTE = '/(onboarding)' as const;

export function routeForOnboardingStatus(
  status: boolean | null,
): typeof APP_ROUTE | typeof ONBOARDING_ROUTE {
  return status === false ? ONBOARDING_ROUTE : APP_ROUTE;
}

interface SessionState {
  user: SessionUser | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  setUser: (user: SessionUser | null) => void;
  setHydrated: (hydrated: boolean) => void;
  clear: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  user: null,
  isAuthenticated: false,
  isHydrated: false,
  setUser: (user) =>
    set({
      user,
      isAuthenticated: user !== null,
    }),
  setHydrated: (hydrated) => set({ isHydrated: hydrated }),
  clear: () =>
    set({
      user: null,
      isAuthenticated: false,
    }),
}));
