/**
 * Pure grouping/filter helpers for the Plan composition.
 *
 * Extracted from the screen so the domain logic (nesting habits under goals,
 * finding untied habits, filtering by lifecycle state) is unit-testable without
 * rendering or mocking hooks. The screen imports these and keeps the rendering
 * concerns separate.
 */
import type { Goal, Habit } from '@/core/api/schemas';

export type Filter = 'all' | 'active' | 'completed';
export type SortBy = 'streak' | 'name';

/**
 * Unique habit categories from a list of habits, sorted alphabetically.
 */
export function getHabitCategories(habits: Habit[]): string[] {
  const set = new Set<string>();
  for (const h of habits) {
    if (h.category) set.add(h.category);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

/**
 * Filter and sort habits by category and sort key.
 * Mirrors the web frontend's `useHabitsFilters` logic.
 */
export function filterAndSortHabits(
  habits: Habit[],
  categoryFilter: string,
  sortBy: SortBy,
): Habit[] {
  let filtered = habits;
  if (categoryFilter !== 'all') {
    filtered = filtered.filter((h) => h.category === categoryFilter);
  }
  return [...filtered].sort((a, b) => {
    if (sortBy === 'streak') return b.streak - a.streak;
    return a.name.localeCompare(b.name);
  });
}

/**
 * Habits that are referenced by at least one goal's `relatedHabitIds`.
 */
export function getTiedHabitIds(goals: Goal[]): Set<string> {
  const ids = new Set<string>();
  for (const g of goals) {
    for (const id of g.relatedHabitIds ?? []) ids.add(id);
  }
  return ids;
}

/**
 * Habits not referenced by any goal.
 */
export function getUntiedHabits(habits: Habit[], goals: Goal[]): Habit[] {
  const tied = getTiedHabitIds(goals);
  return habits.filter((h) => !tied.has(h.id));
}

/**
 * Habits linked to a goal, in the order they appear in `relatedHabitIds`.
 * Habits that no longer exist are skipped.
 */
export function getHabitsForGoal(goal: Goal, habitById: Map<string, Habit>): Habit[] {
  return (goal.relatedHabitIds ?? []).map((id) => habitById.get(id)).filter((h): h is Habit => !!h);
}

/**
 * Filters goals by the selected lifecycle filter. Habits have no lifecycle
 * "completed" state (only today's check-in), so the filter only applies to
 * goals; untied habits always show under their section.
 */
export function filterGoalsByLifecycle(goals: Goal[], filter: Filter): Goal[] {
  if (filter === 'active') return goals.filter((g) => !g.completed);
  if (filter === 'completed') return goals.filter((g) => g.completed);
  return goals;
}
