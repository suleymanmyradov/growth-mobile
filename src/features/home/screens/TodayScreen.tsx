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
 * Domain boundary: this is a composition screen in `features/home`. It imports
 * only PUBLIC hooks from `features/habits`, `features/check-ins`, `features/goals`,
 * and `features/notifications`. It does not import feature internals, stores,
 * or repositories. Coach insight data is deferred to Phase H (placeholder).
 *
 * Undo note: a per-habit user-initiated un-check requires a backend delete-
 * check-in contract that does not exist yet. Until then a completed row shows
 * the "done" state and the check-in control is disabled (no fake undo). The
 * optimistic mutation's onError rolls back failed check-ins automatically.
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
import type { Habit } from '@/core/api/schemas';
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
import { useCheckInAll, useCreateCheckIn } from '@/features/check-ins';
import { useGoals } from '@/features/goals';
import { useHabits } from '@/features/habits';
import { useUnreadNotificationCount } from '@/features/notifications';

import { deriveCheckInState } from '../check-in-state';
import { CoachInsightCard } from '../components/CoachInsightCard';
import { TodayGoalCard } from '../components/TodayGoalCard';
import { TodayHabitRow } from '../components/TodayHabitRow';

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

  const [refreshing, setRefreshing] = useState(false);
  const [failedHabitIds, setFailedHabitIds] = useState<Set<string>>(new Set());
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const scrollY = useMemo(() => new Animated.Value(0), []);

  const incompleteHabits = useMemo(() => habits?.filter((h) => !h.completed) ?? [], [habits]);

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
          <View style={{ flex: 1 }}>
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
            <ThemedText variant="screenTitle">{t('tabs.today')}</ThemedText>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
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
        {/* Coach insight (placeholder until Phase H) */}
        <CoachInsightCard
          primaryActionLabel={t('today.talkToCoach')}
          onPrimaryAction={() => router.push('/(app)/(tabs)/coach')}
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
                <Button onPress={() => router.push('/(app)/(tabs)/plan')}>
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
      </ScrollView>
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
