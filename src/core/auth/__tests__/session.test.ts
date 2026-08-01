/**
 * Tests for the onboarding routing decision used by the route guards.
 *
 * Rule under test: an authenticated user who already completed onboarding
 * must never be sent to the onboarding page. Only an explicit incomplete
 * status (`false`) enters onboarding; an unavailable status (`null`) stays
 * in the app so a failed settings response cannot restart a user's setup.
 */
import { describe, expect, it } from '@jest/globals';

import { APP_ROUTE, ONBOARDING_ROUTE, routeForOnboardingStatus, useSessionStore } from '../session';

describe('routeForOnboardingStatus', () => {
  it('routes an onboarded user to the app, not onboarding', () => {
    expect(routeForOnboardingStatus(true)).toBe(APP_ROUTE);
    expect(routeForOnboardingStatus(true)).not.toBe(ONBOARDING_ROUTE);
  });

  it('routes a user with incomplete onboarding to onboarding', () => {
    expect(routeForOnboardingStatus(false)).toBe(ONBOARDING_ROUTE);
  });

  it('does not route to onboarding when status is unavailable', () => {
    expect(routeForOnboardingStatus(null)).toBe(APP_ROUTE);
    expect(routeForOnboardingStatus(null)).not.toBe(ONBOARDING_ROUTE);
  });
});

describe('useSessionStore', () => {
  it('marks an onboarded user as authenticated without dropping status', () => {
    const store = useSessionStore.getState();
    store.setUser({
      id: 'user-1',
      email: 'user@example.com',
      fullName: 'Growth User',
      onboardingCompleted: true,
    });

    const next = useSessionStore.getState();
    expect(next.isAuthenticated).toBe(true);
    expect(next.user?.onboardingCompleted).toBe(true);
    // The routing decision for this session must not target onboarding.
    if (!next.user) throw new Error('Expected a session user');
    expect(routeForOnboardingStatus(next.user.onboardingCompleted)).toBe(APP_ROUTE);
  });

  it('clear() resets authentication so no route decision can run', () => {
    useSessionStore.getState().setUser({
      id: 'user-1',
      email: 'user@example.com',
      fullName: 'Growth User',
      onboardingCompleted: true,
    });
    useSessionStore.getState().clear();

    const next = useSessionStore.getState();
    expect(next.isAuthenticated).toBe(false);
    expect(next.user).toBeNull();
  });
});
