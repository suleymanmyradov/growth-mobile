import * as SQLite from 'expo-sqlite';

/**
 * Non-secret persistence using expo-sqlite/kv-store.
 *
 * Used for: query cache (allowlisted), onboarding draft, theme, locale,
 * and non-sensitive preferences.
 *
 * Tokens and sensitive data NEVER go here — they use expo-secure-store.
 *
 * Data is partitioned by user ID and purged on logout/account switch.
 */

const DB_NAME = 'growth.db';

let db: SQLite.SQLiteDatabase | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync(DB_NAME);
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS kv_store (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);
  }
  return db;
}

/**
 * Stores a value under the given key. Values are JSON-stringified.
 * The key should include the user ID prefix for user-scoped data
 * (e.g. `user:<userId>:query-cache:habits`).
 */
export async function setItem(key: string, value: unknown): Promise<void> {
  const database = await getDb();
  const json = JSON.stringify(value);
  const now = Date.now();
  await database.runAsync(
    'INSERT OR REPLACE INTO kv_store (key, value, updated_at) VALUES (?, ?, ?)',
    key,
    json,
    now,
  );
}

/**
 * Retrieves and JSON-parses a value. Returns null if the key doesn't exist.
 */
export async function getItem<T>(key: string): Promise<T | null> {
  const database = await getDb();
  const row = await database.getFirstAsync<{ value: string }>(
    'SELECT value FROM kv_store WHERE key = ?',
    key,
  );
  if (!row) return null;
  try {
    return JSON.parse(row.value) as T;
  } catch {
    return null;
  }
}

/**
 * Removes a key.
 */
export async function removeItem(key: string): Promise<void> {
  const database = await getDb();
  await database.runAsync('DELETE FROM kv_store WHERE key = ?', key);
}

/**
 * Removes all keys matching a prefix (e.g. `user:<userId>:`).
 * Used to purge user-scoped data on logout or account switch.
 */
export async function removeByPrefix(prefix: string): Promise<void> {
  const database = await getDb();
  await database.runAsync('DELETE FROM kv_store WHERE key LIKE ?', `${prefix}%`);
}

/**
 * Clears the entire KV store. Used on logout.
 */
export async function clearAll(): Promise<void> {
  const database = await getDb();
  await database.runAsync('DELETE FROM kv_store');
}
