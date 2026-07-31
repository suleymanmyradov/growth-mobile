/**
 * ConversationRow — a single conversation row in the Coach tab list.
 *
 * Paper: in-flow row with hairline separator, title, last message preview
 * (truncated), and relative timestamp. Tap navigates to the conversation
 * stack screen. Does not log message content.
 */
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Conversation } from '@/core/api/schemas';
import { ThemedText } from '@/design-system';
import { useTheme } from '@/design-system/theme';

export interface ConversationRowProps {
  conversation: Conversation;
  onPress: (conversation: Conversation) => void;
}

export function ConversationRow({ conversation, onPress }: ConversationRowProps): ReactNode {
  const { colors, spacing } = useTheme();
  const { t } = useTranslation();

  return (
    <Pressable
      onPress={() => onPress(conversation)}
      accessibilityRole="button"
      accessibilityLabel={t('coach.openConversation', { title: conversation.title })}
      style={({ pressed }) => [
        styles.row,
        {
          paddingHorizontal: spacing.xl,
          backgroundColor: pressed ? colors.surface : colors.background,
        },
      ]}
    >
      <View style={{ gap: spacing.xs, flex: 1 }}>
        <ThemedText variant="cardTitle" numberOfLines={1}>
          {conversation.title}
        </ThemedText>
        {conversation.lastMessage ? (
          <ThemedText variant="body" style={{ color: colors.mutedForeground }} numberOfLines={1}>
            {conversation.lastMessage}
          </ThemedText>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
