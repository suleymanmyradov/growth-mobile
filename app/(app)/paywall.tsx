import { PaywallScreen } from '@/features/billing/screens/PaywallScreen';

/**
 * Paywall modal route.
 *
 * Phase I: renders the limit-aware paywall with RevenueCat offerings and
 * backend entitlement reconciliation. Per `mobile.md` §6/§8.9, the paywall
 * receives a validated `reason`/limit identifier — never arbitrary marketing
 * copy through route params. This route file stays thin and contains no
 * business logic.
 */
export default function PaywallRoute() {
  return <PaywallScreen />;
}
