/**
 * MessageBubble — a single conversation message.
 *
 * Paper (`mobile.md` §8.4): user messages use a muted bubble; assistant
 * messages are visually quieter and need not use a bubble. Streaming partial
 * text renders the same way as a completed assistant message (no flicker).
 */
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/design-system';
import { useTheme } from '@/design-system/theme';

export interface MessageBubbleProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
  /** Optional accessibility label override (e.g. for streaming partials). */
  streaming?: boolean;
}

export function MessageBubble({ role, content, streaming }: MessageBubbleProps): ReactNode {
  const { colors, spacing, radius } = useTheme();
  const isUser = role === 'user';

  if (role === 'system') {
    // System messages are rare and rendered as quiet centered text.
    return (
      <View style={styles.systemWrap}>
        <ThemedText
          variant="caption"
          style={{ color: colors.mutedForeground, textAlign: 'center' }}
        >
          {content}
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.wrap, isUser ? styles.userWrap : styles.assistantWrap]}>
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: isUser ? colors.surface : 'transparent',
            borderColor: isUser ? colors.border : 'transparent',
            borderWidth: isUser ? 1 : 0,
            borderRadius: radius.card,
            paddingHorizontal: isUser ? spacing.md : 0,
            paddingVertical: isUser ? spacing.sm : 0,
            maxWidth: '85%',
          },
        ]}
      >
        <ThemedText
          variant="body"
          style={{ color: isUser ? colors.foreground : colors.mutedForeground }}
          accessibilityLabel={streaming ? 'Assistant is typing' : undefined}
        >
          {content}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: 4 },
  userWrap: { alignItems: 'flex-end' },
  assistantWrap: { alignItems: 'flex-start' },
  bubble: {},
  systemWrap: { paddingVertical: 8, alignItems: 'center' },
});
