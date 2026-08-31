/**
 * Weekly Review hooks — React Query queries and streaming generation.
 *
 * The streaming hook (`useGenerateWeeklyReviewStream`) opens an SSE stream to
 * `/weekly-reviews/generate-stream`, accumulates partial AI summary text, and
 * invalidates the review query on completion. The non-streaming generate
 * mutation is also exposed for synchronous refresh.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';

import type { GenerateWeeklyReviewRequest, WeeklyReview } from '@/core/api/schemas';
import { activityKeys, weeklyReviewKeys } from '@/core/query/query-keys';

import {
    generateWeeklyReview,
    generateWeeklyReviewStream,
    getCurrentWeeklyReview,
    listWeeklyReviews,
    type WeeklyReviewStreamEvent,
} from './api';

export function useCurrentWeeklyReview() {
  return useQuery({
    queryKey: weeklyReviewKeys.current(),
    queryFn: () => getCurrentWeeklyReview(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useWeeklyReviews(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: weeklyReviewKeys.list(params),
    queryFn: () => listWeeklyReviews(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useGenerateWeeklyReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data?: GenerateWeeklyReviewRequest) => generateWeeklyReview(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: weeklyReviewKeys.all });
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
}

export interface UseGenerateWeeklyReviewStreamResult {
  /** Whether a stream is currently active. */
  isStreaming: boolean;
  /** Accumulated partial AI summary text from `delta` events. */
  partialSummary: string;
  /** The completed review once the `complete` event arrives. */
  completedReview: WeeklyReview | null;
  /** Error message if the stream failed. */
  error: string | null;
  /** Start the streaming generation. */
  generate: (data?: GenerateWeeklyReviewRequest) => Promise<void>;
  /** Cancel an in-flight stream. */
  cancel: () => void;
  /** Reset to the initial state. */
  reset: () => void;
}

export function useGenerateWeeklyReviewStream(): UseGenerateWeeklyReviewStreamResult {
  const queryClient = useQueryClient();
  const abortRef = useRef<AbortController | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [partialSummary, setPartialSummary] = useState('');
  const [completedReview, setCompletedReview] = useState<WeeklyReview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
    setPartialSummary('');
    setCompletedReview(null);
    setError(null);
  }, []);

  const generate = useCallback(
    async (data?: GenerateWeeklyReviewRequest) => {
      // Cancel any in-flight stream first.
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsStreaming(true);
      setPartialSummary('');
      setCompletedReview(null);
      setError(null);

      try {
        for await (const event of generateWeeklyReviewStream(data, controller.signal)) {
          if (controller.signal.aborted) break;
          handleStreamEvent(event, {
            onDelta: (text) => setPartialSummary((prev) => prev + text),
            onComplete: (review) => {
              setCompletedReview(review);
              queryClient.invalidateQueries({ queryKey: weeklyReviewKeys.all });
              queryClient.invalidateQueries({ queryKey: activityKeys.all });
            },
            onError: (msg) => setError(msg),
          });
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Stream failed');
        }
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
        }
        setIsStreaming(false);
      }
    },
    [queryClient],
  );

  return { isStreaming, partialSummary, completedReview, error, generate, cancel, reset };
}

function handleStreamEvent(
  event: WeeklyReviewStreamEvent,
  handlers: {
    onDelta: (text: string) => void;
    onComplete: (review: WeeklyReview) => void;
    onError: (msg: string) => void;
  },
) {
  switch (event.type) {
    case 'delta':
      handlers.onDelta(event.text);
      break;
    case 'complete':
      handlers.onComplete(event.review);
      break;
    case 'error':
      handlers.onError(event.message);
      break;
  }
}
