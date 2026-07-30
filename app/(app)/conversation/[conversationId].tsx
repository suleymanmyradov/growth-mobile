import { EmptyState, Screen } from '@/design-system';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

/**
 * Conversation stack route (pushed coaching screen).
 *
 * Phase D: shell placeholder. Phase H implements conversation history,
 * composer, streaming, cancellation, retry, and keyboard states, and reads the
 * `conversationId` route param. The `conversationId` is validated as a UUID by
 * the deep-link layer before routing; this wrapper stays thin and contains no
 * business logic.
 */
export default function ConversationRoute() {
  const router = useRouter();
  const { t } = useTranslation();
  return (
    <Screen title={t('screens.conversation.title')} onBack={() => router.back()}>
      <EmptyState title={t('screens.conversation.title')} subtitle={t('common.comingLater')} />
    </Screen>
  );
}
