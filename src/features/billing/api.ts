/**
 * Billing API — overview (plans, subscription, entitlements), checkout, portal,
 * and upgrade-event tracking.
 *
 * The Coach tab uses entitlements to render the entitlement/usage banner and
 * gate personalized AI. The paywall (Phase I) uses RevenueCat for native
 * digital subscriptions and reconciles entitlement via `getBillingOverview`;
 * the checkout/portal endpoints remain available for the web app's Stripe
 * flow and are exposed here for completeness. Upgrade events are tracked to
 * the backend for analytics.
 */
import { apiRequest } from '@/core/api/client';
import { billingEndpoints } from '@/core/api/endpoints';
import {
  BillingOverviewResponseSchema,
  CreateCheckoutSessionResponseSchema,
  CreateCustomerPortalSessionResponseSchema,
  TrackUpgradeEventResponseSchema,
  type BillingOverviewResponse,
  type CreateCheckoutSessionRequest,
  type CreateCheckoutSessionResponse,
  type CreateCustomerPortalSessionResponse,
  type TrackUpgradeEventRequest,
  type TrackUpgradeEventResponse,
} from '@/core/api/schemas';

export type {
  BillingOverviewResponse,
  CreateCheckoutSessionRequest,
  CreateCheckoutSessionResponse,
  CreateCustomerPortalSessionResponse,
  Entitlements,
  Plan,
  TrackUpgradeEventRequest,
  TrackUpgradeEventResponse,
  UserSubscription,
} from '@/core/api/schemas';

export async function getBillingOverview(): Promise<BillingOverviewResponse> {
  const response = await apiRequest<unknown>({ method: 'GET', url: billingEndpoints.overview });
  return BillingOverviewResponseSchema.parse(response);
}

export async function createCheckoutSession(
  request: CreateCheckoutSessionRequest,
): Promise<CreateCheckoutSessionResponse> {
  const response = await apiRequest<unknown>({
    method: 'POST',
    url: billingEndpoints.checkout,
    data: request,
  });
  return CreateCheckoutSessionResponseSchema.parse(response);
}

export async function createCustomerPortalSession(): Promise<CreateCustomerPortalSessionResponse> {
  const response = await apiRequest<unknown>({ method: 'POST', url: billingEndpoints.portal });
  return CreateCustomerPortalSessionResponseSchema.parse(response);
}

export async function trackUpgradeEvent(
  request: TrackUpgradeEventRequest,
): Promise<TrackUpgradeEventResponse> {
  const response = await apiRequest<unknown>({
    method: 'POST',
    url: billingEndpoints.upgradeEvents,
    data: request,
  });
  return TrackUpgradeEventResponseSchema.parse(response);
}
