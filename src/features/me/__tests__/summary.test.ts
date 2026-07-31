/**
 * Tests for the Me screen summary derivation.
 *
 * Verifies that summary metrics are derived truthfully from habits and goals
 * with no fabricated values when data is unloaded.
 */
import { describe, it, expect } from '@jest/globals';

import type { Goal, Habit } from '@/core/api/schemas';

import { deriveMeSummary } from '../summary';

function makeHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'h1',
    name: 'Read',
    description: '',
    streak: 0,
    completed: false,
    category: 'general',
    userId: 'user-1',
    recentHistory: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: 'g1',
    title: 'Study',
    description: '',
    category: 'general',
    progress: 0,
    completed: false,
    userId: 'user-1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('deriveMeSummary', () => {
  it('returns zeroes when both lists are undefined (not loaded yet)', () => {
    expect(deriveMeSummary(undefined, undefined)).toEqual({
      goalsCount: 0,
      habitsCount: 0,
      bestStreak: 0,
    });
  });

  it('counts habits and goals', () => {
    const habits = [makeHabit(), makeHabit({ id: 'h2' }), makeHabit({ id: 'h3' })];
    const goals = [makeGoal(), makeGoal({ id: 'g2' })];
    expect(deriveMeSummary(habits, goals)).toEqual({
      goalsCount: 2,
      habitsCount: 3,
      bestStreak: 0,
    });
  });

  it('derives the best streak as the max streak across habits', () => {
    const habits = [
      makeHabit({ id: 'h1', streak: 3 }),
      makeHabit({ id: 'h2', streak: 12 }),
      makeHabit({ id: 'h3', streak: 7 }),
    ];
    expect(deriveMeSummary(habits, [])).toEqual({
      goalsCount: 0,
      habitsCount: 3,
      bestStreak: 12,
    });
  });

  it('returns a 0 best streak when there are no habits', () => {
    expect(deriveMeSummary([], [makeGoal()])).toEqual({
      goalsCount: 1,
      habitsCount: 0,
      bestStreak: 0,
    });
  });

  it('does not fabricate goals when only habits are loaded', () => {
    expect(deriveMeSummary([makeHabit()], undefined)).toEqual({
      goalsCount: 0,
      habitsCount: 1,
      bestStreak: 0,
    });
  });
});
