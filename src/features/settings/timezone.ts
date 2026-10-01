/**
 * The one-time "update your time zone?" prompt record — mirrors the web
 * timezone-sync (`frontend/src/lib/timezone.ts`). The record lives in the KV
 * store scoped to the user: dismissing "Europe/London" doesn't suppress a
 * later "Asia/Tokyo" prompt (e.g. after travel), and a different account on
 * the same device gets asked independently.
 */
import { getItem, setItem } from '@/core/storage';

const PROMPT_KEY_SUFFIX = 'timezone-prompt';

export interface TimezonePromptRecord {
  /** The detected IANA zone the prompt was shown for. */
  timezone: string;
  action: 'updated' | 'dismissed';
  /** ISO-8601 timestamp of when the user answered. */
  at: string;
}

/** The recorded prompt answer for this user, or null if never asked / malformed. */
export async function getTimezonePromptRecord(
  userId: string,
): Promise<TimezonePromptRecord | null> {
  try {
    const value = await getItem<Partial<TimezonePromptRecord>>(promptKey(userId));
    if (
      value &&
      typeof value.timezone === 'string' &&
      (value.action === 'updated' || value.action === 'dismissed') &&
      typeof value.at === 'string'
    ) {
      return value as TimezonePromptRecord;
    }
    return null;
  } catch {
    return null;
  }
}

/** Persist that the prompt was answered for `timezone` (update or dismiss). */
export async function recordTimezonePrompt(
  userId: string,
  timezone: string,
  action: TimezonePromptRecord['action'],
): Promise<void> {
  try {
    const record: TimezonePromptRecord = { timezone, action, at: new Date().toISOString() };
    await setItem(promptKey(userId), record);
  } catch {
    // Storage unavailable — worst case the prompt shows again.
  }
}

function promptKey(userId: string): string {
  return `user:${userId}:${PROMPT_KEY_SUFFIX}`;
}
