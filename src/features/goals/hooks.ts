/**
 * Goals hooks — React Query queries and mutations.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { CreateGoalRequest, GoalsResponse, UpdateGoalRequest } from '@/core/api/schemas';
import { activityKeys, billingKeys, goalKeys } from '@/core/query/query-keys';

import {
  createGoal,
  createMilestone,
  deleteGoal,
  deleteMilestone,
  listGoals,
  logGoalValue,
  toggleGoal,
  toggleMilestone,
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

/**
 * Log a new current value for a numeric goal (recomputes progress server-side).
 */
export function useLogGoalValue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, value }: { id: string; value: number }) => logGoalValue(id, value),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: goalKeys.all });
      queryClient.invalidateQueries({ queryKey: goalKeys.detail(variables.id) });
    },
  });
}

/**
 * Create a milestone step for a milestone-type goal.
 */
export function useCreateMilestone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, title, sortOrder }: { id: string; title: string; sortOrder?: number }) =>
      createMilestone(id, title, sortOrder),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: goalKeys.all });
      queryClient.invalidateQueries({ queryKey: goalKeys.detail(variables.id) });
    },
  });
}

/**
 * Toggle a milestone's done/not-done state (recomputes goal progress).
 */
export function useToggleMilestone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, milestoneId }: { id: string; milestoneId: string }) =>
      toggleMilestone(id, milestoneId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: goalKeys.all });
      queryClient.invalidateQueries({ queryKey: goalKeys.detail(variables.id) });
    },
  });
}

/**
 * Delete a milestone step (recomputes goal progress).
 */
export function useDeleteMilestone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, milestoneId }: { id: string; milestoneId: string }) =>
      deleteMilestone(id, milestoneId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: goalKeys.all });
      queryClient.invalidateQueries({ queryKey: goalKeys.detail(variables.id) });
    },
  });
}
