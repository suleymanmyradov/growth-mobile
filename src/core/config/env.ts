import { z } from 'zod';

/**
 * Environment variable validation.
 *
 * Only `EXPO_PUBLIC_*` variables are available in the client bundle.
 * No secrets may enter this file or the client bundle.
 *
 * PLACEHOLDER values: OAuth client IDs, Sentry DSN, PostHog keys, and API
 * origin for non-development environments are pending organizational decisions
 * in `docs/app-identity-environment-matrix.md`.
 */

const envSchema = z.object({
  // API origin — absolute HTTPS origin in non-development builds.
  EXPO_PUBLIC_API_ORIGIN: z.string().url().default('http://localhost:8888'),

  // AI-gateway origin — separate API service for AI/streaming routes (coaching,
  // weekly reviews, conversations, voice). In production both services share a
  // single origin via ingress; in local dev they run on separate ports.
  // Empty = same as EXPO_PUBLIC_API_ORIGIN (production / single-origin).
  EXPO_PUBLIC_AI_GATEWAY_ORIGIN: z.string().default(''),

  // OAuth client IDs (PLACEHOLDER — pending organizational decisions).
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: z.string().default(''),
  EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID: z.string().default(''),
  EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID: z.string().default(''),
  EXPO_PUBLIC_APPLE_SERVICES_ID: z.string().default(''),

  // Sentry (disabled by default; set DSN to enable).
  EXPO_PUBLIC_SENTRY_DSN: z.string().default(''),

  // PostHog (disabled by default; set host + key to enable).
  EXPO_PUBLIC_POSTHOG_HOST: z.string().default(''),
  EXPO_PUBLIC_POSTHOG_KEY: z.string().default(''),

  // RevenueCat (disabled by default; set keys to enable).
  EXPO_PUBLIC_REVENUECAT_APPLE_KEY: z.string().default(''),
  EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY: z.string().default(''),
  EXPO_PUBLIC_REVENUECAT_PROJECT_ID: z.string().default(''),

  // Legal links (validated destinations for the paywall; empty disables).
  EXPO_PUBLIC_TERMS_URL: z
    .string()
    .default('')
    .refine((v) => v === '' || z.string().url().safeParse(v).success, 'Invalid URL'),
  EXPO_PUBLIC_PRIVACY_URL: z
    .string()
    .default('')
    .refine((v) => v === '' || z.string().url().safeParse(v).success, 'Invalid URL'),

  // EAS project ID (PLACEHOLDER — pending organizational decisions).
  EXPO_PUBLIC_EAS_PROJECT_ID: z.string().default('PLACEHOLDER_EAS_PROJECT_ID'),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

/**
 * Returns validated environment variables.
 * Throws if validation fails — the app should not run with invalid config.
 */
export function getEnv(): Env {
  if (cachedEnv) return cachedEnv;

  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const errors = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
    throw new Error(`Invalid environment variables: ${errors}`);
  }

  cachedEnv = result.data;
  return cachedEnv;
}

/**
 * The API base path. All gateway routes are under `/api/v1`.
 */
export function apiBaseUrl(): string {
  return `${getEnv().EXPO_PUBLIC_API_ORIGIN}/api/v1`;
}

/**
 * The AI-gateway API base path (origin + /api/v1). Falls back to the main
 * gateway origin when no separate AI-gateway origin is configured.
 */
export function apiBaseUrlAi(): string {
  const { EXPO_PUBLIC_API_ORIGIN, EXPO_PUBLIC_AI_GATEWAY_ORIGIN } = getEnv();
  const origin = EXPO_PUBLIC_AI_GATEWAY_ORIGIN || EXPO_PUBLIC_API_ORIGIN;
  return `${origin}/api/v1`;
}

/**
 * Path prefixes owned by the ai-gateway service. Used to route requests to the
 * correct backend in local dev (where the two services run on separate ports).
 * In production, ingress handles routing and `EXPO_PUBLIC_AI_GATEWAY_ORIGIN`
 * can be empty (same origin).
 *
 * Keep in sync with services/ai-gateway/contract/main.api route groups.
 */
const AI_GATEWAY_PATH_PREFIXES = [
  '/personalization/coaching',
  '/personalization/coaching-stream',
  '/personalization/onboarding-habits',
  '/personalization/transcribe',
  '/personalization/voice-turn',
  '/weekly-reviews/generate',
  '/weekly-reviews/generate-stream',
  '/conversations',
];

/**
 * Whether a given API path (without /api/v1 prefix) routes to the ai-gateway.
 */
export function isAiGatewayPath(path: string): boolean {
  const { EXPO_PUBLIC_AI_GATEWAY_ORIGIN } = getEnv();
  if (!EXPO_PUBLIC_AI_GATEWAY_ORIGIN) return false;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return AI_GATEWAY_PATH_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`),
  );
}

/**
 * Build the full URL for an API path, routing to the ai-gateway or main gateway
 * based on the path prefix. Use this instead of `apiBaseUrl()` + path for
 * calls that may hit AI routes.
 */
export function apiUrlFor(path: string): string {
  const { EXPO_PUBLIC_API_ORIGIN, EXPO_PUBLIC_AI_GATEWAY_ORIGIN } = getEnv();
  const origin = isAiGatewayPath(path) ? EXPO_PUBLIC_AI_GATEWAY_ORIGIN : EXPO_PUBLIC_API_ORIGIN;
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${origin}/api/v1${p}`;
}
