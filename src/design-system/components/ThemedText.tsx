/**
 * Theme-aware text. Maps a `variant` prop to the Paper semantic text styles
 * (see `tokens/typography.ts` `textStyles`) and resolves the font family from
 * the loaded fonts (or system fallbacks before fonts load).
 *
 * `allowFontScaling` stays on (the React Native default) so Dynamic Type /
 * font scale up to 200% only makes rows taller. There is no fixed-height text
 * wrapper. New code uses the canonical `TextStyleVariant` names; `heading` is
 * kept as a deprecated alias for `sectionTitle`.
 */
import type { ReactNode } from 'react';
import { Text, type TextProps } from 'react-native';

import type { Theme } from '../theme/theme';
import { useTheme } from '../theme/theme';
import { resolveTextStyle, type TextStyleVariant } from '../tokens/typography';

export type ThemedTextVariant = TextStyleVariant | 'heading';

export type ThemedTextProps = TextProps & {
  variant?: ThemedTextVariant;
  children?: ReactNode;
};

/** Maps a (possibly legacy) variant to a canonical text style spec key. */
function normalizeVariant(variant: ThemedTextVariant): TextStyleVariant {
  if (variant === 'heading') {
    return 'sectionTitle';
  }
  return variant;
}

/**
 * Theme-aware text. Defaults to the theme's `foreground` color and the `body`
 * typography variant. Pass `variant` to switch between preset text styles.
 */
export function ThemedText({
  variant = 'body',
  style,
  children,
  ...rest
}: ThemedTextProps): ReactNode {
  const theme: Theme = useTheme();
  const spec = theme.textStyles[normalizeVariant(variant)];
  const fontRecipe = resolveTextStyle(spec, theme.fonts);

  return (
    <Text style={[{ color: theme.colors.foreground }, fontRecipe, style]} {...rest}>
      {children}
    </Text>
  );
}
