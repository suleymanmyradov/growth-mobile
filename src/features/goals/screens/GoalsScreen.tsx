/**
 * Goals screen — list, create, edit, delete, toggle complete.
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
import { useCreateGoal, useDeleteGoal, useGoals, useToggleGoal, useUpdateGoal } from '../hooks';

export function GoalsScreen() {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();

  const { data: goals, isLoading, isError, error, refetch } = useGoals();
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();
  const toggleGoal = useToggleGoal();

  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const handleCreate = (values: GoalFormValues) => {
    createGoal.mutate(values, { onSuccess: () => setShowForm(false) });
  };

  const handleUpdate = (values: GoalFormValues) => {
    if (!editingGoal) return;
    updateGoal.mutate(
      { id: editingGoal.id, data: values },
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
            />
          ))
        )}
      </View>
    </Screen>
  );
}

// (no styles needed — layout is inline)
