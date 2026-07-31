/**
 * NotificationRow — a single notification row in the notification sheet.
 *
 * Paper (`mobile.md` §8.10): unread rows use an accent dot plus stronger text;
 * read rows use muted text. Tapping routes only through the validated
 * internal-route allowlist (handled by the parent screen).
 */
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Notification } from '@/core/api/schemas';
import { ThemedText } from '@/design-system';
import { useTheme } from '@/design-system/theme';

export interface NotificationRowProps {
  notification: Notification;
  onPress: (notification: Notification) => void;
}

export function NotificationRow({ notification, onPress }: NotificationRowProps): ReactNode {
  const { colors } = useTheme();
  const unread = !notification.read;

  return (
    <Pressable
      onPress={() => onPress(notification)}
      accessibilityRole="button"
      accessibilityLabel={notification.title}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}
    >
      <View
        style={[
          styles.dot,
          {
            backgroundColor: unread ? colors.accent : 'transparent',
            borderColor: unread ? colors.accent : colors.border,
          },
        ]}
      />
      <View style={{ flex: 1, gap: 2 }}>
        <ThemedText
          variant="label"
          numberOfLines={1}
          style={{ color: unread ? colors.foreground : colors.mutedForeground }}
        >
          {notification.title}
        </ThemedText>
        <ThemedText
          variant="caption"
          numberOfLines={2}
          style={{ color: unread ? colors.foreground : colors.mutedForeground }}
        >
          {notification.message}
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    minHeight: 64,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    marginTop: 6,
  },
});
