/**
 * Deep-link validation.
 *
 * Per AGENTS.md: the mobile app must never pass `destination` or any payload
 * field directly to the router. It must map `destination` + `resourceId` to a
 * typed Expo Router route.
 *
 * This module defines the allowed destinations and maps them to typed route
 * paths. Any destination not in the allowlist is rejected.
 *
 * Two layers of gating:
 * 1. `ALLOWED_DESTINATIONS` — the full set of planned destinations per the
 *    backend push contract. This acts as a tracker; `validateDestination`
 *    accepts any of these so the caller can log/track unimplemented ones.
 * 2. `destinationToRoute` — gates the actual routing to routes that exist
 *    under `app/`. Returns null for unimplemented routes so the caller falls
 *    back to a safe default (e.g. home tab) instead of landing on +not-found.
 *    When you implement a route file under `app/`, enable its destination here.
 */

export type DeepLinkDestination =
  | 'habit-detail'
  | 'goal-detail'
  | 'article-detail'
  | 'conversation'
  | 'weekly-review'
  | 'activity'
  | 'notifications';

/**
 * Full set of planned destinations per the backend push contract. Kept as a
 * tracker so `validateDestination` recognises all of them; `destinationToRoute`
 * gates which ones can actually be routed to.
 */
const ALLOWED_DESTINATIONS: ReadonlySet<DeepLinkDestination> = new Set([
  'habit-detail',
  'goal-detail',
  'article-detail',
  'conversation',
  'weekly-review',
  'activity',
  'notifications',
]);

/**
 * Validates that a destination string is in the allowlist.
 * Returns the typed destination, or null if invalid.
 */
export function validateDestination(dest: string): DeepLinkDestination | null {
  if (ALLOWED_DESTINATIONS.has(dest as DeepLinkDestination)) {
    return dest as DeepLinkDestination;
  }
  return null;
}

/**
 * Maps a validated destination + resource ID to a typed Expo Router route path.
 * Returns null if the destination is invalid, the required resource ID is
 * missing/invalid, or the target route is not yet implemented under `app/`.
 *
 * Callers should fall back to a safe default (the Today tab) when this returns
 * null. See `mobile.md` §6 "Target navigation" for the route set.
 *
 * Phase D route migration: the old `Home/Explore/Habits/Coach/Profile` tabs are
 * now `Today/Plan/Coach/Library/Me`. Legacy destinations are re-pointed to the
 * new IA. `weekly-review` and `activity` both route to the Progress stack
 * screen (pushed from Today). `habit-detail` and `goal-detail` route to the
 * Plan tab, which is the canonical home for habits and goals in the new IA —
 * habits nest under goals and there is no standalone per-id detail screen. The
 * `resourceId` is accepted but not interpolated, since the Plan tab does not
 * (yet) accept a focus/highlight query param; landing on Plan is the correct
 * fallback rather than dropping the user on Today.
 */
export function destinationToRoute(
  destination: DeepLinkDestination,
  resourceId?: string,
): string | null {
  switch (destination) {
    case 'habit-detail':
      // Plan tab hosts habits nested under goals; no per-id detail screen exists.
      return '/(app)/(tabs)/plan';
    case 'goal-detail':
      // Goals fold into Plan (Phase E); no per-id detail screen exists.
      return '/(app)/(tabs)/plan';
    case 'article-detail':
      // /article/[id] exists as a thin wrapper; validate the id before routing.
      return resourceId && isValidUUID(resourceId)
        ? `/(app)/article/${encodeURIComponent(resourceId)}`
        : null;
    case 'conversation':
      // /conversation/[conversationId] exists as a thin wrapper.
      return resourceId && isValidUUID(resourceId)
        ? `/(app)/conversation/${encodeURIComponent(resourceId)}`
        : null;
    case 'weekly-review':
      // Progress stack screen hosts weekly review summaries.
      return '/(app)/progress';
    case 'activity':
      // Progress stack screen hosts recent activity.
      return '/(app)/progress';
    case 'notifications':
      // Notifications stack screen (presented as a sheet).
      return '/(app)/notifications';
    default:
      return null;
  }
}

/**
 * Validates a UUID string (v4). Used to validate resource IDs from push
 * payloads before interpolating them into route paths.
 */
export function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}
