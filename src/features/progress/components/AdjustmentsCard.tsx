/**
 * AdjustmentsCard — suggested habit adjustments from the weekly review.
 *
 * Ported from the web frontend's `AdjustmentsCard`: shows each adjustment with
 * its type (keep_same, reduce_difficulty, change_time, clarify_plan,
 * pause_habit), habit name, reason, and suggestion.
 */
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import type { WeeklyReviewAdjustment } from '@/core/api/schemas';
import { Card, SectionLabel, ThemedText } from '@/design-system';
import { useTheme } from '@/design-system/theme';

export interface AdjustmentsCardProps {
  adjustments: WeeklyReviewAdjustment[];
}

const ADJUSTMENT_TYPE_KEYS: Record<string, string> = {
  keep_same: 'progress.adjustKeepSame',
  reduce_difficulty: 'progress.adjustReduceDifficulty',
  change_time: 'progress.adjustChangeTime',
  clarify_plan: 'progress.adjustClarifyPlan',
  pause_habit: 'progress.adjustPauseHabit',
};

export function AdjustmentsCard({ adjustments }: AdjustmentsCardProps): ReactNode {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();

  if (adjustments.length === 0) return null;

  return (
    <View style={{ gap: spacing.sm }}>
      <SectionLabel>{t('progress.suggestedAdjustments')}</SectionLabel>
      <Card>
        <View style={{ gap: spacing.md }}>
          {adjustments.map((adj, i) => {
            const typeKey = ADJUSTMENT_TYPE_KEYS[adj.adjustmentType];
            const typeLabel = typeKey ? t(typeKey as never) : adj.adjustmentType;
            return (
              <View key={`${adj.habitId ?? i}-${i}`} style={{ gap: 4 }}>
                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                  <ThemedText variant="label">{typeLabel}</ThemedText>
                  <ThemedText variant="caption" style={{ color: colors.mutedForeground }}>
                    {adj.habitName}
                  </ThemedText>
                </View>
                <ThemedText variant="caption" style={{ color: colors.mutedForeground }}>
                  {adj.reason}
                </ThemedText>
                <ThemedText variant="body" style={{ color: colors.foreground }}>
                  {adj.suggestion}
                </ThemedText>
              </View>
            );
          })}
        </View>
      </Card>
    </View>
  );
}
