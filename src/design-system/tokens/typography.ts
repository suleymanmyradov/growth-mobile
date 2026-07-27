/**
 * Typography tokens.
 *
 * Centralizes font sizes, weights, and line heights so text styles stay
 * consistent and themeable across the app.
 */

export type FontSizeScale = {
  xs: 12;
  sm: 14;
  md: 16;
  lg: 20;
  xl: 24;
  xxl: 32;
};

export type FontWeightScale = {
  regular: '400';
  medium: '500';
  semibold: '600';
  bold: '700';
};

export type LineHeightScale = {
  xs: 16;
  sm: 20;
  md: 24;
  lg: 28;
  xl: 32;
  xxl: 40;
};

export type TypographyTokens = {
  fontSize: FontSizeScale;
  fontWeight: FontWeightScale;
  lineHeight: LineHeightScale;
};

export const typography: TypographyTokens = {
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
  },
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 28,
    xl: 32,
    xxl: 40,
  },
};
