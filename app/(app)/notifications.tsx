import { NotificationsScreen } from '@/features/notifications/screens/NotificationsScreen';

/**
 * Notifications stack route (presented as a form sheet).
 *
 * Phase I: renders the notification sheet — list with unread/read styling,
 * "Mark all read", and allowlisted navigation to validated destinations. Per
 * `mobile.md` §6/§8.10, notifications are presented as a sheet even though
 * Expo Router uses a route to make it deep-linkable/testable. This route file
 * stays thin and contains no business logic.
 */
export default function NotificationsRoute() {
  return <NotificationsScreen />;
}
