/**
 * Pure check-in state derivation for habit rows.
 *
 * Maps a habit's optimistic cache state + per-habit failure tracking + the
 * bulk "check in all" pending flag to a `CheckInState` for the `CheckInControl`.
 * Extracted as a pure function so the state machine is unit-testable and
 * shareable between the Today and Plan compositions.
 */
import type { Habit } from '@/core/api/schemas';
import type { CheckInState } from '@/design-system';

export type DeriveCheckInStateInput = {
  habit: Habit;
  failedHabitIds: Set<string>;
  /** Whether the bulk "check in all" action is in flight. */
  checkInAllPending: boolean;
};

/**
 * Derives the check-in control state for a single habit row.
 *
 * Priority: failed > done > syncing (bulk) > rest.
 * A per-habit "syncing" state for individual check-ins is not derivable from
 * the shared mutation without per-habit pending tracking; the bulk action's
 * pending flag is used conservatively.
 */
export function deriveCheckInState({
  habit,
  failedHabitIds,
  checkInAllPending,
}: DeriveCheckInStateInput): CheckInState {
  if (failedHabitIds.has(habit.id)) return 'failed';
  if (habit.completed) return 'done';
  if (checkInAllPending) return 'syncing';
  return 'rest';
}
