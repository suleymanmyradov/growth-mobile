/**
 * Categories API — list categories by entity type.
 *
 * Categories are a shared pool in the DB; the `entityType` query param is
 * accepted by the API but currently ignored server-side.
 */
import { apiRequest } from '@/core/api/client';
import { categoryEndpoints } from '@/core/api/endpoints';
import {
  CategoriesResponseSchema,
  type CategoriesResponse,
  type Category,
} from '@/core/api/schemas';

export type { Category, CategoriesResponse };

export async function listCategories(
  entityType: 'habit' | 'goal' | 'article' = 'habit',
): Promise<Category[]> {
  const response = await apiRequest<unknown>({
    method: 'GET',
    url: categoryEndpoints.list,
    params: { entityType },
  });
  const parsed = CategoriesResponseSchema.parse(response);
  return parsed.data;
}
