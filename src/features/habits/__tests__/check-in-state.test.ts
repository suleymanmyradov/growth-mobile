/**
 * Tests for the Today check-in state derivation.
 *
 * Verifies the state machine that maps a habit's optimistic cache state +
 * per-habit failure tracking + the bulk "check in all" pending flag to a
 * `CheckInState` for the `CheckInControl`.
 */
import { describe, expect, it } from '@jest/globals';

import type { Habit } from '@/core/api/schemas';

import { deriveCheckInState } from '../check-in-state';



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

describe('deriveCheckInState', () => {
  it('returns "rest" for an incomplete habit with no failures or pending bulk', () => {
    expect(
      deriveCheckInState({
        habit: makeHabit(),
        failedHabitIds: new Set(),
        checkInAllPending: false,
      }),
    ).toBe('rest');
  });

  it('returns "done" for a completed habit', () => {
    expect(
      deriveCheckInState({
        habit: makeHabit({ completed: true }),
        failedHabitIds: new Set(),
        checkInAllPending: false,
      }),
    ).toBe('done');
  });

  it('returns "failed" when the habit id is in failedHabitIds (overrides done)', () => {
    expect(
      deriveCheckInState({
        habit: makeHabit({ completed: true }),
        failedHabitIds: new Set(['h1']),
        checkInAllPending: false,
      }),
    ).toBe('failed');
  });

  it('returns "syncing" when bulk check-in is pending and habit is not done/failed', () => {
    expect(
      deriveCheckInState({
        habit: makeHabit({ completed: false }),
        failedHabitIds: new Set(),
        checkInAllPending: true,
      }),
    ).toBe('syncing');
  });

  it('does not return "syncing" for a completed habit even when bulk is pending', () => {
    expect(
      deriveCheckInState({
        habit: makeHabit({ completed: true }),
        failedHabitIds: new Set(),
        checkInAllPending: true,
      }),
    ).toBe('done');
  });

  it('failed takes priority over syncing', () => {
    expect(
      deriveCheckInState({
        habit: makeHabit({ completed: false }),
        failedHabitIds: new Set(['h1']),
        checkInAllPending: true,
      }),
    ).toBe('failed');
  });
});
