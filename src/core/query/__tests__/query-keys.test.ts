/**
 * Tests for query-key factories.
 */
import { describe, expect, it } from '@jest/globals';

import {
  activityKeys,
  articleKeys,
  billingKeys,
  categoryKeys,
  checkInKeys,
  conversationKeys,
  goalKeys,
  habitKeys,
  notificationKeys,
  profileKeys,
  reportKeys,
  savedKeys,
  searchKeys,
  settingsKeys,
  templateKeys,
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

describe('articleKeys', () => {
  it('produces stable all key', () => {
    expect(articleKeys.all).toEqual(['articles']);
  });

  it('produces list keys with params', () => {
    expect(articleKeys.list({ categorySlug: 'health', page: 1 })).toEqual([
      'articles',
      'list',
      { categorySlug: 'health', page: 1 },
    ]);
  });

  it('produces featured key', () => {
    expect(articleKeys.featured()).toEqual(['articles', 'featured']);
  });

  it('produces detail key', () => {
    expect(articleKeys.detail('article-1')).toEqual(['articles', 'detail', 'article-1']);
  });

  it('produces author keys', () => {
    expect(articleKeys.author('author-1', { page: 2 })).toEqual([
      'articles',
      'author',
      'author-1',
      { page: 2 },
    ]);
  });
});

describe('savedKeys', () => {
  it('produces stable all key', () => {
    expect(savedKeys.all).toEqual(['saved']);
  });

  it('produces list keys with params', () => {
    expect(savedKeys.list({ page: 1, limit: 20 })).toEqual([
      'saved',
      'list',
      { page: 1, limit: 20 },
    ]);
  });

  it('produces listDetailed keys with params', () => {
    expect(savedKeys.listDetailed({ limit: 50 })).toEqual(['saved', 'listDetailed', { limit: 50 }]);
  });
});

describe('searchKeys', () => {
  it('produces query keys with params', () => {
    expect(searchKeys.query({ q: 'habit', itemType: 'article' })).toEqual([
      'search',
      'query',
      { q: 'habit', itemType: 'article' },
    ]);
  });

  it('produces query keys without optional params', () => {
    expect(searchKeys.query({ q: 'test' })).toEqual(['search', 'query', { q: 'test' }]);
  });
});

describe('templateKeys', () => {
  it('produces stable all key', () => {
    expect(templateKeys.all).toEqual(['templates']);
  });

  it('produces habit key', () => {
    expect(templateKeys.habit()).toEqual(['templates', 'habit']);
  });

  it('produces goal key', () => {
    expect(templateKeys.goal()).toEqual(['templates', 'goal']);
  });
});

describe('conversationKeys', () => {
  it('produces stable all key', () => {
    expect(conversationKeys.all).toEqual(['conversations']);
  });

  it('produces list keys with params', () => {
    expect(conversationKeys.list({ type: 'coach', page: 1 })).toEqual([
      'conversations',
      'list',
      { type: 'coach', page: 1 },
    ]);
  });

  it('produces list keys without params', () => {
    expect(conversationKeys.list()).toEqual(['conversations', 'list', {}]);
  });

  it('produces detail keys', () => {
    expect(conversationKeys.detail('conv-1')).toEqual(['conversations', 'detail', 'conv-1']);
  });

  it('produces messages keys nested under detail', () => {
    expect(conversationKeys.messages('conv-1')).toEqual([
      'conversations',
      'detail',
      'conv-1',
      'messages',
    ]);
  });
});

describe('billingKeys', () => {
  it('produces stable all key', () => {
    expect(billingKeys.all).toEqual(['billing']);
  });

  it('produces overview key', () => {
    expect(billingKeys.overview()).toEqual(['billing', 'overview']);
  });

  it('produces offerings key', () => {
    expect(billingKeys.offerings()).toEqual(['billing', 'offerings']);
  });
});

describe('reportKeys', () => {
  it('produces stable all key', () => {
    expect(reportKeys.all).toEqual(['reports']);
  });
});
