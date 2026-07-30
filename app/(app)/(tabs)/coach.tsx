import { EmptyState, Screen } from '@/design-system';
import { useTranslation } from 'react-i18next';

/**
 * Coach tab route (thin wrapper).
 *
 * Phase D: shell placeholder. The conversation list/new conversation surface
 * is built in Phase H. This route file stays thin and contains no business
 * logic.
 */
export default function CoachRoute() {
  const { t } = useTranslation();
  return (
    <Screen>
      <EmptyState title={t('tabs.coach')} subtitle={t('common.comingLater')} />
    </Screen>
  );
}
