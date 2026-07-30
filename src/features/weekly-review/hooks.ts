/**
 * Weekly Review hooks — React Query queries.
 *
 * Streaming generation is deferred to Phase H. The non-streaming generate
 * mutation is exposed for Progress to trigger a synchronous refresh when the
 * user requests it.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { weeklyReviewKeys, activityKeys } from '@/core/query/query-keys';
import type { GenerateWeeklyReviewRequest } from '@/core/api/schemas';

import { generateWeeklyReview, getCurrentWeeklyReview, listWeeklyReviews } from './api';

export function useCurrentWeeklyReview() {
  return useQuery({
    queryKey: weeklyReviewKeys.current(),
    queryFn: () => getCurrentWeeklyReview(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useWeeklyReviews(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: weeklyReviewKeys.list(params),
    queryFn: () => listWeeklyReviews(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useGenerateWeeklyReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data?: GenerateWeeklyReviewRequest) => generateWeeklyReview(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: weeklyReviewKeys.all });
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
}
