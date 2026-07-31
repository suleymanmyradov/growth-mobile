/**
 * Notification → destination routing.
 *
 * Per `mobile.md` §8.10: "Tapping a row routes only through the validated
 * internal-route allowlist." The backend `Notification` payload carries an
 * `itemType` (e.g. `habit_reminder`, `goal_reminder`) but no raw URL or
 * arbitrary destination string. This module maps that itemType to a
 * `DeepLinkDestination` and resolves it to a typed Expo Router path via the
 * shared `destinationToRoute` allowlist in `core/auth/deep-links`.
 *
 * Never accept an arbitrary URL from a notification. Never interpolate an
 * unvalidated id. Unknown item types resolve to null so the caller falls back
 * to a safe default (the Today tab) instead of landing on +not-found.
 */
import {
  destinationToRoute,
  validateDestination,
  type DeepLinkDestination,
} from '@/core/auth/deep-links';
import type { Notification } from '@/core/api/schemas';

/**
 * Maps a notification `itemType` to a validated deep-link destination.
 *
 * The backend notification types are intentionally limited; any unmapped type
 * returns null so the caller falls back to a safe default. When the backend
 * grows a `resourceId`/`destination` field on notifications, extend this map
 * rather than accepting arbitrary strings.
 */
export function notificationTypeToDestination(itemType: string): DeepLinkDestination | null {
  switch (itemType) {
    case 'habit_reminder':
    case 'habit_completed':
    case 'habit_missed':
      return 'habit-detail';
    case 'goal_reminder':
    case 'goal_progress':
    case 'goal_completed':
      return 'goal-detail';
    case 'article':
    case 'article_published':
      return 'article-detail';
    case 'coach_message':
    case 'conversation_reply':
      return 'conversation';
    case 'weekly_review':
    case 'weekly_review_ready':
      return 'weekly-review';
    case 'activity':
      return 'activity';
    default:
      return null;
  }
}

/**
 * Resolves a notification to a typed Expo Router path through the validated
 * internal-route allowlist. Returns null when the itemType is unmapped or the
 * destination has no routable target — callers fall back to the Today tab.
 *
 * Notifications currently carry no per-row resource id, so detail destinations
 * resolve to their owning tab/list screen (e.g. `habit-detail` → Plan tab).
 */
export function notificationToRoute(notification: Notification): string | null {
  const destination = notificationTypeToDestination(notification.itemType);
  if (!destination) return null;
  if (!validateDestination(destination)) return null;
  return destinationToRoute(destination);
}
