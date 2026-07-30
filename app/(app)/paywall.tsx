import { EmptyState, Screen } from '@/design-system';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

/**
 * Paywall modal route.
 *
 * Phase D: shell placeholder. Phase I implements the limit-aware paywall with
 * RevenueCat offerings and backend entitlement reconciliation. Per `mobile.md`
 * §6, the paywall receives a validated reason/limit identifier — never arbitrary
 * marketing copy through route params. This route file stays thin and contains
 * no business logic.
 */
export default function PaywallRoute() {
  const router = useRouter();
  const { t } = useTranslation();
  return (
    <Screen title={t('screens.paywall.title')} onBack={() => router.back()}>
      <EmptyState title={t('screens.paywall.title')} subtitle={t('common.comingLater')} />
    </Screen>
  );
}
