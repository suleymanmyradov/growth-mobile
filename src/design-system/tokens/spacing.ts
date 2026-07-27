/**
 * Spacing scale tokens.
 *
 * A single named scale keeps padding, margins, and gaps consistent across the
 * app. Values are in React Native density-independent pixels (dp).
 */

export type SpacingScale = {
  xs: 4;
  sm: 8;
  md: 16;
  lg: 24;
  xl: 32;
  xxl: 48;
};

export type SpacingTokens = SpacingScale;

export const spacing: SpacingTokens = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};
