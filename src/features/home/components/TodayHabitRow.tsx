/**
 * TodayHabitRow — a single habit row on the Today screen.
 *
 * Paper (`mobile.md` §8.1): one-tap optimistic check-in via `CheckInControl`,
 * textual streak summary via `StreakBar` (decorative bars hidden from a11y),
 * habit name + category, and an inline note-expand affordance. Check-in state
 * (rest/syncing/done/failed) is derived from the optimistic cache + mutation
 * status so the row never relies on color alone.
 *
 * Domain boundary: this is a presentation component owned by `features/home`.
 * It receives a `Habit` and check-in callbacks from the Today composition and
 * does not import `features/habits` or `features/check-ins` internals.
 */
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import type { Habit } from '@/core/api/schemas';
import { Badge, CheckInControl, StreakBar, ThemedText, type CheckInState } from '@/design-system';
import { useTheme } from '@/design-system/theme';

export type TodayHabitRowProps = {
  habit: Habit;
  /** Check-in state for this row, derived from optimistic cache + mutation. */
  checkInState: CheckInState;
  onCheckIn: () => void;
  /** Optional undo for a completed check-in; shown when the row is done. */
  onUndo?: () => void;
  /** Whether an inline note is expanded. */
  noteExpanded?: boolean;
  onToggleNote?: () => void;
};

export function TodayHabitRow({
  habit,
  checkInState,
  onCheckIn,
  onUndo,
  noteExpanded,
  onToggleNote,
}: TodayHabitRowProps): ReactNode {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const history = habit.recentHistory ?? [];
  const streakSummary =
    habit.streak === 1 ? t('habits.streakOne') : t('habits.streak', { count: habit.streak });

  return (
    <View style={{ gap: spacing.xs }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <CheckInControl
          state={checkInState}
          habitName={habit.name}
          onPress={checkInState === 'done' ? onUndo : onCheckIn}
        />
        <View style={{ flex: 1, gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <ThemedText
              variant="rowTitle"
              numberOfLines={2}
              style={{
                flexShrink: 1,
                textDecorationLine: checkInState === 'done' ? 'line-through' : 'none',
              }}
            >
              {habit.name}
            </ThemedText>
            {habit.category ? <Badge>{habit.category}</Badge> : null}
          </View>
          {habit.description ? (
            <Pressable
              onPress={onToggleNote}
              accessibilityRole="button"
              accessibilityLabel={noteExpanded ? t('today.collapseNote') : t('today.expandNote')}
              hitSlop={8}
            >
              <ThemedText
                variant="caption"
                numberOfLines={noteExpanded ? undefined : 1}
                style={{ color: colors.mutedForeground }}
              >
                {habit.description}
              </ThemedText>
            </Pressable>
          ) : null}
        </View>
      </View>
      <StreakBar history={history} summary={streakSummary} />
    </View>
  );
}
