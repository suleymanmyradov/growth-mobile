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
  list: (params?: { page?: number; limit?: number }) =>
    [...notificationKeys.all, 'list', params ?? {}] as const,
  unreadCount: () => [...notificationKeys.all, 'unreadCount'] as const,
  preferences: () => [...notificationKeys.all, 'preferences'] as const,
};
