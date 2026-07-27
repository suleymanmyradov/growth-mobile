import * as SecureStore from 'expo-secure-store';

/**
 * Secure token manager — persists the token pair in expo-secure-store.
 *
 * The access token is kept in memory only (never persisted). The refresh
 * token and session metadata are persisted via SecureStore so the session
 * can be restored on app relaunch.
 *
 * Per AGENTS.md hard rules:
 * - Tokens never go to SQLite, AsyncStorage, logs, analytics, or Zustand.
 * - The access token is in-memory only.
 * - The refresh token pair is persisted via SecureStore.
 */

const REFRESH_TOKEN_KEY = 'growth.refresh_token';
const SESSION_ID_KEY = 'growth.session_id';
const USER_ID_KEY = 'growth.user_id';

export interface PersistedSession {
  refreshToken: string;
  sessionId: string;
  userId: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

class TokenManager {
  // In-memory access token — never persisted.
  private accessToken: string | null = null;

  /** Returns the current access token, or null if not authenticated. */
  getAccessToken(): string | null {
    return this.accessToken;
  }

  /** Sets the in-memory access token. */
  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  /**
   * Persists the refresh token and session metadata to SecureStore.
   * Called after login, register, or a successful token refresh.
   */
  async persistSession(session: PersistedSession): Promise<void> {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, session.refreshToken);
    await SecureStore.setItemAsync(SESSION_ID_KEY, session.sessionId);
    await SecureStore.setItemAsync(USER_ID_KEY, session.userId);
  }

  /**
   * Loads the persisted session (for app relaunch / session restore).
   * Returns null if no session is persisted.
   */
  async loadSession(): Promise<PersistedSession | null> {
    try {
      const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      const sessionId = await SecureStore.getItemAsync(SESSION_ID_KEY);
      const userId = await SecureStore.getItemAsync(USER_ID_KEY);

      if (!refreshToken || !sessionId || !userId) {
        return null;
      }

      return { refreshToken, sessionId, userId };
    } catch {
      // SecureStore may fail on web or in certain environments.
      return null;
    }
  }

  /** Returns the persisted refresh token, or null. */
  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  }

  /**
   * Clears all persisted tokens and the in-memory access token.
   * Called on logout, refresh failure, or account switch.
   */
  async clearAll(): Promise<void> {
    this.accessToken = null;
    try {
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(SESSION_ID_KEY);
      await SecureStore.deleteItemAsync(USER_ID_KEY);
    } catch {
      // Ignore errors on web or when items don't exist.
    }
  }
}

// Singleton — there is only one token manager for the entire app.
export const tokenManager = new TokenManager();
