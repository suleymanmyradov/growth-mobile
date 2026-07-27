import axios from 'axios';
import { apiBaseUrl } from '../config/env';
import { fromAxiosError } from './errors';
import { tokenManager } from '../auth/token-manager';

/**
 * Multipart form-data adapter for file uploads.
 *
 * Used for `POST /files/upload` and `POST /personalization/transcribe`
 * which are custom transport routes not covered by the standard JSON client.
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

  const token = tokenManager.getAccessToken();

  try {
    const response = await axios.post<T>(`${apiBaseUrl()}${opts.path}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      timeout: opts.timeout ?? 60_000, // 60s default for uploads
      signal: opts.signal,
    });
    return response.data;
  } catch (error) {
    throw fromAxiosError(error);
  }
}
