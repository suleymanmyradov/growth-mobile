/**
 * Authenticated SSE stream client for POST endpoints.
 *
 * Per AGENTS.md: use `expo/fetch` streaming bodies for the three SSE/generation
 * endpoints (`/weekly-reviews/generate-stream`, `/personalization/coaching-stream`,
 * `/personalization/voice-turn`). One shared authenticated client; no
 * feature-local fetch instances.
 *
 * This helper opens a streaming POST with the bearer token attached, returns a
 * `ReadableStream<Uint8Array>` for the existing `parseSSEStream` parser, and
 * supports cancellation via `AbortSignal`.
 *
 * Rules honored (AGENTS.md §"SSE, AI coaching, and voice"):
 * - Always attaches the bearer token (no browser `credentials: include`).
 * - Abort active streams on unmount/cancel/auth-loss/replacement.
 * - Does NOT blindly reconnect POST streams (generation may be duplicated).
 * - Does not log stream content (the parser + callers must avoid logging
 *   conversation text, transcripts, coaching content, or audio).
 */
import { fetch } from 'expo/fetch';

import { tokenManager } from '../auth/token-manager';
import { apiUrlFor } from '../config/env';
import { ApiError, fromFetchError, parseJsonApiError } from './errors';

export interface SSEStreamOptions {
  /** Endpoint path relative to the API base (e.g. '/personalization/coaching-stream'). */
  path: string;
  /** JSON body for the POST request. */
  body: unknown;
  /** AbortSignal for cancellation. */
  signal?: AbortSignal;
  /** Optional request timeout in ms for the initial response (default 30s). */
  responseTimeoutMs?: number;
}

/**
 * Opens an authenticated SSE POST stream and returns the response body as a
 * `ReadableStream<Uint8Array>` suitable for `parseSSEStream`.
 *
 * Throws `ApiError` for non-2xx responses (the body is parsed as a gateway
 * error JSON when possible). Once a 200 + `text/event-stream` is committed,
 * subsequent errors surface as SSE `error` events inside the stream (handled by
 * the caller via `parseSSEStream`).
 *
 * The caller is responsible for consuming the stream via `parseSSEStream` and
 * aborting via the supplied signal on unmount/cancel/replacement.
 */
export async function openSSEStream({
  path,
  body,
  signal,
  responseTimeoutMs = 30_000,
}: SSEStreamOptions): Promise<ReadableStream<Uint8Array>> {
  const url = apiUrlFor(path);
  const token = tokenManager.getAccessToken();

  if (!token) {
    throw new ApiError({
      status: 401,
      code: 'NO_ACCESS_TOKEN',
      message: 'Authentication required.',
    });
  }

  // Use a timeout signal for the initial response, then let the caller's signal
  // govern the stream lifetime. We combine the caller's signal with a timeout
  // only for the fetch resolution; once headers arrive, the timeout is cleared.
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), responseTimeoutMs);

  // Combine the caller's signal with the timeout signal so either aborts fetch.
  const combinedSignal = signal
    ? mergeSignals(signal, timeoutController.signal)
    : timeoutController.signal;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      signal: combinedSignal,
    });
  } catch (error) {
    clearTimeout(timeoutId);
    if (signal?.aborted || isAbortError(error)) {
      throw new ApiError({
        status: 0,
        code: 'ABORTED',
        message: 'Stream cancelled.',
      });
    }
    throw fromFetchError(error);
  }

  clearTimeout(timeoutId);

  if (!response.ok) {
    // Parse the gateway error JSON before throwing so callers get a typed error.
    const apiError = await parseJsonApiError(response);
    throw apiError;
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

/**
 * Merges two AbortSignals into one that aborts when either source aborts.
 * Falls back to a controller if the platform lacks `AbortSignal.any`.
 */
function mergeSignals(a: AbortSignal, b: AbortSignal): AbortSignal {
  if (a.aborted) return a;
  if (b.aborted) return b;
  // AbortSignal.any is available on modern RN/Hermes; fall back gracefully.
  const anyFn = (AbortSignal as unknown as { any?: (signals: AbortSignal[]) => AbortSignal }).any;
  if (typeof anyFn === 'function') {
    return anyFn([a, b]);
  }
  const controller = new AbortController();
  const onAbort = (s: AbortSignal) => () => {
    controller.abort(s.reason);
  };
  a.addEventListener('abort', onAbort(a), { once: true });
  b.addEventListener('abort', onAbort(b), { once: true });
  return controller.signal;
}

function isAbortError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === 'AbortError') return true;
  if (error instanceof Error && error.name === 'AbortError') return true;
  return false;
}
