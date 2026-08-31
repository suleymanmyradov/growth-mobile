/**
 * MessageBubble — a single conversation message.
 *
 * Paper (`mobile.md` §8.4): user messages use a muted bubble; assistant
 * messages are visually quieter and need not use a bubble. Streaming partial
 * text renders the same way as a completed assistant message (no flicker).
 *
 * Actions: assistant messages have a Copy action; user messages have Copy,
 * Edit, and (for the last user message) Regenerate. Actions are 44-unit
 * targets rendered below the bubble.
 */
import { Copy, Pencil, RefreshCw } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/design-system';
import { useTheme } from '@/design-system/theme';

export interface MessageBubbleProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
  /** Optional accessibility label override (e.g. for streaming partials). */
  streaming?: boolean;
  /** Whether this is the last user message (enables Regenerate). */
  isLastUser?: boolean;
  /** Called when the user taps Copy on any message. */
  onCopy?: (content: string) => void;
  /** Called when the user taps Edit on a user message. */
  onEdit?: (content: string) => void;
  /** Called when the user taps Regenerate on the last user message. */
  onRegenerate?: () => void;
}

export function MessageBubble({
  role,
  content,
  streaming,
  isLastUser,
  onCopy,
  onEdit,
  onRegenerate,
}: MessageBubbleProps): ReactNode {
  const { t } = useTranslation();
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

  const showActions = !streaming && content.length > 0 && (onCopy || onEdit || onRegenerate);

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

      {showActions ? (
        <View style={[styles.actions, isUser ? styles.userActions : styles.assistantActions]}>
          {onCopy ? (
            <Pressable
              onPress={() => onCopy(content)}
              accessibilityRole="button"
              accessibilityLabel={t('common.copy')}
              hitSlop={8}
              style={styles.actionButton}
            >
              <Copy color={colors.mutedForeground} size={14} />
            </Pressable>
          ) : null}
          {isUser && onEdit ? (
            <Pressable
              onPress={() => onEdit(content)}
              accessibilityRole="button"
              accessibilityLabel={t('common.edit')}
              hitSlop={8}
              style={styles.actionButton}
            >
              <Pencil color={colors.mutedForeground} size={14} />
            </Pressable>
          ) : null}
          {isUser && isLastUser && onRegenerate ? (
            <Pressable
              onPress={onRegenerate}
              accessibilityRole="button"
              accessibilityLabel={t('coach.regenerate')}
              hitSlop={8}
              style={styles.actionButton}
            >
              <RefreshCw color={colors.mutedForeground} size={14} />
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: 4 },
  userWrap: { alignItems: 'flex-end' },
  assistantWrap: { alignItems: 'flex-start' },
  bubble: {},
  systemWrap: { paddingVertical: 8, alignItems: 'center' },
  actions: { flexDirection: 'row', gap: 4, paddingVertical: 2 },
  userActions: { justifyContent: 'flex-end' },
  assistantActions: { justifyContent: 'flex-start' },
  actionButton: { padding: 8, minHeight: 36, justifyContent: 'center' },
});
