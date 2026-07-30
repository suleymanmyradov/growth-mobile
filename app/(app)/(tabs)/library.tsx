import { EmptyState, Screen } from '@/design-system';
import { useTranslation } from 'react-i18next';

/**
 * Library tab route (thin wrapper).
 *
 * Phase D: shell placeholder. The Library composition (Explore, Saved,
 * Templates, People segments, and search) is built in Phase F, composing
 * public surfaces from `features/articles`, `features/saved`, `features/search`
 * while those domains keep separate feature ownership. This route file stays
 * thin and contains no business logic.
 */
export default function LibraryRoute() {
  const { t } = useTranslation();
  return (
    <Screen>
      <EmptyState title={t('tabs.library')} subtitle={t('common.comingLater')} />
    </Screen>
  );
}
