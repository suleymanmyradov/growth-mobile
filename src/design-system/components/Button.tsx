/**
 * Button component with semantic variants and theme-aware colors.
 *
 * - Minimum 44×44 touch target (accessibility).
 * - `loading` state disables interaction and shows a spinner.
 * - `disabled` state reduces opacity.
 * - Accessibility label, role, and hint supported via props.
 */
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type TextProps,
  type ViewProps,
} from 'react-native';

import { useTheme } from '../theme/theme';
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
    primary: { bg: colors.primary, text: colors.background, border: 'transparent' },
    secondary: { bg: colors.surface, text: colors.primaryText, border: colors.border },
    outline: { bg: 'transparent', text: colors.primary, border: colors.primary },
    ghost: { bg: 'transparent', text: colors.primary, border: 'transparent' },
    destructive: { bg: colors.error, text: '#FFFFFF', border: 'transparent' },
  };

  const sizeStyles = {
    sm: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      fontSize: typography.fontSize.sm,
    },
    md: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      fontSize: typography.fontSize.md,
    },
    lg: {
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.xl,
      fontSize: typography.fontSize.lg,
    },
  };

  const vs = variantStyles[variant];
  const ss = sizeStyles[size];

  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={[
        styles.base,
        {
          backgroundColor: vs.bg,
          borderColor: vs.border,
          borderWidth: vs.border === 'transparent' ? 0 : 1,
          borderRadius: radius.md,
          paddingVertical: ss.paddingVertical,
          paddingHorizontal: ss.paddingHorizontal,
          opacity: isDisabled ? 0.5 : 1,
          alignSelf: fullWidth ? 'stretch' : 'auto',
        },
      ]}
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
    minHeight: 44, // Minimum touch target
    flexDirection: 'row',
  },
});
