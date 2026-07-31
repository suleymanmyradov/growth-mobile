/**
 * Articles hooks — React Query queries and mutations.
 *
 * Like mutation optimistically flips `isLiked`/`likeCount` on the article
 * detail and list caches, then invalidates so the server value wins. The
 * share mutation is fire-and-forget analytics; it does not mutate local data.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { ArticleResponse } from '@/core/api/schemas';
import { articleKeys } from '@/core/query/query-keys';

import { getArticle, getFeaturedArticle, likeArticle, listArticles, shareArticle } from './api';

export function useArticles(params?: { categorySlug?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: articleKeys.list(params),
    queryFn: () => listArticles(params),
    select: (data) => data.data,
    staleTime: 2 * 60 * 1000,
  });
}

export function useFeaturedArticle() {
  return useQuery({
    queryKey: articleKeys.featured(),
    queryFn: () => getFeaturedArticle(),
    select: (data) => data.data,
    staleTime: 5 * 60 * 1000,
  });
}

export function useArticle(id: string) {
  return useQuery({
    queryKey: articleKeys.detail(id),
    queryFn: () => getArticle(id),
    select: (data) => data.data,
    staleTime: 2 * 60 * 1000,
  });
}

export function useLikeArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => likeArticle(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: articleKeys.detail(id) });
      const previousDetail = queryClient.getQueryData<ArticleResponse>(articleKeys.detail(id));
      queryClient.setQueryData<ArticleResponse | undefined>(articleKeys.detail(id), (old) => {
        if (!old) return old;
        const isLiked = !old.data.isLiked;
        return {
          ...old,
          data: {
            ...old.data,
            isLiked,
            likeCount: Math.max(0, old.data.likeCount + (isLiked ? 1 : -1)),
          },
        };
      });
      return { previousDetail };
    },
    onError: (_error, id, context) => {
      if (context?.previousDetail) {
        queryClient.setQueryData(articleKeys.detail(id), context.previousDetail);
      }
    },
    onSuccess: (result, id) => {
      queryClient.setQueryData<ArticleResponse | undefined>(articleKeys.detail(id), (old) => {
        if (!old) return old;
        return {
          ...old,
          data: { ...old.data, isLiked: result.isLiked, likeCount: result.newLikeCount },
        };
      });
      queryClient.invalidateQueries({ queryKey: articleKeys.lists() });
    },
  });
}

export function useShareArticle() {
  return useMutation({
    mutationFn: ({ id, platform }: { id: string; platform: string }) => shareArticle(id, platform),
  });
}
