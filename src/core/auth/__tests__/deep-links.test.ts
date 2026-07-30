import { destinationToRoute, isValidUUID, validateDestination } from '../deep-links';

describe('deep-links', () => {
  describe('validateDestination', () => {
    it.each([
      'habit-detail',
      'goal-detail',
      'article-detail',
      'conversation',
      'weekly-review',
      'activity',
      'notifications',
    ])('accepts %s from the planned allowlist', (dest) => {
      expect(validateDestination(dest)).toBe(dest);
    });

    it('rejects unknown destinations', () => {
      expect(validateDestination('unknown')).toBeNull();
      expect(validateDestination('')).toBeNull();
      expect(validateDestination('Habit-Detail')).toBeNull();
    });
  });

  describe('destinationToRoute', () => {
    const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000';

    // Phase D: habits live under the Plan tab.
    it('routes habit-detail without resourceId to the Plan tab', () => {
      expect(destinationToRoute('habit-detail')).toBe('/(app)/(tabs)/plan');
    });

    it('returns null for habit-detail with resourceId (detail screen missing)', () => {
      expect(destinationToRoute('habit-detail', VALID_UUID)).toBeNull();
    });

    // Phase E folded goals into the Plan tab; goal-detail routes to Plan.
    it('routes goal-detail without resourceId to the Plan tab', () => {
      expect(destinationToRoute('goal-detail')).toBe('/(app)/(tabs)/plan');
    });

    it('returns null for goal-detail with resourceId (detail screen missing)', () => {
      expect(destinationToRoute('goal-detail', VALID_UUID)).toBeNull();
    });

    // Article/conversation routes exist as thin wrappers; id is required + validated.
    it('routes article-detail with a valid UUID to the article screen', () => {
      expect(destinationToRoute('article-detail', VALID_UUID)).toBe(`/(app)/article/${VALID_UUID}`);
    });

    it('returns null for article-detail without resourceId', () => {
      expect(destinationToRoute('article-detail')).toBeNull();
    });

    it('returns null for article-detail with an invalid resourceId', () => {
      expect(destinationToRoute('article-detail', 'not-a-uuid')).toBeNull();
      expect(destinationToRoute('article-detail', '../../etc/passwd')).toBeNull();
    });

    it('routes conversation with a valid UUID to the conversation screen', () => {
      expect(destinationToRoute('conversation', VALID_UUID)).toBe(
        `/(app)/conversation/${VALID_UUID}`,
      );
    });

    it('returns null for conversation without resourceId', () => {
      expect(destinationToRoute('conversation')).toBeNull();
    });

    it('returns null for conversation with an invalid resourceId', () => {
      expect(destinationToRoute('conversation', 'not-a-uuid')).toBeNull();
    });

    // weekly-review and activity both route to the Progress stack screen.
    it('routes weekly-review to the Progress screen', () => {
      expect(destinationToRoute('weekly-review')).toBe('/(app)/progress');
    });

    it('routes activity to the Progress screen', () => {
      expect(destinationToRoute('activity')).toBe('/(app)/progress');
    });

    it('routes notifications to the notifications screen', () => {
      expect(destinationToRoute('notifications')).toBe('/(app)/notifications');
    });
  });

  describe('isValidUUID', () => {
    it('accepts valid v4-style UUIDs', () => {
      expect(isValidUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
      expect(isValidUUID('123e4567-e89b-12d3-a456-426614174abc'.toUpperCase())).toBe(true);
    });

    it('rejects malformed strings', () => {
      expect(isValidUUID('')).toBe(false);
      expect(isValidUUID('not-a-uuid')).toBe(false);
      expect(isValidUUID('123e4567-e89b-12d3-a456')).toBe(false);
      expect(isValidUUID('123e4567e89b12d3a456426614174000')).toBe(false);
      expect(isValidUUID('../../etc/passwd')).toBe(false);
    });
  });
});
