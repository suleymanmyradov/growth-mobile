/**
 * Tests for query-key factories.
 */
import { describe, expect, it } from '@jest/globals';

import {
  activityKeys,
  categoryKeys,
  checkInKeys,
  goalKeys,
  habitKeys,
  notificationKeys,
  profileKeys,
  settingsKeys,
  weeklyReviewKeys,
} from '@/core/query/query-keys';

describe('habitKeys', () => {
  it('produces stable all key', () => {
    expect(habitKeys.all).toEqual(['habits']);
  });

  it('produces list keys with params', () => {
    expect(habitKeys.list({ page: 1, limit: 20 })).toEqual([
      'habits',
      'list',
      { page: 1, limit: 20 },
    ]);
  });

  it('produces list keys without params', () => {
    expect(habitKeys.list()).toEqual(['habits', 'list', {}]);
  });

  it('produces detail keys', () => {
    expect(habitKeys.detail('habit-1')).toEqual(['habits', 'detail', 'habit-1']);
  });
});

describe('goalKeys', () => {
  it('produces stable all key', () => {
    expect(goalKeys.all).toEqual(['goals']);
  });

  it('produces detail keys', () => {
    expect(goalKeys.detail('goal-1')).toEqual(['goals', 'detail', 'goal-1']);
  });
});

describe('checkInKeys', () => {
  it('produces today key', () => {
    expect(checkInKeys.today()).toEqual(['checkIns', 'today']);
  });

  it('produces history keys with params', () => {
    expect(checkInKeys.history({ habitId: 'h1', page: 1 })).toEqual([
      'checkIns',
      'history',
      { habitId: 'h1', page: 1 },
    ]);
  });
});

describe('categoryKeys', () => {
  it('produces list key with entity type', () => {
    expect(categoryKeys.list('habit')).toEqual(['categories', 'list', 'habit']);
  });

  it('defaults to habit entity type', () => {
    expect(categoryKeys.list()).toEqual(['categories', 'list', 'habit']);
  });
});

describe('profileKeys', () => {
  it('produces me key', () => {
    expect(profileKeys.me()).toEqual(['profile', 'me']);
  });
});

describe('settingsKeys', () => {
  it('produces get key', () => {
    expect(settingsKeys.get()).toEqual(['settings']);
  });
});

describe('activityKeys', () => {
  it('produces stable all key', () => {
    expect(activityKeys.all).toEqual(['activities']);
  });

  it('produces list keys with params', () => {
    expect(activityKeys.list({ page: 1, limit: 10 })).toEqual([
      'activities',
      'list',
      { page: 1, limit: 10 },
    ]);
  });
});

describe('weeklyReviewKeys', () => {
  it('produces stable all key', () => {
    expect(weeklyReviewKeys.all).toEqual(['weeklyReviews']);
  });

  it('produces current key', () => {
    expect(weeklyReviewKeys.current()).toEqual(['weeklyReviews', 'current']);
  });

  it('produces detail key by weekStart', () => {
    expect(weeklyReviewKeys.detail('2024-01-15')).toEqual([
      'weeklyReviews',
      'detail',
      '2024-01-15',
    ]);
  });

  it('produces list keys with params', () => {
    expect(weeklyReviewKeys.list({ page: 1 })).toEqual(['weeklyReviews', 'list', { page: 1 }]);
  });
});

describe('notificationKeys', () => {
  it('produces stable all key', () => {
    expect(notificationKeys.all).toEqual(['notifications']);
  });

  it('produces unreadCount key', () => {
    expect(notificationKeys.unreadCount()).toEqual(['notifications', 'unreadCount']);
  });

  it('produces preferences key', () => {
    expect(notificationKeys.preferences()).toEqual(['notifications', 'preferences']);
  });
});
