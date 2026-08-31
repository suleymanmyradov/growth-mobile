/**
 * ProgressScreen — the Progress stack screen (pushed from Today).
 *
 * Paper (`mobile.md` §8.3): Progress replaces separate weekly-review/activity
 * entry points in the primary IA, but underlying feature/API ownership stays
 * separate. Shows week label, metric cards (check-ins, consistency, missed,
 * total habits), per-day check-in chart, coach interpretation (streaming
 * during generation), per-habit breakdown, patterns (mood/energy/best/hardest
 * day), suggested adjustments, next-week plan, past reviews (Pro-gated),
 * upgrade prompt for free users, and recent activity. Pull-to-refresh, cached
 * offline view, last-updated timestamp, Retry, skeleton, empty, and error
 * states are required.
 *
 * Domain boundary: composition screen in `features/progress`. Imports only
 * PUBLIC hooks from `features/weekly-review`, `features/activity`, and
 * `features/billing`.
 */
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
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
import { useBillingOverview } from '@/features/billing';
import {
    useCurrentWeeklyReview,
    useGenerateWeeklyReviewStream,
    useWeeklyReviews,
} from '@/features/weekly-review';

import { AdjustmentsCard } from '../components/AdjustmentsCard';
import { MetricCard } from '../components/MetricCard';
import { NextPlanCard } from '../components/NextPlanCard';
import { PastReviews } from '../components/PastReviews';
import { PatternsCard } from '../components/PatternsCard';
import { StreamingCoachCard } from '../components/StreamingCoachCard';
import { UpgradePrompt } from '../components/UpgradePrompt';
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
    data: pastReviewsData,
  } = useWeeklyReviews({ page: 1, limit: 10 });
  const {
    data: activity,
    isLoading: activityLoading,
    isError: activityError,
    error: activityErr,
    refetch: refetchActivity,
  } = useActivity({ page: 1, limit: 10 });
  const { data: billing } = useBillingOverview();
  const isPro = billing?.subscription?.planCode === 'pro';

  const stream = useGenerateWeeklyReviewStream();

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
    stream.generate({ forceRegenerate: true });
  };

  const lastUpdated = reviewUpdatedAt ? new Date(reviewUpdatedAt).toLocaleString() : undefined;

  const weekLabel = review ? formatWeekLabel(review.weekStart, review.weekEnd) : null;

  // Past reviews (exclude the current week).
  const pastReviews = useMemo(() => {
    const all = pastReviewsData?.data ?? [];
    if (!review) return all;
    return all.filter((r) => r.id !== review.id);
  }, [pastReviewsData, review]);

  // Show streaming card during streaming, otherwise the persisted aiSummary.
  const showStreamingCard = stream.isStreaming || stream.partialSummary.length > 0;
  const effectiveSummary = stream.completedReview?.aiSummary ?? review?.aiSummary;

  // Upgrade prompt: show for free users with completion rate > 50%.
  const showUpgradePrompt = !isPro && review && review.completionRate > 0.5;

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

            {/* Metric cards */}
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <MetricCard
                label={t('progress.checkInsCompleted')}
                value={review.completedCheckIns}
              />
              <MetricCard
                label={t('progress.consistency')}
                value={t('today.percent', { percent: Math.round(review.completionRate * 100) })}
                accent
              />
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <MetricCard label={t('progress.missedLabel')} value={review.missedCheckIns} />
              <MetricCard label={t('progress.totalHabits')} value={review.totalHabits} />
            </View>

            <ProgressBar value={review.completionRate} />

            {/* Streaming coach card or persisted AI summary */}
            {showStreamingCard ? (
              <StreamingCoachCard
                partialText={stream.partialSummary}
                isStreaming={stream.isStreaming}
              />
            ) : effectiveSummary ? (
              <View style={{ gap: spacing.sm }}>
                <SectionLabel>{t('progress.coachInterpretation')}</SectionLabel>
                <Card>
                  <ThemedText variant="body" style={{ color: colors.foreground }}>
                    {effectiveSummary}
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

            {/* Patterns card */}
            <PatternsCard review={review} />

            {/* Suggested adjustments */}
            <AdjustmentsCard adjustments={review.suggestedAdjustments} />

            {/* Next-week plan */}
            <NextPlanCard plan={review.nextWeekPlan} />

            {/* Regenerate (streaming) */}
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Button
                variant="outline"
                onPress={handleGenerate}
                loading={stream.isStreaming}
                disabled={stream.isStreaming}
                fullWidth
              >
                {stream.isStreaming ? t('common.saving') : t('progress.regenerate')}
              </Button>
              {stream.isStreaming ? (
                <Button
                  variant="ghost"
                  onPress={stream.cancel}
                  disabled={!stream.isStreaming}
                >
                  {t('coach.stop')}
                </Button>
              ) : null}
            </View>

            {/* Upgrade prompt for free users */}
            <UpgradePrompt
              shouldShow={showUpgradePrompt ?? false}
              trigger="progress_completion_rate"
            />

            {/* Stream error */}
            {stream.error ? (
              <ThemedText variant="caption" style={{ color: colors.destructive }}>
                {stream.error}
              </ThemedText>
            ) : null}
          </View>
        ) : (
          <EmptyState
            title={t('progress.noReviewTitle')}
            subtitle={t('progress.noReviewBody')}
            action={
              <Button onPress={handleGenerate} loading={stream.isStreaming}>
                {t('progress.generate')}
              </Button>
            }
          />
        )}

        {/* Past reviews (Pro-gated) */}
        <PastReviews reviews={pastReviews} isPro={isPro} />

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
