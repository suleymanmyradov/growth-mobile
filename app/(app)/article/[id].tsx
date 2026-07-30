import { EmptyState, Screen } from '@/design-system';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

/**
 * Article detail stack route (pushed content screen).
 *
 * Phase D: shell placeholder. Phase F implements the article reader (markdown
 * style map, image caching, like/share/save, reader size, scroll restoration)
 * and reads the `id` route param. The `id` is validated as a UUID by the
 * deep-link layer before routing; this wrapper stays thin and contains no
 * business logic.
 */
export default function ArticleRoute() {
  const router = useRouter();
  const { t } = useTranslation();
  return (
    <Screen title={t('screens.article.title')} onBack={() => router.back()}>
      <EmptyState title={t('screens.article.title')} subtitle={t('common.comingLater')} />
    </Screen>
  );
}
