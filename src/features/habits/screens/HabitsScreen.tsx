/**
 * Habits screen — list, create, edit, delete, daily check-in, reset today.
 *
 * Uses a bottom sheet for create/edit forms. Check-ins use the check-ins
 * feature hook. Mutations invalidate related domains.
 */
import { Plus, RotateCcw } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, View } from 'react-native';

import { ApiError } from '@/core/api/errors';
import { Button, EmptyState, ErrorState, Screen, Spinner, ThemedText } from '@/design-system';
import { useTheme } from '@/design-system/theme';
import { useCheckInAll, useCreateCheckIn } from '@/features/check-ins';

import type { Habit } from '@/core/api/schemas';
import { HabitCard } from '../components/HabitCard';
import { HabitForm, type HabitFormValues } from '../components/HabitForm';
import {
  useCreateHabit,
  useDeleteHabit,
  useHabits,
  useResetTodayHabits,
  useUpdateHabit,
} from '../hooks';

export function HabitsScreen() {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();

  const { data: habits, isLoading, isError, error, refetch } = useHabits();
  const createHabit = useCreateHabit();
  const updateHabit = useUpdateHabit();
  const deleteHabit = useDeleteHabit();
  const resetToday = useResetTodayHabits();
  const createCheckIn = useCreateCheckIn();
  const checkInAll = useCheckInAll();

  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const handleCreate = (values: HabitFormValues) => {
    createHabit.mutate(values, {
      onSuccess: () => setShowForm(false),
    });
  };

  const handleUpdate = (values: HabitFormValues) => {
    if (!editingHabit) return;
    updateHabit.mutate(
      { id: editingHabit.id, data: values },
      {
        onSuccess: () => {
          setShowForm(false);
          setEditingHabit(null);
        },
      },
    );
  };

  const handleDelete = (habit: Habit) => {
    Alert.alert(t('common.delete'), t('habits.deleteHabitConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => deleteHabit.mutate(habit.id),
      },
    ]);
  };

  const handleCheckIn = (habit: Habit) => {
    createCheckIn.mutate({ habitId: habit.id, status: 'completed' });
  };

  const handleCheckInAll = () => {
    if (!habits) return;
    const incomplete = habits.filter((h) => !h.completed).map((h) => h.id);
    if (incomplete.length === 0) return;
    checkInAll.mutate({ habitIds: incomplete });
  };

  const handleResetToday = () => {
    Alert.alert(t('habits.resetToday'), t('habits.resetTodayConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.confirm'), onPress: () => resetToday.mutate() },
    ]);
  };

  const headerRight = (
    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
      {habits && habits.some((h) => !h.completed) ? (
        <Pressable
          onPress={handleCheckInAll}
          accessibilityRole="button"
          accessibilityLabel={t('habits.checkInAll')}
          hitSlop={8}
          style={{ padding: 8, minHeight: 44, justifyContent: 'center' }}
        >
          <ThemedText style={{ color: colors.primary, fontWeight: '600' }}>
            {t('habits.checkInAll')}
          </ThemedText>
        </Pressable>
      ) : null}
      <Pressable
        onPress={handleResetToday}
        accessibilityRole="button"
        accessibilityLabel={t('habits.resetToday')}
        hitSlop={8}
        style={{ padding: 8, minHeight: 44, justifyContent: 'center' }}
      >
        <RotateCcw color={colors.secondaryText} size={20} />
      </Pressable>
      <Pressable
        onPress={() => {
          setEditingHabit(null);
          setShowForm(true);
        }}
        accessibilityRole="button"
        accessibilityLabel={t('habits.createHabit')}
        hitSlop={8}
        style={{ padding: 8, minHeight: 44, justifyContent: 'center' }}
      >
        <Plus color={colors.primary} size={24} />
      </Pressable>
    </View>
  );

  if (showForm) {
    return (
      <Screen
        title={editingHabit ? t('habits.editHabit') : t('habits.createHabit')}
        onBack={() => {
          setShowForm(false);
          setEditingHabit(null);
        }}
      >
        <HabitForm
          initialValues={editingHabit ?? undefined}
          onSubmit={editingHabit ? handleUpdate : handleCreate}
          onCancel={() => {
            setShowForm(false);
            setEditingHabit(null);
          }}
          submitting={createHabit.isPending || updateHabit.isPending}
        />
      </Screen>
    );
  }

  return (
    <Screen
      title={t('habits.title')}
      subtitle={t('habits.subtitle')}
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
        ) : !habits || habits.length === 0 ? (
          <EmptyState
            title={t('habits.empty')}
            action={
              <Button
                onPress={() => {
                  setEditingHabit(null);
                  setShowForm(true);
                }}
              >
                <Plus color={colors.background} size={18} /> {t('habits.createHabit')}
              </Button>
            }
          />
        ) : (
          habits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              onCheckIn={() => handleCheckIn(habit)}
              onEdit={() => {
                setEditingHabit(habit);
                setShowForm(true);
              }}
              onDelete={() => handleDelete(habit)}
              checkInLoading={createCheckIn.isPending}
            />
          ))
        )}
      </View>
    </Screen>
  );
}

// (no styles needed — layout is inline)
