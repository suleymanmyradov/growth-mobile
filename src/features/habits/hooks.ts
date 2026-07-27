/**
 * Habits hooks — React Query queries and mutations.
 *
 * Mutations invalidate habits, check-ins, activity, and billing queries to
 * preserve the web behavior where habit/check-in changes affect related domains.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { checkInKeys, habitKeys, activityKeys, billingKeys } from '@/core/query/query-keys';
import type { CreateHabitRequest, HabitsResponse, UpdateHabitRequest } from '@/core/api/schemas';

import { createHabit, deleteHabit, listHabits, resetTodayHabits, updateHabit } from './api';

export function useHabits() {
  return useQuery({
    queryKey: habitKeys.list(),
    queryFn: () => listHabits(),
    select: (data) => data.data,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateHabitRequest) => createHabit(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitKeys.all });
      queryClient.invalidateQueries({ queryKey: billingKeys.all });
    },
  });
}

export function useUpdateHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateHabitRequest }) => updateHabit(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: habitKeys.all });
      queryClient.invalidateQueries({ queryKey: habitKeys.detail(variables.id) });
    },
  });
}

export function useDeleteHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteHabit(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: habitKeys.lists() });
      const previous = queryClient.getQueriesData<HabitsResponse>({ queryKey: habitKeys.lists() });
      queryClient.setQueriesData<HabitsResponse | undefined>(
        { queryKey: habitKeys.lists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.filter((h) => h.id !== id),
            page: { ...old.page, total: Math.max(0, old.page.total - 1) },
          };
        },
      );
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        for (const [key, value] of context.previous) {
          queryClient.setQueryData(key, value);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitKeys.all });
      queryClient.invalidateQueries({ queryKey: checkInKeys.all });
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
      queryClient.invalidateQueries({ queryKey: billingKeys.all });
    },
  });
}

export function useResetTodayHabits() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => resetTodayHabits(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitKeys.all });
      queryClient.invalidateQueries({ queryKey: checkInKeys.all });
    },
  });
}
