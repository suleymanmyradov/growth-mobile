/**
 * Chip — a selectable pill used for filters and category selection.
 *
 * Paper (`mobile.md` §7): pill radius, 44-unit touch target, accent when
 * selected, hairline border when not. Press feedback via opacity/ripple.
 */
import type { ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, type ViewProps } from 'react-native';

import { useAndroidRipple } from '../theme/use-press-feedback';
import { useTheme } from '../theme/theme';
import { ThemedText } from './ThemedText';

export type ChipProps = Omit<ViewProps, 'style'> & {
  children: ReactNode;
  selected?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
};

export function Chip({
  children,
  selected = false,
  disabled = false,
  onPress,
  accessibilityLabel,
  ...rest
}: ChipProps): ReactNode {
  const { colors, radius, spacing } = useTheme();
  const isDisabled = disabled;
  const ripple = useAndroidRipple(selected ? colors.accent : `${colors.foreground}14`);

  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled: isDisabled }}
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: selected ? colors.accent : 'transparent',
          borderColor: selected ? colors.accent : colors.border,
          borderWidth: 1,
          borderRadius: radius.pill,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          minHeight: 44,
          opacity: isDisabled ? 0.5 : pressed && Platform.OS === 'ios' ? 0.6 : 1,
        },
      ]}
      {...ripple}
      {...rest}
    >
      <ThemedText
        variant="label"
        style={{ color: selected ? colors.accentForeground : colors.foreground }}
      >
        {children}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
});
