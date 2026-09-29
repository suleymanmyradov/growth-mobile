/**
 * Tests for the RevenueCat identity link (revenuecat.ts).
 *
 * The missing Purchases.logIn(userId) call meant every purchase landed on an
 * anonymous $RCAnonymousID and the backend webhook could never attribute it —
 * users paid and Pro never unlocked. These tests pin the link/unlink contract:
 * logIn once per identity, logOut on session end, no-ops when unconfigured.
 */
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {
    configure: jest.fn(),
    setLogLevel: jest.fn(async () => undefined),
    logIn: jest.fn(async () => ({ customerInfo: {}, created: true })),
    logOut: jest.fn(async () => ({})),
    getOfferings: jest.fn(async () => ({ current: null })),
  },
  LOG_LEVEL: { DEBUG: 0, WARN: 4 },
  PURCHASES_ERROR_CODE: {},
}));

jest.mock('@/core/config/env', () => ({
  getEnv: () => ({
    EXPO_PUBLIC_REVENUECAT_APPLE_KEY: 'appl_test_key',
    EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY: 'goog_test_key',
  }),
}));

interface PurchasesMock {
  configure: jest.Mock;
  logIn: jest.Mock;
  logOut: jest.Mock;
}

function freshModule() {
  // resetModules gives each test fresh adapter state (configured,
  // linkedUserId singletons).
  jest.resetModules();
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const purchases = require('react-native-purchases').default as PurchasesMock;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const rc = require('../revenuecat') as typeof import('../revenuecat');
  return { purchases, rc };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('linkRevenueCatUser', () => {
  it('calls Purchases.logIn with the backend user ID', async () => {
    const { purchases, rc } = freshModule();
    await rc.linkRevenueCatUser('user-123');
    expect(purchases.configure).toHaveBeenCalled();
    expect(purchases.logIn).toHaveBeenCalledWith('user-123');
  });

  it('does not repeat logIn for the same user', async () => {
    const { purchases, rc } = freshModule();
    await rc.linkRevenueCatUser('user-123');
    await rc.linkRevenueCatUser('user-123');
    expect(purchases.logIn).toHaveBeenCalledTimes(1);
  });

  it('re-links when the identity changes (account switch)', async () => {
    const { purchases, rc } = freshModule();
    await rc.linkRevenueCatUser('user-a');
    await rc.linkRevenueCatUser('user-b');
    expect(purchases.logIn).toHaveBeenCalledTimes(2);
    expect(purchases.logIn).toHaveBeenLastCalledWith('user-b');
  });

  it('no-ops on empty user id', async () => {
    const { purchases, rc } = freshModule();
    await rc.linkRevenueCatUser('');
    expect(purchases.logIn).not.toHaveBeenCalled();
  });

  it('never throws when the SDK rejects', async () => {
    const { purchases, rc } = freshModule();
    purchases.logIn.mockImplementation(() =>
      Promise.reject(new Error('rc down')),
    );
    await expect(rc.linkRevenueCatUser('user-1')).resolves.toBeUndefined();
  });
});

describe('unlinkRevenueCatUser', () => {
  it('logs out after a link, reverting to anonymous', async () => {
    const { purchases, rc } = freshModule();
    await rc.linkRevenueCatUser('user-123');
    await rc.unlinkRevenueCatUser();
    expect(purchases.logOut).toHaveBeenCalledTimes(1);
  });

  it('allows re-link after unlink', async () => {
    const { purchases, rc } = freshModule();
    await rc.linkRevenueCatUser('user-a');
    await rc.unlinkRevenueCatUser();
    await rc.linkRevenueCatUser('user-b');
    expect(purchases.logIn).toHaveBeenLastCalledWith('user-b');
  });

  it('no-ops when no user is linked', async () => {
    const { purchases, rc } = freshModule();
    await rc.unlinkRevenueCatUser();
    expect(purchases.logOut).not.toHaveBeenCalled();
  });
});
