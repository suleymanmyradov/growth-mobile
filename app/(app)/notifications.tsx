import { EmptyState, Screen } from '@/design-system';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

/**
 * Notifications stack route (presented as a sheet).
 *
 * Phase D: shell placeholder. Phase I implements the notification sheet
 * (unread/read-all, notification preferences, and allowlisted navigation to
 * validated destinations). Per `mobile.md` §6, notifications are presented as a
 * sheet even though Expo Router uses a route to make it deep-linkable/testable.
 * This route file stays thin and contains no business logic.
 */
export default function NotificationsRoute() {
  const router = useRouter();
  const { t } = useTranslation();
  return (
    <Screen title={t('screens.notifications.title')} onBack={() => router.back()}>
      <EmptyState title={t('screens.notifications.title')} subtitle={t('common.comingLater')} />
    </Screen>
  );
}
