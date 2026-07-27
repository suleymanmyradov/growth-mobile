/**
 * Tests for query-key factories.
 */
import { describe, it, expect } from '@jest/globals';

import {
  habitKeys,
  goalKeys,
  checkInKeys,
  categoryKeys,
  profileKeys,
  settingsKeys,
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
