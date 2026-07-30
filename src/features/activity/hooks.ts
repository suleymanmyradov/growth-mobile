/**
 * Activity hooks — React Query queries.
 */
import { useQuery } from '@tanstack/react-query';

import { activityKeys } from '@/core/query/query-keys';

import { listActivity } from './api';

export function useActivity(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: activityKeys.list(params),
    queryFn: () => listActivity(params),
    staleTime: 2 * 60 * 1000,
  });
}
