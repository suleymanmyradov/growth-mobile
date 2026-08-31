/**
 * AI Coach API — conversations, streaming coaching, and voice.
 *
 * JSON conversation CRUD goes through the shared axios client. The two SSE
 * generation endpoints (`/personalization/coaching-stream` and
 * `/personalization/voice-turn`) go through `openSSEStream` + `parseSSEStream`.
 * The standalone transcription endpoint (`/personalization/transcribe`) is a
 * multipart upload handled by `uploadFile`.
 *
 * Per AGENTS.md: one shared authenticated client; no feature-local HTTP
 * instances. Stream content is never logged.
 */

import { apiRequest } from '@/core/api/client';
import { conversationEndpoints, personalizationEndpoints } from '@/core/api/endpoints';
import { uploadFile } from '@/core/api/multipart';
import {
  AppendMessageRequestSchema,
  AppendMessageResponseSchema,
  GeneratePersonalizedCoachingRequestSchema,
  GetConversationResponseSchema,
  GetMessagesResponseSchema,
  ListConversationsResponseSchema,
  StartConversationRequestSchema,
  StartConversationResponseSchema,
  type AppendMessageRequest,
  type AppendMessageResponse,
  type Conversation,
  type GeneratePersonalizedCoachingRequest,
  type GetMessagesResponse,
  type ListConversationsResponse,
  type StartConversationRequest,
  type StartConversationResponse,
} from '@/core/api/schemas';
import { parseSSEStream, type SSEEvent } from '@/core/api/sse';
import { openSSEStream } from '@/core/api/sse-client';
import { z } from 'zod';

export type {
  AppendMessageRequest,
  AppendMessageResponse,
  CoachingAttachment,
  Conversation,
  ConversationMessage,
  GeneratePersonalizedCoachingRequest,
  GetConversationResponse,
  GetMessagesResponse,
  ListConversationsResponse,
  StartConversationRequest,
  StartConversationResponse,
} from '@/core/api/schemas';

// ─── Conversations (JSON) ─────────────────────────────────────────────────────

export async function listConversations(params?: {
  type?: string;
  page?: number;
  limit?: number;
  /** false (default) lists active conversations, true lists archived ones. */
  archived?: boolean;
}): Promise<ListConversationsResponse> {
  const response = await apiRequest<unknown>({
    method: 'GET',
    url: conversationEndpoints.list,
    params: { page: 1, limit: 20, archived: false, ...params },
  });
  return ListConversationsResponseSchema.parse(response);
}

export async function startConversation(
  data?: StartConversationRequest,
): Promise<StartConversationResponse> {
  const validated = StartConversationRequestSchema.parse(data ?? {});
  const response = await apiRequest<unknown>({
    method: 'POST',
    url: conversationEndpoints.start,
    data: validated,
  });
  return StartConversationResponseSchema.parse(response);
}

export async function getConversation(id: string): Promise<Conversation> {
  const response = await apiRequest<unknown>({
    method: 'GET',
    url: conversationEndpoints.detail(encodeURIComponent(id)),
  });
  return GetConversationResponseSchema.parse(response).data;
}

export async function getMessages(
  id: string,
  params?: { page?: number; limit?: number },
): Promise<GetMessagesResponse> {
  const response = await apiRequest<unknown>({
    method: 'GET',
    url: conversationEndpoints.messages(encodeURIComponent(id)),
    params: { page: 1, limit: 50, ...params },
  });
  return GetMessagesResponseSchema.parse(response);
}

export async function appendMessage(
  id: string,
  data: AppendMessageRequest,
): Promise<AppendMessageResponse> {
  const validated = AppendMessageRequestSchema.parse(data);
  const response = await apiRequest<unknown>({
    method: 'POST',
    url: conversationEndpoints.messages(encodeURIComponent(id)),
    data: validated,
  });
  return AppendMessageResponseSchema.parse(response);
}

export async function archiveConversation(id: string): Promise<Conversation> {
  const response = await apiRequest<unknown>({
    method: 'PUT',
    url: conversationEndpoints.archive(encodeURIComponent(id)),
  });
  return GetConversationResponseSchema.parse(response).data;
}

export async function unarchiveConversation(id: string): Promise<Conversation> {
  const response = await apiRequest<unknown>({
    method: 'PUT',
    url: conversationEndpoints.unarchive(encodeURIComponent(id)),
  });
  return GetConversationResponseSchema.parse(response).data;
}

export async function deleteConversation(id: string): Promise<void> {
  await apiRequest<unknown>({
    method: 'DELETE',
    url: conversationEndpoints.detail(encodeURIComponent(id)),
  });
}

// ─── Streaming coaching (SSE) ─────────────────────────────────────────────────

/**
 * Opens the coaching-stream SSE endpoint and returns an async generator of
 * SSE events. The caller consumes events via the streaming reducer and aborts
 * via the supplied signal on cancel/unmount/replacement.
 *
 * The backend persists the user message (when a conversationId is supplied) and
 * the assistant response (on `complete`) server-side; the client does not
 * duplicate persistence.
 */
export async function* streamCoaching(
  request: GeneratePersonalizedCoachingRequest,
  signal?: AbortSignal,
): AsyncGenerator<SSEEvent> {
  const validated = GeneratePersonalizedCoachingRequestSchema.parse(request);
  const stream = await openSSEStream({
    path: personalizationEndpoints.coachingStream,
    body: validated,
    signal,
  });
  yield* parseSSEStream(stream, signal);
}

// ─── Voice ────────────────────────────────────────────────────────────────────

export interface TranscribeResponse {
  text: string;
  language?: string;
  duration?: number;
}

const TranscribeResponseSchema = z.object({
  text: z.string(),
  language: z.string().optional(),
  duration: z.number().optional(),
});

/**
 * Transcribes an audio clip via the multipart `/personalization/transcribe`
 * endpoint. Returns the transcribed text and optional language/duration.
 */
export async function transcribeAudio(opts: {
  fileUri: string;
  mimeType: string;
  filename?: string;
  language?: string;
  signal?: AbortSignal;
}): Promise<TranscribeResponse> {
  const response = await uploadFile<unknown>({
    path: personalizationEndpoints.transcribe,
    fieldName: 'audio',
    fileUri: opts.fileUri,
    mimeType: opts.mimeType,
    filename: opts.filename,
    fields: opts.language ? { language: opts.language } : undefined,
    signal: opts.signal,
    timeout: 60_000,
  });
  return TranscribeResponseSchema.parse(response);
}

/**
 * Opens the voice-turn SSE endpoint (multipart audio in, SSE out) and returns
 * an async generator of SSE events.
 *
 * Because the request body is multipart (not JSON), this cannot use
 * `openSSEStream` (which posts JSON). Instead it uses fetch directly with the
 * bearer token and a FormData body, then pipes the response body through
 * `parseSSEStream`.
 */
export async function* streamVoiceTurn(opts: {
  fileUri: string;
  mimeType: string;
  filename?: string;
  language?: string;
  conversationId?: string;
  signal?: AbortSignal;
}): AsyncGenerator<SSEEvent> {
  const { openVoiceTurnStream } = await import('./voice-stream');
  const stream = await openVoiceTurnStream(opts);
  yield* parseSSEStream(stream, opts.signal);
}
