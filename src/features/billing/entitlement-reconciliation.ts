/**
 * Entitlement reconciliation state machine for the paywall.
 *
 * Per `mobile.md` §8.9: "A purchase callback alone does not unlock access.
 * Reconcile entitlement with the backend before updating gated behavior." and
 * "Cover loading, unavailable offerings, purchase pending, canceled, failed,
 * restored, and backend-reconciliation states."
 *
 * This is a pure state machine (no I/O) so it is fully unit-testable. The
 * paywall screen drives it with events from the RevenueCat adapter and the
 * billing overview query; the screen owns the side effects (refetching the
 * overview, dismissing) based on the derived state.
 */

export type PaywallStatus =
  | 'loading'
  // No offerings available (SDK unconfigured, no products, network).
  | 'unavailable'
  | 'idle'
  | 'purchasing'
  | 'pending'
  | 'canceled'
  | 'failed'
  | 'restored'
  // Backend entitlement refresh in flight after a purchase/restore.
  | 'reconciling'
  // Backend confirmed the entitlement; the screen may dismiss.
  | 'reconciled';

export interface PaywallState {
  status: PaywallStatus;
  /** Free-text failure message from the store/SDK, shown in the failed state. */
  failureMessage?: string;
}

export type PaywallEvent =
  | { type: 'offerings_loaded'; hasPackages: boolean }
  | { type: 'offerings_failed' }
  | { type: 'select_purchase' }
  | {
      type: 'purchase_outcome';
      outcome: 'purchased' | 'canceled' | 'pending' | 'failed';
      message?: string;
    }
  | { type: 'restore_outcome'; restored: boolean }
  | { type: 'start_reconcile' }
  | { type: 'reconcile_outcome'; entitled: boolean }
  | { type: 'reset' };

export const initialPaywallState: PaywallState = { status: 'loading' };

/**
 * Reduces the paywall state by one event. Pure — returns a new state object.
 */
export function reducePaywall(state: PaywallState, event: PaywallEvent): PaywallState {
  switch (event.type) {
    case 'offerings_loaded':
      return {
        status: event.hasPackages ? 'idle' : 'unavailable',
        failureMessage: undefined,
      };
    case 'offerings_failed':
      return { status: 'unavailable', failureMessage: undefined };
    case 'select_purchase':
      // Only allow starting a purchase from a non-terminal, non-busy state.
      if (state.status === 'idle' || state.status === 'canceled' || state.status === 'failed') {
        return { status: 'purchasing', failureMessage: undefined };
      }
      return state;
    case 'purchase_outcome': {
      if (state.status !== 'purchasing') return state;
      switch (event.outcome) {
        case 'purchased':
          // Move to reconciliation — never unlock on the callback alone.
          return { status: 'reconciling', failureMessage: undefined };
        case 'canceled':
          return { status: 'canceled', failureMessage: undefined };
        case 'pending':
          return { status: 'pending', failureMessage: undefined };
        case 'failed':
          return { status: 'failed', failureMessage: event.message };
      }
      return state;
    }
    case 'restore_outcome':
      // Restore always moves to reconciliation so the backend confirms.
      return { status: 'reconciling', failureMessage: undefined };
    case 'start_reconcile':
      if (state.status === 'purchasing' || state.status === 'restored') {
        return { status: 'reconciling', failureMessage: undefined };
      }
      return state;
    case 'reconcile_outcome':
      if (state.status !== 'reconciling') return state;
      return event.entitled
        ? { status: 'reconciled', failureMessage: undefined }
        : { status: 'failed', failureMessage: undefined };
    case 'reset':
      return { status: 'idle', failureMessage: undefined };
    default:
      return state;
  }
}

/**
 * Whether the paywall should auto-dismiss. True only after backend
 * reconciliation confirms the entitlement.
 */
export function shouldDismissPaywall(state: PaywallState): boolean {
  return state.status === 'reconciled';
}

/**
 * Whether a purchase/restore action is currently in flight and the UI should
 * disable its call-to-action.
 */
export function isPaywallBusy(state: PaywallState): boolean {
  return (
    state.status === 'purchasing' ||
    state.status === 'pending' ||
    state.status === 'reconciling' ||
    state.status === 'loading'
  );
}
