/**
 * NotificationsScreen — the notification sheet content.
 *
 * Paper (`mobile.md` §8.10): opens as a native sheet from Today's bell; header
 * includes "Mark all read"; unread rows use an accent dot plus stronger text,
 * read rows use muted text; tapping a row routes only through the validated
 * internal-route allowlist. Skeleton/empty/error states are implemented.
 *
 * Domain boundary: composition screen in `features/notifications`. Imports
 * only its own components and the shared deep-link allowlist. Does not import
 * other features.
 */
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError } from '@/core/api/errors';
import type { Notification } from '@/core/api/schemas';
import { EmptyState, ErrorState, Skeleton, ThemedText } from '@/design-system';
import { useTheme } from '@/design-system/theme';

import { NotificationRow } from '../components/NotificationRow';
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from '../hooks';
import { notificationToRoute } from '../notification-destination';

export function NotificationsScreen(): React.ReactNode {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors, spacing } = useTheme();
  // `reason` is reserved for future deep-link context; unused for now but kept
  // so the route accepts the param without a console warning.
  useLocalSearchParams<{ reason?: string }>();

  const {
    data: notifications,
    isLoading,
    isError,
    error,
    refetch,
  } = useNotifications({ limit: 50 });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const handlePress = (notification: Notification) => {
    // Mark read optimistically (no-op if already read).
    if (!notification.read) {
      markRead.mutate(notification.id);
    }
    const route = notificationToRoute(notification);
    if (route) {
      // The allowlist returns a validated Expo Router path; cast to the typed
      // href since the route string is built dynamically from the allowlist.
      router.push(route as Parameters<typeof router.push>[0]);
    } else {
      // Unmapped/unknown type — fall back to a safe dismissal (Today tab).
      router.dismiss();
    }
  };

  const handleMarkAllRead = () => {
    markAllRead.mutate();
  };

  const hasUnread = (notifications ?? []).some((n) => !n.read);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View
        style={[
          styles.header,
          {
            paddingHorizontal: spacing.xl,
            borderBottomColor: colors.border,
            borderBottomWidth: StyleSheet.hairlineWidth,
          },
        ]}
      >
        <ThemedText variant="sectionTitle">{t('screens.notifications.title')}</ThemedText>
        <Pressable
          onPress={handleMarkAllRead}
          disabled={!hasUnread || markAllRead.isPending}
          accessibilityRole="button"
          accessibilityLabel={t('notifications.markAllRead')}
          hitSlop={8}
          style={{ padding: 8, minHeight: 44, justifyContent: 'center' }}
        >
          <ThemedText
            variant="label"
            style={{
              color: hasUnread ? colors.accent : colors.mutedForeground,
            }}
          >
            {t('notifications.markAllRead')}
          </ThemedText>
        </Pressable>
      </View>

      <FlashList
        data={notifications ?? []}
        renderItem={({ item }) => <NotificationRow notification={item} onPress={handlePress} />}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.accent} />
        }
        ListEmptyComponent={
          isError ? (
            <ErrorState
              message={error instanceof ApiError ? error.message : t('common.errorGeneric')}
              onRetry={refetch}
            />
          ) : isLoading ? (
            <View
              style={{ paddingHorizontal: spacing.xl, gap: spacing.sm, paddingTop: spacing.sm }}
            >
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} style={{ height: 64 }} radius={12} />
              ))}
            </View>
          ) : (
            <EmptyState
              title={t('notifications.emptyTitle')}
              subtitle={t('notifications.emptyBody')}
            />
          )
        }
        contentContainerStyle={{ paddingBottom: spacing.xl }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
});
