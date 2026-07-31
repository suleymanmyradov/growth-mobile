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

// ─── Personalization / Onboarding / Coaching ──────────────────────────────────

export const personalizationEndpoints = {
  onboardingHabits: '/personalization/onboarding-habits',
  coachingProfile: '/personalization/coaching-profile',
  coachingProfilePreferences: '/personalization/coaching-profile/preferences',
  context: '/personalization/context',
  coaching: '/personalization/coaching',
  // SSE stream (POST, text/event-stream) — handled by the SSE client, not axios.
  coachingStream: '/personalization/coaching-stream',
  planAdjustments: '/personalization/plan-adjustments',
  // Custom multipart transport (POST multipart → JSON).
  transcribe: '/personalization/transcribe',
  // Custom multipart + SSE transport (POST multipart → text/event-stream).
  voiceTurn: '/personalization/voice-turn',
} as const;

// ─── Conversations ────────────────────────────────────────────────────────────

export const conversationEndpoints = {
  list: '/conversations',
  start: '/conversations',
  detail: (id: string) => `/conversations/${id}`,
  messages: (id: string) => `/conversations/${id}/messages`,
  archive: (id: string) => `/conversations/${id}/archive`,
  unarchive: (id: string) => `/conversations/${id}/unarchive`,
} as const;

// ─── Billing ──────────────────────────────────────────────────────────────────

export const billingEndpoints = {
  overview: '/billing/overview',
  checkout: '/billing/checkout',
  portal: '/billing/portal',
  upgradeEvents: '/billing/upgrade-events',
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

// ─── Push device registration ──────────────────────────────────────────────────

export const deviceEndpoints = {
  register: (installationId: string) => `/devices/${encodeURIComponent(installationId)}`,
  unregister: (installationId: string) => `/devices/${encodeURIComponent(installationId)}`,
} as const;

// ─── Articles ─────────────────────────────────────────────────────────────────

export const articleEndpoints = {
  list: '/articles',
  detail: (id: string) => `/articles/${id}`,
  featured: '/articles/featured',
  author: (authorId: string) => `/articles/author/${authorId}`,
  like: (id: string) => `/articles/${id}/like`,
  share: (id: string) => `/articles/${id}/share`,
} as const;

// ─── Saved items ──────────────────────────────────────────────────────────────

export const savedEndpoints = {
  list: '/saved',
  listDetailed: '/saved/detailed',
  save: '/saved',
  remove: (id: string) => `/saved/${id}`,
} as const;

// ─── Search ───────────────────────────────────────────────────────────────────

export const searchEndpoints = {
  search: '/search',
} as const;

// ─── Templates ────────────────────────────────────────────────────────────────

export const templateEndpoints = {
  habitTemplates: '/habit-templates',
  goalTemplates: '/goal-templates',
} as const;
