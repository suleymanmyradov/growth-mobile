/**
 * Goals hooks — React Query queries and mutations.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { activityKeys, billingKeys, goalKeys } from '@/core/query/query-keys';
import type { CreateGoalRequest, GoalsResponse, UpdateGoalRequest } from '@/core/api/schemas';

import {
  createGoal,
  deleteGoal,
  listGoals,
  toggleGoal,
  updateGoal,
  updateGoalProgress,
} from './api';

export function useGoals() {
  return useQuery({
    queryKey: goalKeys.list(),
    queryFn: () => listGoals(),
    select: (data) => data.data,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateGoalRequest) => createGoal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.all });
      queryClient.invalidateQueries({ queryKey: billingKeys.all });
    },
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGoalRequest }) => updateGoal(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: goalKeys.all });
      queryClient.invalidateQueries({ queryKey: goalKeys.detail(variables.id) });
    },
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteGoal(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: goalKeys.lists() });
      const previous = queryClient.getQueriesData<GoalsResponse>({ queryKey: goalKeys.lists() });
      queryClient.setQueriesData<GoalsResponse | undefined>(
        { queryKey: goalKeys.lists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.filter((g) => g.id !== id),
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
      queryClient.invalidateQueries({ queryKey: goalKeys.all });
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
      queryClient.invalidateQueries({ queryKey: billingKeys.all });
    },
  });
}

export function useToggleGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => toggleGoal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.all });
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
}

export function useUpdateGoalProgress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, progress }: { id: string; progress: number }) =>
      updateGoalProgress(id, progress),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: goalKeys.all });
      queryClient.invalidateQueries({ queryKey: goalKeys.detail(variables.id) });
    },
  });
}
