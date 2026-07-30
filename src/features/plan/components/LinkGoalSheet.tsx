/**
 * LinkGoalSheet — a sheet listing goals to link an untied habit to.
 *
 * Paper (`mobile.md` §8.2): untied habits offer "Link a goal". Selecting a
 * goal calls the goal update endpoint with the habit id appended to
 * `relatedHabitIds` (a real contract field, not a fabricated relation).
 *
 * Domain boundary: uses the public `useGoals` and `useUpdateGoal` hooks from
 * `features/goals`. Does not import goals internals.
 */
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import type { Goal, Habit } from '@/core/api/schemas';
import { ListRow, Sheet, ThemedText } from '@/design-system';
import { useTheme } from '@/design-system/theme';
import { useGoals, useUpdateGoal } from '@/features/goals';

export type LinkGoalSheetProps = {
  open: boolean;
  onClose: () => void;
  /** The habit to link. */
  habit: Habit | null;
};

export function LinkGoalSheet({ open, onClose, habit }: LinkGoalSheetProps): ReactNode {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const { data: goals } = useGoals();
  const updateGoal = useUpdateGoal();

  const handleLink = (goal: Goal) => {
    if (!habit) return;
    const existing = goal.relatedHabitIds ?? [];
    if (existing.includes(habit.id)) {
      onClose();
      return;
    }
    updateGoal.mutate(
      { id: goal.id, data: { relatedHabitIds: [...existing, habit.id] } },
      { onSuccess: onClose },
    );
  };

  return (
    <Sheet open={open} onClose={onClose} snapPoints={['50%']}>
      <View style={{ gap: spacing.md }}>
        <ThemedText variant="sectionTitle">{t('plan.linkGoal')}</ThemedText>
        <ThemedText variant="body" style={{ color: colors.mutedForeground }}>
          {t('plan.linkGoalBody', { habit: habit?.name ?? '' })}
        </ThemedText>
        <ScrollView>
          {!goals || goals.length === 0 ? (
            <ThemedText variant="body" style={{ color: colors.mutedForeground }}>
              {t('plan.noGoalsToLink')}
            </ThemedText>
          ) : (
            goals.map((goal) => (
              <ListRow
                key={goal.id}
                onPress={() => handleLink(goal)}
                separator
                accessibilityLabel={t('plan.linkToGoal', { title: goal.title })}
              >
                <View style={{ gap: 2 }}>
                  <ThemedText variant="rowTitle" numberOfLines={1}>
                    {goal.title}
                  </ThemedText>
                  {goal.category ? (
                    <ThemedText variant="caption" style={{ color: colors.mutedForeground }}>
                      {goal.category}
                    </ThemedText>
                  ) : null}
                </View>
              </ListRow>
            ))
          )}
        </ScrollView>
      </View>
    </Sheet>
  );
}
