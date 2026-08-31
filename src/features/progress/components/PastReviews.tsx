/**
 * PastReviews — history of past weekly reviews with Pro-gating.
 *
 * Ported from the web frontend's `PastReviews` with `FeatureLock`: shows a
 * list of past reviews with week label and completion rate. Free users see a
 * locked state instead of the list.
 */
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import type { WeeklyReview } from '@/core/api/schemas';
import { Card, ProgressBar, SectionLabel, ThemedText } from '@/design-system';
import { useTheme } from '@/design-system/theme';
import { FeatureLock } from '@/features/billing';

import { formatWeekLabel } from '../date-format';

export interface PastReviewsProps {
  reviews: WeeklyReview[];
  isPro: boolean;
}

export function PastReviews({ reviews, isPro }: PastReviewsProps): ReactNode {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();

  if (reviews.length === 0) return null;

  return (
    <View style={{ gap: spacing.sm }}>
      <SectionLabel>{t('progress.pastReviews')}</SectionLabel>
      <FeatureLock
        isUnlocked={isPro}
        featureName={t('progress.pastReviewsLocked')}
        description={t('progress.pastReviewsLockedBody')}
      >
        <View style={{ gap: spacing.sm }}>
          {reviews.map((review) => (
            <Card key={review.id}>
              <View style={{ gap: spacing.xs }}>
                <ThemedText variant="rowTitle" numberOfLines={1}>
                  {formatWeekLabel(review.weekStart, review.weekEnd)}
                </ThemedText>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <ThemedText variant="caption" style={{ color: colors.mutedForeground }}>
                    {t('progress.checkInsOf', {
                      completed: review.completedCheckIns,
                      total: review.completedCheckIns + review.missedCheckIns,
                    })}
                  </ThemedText>
                  <ThemedText variant="numeric" style={{ color: colors.accent }}>
                    {t('today.percent', { percent: Math.round(review.completionRate * 100) })}
                  </ThemedText>
                </View>
                <ProgressBar value={review.completionRate} />
                {review.aiSummary ? (
                  <ThemedText
                    variant="caption"
                    style={{ color: colors.mutedForeground }}
                    numberOfLines={2}
                  >
                    {review.aiSummary}
                  </ThemedText>
                ) : null}
              </View>
            </Card>
          ))}
        </View>
      </FeatureLock>
    </View>
  );
}
