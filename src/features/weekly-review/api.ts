/**
 * Weekly Review API — list, current, generate, detail, and streaming generation.
 *
 * Streaming generation uses the SSE client (`src/core/api/sse-client.ts`) to
 * open `/weekly-reviews/generate-stream` and consume SSE events. The stream
 * emits `delta` events (partial AI summary text), a `complete` event with the
 * full review, and `error` events.
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
import { parseSSEStream } from '@/core/api/sse';
import { openSSEStream } from '@/core/api/sse-client';

export type {
    GenerateWeeklyReviewRequest,
    WeeklyReview,
    WeeklyReviewResponse,
    WeeklyReviewsResponse
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

/**
 * Streaming weekly review generation. Opens an SSE stream to
 * `/weekly-reviews/generate-stream` and yields events as they arrive.
 *
 * Event types:
 * - `delta`: `{ text: string }` — partial AI summary text
 * - `complete`: `{ review: WeeklyReview }` — the full generated review
 * - `error`: `{ message: string }` — stream error
 */
export async function* generateWeeklyReviewStream(
  data: GenerateWeeklyReviewRequest | undefined,
  signal?: AbortSignal,
): AsyncGenerator<WeeklyReviewStreamEvent> {
  const validated = GenerateWeeklyReviewRequestSchema.parse(data ?? {});
  const body = await openSSEStream({
    path: weeklyReviewEndpoints.generateStream,
    body: validated,
    signal,
  });

  for await (const event of parseSSEStream(body, signal)) {
    if (event.event === 'delta' || event.event === 'complete' || event.event === 'error') {
      try {
        const data = event.data ? JSON.parse(event.data) : {};
        if (event.event === 'delta') {
          yield { type: 'delta', text: data.text ?? data.delta ?? '' };
        } else if (event.event === 'complete') {
          const review = WeeklyReviewResponseSchema.parse(data).data;
          yield { type: 'complete', review };
        } else {
          yield { type: 'error', message: data.message ?? 'Stream error' };
        }
      } catch {
        // Ignore malformed events — the stream continues.
      }
    }
  }
}

export type WeeklyReviewStreamEvent =
  | { type: 'delta'; text: string }
  | { type: 'complete'; review: WeeklyReview }
  | { type: 'error'; message: string };
