/**
 * Saved items hooks — React Query queries and mutations.
 *
 * Save/remove mutations optimistically update the article detail cache's
 * `isSaved` flag (so the reader's save button reflects state immediately) and
 * invalidate the saved lists so the Saved segment stays fresh.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type {
  ArticleResponse,
  SaveItemRequest,
  SavedItemsDetailedResponse,
  SavedItemsResponse,
} from '@/core/api/schemas';
import { articleKeys, savedKeys } from '@/core/query/query-keys';

import { listSaved, listSavedDetailed, removeSaved, saveItem } from './api';

export function useSaved(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: savedKeys.list(params),
    queryFn: () => listSaved(params),
    select: (data) => data.data,
    staleTime: 60 * 1000,
  });
}

export function useSavedDetailed(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: savedKeys.listDetailed(params),
    queryFn: () => listSavedDetailed(params),
    select: (data) => data.data,
    staleTime: 60 * 1000,
  });
}

export function useSaveItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SaveItemRequest) => saveItem(data),
    onMutate: async (data: SaveItemRequest) => {
      // Optimistically flip isSaved on the article detail cache.
      if (data.itemType === 'article') {
        await queryClient.cancelQueries({ queryKey: articleKeys.detail(data.itemId) });
        const previous = queryClient.getQueryData<ArticleResponse>(articleKeys.detail(data.itemId));
        queryClient.setQueryData<ArticleResponse | undefined>(
          articleKeys.detail(data.itemId),
          (old) => {
            if (!old) return old;
            return { ...old, data: { ...old.data, isSaved: true } };
          },
        );
        return { previous };
      }
      return {};
    },
    onError: (_error, data, context) => {
      if (context?.previous) {
        queryClient.setQueryData(articleKeys.detail(data.itemId), context.previous);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: savedKeys.all });
      queryClient.invalidateQueries({ queryKey: articleKeys.lists() });
    },
  });
}

export function useRemoveSaved() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => removeSaved(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: savedKeys.all });
      const previousList = queryClient.getQueriesData<SavedItemsResponse>({
        queryKey: savedKeys.all,
      });
      const previousDetailed = queryClient.getQueriesData<SavedItemsDetailedResponse>({
        queryKey: savedKeys.all,
      });
      queryClient.setQueriesData<SavedItemsResponse | undefined>(
        { queryKey: savedKeys.list() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.filter((s) => s.id !== id),
            page: { ...old.page, total: Math.max(0, old.page.total - 1) },
          };
        },
      );
      queryClient.setQueriesData<SavedItemsDetailedResponse | undefined>(
        { queryKey: savedKeys.listDetailed() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.filter((s) => s.id !== id),
            page: { ...old.page, total: Math.max(0, old.page.total - 1) },
          };
        },
      );
      return { previousList, previousDetailed };
    },
    onError: (_error, _id, context) => {
      if (context?.previousList) {
        for (const [key, value] of context.previousList) queryClient.setQueryData(key, value);
      }
      if (context?.previousDetailed) {
        for (const [key, value] of context.previousDetailed) queryClient.setQueryData(key, value);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: savedKeys.all });
      queryClient.invalidateQueries({ queryKey: articleKeys.lists() });
    },
  });
}
