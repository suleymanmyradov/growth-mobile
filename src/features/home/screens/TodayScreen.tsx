/**
 * TodayScreen — the Today tab composition.
 *
 * Paper (`mobile.md` §8.1): date eyebrow (mono), Today title, Progress action,
 * and notification bell; coach insight card; "Check in" heading + "Check in
 * all"; today's habit rows with one-tap optimistic check-in/syncing/failure
 * states; compact goal progress cards. The date eyebrow fades as the header
 * collapses during scroll (220 ms, instant with reduced motion). Pull-to-
 * refresh uses native refresh behavior.
 *
 * Check-in details: a long-press on a habit row opens the full check-in sheet
 * (mood/energy/blocker/note/missed). Tapping a completed row's check-in circle
 * or "Undo" button undoes (deletes) the check-in via the backend contract.
 *
 * Domain boundary: this is a composition screen in `features/home`. It imports
 * only PUBLIC hooks from `features/habits`, `features/check-ins`, `features/goals`,
 * and `features/notifications`. It does not import feature internals, stores,
 * or repositories. Coach insight data is deferred to Phase H (placeholder).
 */
import { useRouter } from 'expo-router';
import { Bell, Plus } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Animated,
    Easing,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError } from '@/core/api/errors';
import type { CheckIn, Habit } from '@/core/api/schemas';
import {
    Button,
    Card,
    EmptyState,
    ErrorState,
    SectionLabel,
    Skeleton,
    ThemedText,
    type CheckInState,
} from '@/design-system';
import { useTheme } from '@/design-system/theme';
import { useReducedMotion } from '@/design-system/theme/use-reduced-motion';
import { useArticles } from '@/features/articles';
import {
    CheckInSheet,
    useCheckInAll,
    useCreateCheckIn,
    useDeleteCheckIn,
    useTodayCheckIns,
} from '@/features/check-ins';
import {
    useApplyPlanAdjustment,
    useDismissPlanAdjustment,
    usePlanAdjustments,
} from '@/features/coaching';
import { useGoals } from '@/features/goals';
import { useHabits } from '@/features/habits';
import { useUnreadNotificationCount } from '@/features/notifications';
import { useProfile } from '@/features/profile';

import { deriveCheckInState } from '../check-in-state';
import { ArticlesSection } from '../components/ArticlesSection';
import { CoachInsightCard } from '../components/CoachInsightCard';
import { TodayGoalCard } from '../components/TodayGoalCard';
import { TodayHabitRow } from '../components/TodayHabitRow';
import { useArticleActions } from '../use-article-actions';

const COLLAPSE_THRESHOLD = 48;

export function TodayScreen(): React.ReactNode {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors, spacing, fonts } = useTheme();
  const reduced = useReducedMotion();

  const {
    data: habits,
    isLoading: habitsLoading,
    isError: habitsError,
    error: habitsErr,
    refetch: refetchHabits,
  } = useHabits();
  const {
    data: goals,
    isLoading: goalsLoading,
    isError: goalsError,
    error: goalsErr,
    refetch: refetchGoals,
  } = useGoals();
  const { data: unread } = useUnreadNotificationCount();
  const createCheckIn = useCreateCheckIn();
  const checkInAll = useCheckInAll();
  const deleteCheckIn = useDeleteCheckIn();
  const { data: todayCheckIns } = useTodayCheckIns();

  // Articles — "Worth reading tonight" section.
  const { data: articles = [] } = useArticles({ limit: 6 });
  const articleActions = useArticleActions();

  // Check-in sheet state — opened via long-press on a habit row.
  // The `key` forces a remount each time the sheet opens so the form
  // initializes with the correct pre-fill data (avoids setState-in-effect).
  const [checkInSheetOpen, setCheckInSheetOpen] = useState(false);
  const [checkInSheetHabit, setCheckInSheetHabit] = useState<Habit | null>(null);
  const [checkInSheetKey, setCheckInSheetKey] = useState(0);

  // Profile — for the personalized headline.
  const { data: profile } = useProfile();
  const firstName = profile?.fullName?.split(' ')[0] ?? '';
  // i18next can't conditionally prefix, so build the ", Name" suffix here.
  const nameSuffix = firstName ? `, ${firstName}` : '';

  // Plan adjustment suggestions — the first pending one drives the coach nudge.
  const { data: suggestions = [] } = usePlanAdjustments();
  const applyPlanAdjustment = useApplyPlanAdjustment();
  const dismissPlanAdjustment = useDismissPlanAdjustment();
  const coachNudge = suggestions[0];

  const [refreshing, setRefreshing] = useState(false);
  const [failedHabitIds, setFailedHabitIds] = useState<Set<string>>(new Set());
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const scrollY = useMemo(() => new Animated.Value(0), []);

  const incompleteHabits = useMemo(() => habits?.filter((h) => !h.completed) ?? [], [habits]);

  // Derived check-in summary for the personalized headline + counter.
  const totalCount = habits?.length ?? 0;
  const completedCount = habits?.filter((h) => h.completed).length ?? 0;
  const remainingCount = incompleteHabits.length;
  const allDone = totalCount > 0 && remainingCount === 0;

  const headline = habitsLoading
    ? ''
    : allDone
      ? t('today.headlineAllDone', { name: nameSuffix })
      : totalCount === 0
        ? t('today.headlineWelcome', { name: nameSuffix })
        : t('today.headlineRemaining', { count: remainingCount, name: nameSuffix });

  const subtitle = habitsLoading
    ? ''
    : allDone
      ? t('today.subtitleAllDone')
      : totalCount === 0
        ? t('today.subtitleNoHabits')
        : remainingCount <= 2
          ? t('today.subtitleFewLeft')
          : t('today.subtitleSomeLeft');

  const handleCheckIn = (habit: Habit) => {
    setFailedHabitIds((prev) => {
      if (!prev.has(habit.id)) return prev;
      const next = new Set(prev);
      next.delete(habit.id);
      return next;
    });
    createCheckIn.mutate(
      { habitId: habit.id, status: 'completed' },
      {
        onError: () => {
          setFailedHabitIds((prev) => new Set(prev).add(habit.id));
        },
      },
    );
  };

  const handleCheckInAll = () => {
    if (incompleteHabits.length === 0) return;
    const ids = incompleteHabits.map((h) => h.id);
    checkInAll.mutate(
      { habitIds: ids },
      {
        onError: () => {
          // Partial failure: surface the habits that did not flip as failed.
          setFailedHabitIds((prev) => {
            const next = new Set(prev);
            for (const id of ids) next.add(id);
            return next;
          });
        },
        onSuccess: (results) => {
          const failed = new Set<string>();
          results.forEach((r, i) => {
            if (r.status === 'rejected') failed.add(ids[i] ?? '');
          });
          if (failed.size > 0) setFailedHabitIds(failed);
        },
      },
    );
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchHabits(), refetchGoals()]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleUndoCheckIn = (habit: Habit) => {
    deleteCheckIn.mutate(habit.id);
  };

  const handleOpenCheckInSheet = (habit: Habit) => {
    setCheckInSheetHabit(habit);
    setCheckInSheetKey((k) => k + 1);
    setCheckInSheetOpen(true);
  };

  const handleCloseCheckInSheet = () => {
    setCheckInSheetOpen(false);
    setCheckInSheetHabit(null);
  };

  const handleSubmitCheckIn = (data: {
    habitId: string;
    status: 'completed' | 'missed';
    mood?: 'great' | 'okay' | 'low' | 'stressed';
    energy?: 'high' | 'medium' | 'low';
    blocker?: 'lack_of_time' | 'low_motivation' | 'too_distracted' | 'unclear_plan' | 'other';
    note?: string;
  }) => {
    createCheckIn.mutate(data, { onSuccess: handleCloseCheckInSheet });
  };

  // Today's check-in for the sheet's habit (pre-fills mood/energy/note).
  const existingCheckInForSheet: CheckIn | null = checkInSheetHabit
    ? (todayCheckIns?.find((c) => c.habitId === checkInSheetHabit.id) ?? null)
    : null;

  const toggleNote = (id: string) => {
    setExpandedNotes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const checkInStateFor = (habit: Habit): CheckInState =>
    deriveCheckInState({
      habit,
      failedHabitIds,
      checkInAllPending: checkInAll.isPending,
    });

  const today = new Date();
  const dateEyebrow = today.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  // Header collapse: fade the date eyebrow as the user scrolls past the
  // threshold (220 ms easing, instant with reduced motion).
  const eyebrowOpacity = reduced
    ? 1
    : scrollY.interpolate({
        inputRange: [0, COLLAPSE_THRESHOLD],
        outputRange: [1, 0],
        easing: Easing.inOut(Easing.ease),
        extrapolate: 'clamp',
      });
  const eyebrowHeight = reduced
    ? undefined
    : scrollY.interpolate({
        inputRange: [0, COLLAPSE_THRESHOLD],
        outputRange: [18, 0],
        easing: Easing.inOut(Easing.ease),
        extrapolate: 'clamp',
      });

  const onScroll = Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
    useNativeDriver: false,
  });

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      {/* Header (collapses on scroll) */}
      <View
        style={[
          styles.header,
          {
            paddingHorizontal: spacing.xl,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
            borderBottomWidth: StyleSheet.hairlineWidth,
          },
        ]}
      >
        <View style={styles.headerTop}>
          <View style={{ flex: 1, gap: 2 }}>
            <Animated.View
              style={{ opacity: eyebrowOpacity, height: eyebrowHeight, overflow: 'hidden' }}
            >
              <ThemedText
                variant="meta"
                style={{ fontFamily: fonts.mono, color: colors.mutedForeground }}
              >
                {dateEyebrow}
              </ThemedText>
            </Animated.View>
            <ThemedText variant="screenTitle" numberOfLines={2}>
              {headline || t('tabs.today')}
            </ThemedText>
            {subtitle ? (
              <ThemedText
                variant="caption"
                style={{ color: colors.mutedForeground }}
                numberOfLines={2}
              >
                {subtitle}
              </ThemedText>
            ) : null}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            {totalCount > 0 ? (
              <View style={{ alignItems: 'flex-end' }}>
                <ThemedText
                  variant="numeric"
                  style={{ color: colors.foreground }}
                  accessibilityLabel={t('today.checkedInCount', {
                    completed: completedCount,
                    total: totalCount,
                  })}
                >
                  {completedCount}
                  <ThemedText variant="meta" style={{ color: colors.mutedForeground }}>
                    /{totalCount}
                  </ThemedText>
                </ThemedText>
                <ThemedText variant="meta" style={{ color: colors.mutedForeground }}>
                  {t('today.checkedIn')}
                </ThemedText>
              </View>
            ) : null}
            <Pressable
              onPress={() => router.push('/progress')}
              accessibilityRole="button"
              accessibilityLabel={t('screens.progress.title')}
              hitSlop={8}
              style={{ padding: 8, minHeight: 44, justifyContent: 'center' }}
            >
              <ThemedText variant="label" style={{ color: colors.accent }}>
                {t('screens.progress.title')}
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={() => router.push('/notifications')}
              accessibilityRole="button"
              accessibilityLabel={t('screens.notifications.title')}
              hitSlop={8}
              style={{ padding: 8, minHeight: 44, justifyContent: 'center' }}
            >
              <View>
                <Bell color={colors.foreground} size={22} />
                {unread && unread.count > 0 ? (
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: colors.accent, borderColor: colors.background },
                    ]}
                  />
                ) : null}
              </View>
            </Pressable>
          </View>
        </View>
      </View>

      <ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
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
        {/* Coach insight — real plan-adjustment nudge when available, else placeholder */}
        <CoachInsightCard
          headline={coachNudge ? t('today.coachNudgeHeadline') : undefined}
          body={coachNudge?.suggestion}
          primaryActionLabel={
            coachNudge
              ? applyPlanAdjustment.isPending
                ? t('common.saving')
                : t('today.coachNudgeApply')
              : t('today.talkToCoach')
          }
          onPrimaryAction={
            coachNudge
              ? () => applyPlanAdjustment.mutate(coachNudge.id)
              : () => router.push('/(app)/(tabs)/coach')
          }
          secondaryActionLabel={coachNudge ? t('today.coachNudgeDismiss') : undefined}
          onSecondaryAction={
            coachNudge ? () => dismissPlanAdjustment.mutate(coachNudge.id) : undefined
          }
        />

        {/* Check-in section */}
        <View style={{ gap: spacing.md }}>
          <View
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <SectionLabel>{t('today.checkInHeading')}</SectionLabel>
            {incompleteHabits.length > 0 ? (
              <Pressable
                onPress={handleCheckInAll}
                disabled={checkInAll.isPending}
                accessibilityRole="button"
                accessibilityLabel={t('habits.checkInAll')}
                hitSlop={8}
                style={{ padding: 8, minHeight: 44, justifyContent: 'center' }}
              >
                <ThemedText
                  variant="label"
                  style={{ color: checkInAll.isPending ? colors.mutedForeground : colors.accent }}
                >
                  {checkInAll.isPending ? t('common.saving') : t('habits.checkInAll')}
                </ThemedText>
              </Pressable>
            ) : null}
          </View>

          {habitsLoading ? (
            <View style={{ gap: spacing.md }}>
              {[0, 1, 2].map((i) => (
                <Card key={i}>
                  <View style={{ gap: spacing.sm }}>
                    <Skeleton style={{ width: '60%', height: 18 }} />
                    <Skeleton style={{ width: '40%', height: 12 }} />
                  </View>
                </Card>
              ))}
            </View>
          ) : habitsError ? (
            <ErrorState
              message={habitsErr instanceof ApiError ? habitsErr.message : undefined}
              onRetry={() => refetchHabits()}
            />
          ) : !habits || habits.length === 0 ? (
            <EmptyState
              title={t('today.noHabitsTitle')}
              subtitle={t('today.noHabitsBody')}
              action={
                <Button onPress={() => router.push('/(app)/(tabs)/plan?create=habit')}>
                  <Plus color={colors.accentForeground} size={16} /> {t('today.addFirstHabit')}
                </Button>
              }
            />
          ) : (
            <View style={{ gap: spacing.md }}>
              {habits.map((habit) => (
                <Card key={habit.id}>
                  <TodayHabitRow
                    habit={habit}
                    checkInState={checkInStateFor(habit)}
                    onCheckIn={() => handleCheckIn(habit)}
                    onUndo={() => handleUndoCheckIn(habit)}
                    onLogDetails={() => handleOpenCheckInSheet(habit)}
                    isUndoPending={deleteCheckIn.isPending}
                    noteExpanded={expandedNotes.has(habit.id)}
                    onToggleNote={() => toggleNote(habit.id)}
                  />
                </Card>
              ))}
            </View>
          )}
        </View>

        {/* Compact goal progress */}
        {goalsLoading ? (
          <View style={{ gap: spacing.md }}>
            <SectionLabel>{t('today.goalsHeading')}</SectionLabel>
            {[0, 1].map((i) => (
              <Card key={i}>
                <View style={{ gap: spacing.sm }}>
                  <Skeleton style={{ width: '50%', height: 18 }} />
                  <Skeleton style={{ width: '100%', height: 6 }} />
                </View>
              </Card>
            ))}
          </View>
        ) : goalsError ? (
          <View style={{ gap: spacing.md }}>
            <SectionLabel>{t('today.goalsHeading')}</SectionLabel>
            <ErrorState
              message={goalsErr instanceof ApiError ? goalsErr.message : undefined}
              onRetry={() => refetchGoals()}
            />
          </View>
        ) : goals && goals.length > 0 ? (
          <View style={{ gap: spacing.md }}>
            <SectionLabel>{t('today.goalsHeading')}</SectionLabel>
            {goals.slice(0, 3).map((goal) => (
              <Card key={goal.id}>
                <TodayGoalCard goal={goal} onPress={() => router.push('/(app)/(tabs)/plan')} />
              </Card>
            ))}
          </View>
        ) : null}

        {/* Worth reading tonight */}
        {articles.length > 0 ? (
          <ArticlesSection
            articles={articles}
            onLike={articleActions.handleLike}
            onToggleSave={articleActions.handleToggleSave}
            isLikePendingFor={articleActions.isLikePendingFor}
            getIsSaved={articleActions.getIsSaved}
          />
        ) : null}
      </ScrollView>

      {/* Full check-in sheet — opened via long-press on a habit row */}
      <CheckInSheet
        key={checkInSheetKey}
        open={checkInSheetOpen}
        onClose={handleCloseCheckInSheet}
        habit={checkInSheetHabit}
        existingCheckIn={existingCheckInForSheet}
        onSubmit={handleSubmitCheckIn}
        isSubmitting={createCheckIn.isPending}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingVertical: 8 },
  headerTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
  },
});
