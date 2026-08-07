/**
 * Voice-turn SSE stream opener (multipart body → SSE response).
 *
 * The voice-turn endpoint is a custom transport: a multipart/form-data POST
 * that returns `text/event-stream`. `openSSEStream` posts JSON, so this helper
 * handles the multipart case directly with the bearer token, FormData, and an
 * AbortSignal. The returned `ReadableStream` is consumed by `parseSSEStream`.
 *
 * Per AGENTS.md: one shared authenticated path (bearer token from the token
 * manager); no feature-local auth. Stream content is never logged.
 */
import { fetch } from 'expo/fetch';

import { personalizationEndpoints } from '@/core/api/endpoints';
import { ApiError, fromFetchError, parseJsonApiError } from '@/core/api/errors';
import { tokenManager } from '@/core/auth/token-manager';
import { apiUrlFor } from '@/core/config/env';

export interface VoiceTurnStreamOptions {
  fileUri: string;
  mimeType: string;
  filename?: string;
  language?: string;
  conversationId?: string;
  signal?: AbortSignal;
  responseTimeoutMs?: number;
}

/**
 * Opens the voice-turn SSE stream and returns the response body for
 * `parseSSEStream`. Throws `ApiError` for non-2xx responses (parsed from the
 * gateway error JSON when possible). Once 200 + `text/event-stream` is
 * committed, subsequent errors arrive as SSE `error` events.
 */
export async function openVoiceTurnStream({
  fileUri,
  mimeType,
  filename,
  language,
  conversationId,
  signal,
  responseTimeoutMs = 60_000,
}: VoiceTurnStreamOptions): Promise<ReadableStream<Uint8Array>> {
  const url = apiUrlFor(personalizationEndpoints.voiceTurn);
  const token = tokenManager.getAccessToken();

  if (!token) {
    throw new ApiError({
      status: 401,
      code: 'NO_ACCESS_TOKEN',
      message: 'Authentication required.',
    });
  }

  const formData = new FormData();
  formData.append('audio', {
    uri: fileUri,
    type: mimeType,
    name: filename ?? fileUri.split('/').pop() ?? 'audio.m4a',
  } as unknown as Blob);
  if (language) formData.append('language', language);
  if (conversationId) formData.append('conversationId', conversationId);

  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), responseTimeoutMs);
  const combinedSignal = signal
    ? mergeSignals(signal, timeoutController.signal)
    : timeoutController.signal;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'text/event-stream',
        Authorization: `Bearer ${token}`,
        // Let the platform set the multipart boundary — do not set
        // Content-Type manually for FormData.
      },
      body: formData,
      signal: combinedSignal,
    });
  } catch (error) {
    clearTimeout(timeoutId);
    if (signal?.aborted || isAbortError(error)) {
      throw new ApiError({ status: 0, code: 'ABORTED', message: 'Stream cancelled.' });
    }
    throw fromFetchError(error);
  }

  clearTimeout(timeoutId);

  if (!response.ok) {
    throw await parseJsonApiError(response);
  }

  const stream = response.body;
  if (!stream) {
    throw new ApiError({
      status: 0,
      code: 'NO_STREAM_BODY',
      message: 'The server returned no stream body.',
    });
  }

  return stream as ReadableStream<Uint8Array>;
}

function mergeSignals(a: AbortSignal, b: AbortSignal): AbortSignal {
  if (a.aborted) return a;
  if (b.aborted) return b;
  const anyFn = (AbortSignal as unknown as { any?: (signals: AbortSignal[]) => AbortSignal }).any;
  if (typeof anyFn === 'function') {
    return anyFn([a, b]);
  }
  const controller = new AbortController();
  const onAbort = (s: AbortSignal) => () => controller.abort(s.reason);
  a.addEventListener('abort', onAbort(a), { once: true });
  b.addEventListener('abort', onAbort(b), { once: true });
  return controller.signal;
}

function isAbortError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === 'AbortError') return true;
  if (error instanceof Error && error.name === 'AbortError') return true;
  return false;
}
