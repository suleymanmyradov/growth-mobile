/**
 * RevenueCat adapter — a thin typed wrapper over `react-native-purchases`.
 *
 * Per `mobile.md` §8.9: native digital subscriptions use RevenueCat offerings and
 * localized store prices (StoreKit/Google Play Billing), never Stripe Checkout
 * or a WebView. A purchase callback alone does not unlock access — the backend
 * reconciles entitlement via the RevenueCat webhook, and the client refetches
 * the billing overview before treating the user as entitled.
 *
 * The SDK is configured with the public RevenueCat keys from `core/config/env`.
 * When no platform key is configured (org blocker), offerings resolve to empty
 * and purchase/restore no-op so the paywall renders its "unavailable offerings"
 * state gracefully. No purchase data, tokens, or personal data is logged.
 *
 * This adapter exposes a small typed surface (`PaywallPackage` view models) so
 * the paywall screen and the reconciliation state machine do not depend on the
 * SDK's internal types directly.
 */
import { Platform } from 'react-native';
import type { CustomerInfo, PurchasesOfferings, PurchasesPackage } from 'react-native-purchases';
import Purchases, { LOG_LEVEL, PURCHASES_ERROR_CODE } from 'react-native-purchases';

import { getEnv } from '@/core/config/env';

/** A flattened, SDK-agnostic view of a purchasable package for the paywall. */
export interface PaywallPackage {
  /** RevenueCat package identifier (e.g. `$rc_monthly`, `$rc_annual`). */
  identifier: string;
  /** Human-readable title from the store product. */
  title: string;
  /** Store-localized price string (e.g. "$9.99"). */
  priceString: string;
  /** Currency code (e.g. "USD"). */
  currencyCode: string;
  /** Product identifier in the store. */
  productIdentifier: string;
  /** The raw SDK package, retained to pass back to `purchasePackage`. */
  raw: PurchasesPackage;
}

/** A flattened view of an offering's packages. */
export interface PaywallOfferings {
  packages: PaywallPackage[];
}

let configured = false;

/**
 * Configures the RevenueCat SDK. Safe to call multiple times. No-ops when no
 * platform API key is configured (org blocker) — callers should treat the
 * paywall as having no offerings in that case.
 */
export function configureRevenueCat(): void {
  if (configured) return;
  const env = getEnv();
  const apiKey =
    Platform.OS === 'ios'
      ? env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY
      : env.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY;
  if (!apiKey) {
    // No platform key configured — push delivery/purchases unavailable.
    return;
  }
  try {
    Purchases.configure({ apiKey });
    // Avoid verbose logging in production; debug only.
    if (__DEV__) {
      void Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    } else {
      void Purchases.setLogLevel(LOG_LEVEL.WARN);
    }
    configured = true;
  } catch {
    // Configuration failed — paywall will render unavailable state.
    configured = false;
  }
}

function toPaywallPackage(pkg: PurchasesPackage): PaywallPackage {
  return {
    identifier: pkg.identifier,
    title: pkg.product.title,
    priceString: pkg.product.priceString,
    currencyCode: pkg.product.currencyCode,
    productIdentifier: pkg.product.identifier,
    raw: pkg,
  };
}

/**
 * Fetches the current offerings. Returns an empty package list when the SDK is
 * unconfigured or no offerings are available. Never throws — callers render the
 * "unavailable offerings" state on empty.
 */
export async function getOfferings(): Promise<PaywallOfferings> {
  configureRevenueCat();
  if (!configured) return { packages: [] };
  try {
    const offerings: PurchasesOfferings = await Purchases.getOfferings();
    const current = offerings.current;
    if (!current) return { packages: [] };
    return { packages: current.availablePackages.map(toPaywallPackage) };
  } catch {
    return { packages: [] };
  }
}

/** Outcome of a purchase attempt. */
export type PurchaseOutcome =
  | { status: 'purchased'; customerInfo: CustomerInfo }
  | { status: 'canceled' }
  | { status: 'pending' }
  | { status: 'failed'; message: string };

/**
 * Attempts to purchase a package. Maps SDK errors to a typed outcome:
 * canceled, pending, or failed. Never throws.
 */
export async function purchasePackage(pkg: PaywallPackage): Promise<PurchaseOutcome> {
  configureRevenueCat();
  if (!configured) {
    return { status: 'failed', message: 'Purchases are not configured.' };
  }
  try {
    const result = await Purchases.purchasePackage(pkg.raw);
    return { status: 'purchased', customerInfo: result.customerInfo };
  } catch (error) {
    return classifyPurchaseError(error);
  }
}

/**
 * Restores previous purchases. Returns whether any active entitlement was
 * found in the restored customer info. Never throws.
 */
export async function restorePurchases(): Promise<{
  restored: boolean;
  customerInfo: CustomerInfo | null;
}> {
  configureRevenueCat();
  if (!configured) return { restored: false, customerInfo: null };
  try {
    const customerInfo = await Purchases.restorePurchases();
    const hasActive = Object.keys(customerInfo.entitlements.active).length > 0;
    return { restored: hasActive, customerInfo };
  } catch (error) {
    return classifyRestoreError(error);
  }
}

function classifyPurchaseError(error: unknown): PurchaseOutcome {
  if (isPurchasesError(error)) {
    if (error.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
      return { status: 'canceled' };
    }
    // Some platforms report pending/deferred purchases via specific codes.
    if (
      error.code === PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR ||
      error.code === PURCHASES_ERROR_CODE.RECEIPT_ALREADY_IN_USE_ERROR
    ) {
      return { status: 'pending' };
    }
    return { status: 'failed', message: error.message };
  }
  return { status: 'failed', message: 'Purchase could not be completed.' };
}

function classifyRestoreError(_error: unknown): { restored: boolean; customerInfo: null } {
  // Restore failures are best-effort; surface as not restored.
  return { restored: false, customerInfo: null };
}

function isPurchasesError(
  error: unknown,
): error is { code: PURCHASES_ERROR_CODE; message: string } {
  return typeof error === 'object' && error !== null && 'code' in error && 'message' in error;
}
