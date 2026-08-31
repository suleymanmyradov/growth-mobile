/**
 * Check-ins hooks — today's check-ins, create, check-in all.
 *
 * Optimistic updates mirror the web frontend: a 'completed' check-in
 * immediately flips the habit card to "Done Today" and bumps the streak
 * locally. The server recomputes the authoritative streak on invalidate.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { HabitsResponse } from '@/core/api/schemas';
import { activityKeys, checkInKeys, habitKeys } from '@/core/query/query-keys';

import { createCheckIn, deleteCheckIn, getTodayCheckIns, type CreateCheckInRequest } from './api';

export function useTodayCheckIns() {
  return useQuery({
    queryKey: checkInKeys.today(),
    queryFn: () => getTodayCheckIns(),
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCheckInRequest) => createCheckIn(data),
    onMutate: async (data: CreateCheckInRequest) => {
      if (data.status !== 'completed') return {};
      await queryClient.cancelQueries({ queryKey: habitKeys.lists() });
      const previous = queryClient.getQueriesData<HabitsResponse>({ queryKey: habitKeys.lists() });
      queryClient.setQueriesData<HabitsResponse | undefined>(
        { queryKey: habitKeys.lists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((h) =>
              h.id === data.habitId ? { ...h, completed: true, streak: h.streak + 1 } : h,
            ),
          };
        },
      );
      return { previous };
    },
    onError: (_error, _data, context) => {
      if (context?.previous) {
        for (const [key, value] of context.previous) {
          queryClient.setQueryData(key, value);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: checkInKeys.all });
      queryClient.invalidateQueries({ queryKey: habitKeys.all });
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
}

export function useCheckInAll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ habitIds }: { habitIds: string[] }) => {
      const results = await Promise.allSettled(
        habitIds.map((habitId) =>
          createCheckIn({ habitId, status: 'completed' } satisfies CreateCheckInRequest),
        ),
      );
      return results;
    },
    onMutate: async ({ habitIds }: { habitIds: string[] }) => {
      await queryClient.cancelQueries({ queryKey: habitKeys.lists() });
      const previous = queryClient.getQueriesData<HabitsResponse>({ queryKey: habitKeys.lists() });
      const completedSet = new Set(habitIds);
      queryClient.setQueriesData<HabitsResponse | undefined>(
        { queryKey: habitKeys.lists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((h) =>
              completedSet.has(h.id) ? { ...h, completed: true, streak: h.streak + 1 } : h,
            ),
          };
        },
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) {
        for (const [key, value] of context.previous) {
          queryClient.setQueryData(key, value);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: checkInKeys.all });
      queryClient.invalidateQueries({ queryKey: habitKeys.all });
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
}

/**
 * Undo (delete) today's check-in for a habit.
 *
 * Optimistically reverts the habit to not-completed and decrements the streak.
 * A 404 "not_found" means there was no check-in to undo (e.g. already undone
 * from another session) — the optimistic state is already correct, so we
 * invalidate without rolling back.
 */
export function useDeleteCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (habitId: string) => deleteCheckIn(habitId),
    onMutate: async (habitId: string) => {
      await queryClient.cancelQueries({ queryKey: habitKeys.lists() });
      const previous = queryClient.getQueriesData<HabitsResponse>({ queryKey: habitKeys.lists() });
      queryClient.setQueriesData<HabitsResponse | undefined>(
        { queryKey: habitKeys.lists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((h) =>
              h.id === habitId ? { ...h, completed: false, streak: Math.max(0, h.streak - 1) } : h,
            ),
          };
        },
      );
      return { previous };
    },
    onError: (_error, _habitId, context) => {
      if (context?.previous) {
        for (const [key, value] of context.previous) {
          queryClient.setQueryData(key, value);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: checkInKeys.all });
      queryClient.invalidateQueries({ queryKey: habitKeys.all });
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
}
