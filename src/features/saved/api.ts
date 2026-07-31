/**
 * Saved items API — list, listDetailed, save, remove.
 *
 * Saved items are user-scoped bookmarks across articles/goals/habits. The
 * detailed endpoint hydrates the referenced entity so the Library Saved
 * segment can render rows without N+1 fetches.
 */
import { apiRequest } from '@/core/api/client';
import { savedEndpoints } from '@/core/api/endpoints';
import {
  SaveItemRequestSchema,
  SavedItemDetailedSchema,
  SavedItemResponseSchema,
  SavedItemsDetailedResponseSchema,
  SavedItemsResponseSchema,
  type SaveItemRequest,
  type SavedItem,
  type SavedItemDetailed,
  type SavedItemResponse,
  type SavedItemsDetailedResponse,
  type SavedItemsResponse,
} from '@/core/api/schemas';

export type {
  SaveItemRequest,
  SavedItem,
  SavedItemDetailed,
  SavedItemResponse,
  SavedItemsDetailedResponse,
  SavedItemsResponse,
};

export async function listSaved(params?: {
  page?: number;
  limit?: number;
}): Promise<SavedItemsResponse> {
  const response = await apiRequest<unknown>({
    method: 'GET',
    url: savedEndpoints.list,
    params: { page: 1, limit: 20, ...params },
  });
  return SavedItemsResponseSchema.parse(response);
}

export async function listSavedDetailed(params?: {
  page?: number;
  limit?: number;
}): Promise<SavedItemsDetailedResponse> {
  const response = await apiRequest<unknown>({
    method: 'GET',
    url: savedEndpoints.listDetailed,
    params: { page: 1, limit: 20, ...params },
  });
  return SavedItemsDetailedResponseSchema.parse(response);
}

export async function saveItem(data: SaveItemRequest): Promise<SavedItemResponse> {
  const validated = SaveItemRequestSchema.parse(data);
  const response = await apiRequest<unknown>({
    method: 'POST',
    url: savedEndpoints.save,
    data: validated,
  });
  return SavedItemResponseSchema.parse(response);
}

export async function removeSaved(id: string): Promise<void> {
  await apiRequest<unknown>({
    method: 'DELETE',
    url: savedEndpoints.remove(encodeURIComponent(id)),
  });
}

export { SavedItemDetailedSchema };
