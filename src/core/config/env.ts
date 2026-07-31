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
