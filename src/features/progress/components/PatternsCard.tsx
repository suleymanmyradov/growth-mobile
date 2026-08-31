/**
 * PatternsCard — mood/energy distribution and best/hardest day from the
 * weekly review.
 *
 * Ported from the web frontend's `PatternsCard`: shows mood and energy
 * summaries as distribution bars, plus best day and hardest day if available.
 */
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import type { WeeklyReview } from '@/core/api/schemas';
import { Card, SectionLabel, ThemedText } from '@/design-system';
import { useTheme } from '@/design-system/theme';

export interface PatternsCardProps {
  review: WeeklyReview;
}

export function PatternsCard({ review }: PatternsCardProps): ReactNode {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();

  const moodEntries = Object.entries(review.moodSummary ?? {});
  const energyEntries = Object.entries(review.energySummary ?? {});
  const hasMood = moodEntries.length > 0;
  const hasEnergy = energyEntries.length > 0;
  const hasBestDay = Boolean(review.bestDay);
  const hasHardestDay = Boolean(review.hardestDay);

  if (!hasMood && !hasEnergy && !hasBestDay && !hasHardestDay) return null;

  const maxMood = Math.max(...moodEntries.map(([, v]) => v), 1);
  const maxEnergy = Math.max(...energyEntries.map(([, v]) => v), 1);

  return (
    <View style={{ gap: spacing.sm }}>
      <SectionLabel>{t('progress.patterns')}</SectionLabel>
      <Card>
        <View style={{ gap: spacing.md }}>
          {hasBestDay || hasHardestDay ? (
            <View style={{ gap: spacing.xs }}>
              {hasBestDay ? (
                <ThemedText variant="caption" style={{ color: colors.mutedForeground }}>
                  {t('progress.bestDay')}: <ThemedText variant="label">{review.bestDay}</ThemedText>
                </ThemedText>
              ) : null}
              {hasHardestDay ? (
                <ThemedText variant="caption" style={{ color: colors.mutedForeground }}>
                  {t('progress.hardestDay')}:{' '}
                  <ThemedText variant="label">{review.hardestDay}</ThemedText>
                </ThemedText>
              ) : null}
            </View>
          ) : null}

          {hasMood ? (
            <View style={{ gap: spacing.xs }}>
              <ThemedText variant="label">{t('progress.moodDistribution')}</ThemedText>
              {moodEntries.map(([mood, count]) => (
                <View key={mood} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ThemedText
                    variant="caption"
                    style={{ color: colors.mutedForeground, width: 80 }}
                    numberOfLines={1}
                  >
                    {mood}
                  </ThemedText>
                  <View
                    style={{
                      flex: 1,
                      height: 8,
                      backgroundColor: colors.input,
                      borderRadius: 4,
                    }}
                  >
                    <View
                      style={{
                        width: `${(count / maxMood) * 100}%`,
                        height: '100%',
                        backgroundColor: colors.accent,
                        borderRadius: 4,
                      }}
                    />
                  </View>
                  <ThemedText
                    variant="caption"
                    style={{ color: colors.mutedForeground, width: 24, textAlign: 'right' }}
                  >
                    {count}
                  </ThemedText>
                </View>
              ))}
            </View>
          ) : null}

          {hasEnergy ? (
            <View style={{ gap: spacing.xs }}>
              <ThemedText variant="label">{t('progress.energyDistribution')}</ThemedText>
              {energyEntries.map(([energy, count]) => (
                <View key={energy} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ThemedText
                    variant="caption"
                    style={{ color: colors.mutedForeground, width: 80 }}
                    numberOfLines={1}
                  >
                    {energy}
                  </ThemedText>
                  <View
                    style={{
                      flex: 1,
                      height: 8,
                      backgroundColor: colors.input,
                      borderRadius: 4,
                    }}
                  >
                    <View
                      style={{
                        width: `${(count / maxEnergy) * 100}%`,
                        height: '100%',
                        backgroundColor: colors.accent,
                        borderRadius: 4,
                      }}
                    />
                  </View>
                  <ThemedText
                    variant="caption"
                    style={{ color: colors.mutedForeground, width: 24, textAlign: 'right' }}
                  >
                    {count}
                  </ThemedText>
                </View>
              ))}
            </View>
          ) : null}

          {review.topBlocker ? (
            <ThemedText variant="caption" style={{ color: colors.mutedForeground }}>
              {t('progress.topBlocker')}: {review.topBlocker}
            </ThemedText>
          ) : null}
        </View>
      </Card>
    </View>
  );
}
