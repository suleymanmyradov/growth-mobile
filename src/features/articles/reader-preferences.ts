/**
 * Article reader preferences — non-secret, user-scoped persistence.
 *
 * Per AGENTS.md: non-secret persistence uses `expo-sqlite/kv-store`. Reader
 * size and per-article scroll positions are non-sensitive preferences. Keys
 * are user-scoped so they are purged on account switch.
 *
 * Per `mobile.md` §8.7: persist three reader-size choices and restore scroll
 * position per article.
 */
import { getItem, removeItem, setItem } from '@/core/storage/kv';
import { useSessionStore } from '@/core/auth/session';

import type { ReaderSize } from './markdown-style';

const READER_SIZE_KEY = 'reader-size';
const SCROLL_PREFIX = 'reader-scroll:';

function userPrefix(): string {
  const userId = useSessionStore.getState().user?.id ?? 'anon';
  return `user:${userId}:`;
}

export async function getReaderSize(): Promise<ReaderSize> {
  const value = await getItem<ReaderSize>(`${userPrefix()}${READER_SIZE_KEY}`);
  return value ?? 'medium';
}

export async function setReaderSize(size: ReaderSize): Promise<void> {
  await setItem(`${userPrefix()}${READER_SIZE_KEY}`, size);
}

export async function getScrollPosition(articleId: string): Promise<number> {
  const value = await getItem<number>(`${userPrefix()}${SCROLL_PREFIX}${articleId}`);
  return value ?? 0;
}

export async function setScrollPosition(articleId: string, offset: number): Promise<void> {
  await setItem(`${userPrefix()}${SCROLL_PREFIX}${articleId}`, offset);
}

/**
 * Clears all reader preferences for the current user. Called on logout.
 */
export async function clearReaderPreferences(): Promise<void> {
  // The kv-store purge-by-prefix handles this on logout, but expose a hook
  // for explicit cleanup if needed.
  await removeItem(`${userPrefix()}${READER_SIZE_KEY}`);
}
