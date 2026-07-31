/**
 * Pure helpers for the Me screen summary cards.
 *
 * Derives trustworthy metrics from already-fetched habits and goals. The Me
 * screen only shows a card when the underlying contract provides a real value
 * (no fabricated totals).
 */
import type { Goal, Habit } from '@/core/api/schemas';

export type MeSummary = {
  /** Number of goals (active + completed). */
  goalsCount: number;
  /** Number of habits. */
  habitsCount: number;
  /** Best (longest) current streak across habits, or 0 when there are none. */
  bestStreak: number;
};

/**
 * Derives the Me summary from habits and goals. Treats `undefined` lists as
 * "not loaded yet" and returns zeroes so the caller can decide whether to show
 * a card (it should not show fabricated values for unloaded data).
 */
export function deriveMeSummary(habits: Habit[] | undefined, goals: Goal[] | undefined): MeSummary {
  const habitsCount = habits?.length ?? 0;
  const goalsCount = goals?.length ?? 0;
  const bestStreak = habits?.reduce((max, h) => (h.streak > max ? h.streak : max), 0) ?? 0;
  return { goalsCount, habitsCount, bestStreak };
}
