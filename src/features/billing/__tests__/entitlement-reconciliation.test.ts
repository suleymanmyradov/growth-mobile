/**
 * Tests for the paywall entitlement reconciliation state machine.
 *
 * Per `mobile.md` §8.9: a purchase callback alone does not unlock access — the
 * entitlement must be reconciled with the backend before the paywall dismisses.
 * Covers loading, unavailable, idle, purchasing, pending, canceled, failed,
 * restored, reconciling, and reconciled states.
 */
import { describe, expect, it } from '@jest/globals';

import {
  initialPaywallState,
  isPaywallBusy,
  reducePaywall,
  shouldDismissPaywall,
} from '../entitlement-reconciliation';

describe('initialPaywallState', () => {
  it('starts in loading', () => {
    expect(initialPaywallState.status).toBe('loading');
  });
});

describe('reducePaywall — offerings', () => {
  it('moves to idle when packages are available', () => {
    const state = reducePaywall(initialPaywallState, {
      type: 'offerings_loaded',
      hasPackages: true,
    });
    expect(state.status).toBe('idle');
  });

  it('moves to unavailable when no packages', () => {
    const state = reducePaywall(initialPaywallState, {
      type: 'offerings_loaded',
      hasPackages: false,
    });
    expect(state.status).toBe('unavailable');
  });

  it('moves to unavailable on offerings_failed', () => {
    const state = reducePaywall(initialPaywallState, { type: 'offerings_failed' });
    expect(state.status).toBe('unavailable');
  });
});

describe('reducePaywall — purchase flow', () => {
  it('starts purchasing from idle', () => {
    const idle = reducePaywall(initialPaywallState, {
      type: 'offerings_loaded',
      hasPackages: true,
    });
    const state = reducePaywall(idle, { type: 'select_purchase' });
    expect(state.status).toBe('purchasing');
  });

  it('can retry a purchase from canceled', () => {
    let state = reducePaywall(initialPaywallState, { type: 'offerings_loaded', hasPackages: true });
    state = reducePaywall(state, { type: 'select_purchase' });
    state = reducePaywall(state, { type: 'purchase_outcome', outcome: 'canceled' });
    expect(state.status).toBe('canceled');
    state = reducePaywall(state, { type: 'select_purchase' });
    expect(state.status).toBe('purchasing');
  });

  it('can retry a purchase from failed', () => {
    let state = reducePaywall(initialPaywallState, { type: 'offerings_loaded', hasPackages: true });
    state = reducePaywall(state, { type: 'select_purchase' });
    state = reducePaywall(state, { type: 'purchase_outcome', outcome: 'failed', message: 'oops' });
    expect(state.status).toBe('failed');
    expect(state.failureMessage).toBe('oops');
    state = reducePaywall(state, { type: 'select_purchase' });
    expect(state.status).toBe('purchasing');
  });

  it('a purchased outcome moves to reconciling (never reconciled directly)', () => {
    let state = reducePaywall(initialPaywallState, { type: 'offerings_loaded', hasPackages: true });
    state = reducePaywall(state, { type: 'select_purchase' });
    state = reducePaywall(state, { type: 'purchase_outcome', outcome: 'purchased' });
    expect(state.status).toBe('reconciling');
    expect(shouldDismissPaywall(state)).toBe(false);
  });

  it('a canceled outcome moves to canceled', () => {
    let state = reducePaywall(initialPaywallState, { type: 'offerings_loaded', hasPackages: true });
    state = reducePaywall(state, { type: 'select_purchase' });
    state = reducePaywall(state, { type: 'purchase_outcome', outcome: 'canceled' });
    expect(state.status).toBe('canceled');
  });

  it('a pending outcome moves to pending', () => {
    let state = reducePaywall(initialPaywallState, { type: 'offerings_loaded', hasPackages: true });
    state = reducePaywall(state, { type: 'select_purchase' });
    state = reducePaywall(state, { type: 'purchase_outcome', outcome: 'pending' });
    expect(state.status).toBe('pending');
  });

  it('a failed outcome carries the failure message', () => {
    let state = reducePaywall(initialPaywallState, { type: 'offerings_loaded', hasPackages: true });
    state = reducePaywall(state, { type: 'select_purchase' });
    state = reducePaywall(state, {
      type: 'purchase_outcome',
      outcome: 'failed',
      message: 'store error',
    });
    expect(state.status).toBe('failed');
    expect(state.failureMessage).toBe('store error');
  });

  it('ignores purchase outcomes when not purchasing', () => {
    const state = reducePaywall(initialPaywallState, {
      type: 'purchase_outcome',
      outcome: 'purchased',
    });
    expect(state.status).toBe('loading');
  });
});

describe('reducePaywall — restore flow', () => {
  it('restore always moves to reconciling', () => {
    const idle = reducePaywall(initialPaywallState, {
      type: 'offerings_loaded',
      hasPackages: true,
    });
    const state = reducePaywall(idle, { type: 'restore_outcome', restored: false });
    expect(state.status).toBe('reconciling');
  });

  it('restore with no active entitlement still reconciles with backend', () => {
    const idle = reducePaywall(initialPaywallState, {
      type: 'offerings_loaded',
      hasPackages: true,
    });
    const state = reducePaywall(idle, { type: 'restore_outcome', restored: false });
    expect(state.status).toBe('reconciling');
  });
});

describe('reducePaywall — reconciliation', () => {
  it('reconcile outcome entitled moves to reconciled (dismissable)', () => {
    let state = reducePaywall(initialPaywallState, { type: 'offerings_loaded', hasPackages: true });
    state = reducePaywall(state, { type: 'select_purchase' });
    state = reducePaywall(state, { type: 'purchase_outcome', outcome: 'purchased' });
    state = reducePaywall(state, { type: 'reconcile_outcome', entitled: true });
    expect(state.status).toBe('reconciled');
    expect(shouldDismissPaywall(state)).toBe(true);
  });

  it('reconcile outcome not entitled moves to failed', () => {
    let state = reducePaywall(initialPaywallState, { type: 'offerings_loaded', hasPackages: true });
    state = reducePaywall(state, { type: 'select_purchase' });
    state = reducePaywall(state, { type: 'purchase_outcome', outcome: 'purchased' });
    state = reducePaywall(state, { type: 'reconcile_outcome', entitled: false });
    expect(state.status).toBe('failed');
    expect(shouldDismissPaywall(state)).toBe(false);
  });

  it('ignores reconcile outcome when not reconciling', () => {
    const state = reducePaywall(initialPaywallState, { type: 'reconcile_outcome', entitled: true });
    expect(state.status).toBe('loading');
  });
});

describe('reducePaywall — reset', () => {
  it('reset returns to idle', () => {
    let state = reducePaywall(initialPaywallState, { type: 'offerings_loaded', hasPackages: true });
    state = reducePaywall(state, { type: 'select_purchase' });
    state = reducePaywall(state, { type: 'reset' });
    expect(state.status).toBe('idle');
  });
});

describe('isPaywallBusy', () => {
  it.each(['loading', 'purchasing', 'pending', 'reconciling'] as const)(
    'is busy for %s',
    (status) => {
      expect(isPaywallBusy({ status })).toBe(true);
    },
  );

  it.each(['unavailable', 'idle', 'canceled', 'failed', 'restored', 'reconciled'] as const)(
    'is not busy for %s',
    (status) => {
      expect(isPaywallBusy({ status })).toBe(false);
    },
  );
});
