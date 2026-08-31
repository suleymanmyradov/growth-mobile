import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios';
import { tokenManager } from '../auth/token-manager';
import { apiBaseUrl, apiBaseUrlAi, isAiGatewayPath } from '../config/env';
import { ApiError, fromAxiosError } from './errors';

/**
 * Authenticated HTTP client.
 *
 * - Attaches `Authorization: Bearer <accessToken>` to every request.
 * - On 401, runs exactly one refresh operation for the entire process.
 *   Concurrent failed requests await the same refresh promise.
 * - Refresh rotates both tokens. Persists the new pair atomically before
 *   replaying requests once.
 * - If refresh fails, clears all local state and throws.
 * - Never retries non-idempotent mutations automatically.
 * - Adds `X-Device-Id` header if set.
 */

// Extended config to mark retried requests and avoid infinite loops.
interface RetryableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

// Refresh token response from the backend.
interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  userId: string;
}

// The refresh endpoint path.
const REFRESH_PATH = '/auth/refresh';

// Installation ID for X-Device-Id header.
let installationId: string | null = null;

export function setInstallationId(id: string): void {
  installationId = id;
}

// --- Single-flight refresh logic ---

let refreshPromise: Promise<string> | null = null;

async function performRefresh(): Promise<string> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = await tokenManager.getRefreshToken();
    if (!refreshToken) {
      throw new ApiError({
        status: 401,
        code: 'NO_REFRESH_TOKEN',
        message: 'Session expired. Please sign in again.',
      });
    }

    try {
      // Use a bare axios instance (no interceptors) for the refresh call.
      const resp = await axios.post(`${apiBaseUrl()}${REFRESH_PATH}`, {
        refreshToken,
      });

      const data = resp.data as RefreshResponse;

      // Persist the new token pair atomically before replaying.
      tokenManager.setAccessToken(data.accessToken);
      await tokenManager.persistSession({
        refreshToken: data.refreshToken,
        sessionId: data.sessionId,
        userId: data.userId,
      });

      return data.accessToken;
    } catch (error) {
      // Refresh failed — clear all local state.
      await tokenManager.clearAll();
      throw fromAxiosError(error);
    } finally {
      // Clear the single-flight promise so future 401s can attempt refresh.
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// --- Client creation ---

let clientInstance: AxiosInstance | null = null;

function createClient(): AxiosInstance {
  const instance = axios.create({
    baseURL: apiBaseUrl(),
    timeout: 15_000, // 15s default for JSON requests
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor: attach Authorization and X-Device-Id, and rewrite
  // the baseURL for AI-gateway routes (local dev only — in production both
  // services share one origin via ingress).
  instance.interceptors.request.use((config) => {
    const token = tokenManager.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (installationId) {
      config.headers['X-Device-Id'] = installationId;
    }
    // Route AI paths to the ai-gateway origin when configured separately.
    if (config.url && isAiGatewayPath(config.url)) {
      config.baseURL = apiBaseUrlAi();
    }
    return config;
  });

  // Response interceptor: single-flight refresh on 401.
  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const config = error.config as RetryableConfig | undefined;

      // Only retry on 401 and only once.
      if (error.response?.status === 401 && config && !config._retried) {
        // Don't retry the refresh endpoint itself.
        if (config.url?.includes(REFRESH_PATH)) {
          await tokenManager.clearAll();
          return Promise.reject(fromAxiosError(error));
        }

        config._retried = true;

        try {
          const newToken = await performRefresh();
          config.headers.Authorization = `Bearer ${newToken}`;
          return instance.request(config);
        } catch (refreshError) {
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(fromAxiosError(error));
    },
  );

  return instance;
}

/**
 * Returns the singleton authenticated Axios instance.
 */
export function getApiClient(): AxiosInstance {
  if (!clientInstance) {
    clientInstance = createClient();
  }
  return clientInstance;
}

/**
 * Returns a bare (unauthenticated) Axios instance for auth endpoints
 * (login, register, refresh) that should not attach the bearer token.
 */
export function getBareClient(): AxiosInstance {
  return axios.create({
    baseURL: apiBaseUrl(),
    timeout: 15_000,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Convenience wrapper for API calls that converts errors to ApiError.
 */
export async function apiRequest<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const response = await getApiClient().request<T>(config);
    return response.data;
  } catch (error) {
    throw fromAxiosError(error);
  }
}

export { fromAxiosError } from './errors';
