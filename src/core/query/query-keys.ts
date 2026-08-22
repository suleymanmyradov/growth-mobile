/**
 * Query-key factories per domain.
 *
 * Per AGENTS.md: use query-key factories per domain, e.g. `habitKeys.all`,
 * `habitKeys.list(params)`, `habitKeys.detail(id)`. Mutations invalidate or
 * update every affected domain explicitly.
 */

export const habitKeys = {
  all: ['habits'] as const,
  lists: () => [...habitKeys.all, 'list'] as const,
  list: (params?: { page?: number; limit?: number }) =>
    [...habitKeys.lists(), params ?? {}] as const,
  details: () => [...habitKeys.all, 'detail'] as const,
  detail: (id: string) => [...habitKeys.details(), id] as const,
};

export const goalKeys = {
  all: ['goals'] as const,
  lists: () => [...goalKeys.all, 'list'] as const,
  list: (params?: { page?: number; limit?: number }) =>
    [...goalKeys.lists(), params ?? {}] as const,
  details: () => [...goalKeys.all, 'detail'] as const,
  detail: (id: string) => [...goalKeys.details(), id] as const,
};

export const checkInKeys = {
  all: ['checkIns'] as const,
  today: () => [...checkInKeys.all, 'today'] as const,
  history: (params?: { habitId?: string; page?: number; limit?: number }) =>
    [...checkInKeys.all, 'history', params ?? {}] as const,
};

export const categoryKeys = {
  all: ['categories'] as const,
  list: (entityType?: string) => [...categoryKeys.all, 'list', entityType ?? 'habit'] as const,
};

export const profileKeys = {
  all: ['profile'] as const,
  me: () => [...profileKeys.all, 'me'] as const,
};

export const settingsKeys = {
  all: ['settings'] as const,
  get: () => [...settingsKeys.all] as const,
};

export const activityKeys = {
  all: ['activities'] as const,
  list: (params?: { page?: number; limit?: number }) =>
    [...activityKeys.all, 'list', params ?? {}] as const,
};

export const billingKeys = {
  all: ['billing'] as const,
  overview: () => [...billingKeys.all, 'overview'] as const,
  offerings: () => [...billingKeys.all, 'offerings'] as const,
};

export const weeklyReviewKeys = {
  all: ['weeklyReviews'] as const,
  lists: () => [...weeklyReviewKeys.all, 'list'] as const,
  list: (params?: { page?: number; limit?: number }) =>
    [...weeklyReviewKeys.lists(), params ?? {}] as const,
  current: () => [...weeklyReviewKeys.all, 'current'] as const,
  details: () => [...weeklyReviewKeys.all, 'detail'] as const,
  detail: (weekStart: string) => [...weeklyReviewKeys.details(), weekStart] as const,
};

export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (params?: { page?: number; limit?: number }) =>
    [...notificationKeys.lists(), params ?? {}] as const,
  unreadCount: () => [...notificationKeys.all, 'unreadCount'] as const,
  preferences: () => [...notificationKeys.all, 'preferences'] as const,
};

export const articleKeys = {
  all: ['articles'] as const,
  lists: () => [...articleKeys.all, 'list'] as const,
  list: (params?: { categorySlug?: string; page?: number; limit?: number }) =>
    [...articleKeys.lists(), params ?? {}] as const,
  featured: () => [...articleKeys.all, 'featured'] as const,
  author: (authorId: string, params?: { page?: number; limit?: number }) =>
    [...articleKeys.all, 'author', authorId, params ?? {}] as const,
  details: () => [...articleKeys.all, 'detail'] as const,
  detail: (id: string) => [...articleKeys.details(), id] as const,
};

export const savedKeys = {
  all: ['saved'] as const,
  list: (params?: { page?: number; limit?: number }) =>
    [...savedKeys.all, 'list', params ?? {}] as const,
  listDetailed: (params?: { page?: number; limit?: number }) =>
    [...savedKeys.all, 'listDetailed', params ?? {}] as const,
};

export const searchKeys = {
  all: ['search'] as const,
  query: (params: { q: string; itemType?: string; page?: number; limit?: number }) =>
    [...searchKeys.all, 'query', params] as const,
};

export const templateKeys = {
  all: ['templates'] as const,
  habit: () => [...templateKeys.all, 'habit'] as const,
  goal: () => [...templateKeys.all, 'goal'] as const,
};

export const conversationKeys = {
  all: ['conversations'] as const,
  lists: () => [...conversationKeys.all, 'list'] as const,
  list: (params?: { type?: string; page?: number; limit?: number }) =>
    [...conversationKeys.lists(), params ?? {}] as const,
  details: () => [...conversationKeys.all, 'detail'] as const,
  detail: (id: string) => [...conversationKeys.details(), id] as const,
  messages: (id: string) => [...conversationKeys.detail(id), 'messages'] as const,
};
