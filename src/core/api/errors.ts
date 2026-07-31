/**
 * Unified API error shape.
 *
 * All backend errors are converted into this shape so the UI never has to
 * inspect Axios error internals. Contains HTTP status, a stable error code
 * from the backend, a user-safe message, and optional metadata.
 */

export interface ApiErrorOptions {
  status: number;
  code: string;
  message: string;
  requestId?: string;
  /** Rate limit info if present (429 responses). */
  limit?: {
    remaining: number;
    resetAt?: number;
  };
  /** Upgrade trigger if the error is entitlement-related (403 with upgrade code). */
  upgrade?: {
    plan: string;
    feature: string;
  };
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly requestId?: string;
  readonly limit?: { remaining: number; resetAt?: number };
  readonly upgrade?: { plan: string; feature: string };

  constructor(opts: ApiErrorOptions) {
    super(opts.message);
    this.name = 'ApiError';
    this.status = opts.status;
    this.code = opts.code;
    this.requestId = opts.requestId;
    this.limit = opts.limit;
    this.upgrade = opts.upgrade;
  }

  /** True for 401 responses — caller should attempt token refresh. */
  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  /** True for 403 responses with an upgrade trigger. */
  get isUpgradeRequired(): boolean {
    return this.status === 403 && !!this.upgrade;
  }

  /** True for 429 rate-limited responses. */
  get isRateLimited(): boolean {
    return this.status === 429;
  }

  /** True for 5xx server errors (retryable). */
  get isServerError(): boolean {
    return this.status >= 500;
  }
}

/**
 * Convert an Axios error into an ApiError.
 * The backend returns errors as `{ code: string, message: string, requestId?: string }`.
 */
export function fromAxiosError(error: unknown): ApiError {
  // Already an ApiError — pass through.
  if (error instanceof ApiError) return error;

  // Network error (no response).
  if (error && typeof error === 'object' && 'isAxiosError' in error) {
    const axiosErr = error as unknown as {
      response?: {
        status: number;
        data?: {
          code?: string;
          message?: string;
          requestId?: string;
          limit?: { remaining: number; resetAt?: number };
          upgrade?: { plan: string; feature: string };
        };
      };
      message: string;
      code?: string;
    };

    if (!axiosErr.response) {
      // Network failure or timeout.
      return new ApiError({
        status: 0,
        code: 'NETWORK_ERROR',
        message: 'Network error. Please check your connection.',
      });
    }

    const { status, data } = axiosErr.response;
    return new ApiError({
      status,
      code: data?.code ?? `HTTP_${status}`,
      message: data?.message ?? 'An unexpected error occurred.',
      requestId: data?.requestId,
      limit: data?.limit,
      upgrade: data?.upgrade,
    });
  }

  // Unknown error.
  if (error instanceof Error) {
    return new ApiError({
      status: 0,
      code: 'UNKNOWN_ERROR',
      message: error.message,
    });
  }

  return new ApiError({
    status: 0,
    code: 'UNKNOWN_ERROR',
    message: 'An unknown error occurred.',
  });
}

/**
 * Convert a fetch error (from the SSE client) into an ApiError.
 * Handles network failures, aborts, and TypeError-based fetch failures.
 */
export function fromFetchError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  // Abort errors.
  if (error instanceof DOMException && error.name === 'AbortError') {
    return new ApiError({ status: 0, code: 'ABORTED', message: 'Stream cancelled.' });
  }
  if (error instanceof Error && error.name === 'AbortError') {
    return new ApiError({ status: 0, code: 'ABORTED', message: 'Stream cancelled.' });
  }

  // Network failure (fetch throws TypeError on network errors).
  if (error instanceof TypeError) {
    return new ApiError({
      status: 0,
      code: 'NETWORK_ERROR',
      message: 'Network error. Please check your connection.',
    });
  }

  if (error instanceof Error) {
    return new ApiError({ status: 0, code: 'UNKNOWN_ERROR', message: error.message });
  }

  return new ApiError({
    status: 0,
    code: 'UNKNOWN_ERROR',
    message: 'An unknown error occurred.',
  });
}

/**
 * Parse a non-2xx fetch Response into an ApiError by reading the gateway error
 * JSON body. Falls back to a generic error if the body is not valid JSON.
 */
export async function parseJsonApiError(response: Response): Promise<ApiError> {
  const status = response.status;
  try {
    const data = (await response.json()) as {
      code?: string;
      message?: string;
      requestId?: string;
      limit?: { remaining: number; resetAt?: number };
      upgrade?: { plan: string; feature: string };
    };
    return new ApiError({
      status,
      code: data?.code ?? `HTTP_${status}`,
      message: data?.message ?? 'An unexpected error occurred.',
      requestId: data?.requestId,
      limit: data?.limit,
      upgrade: data?.upgrade,
    });
  } catch {
    return new ApiError({
      status,
      code: `HTTP_${status}`,
      message: 'An unexpected error occurred.',
    });
  }
}
