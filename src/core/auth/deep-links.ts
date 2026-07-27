/**
 * Deep-link validation.
 *
 * Per AGENTS.md: the mobile app must never pass `destination` or any payload
 * field directly to the router. It must map `destination` + `resourceId` to a
 * typed Expo Router route.
 *
 * This module defines the allowed destinations and maps them to typed route
 * paths. Any destination not in the allowlist is rejected.
 */

export type DeepLinkDestination =
  | 'habit-detail'
  | 'goal-detail'
  | 'article-detail'
  | 'conversation'
  | 'weekly-review'
  | 'activity'
  | 'notifications';

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
 * Returns null if the destination is invalid or the resource ID is missing
 * when required.
 */
export function destinationToRoute(
  destination: DeepLinkDestination,
  resourceId?: string,
): string | null {
  switch (destination) {
    case 'habit-detail':
      return resourceId ? `/habits/${resourceId}` : '/habits';
    case 'goal-detail':
      return resourceId ? `/goals/${resourceId}` : '/goals';
    case 'article-detail':
      return resourceId ? `/article/${resourceId}` : null;
    case 'conversation':
      return resourceId ? `/conversation/${resourceId}` : '/conversation';
    case 'weekly-review':
      return '/weekly-review';
    case 'activity':
      return '/activity';
    case 'notifications':
      return '/notifications';
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
