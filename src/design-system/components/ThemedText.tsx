/**
 * Text component that uses the theme's text color by default and maps a
 * `variant` prop to typography tokens.
 */
import type { ReactNode } from 'react';
import { Text, type TextProps } from 'react-native';

import type { Theme } from '../theme/theme';
import { useTheme } from '../theme/theme';

export type ThemedTextVariant = 'body' | 'heading' | 'caption' | 'label';

export type ThemedTextProps = TextProps & {
  variant?: ThemedTextVariant;
  children?: ReactNode;
};

/**
 * Maps a `ThemedTextVariant` to its concrete typography token values.
 */
function resolveVariant(theme: Theme, variant: ThemedTextVariant) {
  switch (variant) {
    case 'heading':
      return {
        fontSize: theme.typography.fontSize.xl,
        lineHeight: theme.typography.lineHeight.xl,
        fontWeight: theme.typography.fontWeight.bold,
      };
    case 'caption':
      return {
        fontSize: theme.typography.fontSize.xs,
        lineHeight: theme.typography.lineHeight.xs,
        fontWeight: theme.typography.fontWeight.regular,
      };
    case 'label':
      return {
        fontSize: theme.typography.fontSize.sm,
        lineHeight: theme.typography.lineHeight.sm,
        fontWeight: theme.typography.fontWeight.medium,
      };
    case 'body':
    default:
      return {
        fontSize: theme.typography.fontSize.md,
        lineHeight: theme.typography.lineHeight.md,
        fontWeight: theme.typography.fontWeight.regular,
      };
  }
}

/**
 * Theme-aware text. Defaults to the theme's `primaryText` color and the `body`
 * typography variant. Pass `variant` to switch between preset text styles.
 */
export function ThemedText({
  variant = 'body',
  style,
  children,
  ...rest
}: ThemedTextProps): ReactNode {
  const theme = useTheme();
  const resolved = resolveVariant(theme, variant);

  return (
    <Text style={[{ color: theme.colors.primaryText }, resolved, style]} {...rest}>
      {children}
    </Text>
  );
}
