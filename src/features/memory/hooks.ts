/**
 * Memory Facts hooks — React Query queries and mutations.
 *
 * Mirrors the web frontend's use-memory-facts hooks: list, add, forget
 * (single), forget all. All mutations invalidate the memory-facts list.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { AddMemoryFactRequest } from '@/core/api/schemas';
import { memoryFactKeys } from '@/core/query/query-keys';

import { addMemoryFact, forgetAllMemoryFacts, forgetMemoryFact, listMemoryFacts } from './api';

export function useMemoryFacts(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: memoryFactKeys.list(params),
    queryFn: () => listMemoryFacts(params),
    select: (data) => data.data,
    staleTime: 60 * 1000,
  });
}

export function useAddMemoryFact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddMemoryFactRequest) => addMemoryFact(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memoryFactKeys.all });
    },
  });
}

export function useForgetMemoryFact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => forgetMemoryFact(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memoryFactKeys.all });
    },
  });
}

export function useForgetAllMemoryFacts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => forgetAllMemoryFacts(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memoryFactKeys.all });
    },
  });
}
