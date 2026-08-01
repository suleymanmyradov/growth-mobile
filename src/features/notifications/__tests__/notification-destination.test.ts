/**
 * Tests for notification → destination routing.
 *
 * Per `mobile.md` §8.10, tapping a notification row routes only through the
 * validated internal-route allowlist. Unknown item types must resolve to null
 * so the caller falls back to a safe default.
 */
import { describe, expect, it } from '@jest/globals';

import type { Notification } from '@/core/api/schemas';

import { notificationToRoute, notificationTypeToDestination } from '../notification-destination';

function makeNotification(itemType: string): Notification {
  return {
    id: 'notif-1',
    title: 'Title',
    message: 'Message',
    type: itemType,
    read: false,
    userId: 'user-1',
    createdAt: '2024-01-15T08:00:00Z',
  };
}

describe('notificationTypeToDestination', () => {
  it.each([
    ['habit_reminder', 'habit-detail'],
    ['habit_completed', 'habit-detail'],
    ['habit_missed', 'habit-detail'],
    ['goal_reminder', 'goal-detail'],
    ['goal_progress', 'goal-detail'],
    ['goal_completed', 'goal-detail'],
    ['article', 'article-detail'],
    ['article_published', 'article-detail'],
    ['coach_message', 'conversation'],
    ['conversation_reply', 'conversation'],
    ['weekly_review', 'weekly-review'],
    ['weekly_review_ready', 'weekly-review'],
    ['activity', 'activity'],
  ])('maps %s to %s', (itemType, expected) => {
    expect(notificationTypeToDestination(itemType)).toBe(expected);
  });

  it('returns null for unknown item types', () => {
    expect(notificationTypeToDestination('unknown')).toBeNull();
    expect(notificationTypeToDestination('')).toBeNull();
  });

  it('never accepts arbitrary destination strings', () => {
    // Even a string that looks like a route must not be accepted as a type.
    expect(notificationTypeToDestination('/(app)/article/123')).toBeNull();
  });
});

describe('notificationToRoute', () => {
  it('routes habit reminders to the Plan tab (no per-id detail screen)', () => {
    expect(notificationToRoute(makeNotification('habit_reminder'))).toBe('/(app)/(tabs)/plan');
  });

  it('routes goal reminders to the Plan tab', () => {
    expect(notificationToRoute(makeNotification('goal_reminder'))).toBe('/(app)/(tabs)/plan');
  });

  it('routes weekly review to the Progress screen', () => {
    expect(notificationToRoute(makeNotification('weekly_review'))).toBe('/(app)/progress');
  });

  it('routes activity to the Progress screen', () => {
    expect(notificationToRoute(makeNotification('activity'))).toBe('/(app)/progress');
  });

  it('returns null for unknown item types (safe fallback)', () => {
    expect(notificationToRoute(makeNotification('unknown'))).toBeNull();
  });

  it('article-detail without a resource id returns null (no id to route to)', () => {
    // Notifications carry no per-row resource id, so article-detail cannot
    // resolve to a specific article; the caller falls back to a safe default.
    expect(notificationToRoute(makeNotification('article'))).toBeNull();
  });
});
