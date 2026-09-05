/**
 * HabitCard — a habit row with full check-in parity for the Plan screen.
 *
 * Mirrors the Today screen's `TodayHabitRow` check-in behavior:
 * - One-tap fast check-in via `CheckInControl` (rest/syncing/done/failed states)
 * - Undo (delete) when the habit is already done
 * - A visible "log details" button opens the detailed check-in sheet
 *   (mood/energy/blocker/note). Long-press on the content area also opens it.
 * - Note indicator + expandable note
 * - Streak summary via `StreakBar`
 *
 * Additionally provides edit/delete actions (the Plan management surface).
 *
 * Domain boundary: presentation component owned by `features/habits`. It
 * receives a `Habit`, check-in state, and callbacks. It does not import
 * `features/check-ins` hooks or stores.
 */
import { ClipboardList, Pencil, StickyNote, Trash2 } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import type { Habit } from '@/core/api/schemas';
import {
  Badge,
  CheckInControl,
  IconButton,
  StreakBar,
  ThemedText,
  type CheckInState,
} from '@/design-system';
import { useTheme } from '@/design-system/theme';

export type HabitCardProps = {
  habit: Habit;
  /** Check-in state for this row, derived from optimistic cache + mutation. */
  checkInState: CheckInState;
  onCheckIn: () => void;
  /** Undo (delete) a completed check-in; shown when the row is done. */
  onUndo?: () => void;
  /** Open the full check-in sheet (mood/energy/blocker/note). */
  onLogDetails?: () => void;
  /** Whether an undo is pending for this row. */
  isUndoPending?: boolean;
  onEdit: () => void;
  onDelete: () => void;
  /** Whether today's check-in for this habit has a note attached. */
  hasNote?: boolean;
  /** Whether the inline note is expanded. */
  noteExpanded?: boolean;
  onToggleNote?: () => void;
};

export function HabitCard({
  habit,
  checkInState,
  onCheckIn,
  onUndo,
  onLogDetails,
  isUndoPending,
  onEdit,
  onDelete,
  hasNote,
  noteExpanded,
  onToggleNote,
}: HabitCardProps): ReactNode {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const isDone = checkInState === 'done';
  const streakSummary =
    habit.streak === 1 ? t('habits.streakOne') : t('habits.streak', { count: habit.streak });

  return (
    <View style={{ gap: spacing.xs }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <CheckInControl
          state={isUndoPending ? 'syncing' : checkInState}
          habitName={habit.name}
          onPress={isDone ? onUndo : onCheckIn}
        />
        {/* Detailed check-in button — visible affordance for the full
            check-in sheet (mood/energy/blocker/note). Long-press on the
            content area also opens it. */}
        {onLogDetails ? (
          <IconButton
            icon={<ClipboardList color={colors.accent} size={20} />}
            onPress={onLogDetails}
            accessibilityLabel={t('habits.detailedCheckIn')}
          />
        ) : null}
        {/* Content area — long-press opens the detailed check-in sheet */}
        <Pressable
          onLongPress={onLogDetails}
          delayLongPress={400}
          accessibilityRole="button"
          accessibilityLabel={`${habit.name} — ${isDone ? t('habits.doneToday') : t('habits.checkIn')}`}
          accessibilityHint={onLogDetails ? t('today.checkInDetailsHint') : undefined}
          disabled={checkInState === 'syncing' || isUndoPending}
          style={{ flex: 1, gap: 2 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <ThemedText
              variant="rowTitle"
              numberOfLines={2}
              style={{
                flexShrink: 1,
                textDecorationLine: isDone ? 'line-through' : 'none',
              }}
            >
              {habit.name}
            </ThemedText>
            {habit.category ? <Badge>{habit.category}</Badge> : null}
            {hasNote ? (
              <StickyNote
                size={14}
                color={colors.mutedForeground}
                accessibilityLabel={t('habits.hasNote')}
              />
            ) : null}
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
        </Pressable>
        {/* Edit / delete actions */}
        <Pressable
          onPress={onEdit}
          accessibilityRole="button"
          accessibilityLabel={t('common.edit')}
          hitSlop={8}
          style={{ padding: 8, minHeight: 44, justifyContent: 'center' }}
        >
          <Pencil color={colors.mutedForeground} size={18} />
        </Pressable>
        <Pressable
          onPress={onDelete}
          accessibilityRole="button"
          accessibilityLabel={t('common.delete')}
          hitSlop={8}
          style={{ padding: 8, minHeight: 44, justifyContent: 'center' }}
        >
          <Trash2 color={colors.destructive} size={18} />
        </Pressable>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <StreakBar history={habit.recentHistory ?? []} summary={streakSummary} />
        {isDone && onUndo ? (
          <Pressable
            onPress={onUndo}
            accessibilityRole="button"
            accessibilityLabel={t('today.undoCheckIn')}
            hitSlop={8}
            disabled={isUndoPending}
            style={{ padding: 8, minHeight: 44, justifyContent: 'center' }}
          >
            <ThemedText variant="label" style={{ color: colors.mutedForeground }}>
              {t('today.undoCheckIn')}
            </ThemedText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
