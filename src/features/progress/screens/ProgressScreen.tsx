/**
 * ProgressScreen — the Progress stack screen (pushed from Today).
 *
 * Paper (`mobile.md` §8.3): Progress replaces separate weekly-review/activity
 * entry points in the primary IA, but underlying feature/API ownership stays
 * separate. Shows week label, check-in total, consistency metric, per-habit
 * breakdown, coach interpretation (from `weeklyReview.aiSummary` only — never
 * fabricated from unrelated fields), and recent activity. Pull-to-refresh,
 * cached offline view, last-updated timestamp, Retry, skeleton, empty, and
 * error states are required.
 *
 * Domain boundary: composition screen in `features/progress`. Imports only
 * PUBLIC hooks from `features/weekly-review` and `features/activity`. Weekly-
 * review generation/streaming is a dedicated domain operation (Phase H) and is
 * not triggered here; this screen only reads the current/generated review.
 */
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, ScrollView, View } from 'react-native';

import { ApiError } from '@/core/api/errors';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  ProgressBar,
  Screen,
  SectionLabel,
  Skeleton,
  ThemedText,
} from '@/design-system';
import { useTheme } from '@/design-system/theme';
import { useActivity } from '@/features/activity';
import { useCurrentWeeklyReview, useGenerateWeeklyReview } from '@/features/weekly-review';

import { formatWeekLabel } from '../date-format';
export function ProgressScreen(): React.ReactNode {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors, spacing, fonts } = useTheme();

  const {
    data: review,
    isLoading: reviewLoading,
    isError: reviewError,
    error: reviewErr,
    refetch: refetchReview,
    dataUpdatedAt: reviewUpdatedAt,
  } = useCurrentWeeklyReview();
  const {
    data: activity,
    isLoading: activityLoading,
    isError: activityError,
    error: activityErr,
    refetch: refetchActivity,
  } = useActivity({ page: 1, limit: 10 });
  const generateReview = useGenerateWeeklyReview();

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchReview(), refetchActivity()]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleGenerate = () => {
    generateReview.mutate(undefined);
  };

  const lastUpdated = reviewUpdatedAt ? new Date(reviewUpdatedAt).toLocaleString() : undefined;

  const weekLabel = review ? formatWeekLabel(review.weekStart, review.weekEnd) : null;

  return (
    <Screen title={t('screens.progress.title')} onBack={() => router.back()} scrollable={false}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
          />
        }
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.lg,
          gap: spacing.xxl,
        }}
      >
        {/* Week summary */}
        {reviewLoading ? (
          <View style={{ gap: spacing.md }}>
            <Skeleton style={{ width: '50%', height: 16 }} />
            <Skeleton style={{ width: '100%', height: 80 }} />
          </View>
        ) : reviewError ? (
          <ErrorState
            message={reviewErr instanceof ApiError ? reviewErr.message : undefined}
            onRetry={() => refetchReview()}
          />
        ) : review ? (
          <View style={{ gap: spacing.md }}>
            <SectionLabel>{t('progress.weekLabel')}</SectionLabel>
            <ThemedText variant="meta" style={{ color: colors.mutedForeground }}>
              {weekLabel ?? t('progress.currentWeek')}
            </ThemedText>

            <Card>
              <View style={{ gap: spacing.md }}>
                <View style={{ flexDirection: 'row', gap: spacing.lg }}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <ThemedText
                      variant="numeric"
                      style={{ color: colors.foreground, fontSize: 24, lineHeight: 30 }}
                    >
                      {review.completedCheckIns}
                    </ThemedText>
                    <ThemedText variant="caption" style={{ color: colors.mutedForeground }}>
                      {t('progress.checkInsCompleted')}
                    </ThemedText>
                  </View>
                  <View style={{ flex: 1, minWidth: 96, gap: 2, alignItems: 'flex-end' }}>
                    <ThemedText
                      variant="numeric"
                      style={{ color: colors.accent, fontSize: 24, lineHeight: 30 }}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.8}
                    >
                      {t('today.percent', { percent: Math.round(review.completionRate * 100) })}
                    </ThemedText>
                    <ThemedText variant="caption" style={{ color: colors.mutedForeground }}>
                      {t('progress.consistency')}
                    </ThemedText>
                  </View>
                </View>
                <ProgressBar value={review.completionRate} />
                {review.missedCheckIns > 0 ? (
                  <ThemedText variant="caption" style={{ color: colors.mutedForeground }}>
                    {t('progress.missed', { count: review.missedCheckIns })}
                  </ThemedText>
                ) : null}
              </View>
            </Card>

            {/* Coach interpretation — only from aiSummary, never fabricated */}
            {review.aiSummary ? (
              <View style={{ gap: spacing.sm }}>
                <SectionLabel>{t('progress.coachInterpretation')}</SectionLabel>
                <Card>
                  <ThemedText variant="body" style={{ color: colors.foreground }}>
                    {review.aiSummary}
                  </ThemedText>
                </Card>
              </View>
            ) : null}

            {/* Per-habit breakdown */}
            {review.habitBreakdown.length > 0 ? (
              <View style={{ gap: spacing.sm }}>
                <SectionLabel>{t('progress.perHabit')}</SectionLabel>
                {review.habitBreakdown.map((b) => (
                  <Card key={b.habitId}>
                    <View style={{ gap: spacing.sm }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <ThemedText variant="rowTitle" numberOfLines={1} style={{ flexShrink: 1 }}>
                          {b.habitName}
                        </ThemedText>
                        <ThemedText
                          variant="numeric"
                          style={{ color: colors.accent }}
                          accessibilityLabel={t('today.percent', {
                            percent: Math.round(b.completionRate * 100),
                          })}
                        >
                          {t('today.percent', { percent: Math.round(b.completionRate * 100) })}
                        </ThemedText>
                      </View>
                      <ProgressBar value={b.completionRate} />
                      <ThemedText variant="caption" style={{ color: colors.mutedForeground }}>
                        {t('progress.checkInsOf', {
                          completed: b.completedCount,
                          total: b.totalCheckIns,
                        })}
                      </ThemedText>
                    </View>
                  </Card>
                ))}
              </View>
            ) : null}

            {/* Regenerate (non-streaming) */}
            <Button
              variant="outline"
              onPress={handleGenerate}
              loading={generateReview.isPending}
              disabled={generateReview.isPending}
            >
              {t('progress.regenerate')}
            </Button>
          </View>
        ) : (
          <EmptyState
            title={t('progress.noReviewTitle')}
            subtitle={t('progress.noReviewBody')}
            action={
              <Button onPress={handleGenerate} loading={generateReview.isPending}>
                {t('progress.generate')}
              </Button>
            }
          />
        )}

        {/* Recent activity */}
        <View style={{ gap: spacing.md }}>
          <SectionLabel>{t('progress.recentActivity')}</SectionLabel>
          {activityLoading ? (
            <View style={{ gap: spacing.sm }}>
              {[0, 1, 2].map((i) => (
                <Card key={i}>
                  <View style={{ gap: spacing.xs }}>
                    <Skeleton style={{ width: '70%', height: 16 }} />
                    <Skeleton style={{ width: '40%', height: 12 }} />
                  </View>
                </Card>
              ))}
            </View>
          ) : activityError ? (
            <ErrorState
              message={activityErr instanceof ApiError ? activityErr.message : undefined}
              onRetry={() => refetchActivity()}
            />
          ) : activity && activity.length > 0 ? (
            <View style={{ gap: spacing.sm }}>
              {activity.map((a) => (
                <Card key={a.id}>
                  <View style={{ gap: spacing.xs }}>
                    <ThemedText variant="rowTitle" numberOfLines={1}>
                      {a.title}
                    </ThemedText>
                    {a.description ? (
                      <ThemedText variant="caption" style={{ color: colors.mutedForeground }}>
                        {a.description}
                      </ThemedText>
                    ) : null}
                    <ThemedText
                      variant="meta"
                      style={{ fontFamily: fonts.mono, color: colors.mutedForeground }}
                    >
                      {new Date(a.createdAt).toLocaleDateString()}
                    </ThemedText>
                  </View>
                </Card>
              ))}
            </View>
          ) : (
            <ThemedText variant="body" style={{ color: colors.mutedForeground }}>
              {t('progress.noActivity')}
            </ThemedText>
          )}
        </View>

        {lastUpdated ? (
          <ThemedText
            variant="caption"
            style={{ color: colors.mutedForeground, textAlign: 'center' }}
          >
            {t('progress.lastUpdated', { time: lastUpdated })}
          </ThemedText>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
