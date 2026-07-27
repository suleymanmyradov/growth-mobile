/**
 * Categories hooks — React Query wrappers.
 */
import { useQuery } from '@tanstack/react-query';

import { categoryKeys } from '@/core/query/query-keys';

import { listCategories, type Category } from './api';

/**
 * Fetch the list of categories from the DB. Categories rarely change.
 */
export function useCategories(entityType: 'habit' | 'goal' | 'article' = 'habit') {
  return useQuery({
    queryKey: categoryKeys.list(entityType),
    queryFn: () => listCategories(entityType),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Convenience selector returning just the slugs, sorted by sortOrder.
 */
export function useCategorySlugs(entityType: 'habit' | 'goal' | 'article' = 'habit'): string[] {
  const { data } = useCategories(entityType);
  if (!data) return [];
  return [...data].sort((a, b) => a.sortOrder - b.sortOrder).map((c: Category) => c.slug);
}
