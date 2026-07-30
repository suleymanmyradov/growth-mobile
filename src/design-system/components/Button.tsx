/**
 * Button component with Paper semantic variants.
 *
 * Paper rules (`mobile.md` §7, §5.3):
 * - Medium buttons are 44 high, large 52. Small 36 only inside a ≥44 parent row.
 * - Press feedback: opacity on iOS, ripple on Android (`instant` 80 ms).
 * - `primary` uses the sage accent (the Paper action color), not the ink
 *   `primary` token, because sage is the single accent for primary actions.
 * - `loading` shows a spinner and disables interaction; `disabled` reduces
 *   opacity. Visual color is never the only state indicator.
 */
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  type TextProps,
  type ViewProps,
} from 'react-native';

import { useTheme } from '../theme/theme';
import { useAndroidRipple } from '../theme/use-press-feedback';
import { ThemedText } from './ThemedText';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = Omit<TextProps & ViewProps, 'style'> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  children,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  ...rest
}: ButtonProps): ReactNode {
  const { colors, spacing, radius, typography } = useTheme();
  const isDisabled = disabled || loading;

  const variantStyles: Record<ButtonVariant, { bg: string; text: string; border: string }> = {
    // Sage accent is the Paper primary action color.
    primary: { bg: colors.accent, text: colors.accentForeground, border: 'transparent' },
    secondary: { bg: colors.surface, text: colors.foreground, border: colors.border },
    outline: { bg: 'transparent', text: colors.accent, border: colors.accent },
    ghost: { bg: 'transparent', text: colors.foreground, border: 'transparent' },
    destructive: {
      bg: colors.destructive,
      text: colors.destructiveForeground,
      border: 'transparent',
    },
  };

  const sizeStyles: Record<
    ButtonSize,
    { pv: number; ph: number; fontSize: number; minHeight: number }
  > = {
    sm: { pv: spacing.sm, ph: spacing.md, fontSize: typography.fontSize.sm, minHeight: 36 },
    md: { pv: spacing.md, ph: spacing.lg, fontSize: typography.fontSize.md, minHeight: 44 },
    lg: { pv: spacing.lg, ph: spacing.xl, fontSize: typography.fontSize.md, minHeight: 52 },
  };

  const vs = variantStyles[variant];
  const ss = sizeStyles[size];
  const ripple = useAndroidRipple(
    vs.border === 'transparent' ? `${colors.foreground}14` : vs.border,
  );

  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: vs.bg,
          borderColor: vs.border,
          borderWidth: vs.border === 'transparent' ? 0 : 1,
          borderRadius: radius.field,
          paddingVertical: ss.pv,
          paddingHorizontal: ss.ph,
          minHeight: ss.minHeight,
          opacity: isDisabled ? 0.5 : pressed && Platform.OS === 'ios' ? 0.6 : 1,
          alignSelf: fullWidth ? 'stretch' : 'auto',
        },
      ]}
      {...ripple}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={vs.text} size="small" />
      ) : (
        <ThemedText
          style={{
            color: vs.text,
            fontSize: ss.fontSize,
            fontWeight: typography.fontWeight.semibold,
            textAlign: 'center',
          }}
        >
          {children}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
});
