/**
 * Motion and target tokens (Paper).
 *
 * From `mobile.md` §5.3:
 * - `instant` 80 ms: press feedback.
 * - `quick` 140 ms: colors, focus, selection.
 * - `base` 220 ms: check-in fill, row state, progress, collapsing header.
 * - `overlay` 260 ms: sheet, toast, and screen transition.
 * - `slow` 1600 ms: skeleton pulse and voice bars.
 *
 * Reduced motion sets movement durations to zero; opacity may remain at 140 ms
 * (handled in the reduced-motion hook, not here).
 */
export type DurationScale = {
  instant: 80;
  quick: 140;
  base: 220;
  overlay: 260;
  slow: 1600;
};

export type DurationTokens = DurationScale;

export const duration: DurationTokens = {
  instant: 80,
  quick: 140,
  base: 220,
  overlay: 260,
  slow: 1600,
};

/**
 * Minimum touch target. Interactive elements must be at least 44 × 44 dp.
 */
export const hitSlop = {
  minTarget: 44,
} as const;
