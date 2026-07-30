/**
 * Border radius tokens (Paper).
 *
 * Canonical scale from `mobile.md` §5.3 / §1l handoff:
 * - `field` 8: inputs and fields.
 * - `card` 12: in-flow cards.
 * - `sheet` 20: bottom sheets and modals.
 * - `pill` 999: pills and fully-round elements.
 *
 * Deprecated t-shirt aliases are kept so existing code compiles during the
 * redesign migration; new code uses the semantic names. Removed in Phase J.
 */
export type RadiusScale = {
  field: 8;
  card: 12;
  sheet: 20;
  pill: 999;
  /** @deprecated use `field`. */
  sm: 8;
  /** @deprecated use `field`. */
  md: 8;
  /** @deprecated use `card`. */
  lg: 12;
  /** @deprecated use `card`. */
  xl: 12;
  /** @deprecated use `pill`. */
  full: 999;
};

export type RadiusTokens = RadiusScale;

export const radius: RadiusTokens = {
  field: 8,
  card: 12,
  sheet: 20,
  pill: 999,
  sm: 8,
  md: 8,
  lg: 12,
  xl: 12,
  full: 999,
};
