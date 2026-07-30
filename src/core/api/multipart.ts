import { getApiClient } from './client';
import { fromAxiosError } from './errors';

/**
 * Multipart form-data adapter for file uploads.
 *
 * Used for `POST /files/upload` and `POST /personalization/transcribe`
 * which are custom transport routes not covered by the standard JSON client.
 *
 * Routes through the shared authenticated client (`getApiClient()`) so uploads
 * get the same 401 refresh interceptor and `X-Device-Id` header as JSON
 * requests. Per AGENTS.md: one shared authenticated client; no feature-local
 * Axios instances.
 *
 * On native, file URIs are passed directly to Axios — React Native's
 * FormData supports `uri` fields natively.
 */

export interface UploadOptions {
  /** The endpoint path (e.g. '/files/upload'). */
  path: string;
  /** Form field name for the file (e.g. 'file', 'audio'). */
  fieldName: string;
  /** Local file URI (e.g. 'file:///path/to/file.jpg'). */
  fileUri: string;
  /** MIME type (e.g. 'image/jpeg', 'audio/m4a'). */
  mimeType: string;
  /** Optional filename. */
  filename?: string;
  /** Additional form fields. */
  fields?: Record<string, string>;
  /** Request timeout in ms (uploads may need longer). */
  timeout?: number;
  /** AbortSignal for cancellation. */
  signal?: AbortSignal;
}

/**
 * Uploads a file as multipart form-data.
 *
 * Uses the shared authenticated client so the request gets:
 * - `Authorization: Bearer <token>` (attached by the request interceptor).
 * - `X-Device-Id` (attached by the request interceptor if set).
 * - 401 single-flight refresh (handled by the response interceptor).
 *
 * Returns the parsed JSON response.
 */
export async function uploadFile<T>(opts: UploadOptions): Promise<T> {
  const formData = new FormData();

  // Add the file field.
  formData.append(opts.fieldName, {
    uri: opts.fileUri,
    type: opts.mimeType,
    name: opts.filename ?? opts.fileUri.split('/').pop() ?? 'file',
  } as unknown as Blob);

  // Add additional fields.
  if (opts.fields) {
    for (const [key, value] of Object.entries(opts.fields)) {
      formData.append(key, value);
    }
  }

  try {
    const response = await getApiClient().post<T>(opts.path, formData, {
      // Override the client's default `application/json` so the platform sets
      // the multipart boundary correctly.
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: opts.timeout ?? 60_000, // 60s default for uploads
      signal: opts.signal,
    });
    return response.data;
  } catch (error) {
    // fromAxiosError is idempotent — passes through if already an ApiError
    // (the response interceptor converts 401/network errors to ApiError).
    throw fromAxiosError(error);
  }
}
