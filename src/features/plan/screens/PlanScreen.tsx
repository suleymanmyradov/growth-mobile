/**
 * PlanScreen — the Plan tab composition.
 *
 * Paper (`mobile.md` §8.2): combines goal-oriented planning and habit
 * management while preserving domain boundaries. Header shows goal/habit
 * counts and All/Active/Completed filters (Paused is deferred — the backend
 * has no paused state for goals or habits; no fabricated content). Goal cards
 * show title, percentage, progress bar, due metadata, and the habits that
 * serve the goal (nested via `goal.relatedHabitIds`). Untied habits appear
 * under "Not tied to a goal" with a "Link a goal" affordance. A 56-unit sage
 * FAB opens a sheet to create a habit or goal. Paused/completed states use a
 * label + icon, not opacity alone.
 *
 * Domain boundary: composition screen in `features/plan`. Imports only PUBLIC
 * hooks/components from `features/habits`, `features/goals`, `features/check-ins`,
 * and `features/categories`. Does not import feature internals.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle2, Plus, Target } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError } from '@/core/api/errors';
import type { Goal, Habit } from '@/core/api/schemas';
import {
    Button,
    Card,
    EmptyState,
    ErrorState,
    SectionLabel,
    SegmentedTabs,
    Sheet,
    Skeleton,
    ThemedText,
    type Segment,
} from '@/design-system';
import { useTheme } from '@/design-system/theme';
import { useCreateCheckIn } from '@/features/check-ins';
import {
    GoalCard,
    GoalForm,
    useCreateGoal,
    useDeleteGoal,
    useGoals,
    useToggleGoal,
    useUpdateGoal,
    type GoalFormValues,
} from '@/features/goals';
import {
    HabitCard,
    HabitForm,
    useCreateHabit,
    useDeleteHabit,
    useHabits,
    useUpdateHabit,
    type HabitFormValues,
} from '@/features/habits';

import { LinkGoalSheet } from '../components/LinkGoalSheet';
import {
    filterGoalsByLifecycle,
    getHabitsForGoal,
    getUntiedHabits,
    type Filter,
} from '../grouping';

type FormKind = 'habit' | 'goal';

export function PlanScreen(): React.ReactNode {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors, spacing, radius } = useTheme();
  const { create, name: tplName, description: tplDescription, category: tplCategory } =
    useLocalSearchParams<{
      create?: string;
      name?: string;
      description?: string;
      category?: string;
    }>();

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

  const createHabit = useCreateHabit();
  const updateHabit = useUpdateHabit();
  const deleteHabit = useDeleteHabit();
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();
  const toggleGoal = useToggleGoal();
  const createCheckIn = useCreateCheckIn();

  const [filter, setFilter] = useState<Filter>('all');
  const [fabOpen, setFabOpen] = useState(false);
  const [formKind, setFormKind] = useState<FormKind | null>(() =>
    create === 'habit' ? 'habit' : create === 'goal' ? 'goal' : null,
  );
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [linkHabit, setLinkHabit] = useState<Habit | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const activeFormKind: FormKind | null =
    create === 'habit' ? 'habit' : create === 'goal' ? 'goal' : formKind;

  // Template pre-fill values passed from the Library Templates segment.
  const templateInitialValues = useMemo(() => {
    if (!create) return undefined;
    return {
      name: tplName ?? undefined,
      title: tplName ?? undefined,
      description: tplDescription ?? undefined,
      category: tplCategory ?? undefined,
    };
  }, [create, tplName, tplDescription, tplCategory]);

  // Map habit id → habit for nesting under goals.
  const habitById = useMemo(() => {
    const m = new Map<string, Habit>();
    habits?.forEach((h) => m.set(h.id, h));
    return m;
  }, [habits]);

  const untiedHabits = useMemo(() => getUntiedHabits(habits ?? [], goals ?? []), [habits, goals]);

  const filterSegments: Segment[] = [
    { id: 'all', label: t('plan.filterAll') },
    { id: 'active', label: t('plan.filterActive') },
    { id: 'completed', label: t('plan.filterCompleted') },
  ];

  const filteredGoals = useMemo(() => filterGoalsByLifecycle(goals ?? [], filter), [goals, filter]);
  const filteredUntied = untiedHabits;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchHabits(), refetchGoals()]);
    } finally {
      setRefreshing(false);
    }
  };

  const openCreateHabit = () => {
    setFabOpen(false);
    setEditingHabit(null);
    setFormKind('habit');
  };
  const openCreateGoal = () => {
    setFabOpen(false);
    setEditingGoal(null);
    setFormKind('goal');
  };

  const handleHabitSubmit = (values: HabitFormValues) => {
    if (editingHabit) {
      updateHabit.mutate(
        { id: editingHabit.id, data: values },
        { onSuccess: () => closeForm() },
      );
    } else {
      createHabit.mutate(values, { onSuccess: () => closeForm() });
    }
  };

  const handleGoalSubmit = (values: GoalFormValues) => {
    if (editingGoal) {
      updateGoal.mutate(
        { id: editingGoal.id, data: values },
        { onSuccess: () => closeForm() },
      );
    } else {
      createGoal.mutate(values, { onSuccess: () => closeForm() });
    }
  };

  const handleDeleteHabit = (habit: Habit) => {
    Alert.alert(t('common.delete'), t('habits.deleteHabitConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => deleteHabit.mutate(habit.id),
      },
    ]);
  };

  const handleDeleteGoal = (goal: Goal) => {
    Alert.alert(t('common.delete'), t('goals.deleteGoalConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => deleteGoal.mutate(goal.id) },
    ]);
  };

  const handleCheckIn = (habit: Habit) => {
    createCheckIn.mutate({ habitId: habit.id, status: 'completed' });
  };

  const closeForm = () => {
    setFormKind(null);
    setEditingHabit(null);
    setEditingGoal(null);
    if (create) router.replace('/(app)/(tabs)/plan');
  };

  const goalCount = goals?.length ?? 0;
  const habitCount = habits?.length ?? 0;

  // ─── Form overlay (full-screen) ────────────────────────────────────────────
  if (activeFormKind === 'habit') {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['top']}
      >
        <View style={[styles.formHeader, { borderBottomColor: colors.border }]}>
          <Pressable
            onPress={closeForm}
            accessibilityRole="button"
            accessibilityLabel={t('common.cancel')}
            hitSlop={8}
            style={{ padding: 8, minHeight: 44, justifyContent: 'center' }}
          >
            <ThemedText variant="label" style={{ color: colors.mutedForeground }}>
              {t('common.cancel')}
            </ThemedText>
          </Pressable>
          <ThemedText variant="sectionTitle">
            {editingHabit ? t('habits.editHabit') : t('habits.createHabit')}
          </ThemedText>
          <View style={{ width: 60 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: spacing.xl }}>
          <HabitForm
            initialValues={editingHabit ?? templateInitialValues}
            onSubmit={handleHabitSubmit}
            onCancel={closeForm}
            submitting={createHabit.isPending || updateHabit.isPending}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (activeFormKind === 'goal') {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['top']}
      >
        <View style={[styles.formHeader, { borderBottomColor: colors.border }]}>
          <Pressable
            onPress={closeForm}
            accessibilityRole="button"
            accessibilityLabel={t('common.cancel')}
            hitSlop={8}
            style={{ padding: 8, minHeight: 44, justifyContent: 'center' }}
          >
            <ThemedText variant="label" style={{ color: colors.mutedForeground }}>
              {t('common.cancel')}
            </ThemedText>
          </Pressable>
          <ThemedText variant="sectionTitle">
            {editingGoal ? t('goals.editGoal') : t('goals.createGoal')}
          </ThemedText>
          <View style={{ width: 60 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: spacing.xl }}>
          <GoalForm
            initialValues={editingGoal ?? templateInitialValues}
            onSubmit={handleGoalSubmit}
            onCancel={closeForm}
            submitting={createGoal.isPending || updateGoal.isPending}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Main Plan list ────────────────────────────────────────────────────────
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <View
        style={[styles.header, { paddingHorizontal: spacing.xl, borderBottomColor: colors.border }]}
      >
        <ThemedText variant="screenTitle">{t('tabs.plan')}</ThemedText>
        <ThemedText variant="meta" style={{ color: colors.mutedForeground }}>
          {t('plan.counts', { goals: goalCount, habits: habitCount })}
        </ThemedText>
        <View style={{ marginTop: spacing.sm }}>
          <SegmentedTabs
            segments={filterSegments}
            value={filter}
            onChange={(id) => setFilter(id as Filter)}
          />
        </View>
      </View>

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
          paddingBottom: 96,
        }}
      >
        {/* Goals with nested habits */}
        {goalsLoading ? (
          <View style={{ gap: spacing.md }}>
            <SectionLabel>{t('plan.goalsSection')}</SectionLabel>
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
          <ErrorState
            message={goalsErr instanceof ApiError ? goalsErr.message : undefined}
            onRetry={() => refetchGoals()}
          />
        ) : filteredGoals.length > 0 ? (
          <View style={{ gap: spacing.md }}>
            <SectionLabel>{t('plan.goalsSection')}</SectionLabel>
            {filteredGoals.map((goal) => {
              const nestedHabits = getHabitsForGoal(goal, habitById);
              return (
                <View key={goal.id} style={{ gap: spacing.sm }}>
                  <GoalCard
                    goal={goal}
                    onToggle={() => toggleGoal.mutate(goal.id)}
                    onEdit={() => {
                      setEditingGoal(goal);
                      setFormKind('goal');
                    }}
                    onDelete={() => handleDeleteGoal(goal)}
                  />
                  {nestedHabits.length > 0 ? (
                    <View style={{ paddingLeft: spacing.md, gap: spacing.xs }}>
                      {nestedHabits.map((habit) => (
                        <HabitCard
                          key={habit.id}
                          habit={habit}
                          onCheckIn={() => handleCheckIn(habit)}
                          onEdit={() => {
                            setEditingHabit(habit);
                            setFormKind('habit');
                          }}
                          onDelete={() => handleDeleteHabit(habit)}
                          checkInLoading={createCheckIn.isPending}
                        />
                      ))}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        ) : !goalsLoading && goalCount === 0 ? (
          <EmptyState
            title={t('plan.noGoalsTitle')}
            subtitle={t('plan.noGoalsBody')}
            action={
              <Button onPress={openCreateGoal}>
                <Target color={colors.accentForeground} size={16} /> {t('goals.createGoal')}
              </Button>
            }
          />
        ) : null}

        {/* Untied habits */}
        {habitsLoading ? (
          <View style={{ gap: spacing.md }}>
            <SectionLabel>{t('plan.untiedSection')}</SectionLabel>
            {[0, 1].map((i) => (
              <Card key={i}>
                <Skeleton style={{ width: '60%', height: 16 }} />
              </Card>
            ))}
          </View>
        ) : habitsError ? (
          <ErrorState
            message={habitsErr instanceof ApiError ? habitsErr.message : undefined}
            onRetry={() => refetchHabits()}
          />
        ) : filteredUntied.length > 0 ? (
          <View style={{ gap: spacing.md }}>
            <SectionLabel>{t('plan.untiedSection')}</SectionLabel>
            {filteredUntied.map((habit) => (
              <View key={habit.id} style={{ gap: spacing.xs }}>
                <HabitCard
                  habit={habit}
                  onCheckIn={() => handleCheckIn(habit)}
                  onEdit={() => {
                    setEditingHabit(habit);
                    setFormKind('habit');
                  }}
                  onDelete={() => handleDeleteHabit(habit)}
                  checkInLoading={createCheckIn.isPending}
                />
                <Pressable
                  onPress={() => setLinkHabit(habit)}
                  accessibilityRole="button"
                  accessibilityLabel={t('plan.linkGoal')}
                  hitSlop={8}
                  style={{
                    alignSelf: 'flex-start',
                    padding: 8,
                    minHeight: 44,
                    justifyContent: 'center',
                  }}
                >
                  <ThemedText variant="label" style={{ color: colors.accent }}>
                    {t('plan.linkGoal')}
                  </ThemedText>
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}

        {/* Empty state when both goals and habits are empty */}
        {!goalsLoading && !habitsLoading && goalCount === 0 && habitCount === 0 ? (
          <EmptyState
            title={t('plan.emptyTitle')}
            subtitle={t('plan.emptyBody')}
            action={
              <Button onPress={() => setFabOpen(true)}>
                <Plus color={colors.accentForeground} size={16} /> {t('plan.create')}
              </Button>
            }
          />
        ) : null}
      </ScrollView>

      {/* Floating action button (56-unit sage) */}
      <Pressable
        onPress={() => setFabOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={t('plan.create')}
        style={[styles.fab, { backgroundColor: colors.accent, borderRadius: radius.pill }]}
      >
        <Plus color={colors.accentForeground} size={24} />
      </Pressable>

      {/* FAB choice sheet */}
      <Sheet open={fabOpen} onClose={() => setFabOpen(false)} snapPoints={['30%']}>
        <View style={{ gap: spacing.md }}>
          <ThemedText variant="sectionTitle">{t('plan.createChoice')}</ThemedText>
          <Pressable
            onPress={openCreateHabit}
            accessibilityRole="button"
            accessibilityLabel={t('habits.createHabit')}
            style={[styles.choiceRow, { borderColor: colors.border, borderRadius: radius.field }]}
          >
            <CheckCircle2 color={colors.accent} size={20} />
            <ThemedText variant="rowTitle">{t('habits.createHabit')}</ThemedText>
          </Pressable>
          <Pressable
            onPress={openCreateGoal}
            accessibilityRole="button"
            accessibilityLabel={t('goals.createGoal')}
            style={[styles.choiceRow, { borderColor: colors.border, borderRadius: radius.field }]}
          >
            <Target color={colors.accent} size={20} />
            <ThemedText variant="rowTitle">{t('goals.createGoal')}</ThemedText>
          </Pressable>
        </View>
      </Sheet>

      {/* Link goal sheet */}
      <LinkGoalSheet
        open={linkHabit !== null}
        onClose={() => setLinkHabit(null)}
        habit={linkHabit}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingVertical: 8, gap: 4, borderBottomWidth: StyleSheet.hairlineWidth },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  choiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    minHeight: 44,
  },
});
