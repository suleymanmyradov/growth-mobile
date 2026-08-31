/**
 * Public barrel for the billing feature.
 *
 * Exposes the overview/entitlements read path (Phase H), the RevenueCat-backed
 * paywall surface (Phase I), and the entitlement reconciliation state machine.
 */
export {
    createCheckoutSession,
    createCustomerPortalSession,
    getBillingOverview,
    trackUpgradeEvent
} from './api';
export type {
    BillingOverviewResponse,
    CreateCheckoutSessionRequest,
    CreateCheckoutSessionResponse,
    CreateCustomerPortalSessionResponse,
    Entitlements,
    Plan,
    TrackUpgradeEventRequest,
    TrackUpgradeEventResponse,
    UserSubscription
} from './api';
export { FeatureLock } from './components/FeatureLock';
export type { FeatureLockProps } from './components/FeatureLock';
export {
    initialPaywallState,
    isPaywallBusy,
    reducePaywall,
    shouldDismissPaywall,
    type PaywallEvent,
    type PaywallState,
    type PaywallStatus
} from './entitlement-reconciliation';
export {
    useBillingOverview,
    useOfferings,
    usePurchasePackage,
    useReconcileEntitlement,
    useRestorePurchases,
    useTrackUpgradeEvent
} from './hooks';
export type { PaywallOfferings, PaywallPackage } from './revenuecat';

