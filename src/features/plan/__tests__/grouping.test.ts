/**
 * Tests for the Plan grouping/filter pure helpers.
 *
 * These verify the domain logic for nesting habits under goals (via
 * `relatedHabitIds`), finding untied habits, and filtering goals by lifecycle
 * state — without rendering or mocking hooks.
 */
import { describe, it, expect } from '@jest/globals';

import type { Goal, Habit } from '@/core/api/schemas';

import {
  filterGoalsByLifecycle,
  getHabitsForGoal,
  getTiedHabitIds,
  getUntiedHabits,
  type Filter,
} from '../grouping';

function makeHabit(id: string, name = id): Habit {
  return {
    id,
    name,
    description: '',
    streak: 0,
    completed: false,
    category: 'general',
    userId: 'user-1',
    recentHistory: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };
}

function makeGoal(id: string, relatedHabitIds: string[] = [], completed = false): Goal {
  return {
    id,
    title: id,
    description: '',
    category: 'general',
    progress: 0,
    completed,
    relatedHabitIds,
    userId: 'user-1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };
}

describe('getTiedHabitIds', () => {
  it('collects habit ids referenced by any goal', () => {
    const goals = [makeGoal('g1', ['h1', 'h2']), makeGoal('g2', ['h2', 'h3'])];
    expect(getTiedHabitIds(goals)).toEqual(new Set(['h1', 'h2', 'h3']));
  });

  it('returns empty set when no goals reference habits', () => {
    expect(getTiedHabitIds([makeGoal('g1'), makeGoal('g2')])).toEqual(new Set());
  });
});

describe('getUntiedHabits', () => {
  it('returns habits not referenced by any goal', () => {
    const habits = [makeHabit('h1'), makeHabit('h2'), makeHabit('h3')];
    const goals = [makeGoal('g1', ['h1'])];
    expect(getUntiedHabits(habits, goals).map((h) => h.id)).toEqual(['h2', 'h3']);
  });

  it('returns all habits when there are no goals', () => {
    const habits = [makeHabit('h1'), makeHabit('h2')];
    expect(getUntiedHabits(habits, []).map((h) => h.id)).toEqual(['h1', 'h2']);
  });
});

describe('getHabitsForGoal', () => {
  it('returns habits in relatedHabitIds order, skipping missing ones', () => {
    const habits = [makeHabit('h1', 'Read'), makeHabit('h3', 'Write')];
    const habitById = new Map(habits.map((h) => [h.id, h]));
    const goal = makeGoal('g1', ['h1', 'h2', 'h3']);
    const result = getHabitsForGoal(goal, habitById);
    expect(result.map((h) => h.id)).toEqual(['h1', 'h3']);
    expect(result.map((h) => h.name)).toEqual(['Read', 'Write']);
  });

  it('returns empty array when goal has no related habits', () => {
    const habitById = new Map<string, Habit>();
    expect(getHabitsForGoal(makeGoal('g1'), habitById)).toEqual([]);
  });
});

describe('filterGoalsByLifecycle', () => {
  const goals = [makeGoal('g1', [], false), makeGoal('g2', [], true), makeGoal('g3', [], false)];

  it.each<[Filter, string[]]>([
    ['all', ['g1', 'g2', 'g3']],
    ['active', ['g1', 'g3']],
    ['completed', ['g2']],
  ])('filter %s returns %s', (filter, expectedIds) => {
    expect(filterGoalsByLifecycle(goals, filter).map((g) => g.id)).toEqual(expectedIds);
  });
});
