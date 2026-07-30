/**
 * Weekly Review API — list, current, generate, detail.
 *
 * Streaming generation (`/weekly-reviews/generate-stream`) is handled by the
 * SSE layer in `src/core/api/sse.ts` and is wired in Phase H alongside AI
 * coaching. This module covers only the JSON endpoints used by Progress.
 */
import { apiRequest } from '@/core/api/client';
import { weeklyReviewEndpoints } from '@/core/api/endpoints';
import {
  GenerateWeeklyReviewRequestSchema,
  WeeklyReviewResponseSchema,
  WeeklyReviewsResponseSchema,
  type GenerateWeeklyReviewRequest,
  type WeeklyReview,
  type WeeklyReviewResponse,
  type WeeklyReviewsResponse,
} from '@/core/api/schemas';

export type {
  GenerateWeeklyReviewRequest,
  WeeklyReview,
  WeeklyReviewResponse,
  WeeklyReviewsResponse,
};

export async function listWeeklyReviews(params?: {
  page?: number;
  limit?: number;
}): Promise<WeeklyReviewsResponse> {
  const response = await apiRequest<unknown>({
    method: 'GET',
    url: weeklyReviewEndpoints.list,
    params: { page: 1, limit: 20, ...params },
  });
  return WeeklyReviewsResponseSchema.parse(response);
}

export async function getCurrentWeeklyReview(): Promise<WeeklyReview> {
  const response = await apiRequest<unknown>({
    method: 'GET',
    url: weeklyReviewEndpoints.current,
  });
  return WeeklyReviewResponseSchema.parse(response).data;
}

export async function getWeeklyReview(weekStart: string): Promise<WeeklyReview> {
  const response = await apiRequest<unknown>({
    method: 'GET',
    url: weeklyReviewEndpoints.detail(encodeURIComponent(weekStart)),
  });
  return WeeklyReviewResponseSchema.parse(response).data;
}

export async function generateWeeklyReview(
  data?: GenerateWeeklyReviewRequest,
): Promise<WeeklyReview> {
  const validated = GenerateWeeklyReviewRequestSchema.parse(data ?? {});
  const response = await apiRequest<unknown>({
    method: 'POST',
    url: weeklyReviewEndpoints.generate,
    data: validated,
  });
  return WeeklyReviewResponseSchema.parse(response).data;
}
