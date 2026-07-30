/**
 * Spacing scale tokens (Paper).
 *
 * A single named scale keeps padding, margins, and gaps consistent across the
 * app. Values are in React Native density-independent pixels (dp).
 *
 * Layout rules from `mobile.md` §5.3:
 * - Screen gutter: 20 (`xl`); onboarding/auth may use 24.
 * - Card padding: 16 (`lg`).
 * - Row group gap: 12 (`md`).
 * - Major group gap: 28 (`xxl`).
 */
export type SpacingScale = {
  xs: 4;
  sm: 8;
  md: 12;
  lg: 16;
  xl: 20;
  xxl: 28;
  xxxl: 40;
};

export type SpacingTokens = SpacingScale;

export const spacing: SpacingTokens = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
};
