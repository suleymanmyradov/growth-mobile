/**
 * Typed endpoint registry.
 *
 * Per AGENTS.md: keep all route strings in one typed endpoint registry. Do not
 * inline `/api/v1` paths in screens/components. All paths are relative to the
 * API base (`${EXPO_PUBLIC_API_ORIGIN}/api/v1`).
 *
 * Path parameters are encoded by the caller via `encodeURIComponent` before
 * interpolation — the functions here do not encode to keep them pure and
 * testable.
 */

// ─── Auth ────────────────────────────────────────────────────────────────────

export const authEndpoints = {
  login: '/auth/login',
  register: '/auth/register',
  logout: '/auth/logout',
  refresh: '/auth/refresh',
  verifyEmail: '/auth/verify-email',
  resendVerification: '/auth/resend-verification',
  googleLogin: '/auth/google',
  appleLogin: '/auth/apple',
  forgotPassword: '/auth/forgot-password',
  resetPassword: '/auth/reset-password',
} as const;

// ─── Profile ──────────────────────────────────────────────────────────────────

export const profileEndpoints = {
  me: '/profile/me',
  update: '/profile',
  delete: '/profile',
} as const;

// ─── Habits ───────────────────────────────────────────────────────────────────

export const habitEndpoints = {
  list: '/habits',
  detail: (id: string) => `/habits/${id}`,
  resetToday: '/habits/reset-today',
} as const;

// ─── Goals ────────────────────────────────────────────────────────────────────

export const goalEndpoints = {
  list: '/goals',
  detail: (id: string) => `/goals/${id}`,
  toggle: (id: string) => `/goals/${id}/toggle`,
  progress: (id: string) => `/goals/${id}/progress`,
} as const;

// ─── Check-Ins ────────────────────────────────────────────────────────────────

export const checkInEndpoints = {
  create: '/check-ins',
  today: '/check-ins/today',
  history: '/check-ins/history',
  checkedToday: '/check-ins/checked-today',
} as const;

// ─── Categories ───────────────────────────────────────────────────────────────

export const categoryEndpoints = {
  list: '/categories',
} as const;

// ─── Settings ─────────────────────────────────────────────────────────────────

export const settingsEndpoints = {
  get: '/settings',
  update: '/settings',
} as const;

// ─── Personalization / Onboarding ─────────────────────────────────────────────

export const personalizationEndpoints = {
  onboardingHabits: '/personalization/onboarding-habits',
  coachingProfile: '/personalization/coaching-profile',
} as const;

// ─── Activity ─────────────────────────────────────────────────────────────────

export const activityEndpoints = {
  list: '/activity',
} as const;

// ─── Weekly Review ────────────────────────────────────────────────────────────

export const weeklyReviewEndpoints = {
  list: '/weekly-reviews',
  current: '/weekly-reviews/current',
  generate: '/weekly-reviews/generate',
  generateStream: '/weekly-reviews/generate-stream',
  detail: (weekStart: string) => `/weekly-reviews/${weekStart}`,
} as const;

// ─── Notifications ────────────────────────────────────────────────────────────

export const notificationEndpoints = {
  list: '/notifications',
  unreadCount: '/notifications/unread-count',
  markRead: (id: string) => `/notifications/${id}/read`,
  markAllRead: '/notifications/read-all',
  preferences: '/notification-preferences',
} as const;
