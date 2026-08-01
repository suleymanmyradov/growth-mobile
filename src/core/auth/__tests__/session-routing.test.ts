import { describe, expect, it } from '@jest/globals';

import { APP_ROUTE, ONBOARDING_ROUTE, routeForOnboardingStatus } from '../session';

describe('routeForOnboardingStatus', () => {
  it('opens the app for completed onboarding', () => {
    expect(routeForOnboardingStatus(true)).toBe(APP_ROUTE);
  });

  it('opens onboarding only for an explicit incomplete status', () => {
    expect(routeForOnboardingStatus(false)).toBe(ONBOARDING_ROUTE);
  });

  it('keeps authenticated users in the app when status is unavailable', () => {
    expect(routeForOnboardingStatus(null)).toBe(APP_ROUTE);
  });
});
