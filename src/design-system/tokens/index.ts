/**
 * Barrel export for all design tokens.
 */
export type { ColorTokens } from './colors';
export type { DurationScale, DurationTokens } from './motion';
export type { RadiusTokens } from './radius';
export type { SpacingTokens } from './spacing';
export type {
  FontFamily,
  FontFamilyName,
  FontWeightScale,
  LineHeightScale,
  TextStyleSpec,
  TextStyleVariant,
  TypographyTokens,
} from './typography';

export { darkColors, lightColors } from './colors';
export { duration, hitSlop } from './motion';
export { radius } from './radius';
export { spacing } from './spacing';
export { fontFamily, resolveTextStyle, textStyles, typography } from './typography';
