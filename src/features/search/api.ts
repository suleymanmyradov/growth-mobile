/**
 * Search API — gateway search across articles/goals/habits.
 *
 * The gateway delegates to the search microservice (Meilisearch). Results are
 * relevance-ordered with optional highlights. The `itemType` filter restricts
 * to one entity kind.
 */
import { apiRequest } from '@/core/api/client';
import { searchEndpoints } from '@/core/api/endpoints';
import { SearchResponseSchema, type SearchResponse, type SearchResult } from '@/core/api/schemas';

export type { SearchResponse, SearchResult };

export async function search(params: {
  q: string;
  itemType?: string;
  page?: number;
  limit?: number;
}): Promise<SearchResponse> {
  const response = await apiRequest<unknown>({
    method: 'GET',
    url: searchEndpoints.search,
    params: {
      page: 1,
      limit: 20,
      q: params.q,
      ...(params.itemType ? { type: params.itemType } : {}),
    },
  });
  return SearchResponseSchema.parse(response);
}
