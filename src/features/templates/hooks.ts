/**
 * Templates hooks — React Query queries for habit and goal templates.
 */
import { useQuery } from '@tanstack/react-query';

import { templateKeys } from '@/core/query/query-keys';

import { listGoalTemplates, listHabitTemplates } from './api';

export function useHabitTemplates() {
  return useQuery({
    queryKey: templateKeys.habit(),
    queryFn: () => listHabitTemplates(),
    select: (data) => data.data,
    staleTime: 10 * 60 * 1000,
  });
}

export function useGoalTemplates() {
  return useQuery({
    queryKey: templateKeys.goal(),
    queryFn: () => listGoalTemplates(),
    select: (data) => data.data,
    staleTime: 10 * 60 * 1000,
  });
}
