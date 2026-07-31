/**
 * AI Coach hooks — React Query queries/mutations for conversations, plus the
 * streaming coaching and voice-turn hooks that drive the pure SSE reducers.
 *
 * Streaming hooks do NOT use React Query (POST streams are not cacheable and
 * must not be retried blindly per AGENTS.md). They expose incremental state via
 * the pure reducers in `streaming.ts` and abort on unmount/cancel/replacement.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ApiError } from '@/core/api/errors';
import { conversationKeys } from '@/core/query/query-keys';
import type {
  AppendMessageRequest,
  Conversation,
  GeneratePersonalizedCoachingRequest,
  StartConversationRequest,
} from '@/core/api/schemas';

import {
  appendMessage,
  archiveConversation,
  deleteConversation,
  getConversation,
  getMessages,
  listConversations,
  startConversation,
  streamCoaching,
  streamVoiceTurn,
  transcribeAudio,
} from './api';
import {
  initialCoachingStreamState,
  initialVoiceTurnStreamState,
  reduceCoachingEvent,
  reduceVoiceTurnEvent,
  type CoachingStreamState,
  type VoiceTurnStreamState,
} from './streaming';

// ─── Conversation queries ─────────────────────────────────────────────────────

export function useConversations(params?: { type?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: conversationKeys.list(params),
    queryFn: () => listConversations(params),
    staleTime: 30 * 1000,
  });
}

export function useConversation(id: string | undefined) {
  return useQuery({
    queryKey: id ? conversationKeys.detail(id) : ['conversations', 'detail', 'pending'],
    queryFn: () => getConversation(id as string),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

export function useMessages(id: string | undefined, params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: id ? conversationKeys.messages(id) : ['conversations', 'messages', 'pending'],
    queryFn: () => getMessages(id as string, params),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

// ─── Conversation mutations ───────────────────────────────────────────────────

export function useStartConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data?: StartConversationRequest) => startConversation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
    },
  });
}

export function useAppendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AppendMessageRequest }) =>
      appendMessage(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: conversationKeys.messages(variables.id) });
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
    },
  });
}

export function useArchiveConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => archiveConversation(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: conversationKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
    },
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteConversation(id),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: conversationKeys.detail(id) });
      queryClient.removeQueries({ queryKey: conversationKeys.messages(id) });
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
    },
  });
}

// ─── Streaming coaching ───────────────────────────────────────────────────────

export interface UseStreamCoachingResult {
  state: CoachingStreamState;
  isStreaming: boolean;
  /** Starts a streaming coaching turn. Aborts any in-flight stream first. */
  send: (request: GeneratePersonalizedCoachingRequest) => Promise<void>;
  /** Aborts the in-flight stream. */
  stop: () => void;
  /** Resets to the initial state (e.g. before retrying). */
  reset: () => void;
  /** The error, if the stream failed before producing output. */
  error: ApiError | null;
}

/**
 * Streaming coaching hook. Drives the pure `reduceCoachingEvent` reducer from
 * the SSE generator and aborts on unmount or when a new request starts.
 *
 * The backend persists the user + assistant messages server-side (when a
 * conversationId is supplied); the client does not duplicate persistence. On
 * `complete`, the caller should invalidate the messages query to refetch the
 * persisted assistant message.
 */
export function useStreamCoaching(): UseStreamCoachingResult {
  const [state, setState] = useState<CoachingStreamState>(initialCoachingStreamState);
  const [error, setError] = useState<ApiError | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const reset = useCallback(() => {
    stop();
    setState(initialCoachingStreamState);
    setError(null);
  }, [stop]);

  const send = useCallback(
    async (request: GeneratePersonalizedCoachingRequest) => {
      // Abort any in-flight stream before starting a new one (replacement rule).
      stop();
      setState(initialCoachingStreamState);
      setError(null);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        for await (const event of streamCoaching(request, controller.signal)) {
          if (controller.signal.aborted) break;
          setState((prev) => reduceCoachingEvent(prev, event));
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(
          err instanceof ApiError
            ? err
            : new ApiError({ status: 0, code: 'STREAM_ERROR', message: 'Coaching stream failed.' }),
        );
        setState((prev) => ({
          ...prev,
          phase: 'error',
          errorMessage: err instanceof ApiError ? err.message : 'Coaching stream failed.',
          done: true,
        }));
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
        }
      }
    },
    [stop],
  );

  // Abort on unmount.
  useEffect(() => stop, [stop]);

  return {
    state,
    isStreaming: state.phase === 'thinking' || state.phase === 'streaming',
    send,
    stop,
    reset,
    error,
  };
}

// ─── Voice turn streaming ─────────────────────────────────────────────────────

export interface UseVoiceTurnResult {
  state: VoiceTurnStreamState;
  isActive: boolean;
  /** Starts a voice turn from a recorded audio file URI. */
  send: (opts: {
    fileUri: string;
    mimeType: string;
    filename?: string;
    language?: string;
    conversationId?: string;
  }) => Promise<void>;
  stop: () => void;
  reset: () => void;
  error: ApiError | null;
}

/**
 * Voice-turn streaming hook. Drives `reduceVoiceTurnEvent` from the multipart
 * SSE generator. Aborts on unmount or replacement.
 */
export function useVoiceTurn(): UseVoiceTurnResult {
  const [state, setState] = useState<VoiceTurnStreamState>(initialVoiceTurnStreamState);
  const [error, setError] = useState<ApiError | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const reset = useCallback(() => {
    stop();
    setState(initialVoiceTurnStreamState);
    setError(null);
  }, [stop]);

  const send = useCallback(
    async (opts: {
      fileUri: string;
      mimeType: string;
      filename?: string;
      language?: string;
      conversationId?: string;
    }) => {
      stop();
      setState(initialVoiceTurnStreamState);
      setError(null);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        for await (const event of streamVoiceTurn({ ...opts, signal: controller.signal })) {
          if (controller.signal.aborted) break;
          setState((prev) => reduceVoiceTurnEvent(prev, event));
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(
          err instanceof ApiError
            ? err
            : new ApiError({ status: 0, code: 'STREAM_ERROR', message: 'Voice turn failed.' }),
        );
        setState((prev) => ({
          ...prev,
          phase: 'error',
          errorMessage: err instanceof ApiError ? err.message : 'Voice turn failed.',
          done: true,
        }));
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
        }
      }
    },
    [stop],
  );

  useEffect(() => stop, [stop]);

  return {
    state,
    isActive: !state.done,
    send,
    stop,
    reset,
    error,
  };
}

// ─── Transcription (multipart, non-streaming) ────────────────────────────────

export function useTranscribeAudio() {
  return useMutation({
    mutationFn: (opts: {
      fileUri: string;
      mimeType: string;
      filename?: string;
      language?: string;
    }) => transcribeAudio(opts),
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Invalidates the conversation list + messages for a conversation. Used by
 * screens after a streaming turn completes to refetch persisted messages.
 */
export function useInvalidateConversation() {
  const queryClient = useQueryClient();
  return useCallback(
    (conversationId: string) => {
      queryClient.invalidateQueries({ queryKey: conversationKeys.messages(conversationId) });
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
    },
    [queryClient],
  );
}

export type { Conversation };
