/**
 * Goals screen — list, create, edit, delete, toggle complete.
 *
 * Supports measurement-aware goals: numeric (log value), milestone
 * (create/toggle/delete milestones), and the default manual/binary/habit
 * progress bar.
 */
import { Plus } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, View } from 'react-native';

import { ApiError } from '@/core/api/errors';
import type { Goal } from '@/core/api/schemas';
import { Button, EmptyState, ErrorState, Screen, Spinner } from '@/design-system';
import { useTheme } from '@/design-system/theme';

import { GoalCard } from '../components/GoalCard';
import { GoalForm, type GoalFormValues } from '../components/GoalForm';
import {
  useCreateGoal,
  useCreateMilestone,
  useDeleteGoal,
  useDeleteMilestone,
  useGoals,
  useLogGoalValue,
  useToggleGoal,
  useToggleMilestone,
  useUpdateGoal,
} from '../hooks';

export function GoalsScreen() {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();

  const { data: goals, isLoading, isError, error, refetch } = useGoals();
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();
  const toggleGoal = useToggleGoal();
  const logGoalValue = useLogGoalValue();
  const createMilestone = useCreateMilestone();
  const toggleMilestone = useToggleMilestone();
  const deleteMilestone = useDeleteMilestone();

  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  // Convert form values to the API request shape.
  // On create: send milestoneTitles (array of strings).
  // On edit: send milestones (array of { id?, title }) for rename/reorder.
  const handleCreate = (values: GoalFormValues) => {
    const { milestones, ...rest } = values;
    createGoal.mutate(
      {
        ...rest,
        milestoneTitles:
          values.measurement === 'milestone'
            ? (milestones ?? []).map((m) => m.title).filter(Boolean)
            : undefined,
      },
      { onSuccess: () => setShowForm(false) },
    );
  };

  const handleUpdate = (values: GoalFormValues) => {
    if (!editingGoal) return;
    const { milestones, ...rest } = values;
    updateGoal.mutate(
      {
        id: editingGoal.id,
        data: {
          ...rest,
          milestones:
            values.measurement === 'milestone'
              ? (milestones ?? []).filter((m) => m.title.trim().length > 0)
              : undefined,
        },
      },
      {
        onSuccess: () => {
          setShowForm(false);
          setEditingGoal(null);
        },
      },
    );
  };

  const handleDelete = (goal: Goal) => {
    Alert.alert(t('common.delete'), t('goals.deleteGoalConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => deleteGoal.mutate(goal.id),
      },
    ]);
  };

  const handleLogValue = (goal: Goal, value: number) => {
    logGoalValue.mutate({ id: goal.id, value });
  };

  const handleAddMilestone = (goal: Goal, title: string) => {
    createMilestone.mutate({ id: goal.id, title });
  };

  const handleToggleMilestone = (goal: Goal, milestoneId: string) => {
    toggleMilestone.mutate({ id: goal.id, milestoneId });
  };

  const handleDeleteMilestone = (goal: Goal, milestoneId: string) => {
    deleteMilestone.mutate({ id: goal.id, milestoneId });
  };

  const headerRight = (
    <Pressable
      onPress={() => {
        setEditingGoal(null);
        setShowForm(true);
      }}
      accessibilityRole="button"
      accessibilityLabel={t('goals.createGoal')}
      hitSlop={8}
      style={{ padding: 8, minHeight: 44, justifyContent: 'center' }}
    >
      <Plus color={colors.primary} size={24} />
    </Pressable>
  );

  if (showForm) {
    return (
      <Screen
        title={editingGoal ? t('goals.editGoal') : t('goals.createGoal')}
        onBack={() => {
          setShowForm(false);
          setEditingGoal(null);
        }}
      >
        <GoalForm
          initialValues={editingGoal ?? undefined}
          onSubmit={editingGoal ? handleUpdate : handleCreate}
          onCancel={() => {
            setShowForm(false);
            setEditingGoal(null);
          }}
          submitting={createGoal.isPending || updateGoal.isPending}
          mode={editingGoal ? 'edit' : 'create'}
        />
      </Screen>
    );
  }

  return (
    <Screen
      title={t('goals.title')}
      subtitle={t('goals.subtitle')}
      headerRight={headerRight}
      scrollable
    >
      <View style={{ padding: spacing.md, gap: spacing.sm }}>
        {isLoading ? (
          <Spinner fullScreen label={t('common.loading')} />
        ) : isError ? (
          <ErrorState
            message={error instanceof ApiError ? error.message : undefined}
            onRetry={() => refetch()}
          />
        ) : !goals || goals.length === 0 ? (
          <EmptyState
            title={t('goals.empty')}
            action={
              <Button
                onPress={() => {
                  setEditingGoal(null);
                  setShowForm(true);
                }}
              >
                <Plus color={colors.background} size={18} /> {t('goals.createGoal')}
              </Button>
            }
          />
        ) : (
          goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onToggle={() => toggleGoal.mutate(goal.id)}
              onEdit={() => {
                setEditingGoal(goal);
                setShowForm(true);
              }}
              onDelete={() => handleDelete(goal)}
              onLogValue={(value) => handleLogValue(goal, value)}
              onAddMilestone={(title) => handleAddMilestone(goal, title)}
              onToggleMilestone={(milestoneId) => handleToggleMilestone(goal, milestoneId)}
              onDeleteMilestone={(milestoneId) => handleDeleteMilestone(goal, milestoneId)}
            />
          ))
        )}
      </View>
    </Screen>
  );
}

// (no styles needed — layout is inline)
