/**
 * Memory Facts API — list, add, forget (delete single), forget all.
 *
 * These are the durable facts the AI coach uses to personalize guidance.
 * User-authored facts outrank model-extracted ones.
 */
import { apiRequest } from '@/core/api/client';
import { memoryFactEndpoints } from '@/core/api/endpoints';
import {
  AddMemoryFactRequestSchema,
  ListMemoryFactsResponseSchema,
  MemoryFactResponseSchema,
  ForgetAllMemoryFactsResponseSchema,
  type AddMemoryFactRequest,
  type ForgetAllMemoryFactsResponse,
  type ListMemoryFactsResponse,
  type MemoryFact,
  type MemoryFactResponse,
} from '@/core/api/schemas';

export type {
  AddMemoryFactRequest,
  ForgetAllMemoryFactsResponse,
  ListMemoryFactsResponse,
  MemoryFact,
  MemoryFactResponse,
};

export async function listMemoryFacts(params?: {
  page?: number;
  limit?: number;
}): Promise<ListMemoryFactsResponse> {
  const response = await apiRequest<unknown>({
    method: 'GET',
    url: memoryFactEndpoints.list,
    params: { page: 1, limit: 100, ...params },
  });
  return ListMemoryFactsResponseSchema.parse(response);
}

export async function addMemoryFact(data: AddMemoryFactRequest): Promise<MemoryFact> {
  const validated = AddMemoryFactRequestSchema.parse(data);
  const response = await apiRequest<unknown>({
    method: 'POST',
    url: memoryFactEndpoints.create,
    data: validated,
  });
  return MemoryFactResponseSchema.parse(response).data;
}

export async function forgetMemoryFact(id: string): Promise<void> {
  await apiRequest<unknown>({
    method: 'DELETE',
    url: memoryFactEndpoints.detail(encodeURIComponent(id)),
  });
}

export async function forgetAllMemoryFacts(): Promise<ForgetAllMemoryFactsResponse> {
  const response = await apiRequest<unknown>({
    method: 'DELETE',
    url: memoryFactEndpoints.list,
    params: { confirm: true },
  });
  return ForgetAllMemoryFactsResponseSchema.parse(response);
}
