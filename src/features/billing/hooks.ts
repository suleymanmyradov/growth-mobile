/**
 * Billing hooks — React Query queries and mutations.
 *
 * `useBillingOverview` powers the Coach entitlement/usage banner. The paywall
 * (Phase I) uses `useOfferings`, `usePurchasePackage`, and `useRestorePurchases`
 * against the RevenueCat adapter, and reconciles entitlement by refetching the
 * overview. `useTrackUpgradeEvent` records paywall analytics to the backend.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { billingKeys } from '@/core/query/query-keys';

import { getBillingOverview, trackUpgradeEvent } from './api';
import { getOfferings, purchasePackage, restorePurchases, type PaywallPackage } from './revenuecat';

export function useBillingOverview() {
  return useQuery({
    queryKey: billingKeys.overview(),
    queryFn: () => getBillingOverview(),
    staleTime: 60 * 1000,
  });
}

/**
 * Fetches RevenueCat offerings for the paywall. Returns an empty package list
 * when the SDK is unconfigured or no offerings exist (the paywall renders its
 * "unavailable offerings" state).
 */
export function useOfferings() {
  return useQuery({
    queryKey: billingKeys.offerings(),
    queryFn: () => getOfferings(),
    staleTime: 60 * 1000,
  });
}

/**
 * Purchases a RevenueCat package. Callers inspect the returned outcome to drive
 * the reconciliation state machine — a `purchased` outcome must be followed by a
 * backend entitlement refresh before unlocking access.
 */
export function usePurchasePackage() {
  return useMutation({
    mutationFn: (pkg: PaywallPackage) => purchasePackage(pkg),
  });
}

/**
 * Restores previous purchases. Returns whether any active entitlement was found
 * in the restored customer info; the caller still reconciles with the backend.
 */
export function useRestorePurchases() {
  return useMutation({
    mutationFn: () => restorePurchases(),
  });
}

/**
 * Tracks a paywall upgrade event to the backend for analytics. Best-effort —
 * errors are swallowed so analytics never block the paywall flow.
 */
export function useTrackUpgradeEvent() {
  return useMutation({
    mutationFn: trackUpgradeEvent,
    // Analytics must never block the purchase flow.
    retry: false,
  });
}

/**
 * Refetches the billing overview and returns whether the user is now entitled
 * to personalized AI. Used by the paywall to reconcile after a purchase/restore.
 */
export function useReconcileEntitlement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const overview = await queryClient.fetchQuery({
        queryKey: billingKeys.overview(),
        queryFn: () => getBillingOverview(),
        staleTime: 0,
      });
      return overview.entitlements.canUsePersonalizedAi;
    },
  });
}
