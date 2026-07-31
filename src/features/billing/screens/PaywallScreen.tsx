/**
 * PaywallScreen — the limit-aware upgrade modal.
 *
 * Paper (`mobile.md` §8.9): presented from the limit the user reached; the
 * eyebrow identifies the real limit reason. Uses RevenueCat offerings and
 * localized store prices — never the illustrative HTML prices, never Stripe
 * Checkout, never a WebView. Shows a feature list, selectable packages,
 * Continue, Restore purchase, Terms, and Privacy. A purchase callback alone
 * does not unlock access: the entitlement is reconciled with the backend
 * (via the billing overview) before the paywall dismisses. Covers loading,
 * unavailable offerings, purchase pending, canceled, failed, restored, and
 * backend-reconciliation states.
 *
 * The `reason` route param is a validated limit identifier (never arbitrary
 * marketing copy). Unknown reasons fall back to a generic eyebrow.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Check, Lock } from 'lucide-react-native';
import { useEffect, useMemo, useReducer, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { getEnv } from '@/core/config/env';
import { Button, ErrorState, Screen, Skeleton, ThemedText } from '@/design-system';
import { useTheme } from '@/design-system/theme';

import {
  initialPaywallState,
  isPaywallBusy,
  reducePaywall,
  shouldDismissPaywall,
} from '../entitlement-reconciliation';
import {
  useOfferings,
  usePurchasePackage,
  useReconcileEntitlement,
  useRestorePurchases,
  useTrackUpgradeEvent,
} from '../hooks';

/** Validated limit reasons — the only values accepted via the `reason` param. */
const ALLOWED_REASONS = new Set([
  'ai_coach_limit',
  'goal_limit',
  'habit_limit',
  'weekly_review_limit',
  'plan_adjustment_limit',
  'general',
]);

function reasonKey(reason: string | undefined): string {
  return reason && ALLOWED_REASONS.has(reason) ? reason : 'general';
}

export function PaywallScreen(): React.ReactNode {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors, spacing, radius } = useTheme();
  const params = useLocalSearchParams<{ reason?: string }>();
  const reason = reasonKey(typeof params.reason === 'string' ? params.reason : undefined);

  const { data: offerings, isLoading } = useOfferings();
  const purchase = usePurchasePackage();
  const restore = useRestorePurchases();
  const reconcile = useReconcileEntitlement();
  const trackEvent = useTrackUpgradeEvent();

  const [state, dispatch] = useReducer(reducePaywall, initialPaywallState);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const packages = useMemo(() => offerings?.packages ?? [], [offerings]);

  // Derive the effective selection: the user's choice, or the first package as
  // a default. Avoids setState-in-effect for the default selection.
  const effectiveSelectedId = selectedId ?? packages[0]?.identifier ?? null;

  // When offerings load, drive the state machine.
  useEffect(() => {
    if (isLoading) return;
    dispatch({ type: 'offerings_loaded', hasPackages: packages.length > 0 });
  }, [isLoading, packages]);

  // Track that the paywall was viewed.
  useEffect(() => {
    trackEvent.mutate({
      eventType: 'prompt_viewed',
      surface: 'paywall',
      trigger: reason,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reconcile after a purchase/restore moves us into the reconciling state.
  useEffect(() => {
    if (state.status !== 'reconciling') return;
    let cancelled = false;
    (async () => {
      try {
        const entitled = await reconcile.mutateAsync();
        if (!cancelled) dispatch({ type: 'reconcile_outcome', entitled });
      } catch {
        if (!cancelled) dispatch({ type: 'reconcile_outcome', entitled: false });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [state.status, reconcile]);

  // Auto-dismiss once the backend confirms the entitlement.
  useEffect(() => {
    if (shouldDismissPaywall(state)) {
      router.dismiss();
    }
  }, [state, router]);

  const handlePurchase = async () => {
    const pkg = packages.find((p) => p.identifier === effectiveSelectedId);
    if (!pkg) return;
    dispatch({ type: 'select_purchase' });
    const outcome = await purchase.mutateAsync(pkg);
    dispatch({
      type: 'purchase_outcome',
      outcome: outcome.status,
      message: outcome.status === 'failed' ? outcome.message : undefined,
    });
    if (outcome.status === 'purchased') {
      trackEvent.mutate({
        eventType: 'purchase_completed',
        surface: 'paywall',
        planCode: pkg.productIdentifier,
      });
    }
  };

  const handleRestore = async () => {
    const result = await restore.mutateAsync();
    dispatch({ type: 'restore_outcome', restored: result.restored });
  };

  const openLegal = (url: string) => {
    if (url) void WebBrowser.openBrowserAsync(url);
  };

  const env = getEnv();
  const busy = isPaywallBusy(state);

  const eyebrow = useMemo(() => t(`paywall.reason.${reason}`), [reason, t]);

  return (
    <Screen title={t('screens.paywall.title')} onBack={() => router.dismiss()}>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}>
        {/* Eyebrow identifying the real limit reason */}
        <View style={{ gap: spacing.xs }}>
          <ThemedText variant="meta" style={{ color: colors.mutedForeground }}>
            {eyebrow}
          </ThemedText>
          <ThemedText variant="screenTitle">{t('paywall.title')}</ThemedText>
          <ThemedText variant="body" style={{ color: colors.mutedForeground }}>
            {t('paywall.subtitle')}
          </ThemedText>
        </View>

        {/* Feature list */}
        <View style={{ gap: spacing.sm }}>
          {(
            [
              'unlimitedHabits',
              'unlimitedGoals',
              'personalizedAi',
              'weeklyReview',
              'planAdjustments',
            ] as const
          ).map((feature) => (
            <View
              key={feature}
              style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: colors.accent + '1A',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Check color={colors.accent} size={16} />
              </View>
              <ThemedText variant="body">{t(`paywall.feature.${feature}`)}</ThemedText>
            </View>
          ))}
        </View>

        {/* Packages / states */}
        {isLoading ? (
          <View style={{ gap: spacing.sm }}>
            {[0, 1].map((i) => (
              <Skeleton key={i} style={{ height: 64 }} radius={radius.field} />
            ))}
          </View>
        ) : packages.length === 0 ? (
          <ErrorState message={t('paywall.unavailable')} onRetry={() => {}} />
        ) : (
          <View style={{ gap: spacing.sm }}>
            {packages.map((pkg) => {
              const selected = pkg.identifier === effectiveSelectedId;
              return (
                <Pressable
                  key={pkg.identifier}
                  onPress={() => setSelectedId(pkg.identifier)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={pkg.title}
                  style={[
                    styles.package,
                    {
                      borderColor: selected ? colors.accent : colors.border,
                      backgroundColor: selected ? colors.accent + '0D' : colors.surface,
                      borderRadius: radius.field,
                    },
                  ]}
                >
                  <View style={{ flex: 1, gap: 2 }}>
                    <ThemedText variant="label">{pkg.title}</ThemedText>
                    <ThemedText variant="caption" style={{ color: colors.mutedForeground }}>
                      {pkg.priceString} {pkg.currencyCode}
                    </ThemedText>
                  </View>
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      borderWidth: 2,
                      borderColor: selected ? colors.accent : colors.border,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {selected ? (
                      <View
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: colors.accent,
                        }}
                      />
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Status messaging */}
        {state.status === 'canceled' ? (
          <ThemedText variant="caption" style={{ color: colors.mutedForeground }}>
            {t('paywall.canceled')}
          </ThemedText>
        ) : null}
        {state.status === 'pending' ? (
          <ThemedText variant="caption" style={{ color: colors.mutedForeground }}>
            {t('paywall.pending')}
          </ThemedText>
        ) : null}
        {state.status === 'failed' ? (
          <ThemedText variant="caption" style={{ color: colors.destructive }}>
            {state.failureMessage || t('paywall.failed')}
          </ThemedText>
        ) : null}
        {state.status === 'reconciling' ? (
          <ThemedText variant="caption" style={{ color: colors.mutedForeground }}>
            {t('paywall.reconciling')}
          </ThemedText>
        ) : null}

        {/* Actions */}
        <View style={{ gap: spacing.sm }}>
          <Button
            fullWidth
            size="lg"
            loading={busy}
            disabled={packages.length === 0 || busy}
            onPress={handlePurchase}
            accessibilityLabel={t('paywall.continue')}
          >
            {t('paywall.continue')}
          </Button>
          <Button
            variant="ghost"
            fullWidth
            loading={restore.isPending}
            disabled={busy}
            onPress={handleRestore}
            accessibilityLabel={t('paywall.restore')}
          >
            {t('paywall.restore')}
          </Button>
        </View>

        {/* Billing copy + legal links */}
        <View style={{ gap: spacing.xs, alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
            <Lock color={colors.mutedForeground} size={12} />
            <ThemedText variant="caption" style={{ color: colors.mutedForeground }}>
              {t('paywall.billingCopy')}
            </ThemedText>
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            {env.EXPO_PUBLIC_TERMS_URL ? (
              <Pressable onPress={() => openLegal(env.EXPO_PUBLIC_TERMS_URL)} hitSlop={8}>
                <ThemedText variant="caption" style={{ color: colors.accent }}>
                  {t('paywall.terms')}
                </ThemedText>
              </Pressable>
            ) : null}
            {env.EXPO_PUBLIC_PRIVACY_URL ? (
              <Pressable onPress={() => openLegal(env.EXPO_PUBLIC_PRIVACY_URL)} hitSlop={8}>
                <ThemedText variant="caption" style={{ color: colors.accent }}>
                  {t('paywall.privacy')}
                </ThemedText>
              </Pressable>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  package: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    minHeight: 64,
  },
});
