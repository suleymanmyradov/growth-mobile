/**
 * Composer — the conversation text input + send/stop control.
 *
 * Paper (`mobile.md` §8.4): composer follows keyboard insets and remains
 * usable with large text. Exposes Send while idle and Stop while streaming.
 * The composer is a controlled input; the owning screen owns the streaming
 * state and passes `isStreaming` to toggle the trailing control.
 */
import { ArrowUp, Square } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { useTheme } from '@/design-system/theme';

export interface ComposerProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onStop?: () => void;
  isStreaming: boolean;
  disabled?: boolean;
  /** Optional placeholder text. */
  placeholder?: string;
}

export function Composer({
  value,
  onChangeText,
  onSend,
  onStop,
  isStreaming,
  disabled,
  placeholder,
}: ComposerProps): ReactNode {
  const { colors, spacing, radius, typography } = useTheme();
  const { t } = useTranslation();
  const canSend = value.trim().length > 0 && !disabled && !isStreaming;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: spacing.sm,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.sm,
        borderTopColor: colors.border,
        borderTopWidth: StyleSheet.hairlineWidth,
        backgroundColor: colors.background,
      }}
    >
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? t('coach.composerPlaceholder')}
        placeholderTextColor={colors.mutedForeground}
        multiline
        editable={!disabled}
        accessibilityLabel={t('coach.composerLabel')}
        style={{
          flex: 1,
          color: colors.foreground,
          backgroundColor: colors.surface,
          borderColor: colors.input,
          borderWidth: 1,
          borderRadius: radius.field,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          fontSize: typography.fontSize.md,
          minHeight: 48,
          maxHeight: 120,
        }}
      />
      {isStreaming ? (
        <Pressable
          onPress={onStop}
          accessibilityRole="button"
          accessibilityLabel={t('coach.stop')}
          hitSlop={8}
          style={[
            styles.action,
            { backgroundColor: colors.mutedForeground, borderRadius: radius.field },
          ]}
        >
          <Square color={colors.background} size={20} />
        </Pressable>
      ) : (
        <Pressable
          onPress={canSend ? onSend : undefined}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel={t('coach.send')}
          hitSlop={8}
          style={[
            styles.action,
            {
              backgroundColor: canSend ? colors.accent : colors.input,
              borderRadius: radius.field,
            },
          ]}
        >
          <ArrowUp color={canSend ? colors.accentForeground : colors.mutedForeground} size={20} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  action: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
