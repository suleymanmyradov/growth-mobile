/**
 * TodayGoalCard — a compact goal progress card for the Today screen.
 *
 * Paper (`mobile.md` §8.1): compact goal progress cards. Shows title,
 * percentage, a thin `ProgressBar`, and due/pace metadata when available.
 * The full goal card with toggle/edit/delete lives in `features/goals` and is
 * used by Plan; Today only shows a compact, read-only summary.
 *
 * Domain boundary: presentation component owned by `features/home`. Receives a
 * `Goal` and an optional `onPress` to open the goal (routes to Plan in a later
 * phase). Does not import `features/goals` internals.
 */
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import type { Goal } from '@/core/api/schemas';
import { Badge, ProgressBar, ThemedText } from '@/design-system';
import { useTheme } from '@/design-system/theme';

export type TodayGoalCardProps = {
  goal: Goal;
  onPress?: () => void;
};

export function TodayGoalCard({ goal, onPress }: TodayGoalCardProps): ReactNode {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const percent = Math.round(goal.progress);

  const content = (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <ThemedText variant="rowTitle" numberOfLines={1} style={{ flexShrink: 1 }}>
          {goal.title}
        </ThemedText>
        {goal.category ? <Badge>{goal.category}</Badge> : null}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <ProgressBar value={goal.progress / 100} style={{ flex: 1 }} />
        <ThemedText
          variant="numeric"
          accessibilityLabel={t('goals.progressPercent', { percent })}
          style={{ color: colors.accent, minWidth: 44, textAlign: 'right' }}
        >
          {t('today.percent', { percent })}
        </ThemedText>
      </View>
      {goal.dueDate ? (
        <ThemedText variant="caption" style={{ color: colors.mutedForeground }}>
          {t('goals.dueDate')}: {new Date(goal.dueDate).toLocaleDateString()}
        </ThemedText>
      ) : null}
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t('today.openGoal', { title: goal.title })}
      hitSlop={8}
    >
      {content}
    </Pressable>
  );
}
