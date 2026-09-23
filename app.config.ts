import { ConfigContext, ExpoConfig } from 'expo/config';

type ConfigPlugin = [string, Record<string, unknown>];

/**
 * Evolella mobile app configuration.
 *
 * App identity is decided in `docs/app-identity-environment-matrix.md`:
 * bundle IDs, URL schemes, and display names differ per environment profile
 * so installs don't collide and push credentials are scoped correctly.
 *
 * Environment resolution order: `APP_ENV` → `EAS_PROFILE` → `EAS_BUILD_PROFILE`
 * → 'development'. `EAS_PROFILE` is set per build profile in `eas.json` and
 * `EAS_BUILD_PROFILE` is set automatically by EAS Build; `APP_ENV` is a manual
 * override for local runs (e.g. `APP_ENV=preview bun start`).
 */

type AppEnv = 'development' | 'preview' | 'production';

const APP_IDENTITIES: Record<AppEnv, { name: string; bundleId: string; scheme: string }> = {
  production: {
    name: 'Evolella',
    bundleId: 'com.evolella.app',
    scheme: 'evolella',
  },
  preview: {
    name: 'Evolella Preview',
    bundleId: 'com.evolella.app.preview',
    scheme: 'evolella-preview',
  },
  development: {
    name: 'Evolella Dev',
    bundleId: 'com.evolella.app.dev',
    scheme: 'evolella-dev',
  },
};

function resolveAppEnv(): AppEnv {
  const raw =
    process.env.APP_ENV ??
    process.env.EAS_PROFILE ??
    process.env.EAS_BUILD_PROFILE ??
    'development';
  return raw in APP_IDENTITIES ? (raw as AppEnv) : 'development';
}

const appEnv = resolveAppEnv();
const identity = APP_IDENTITIES[appEnv];

// Decided deep-link host (matrix §2). Requires hosted association files:
//   https://link.evolella.com/.well-known/apple-app-site-association
//   https://link.evolella.com/.well-known/assetlinks.json
// Web fallback origin for email links: https://app.evolella.com
// (EXPO_PUBLIC_WEB_APP_ORIGIN in src/core/config/env.ts).
const DEEP_LINK_HOST = 'link.evolella.com';

// PENDING (matrix §4): `eas init` once the `evolella` Expo account exists.
// Until then the project ID is read from EXPO_PUBLIC_EAS_PROJECT_ID and falls
// back to a placeholder that src/core/auth/installation.ts treats as unset.
const easProjectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID || 'PLACEHOLDER_EAS_PROJECT_ID';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: identity.name,
  slug: 'evolella',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: identity.scheme,
  userInterfaceStyle: 'automatic',
  ios: {
    ...config.ios,
    bundleIdentifier: identity.bundleId,
    // Universal Links + shared web credentials for the decided link host.
    associatedDomains: [`applinks:${DEEP_LINK_HOST}`, `webcredentials:${DEEP_LINK_HOST}`],
    icon: './assets/expo.icon',
    // PENDING (matrix §4): Apple Developer account is deferred. Set
    // APPLE_TEAM_ID once it exists — it must match backend AppleOAuth.TeamID.
    ...(process.env.APPLE_TEAM_ID ? { appleTeamId: process.env.APPLE_TEAM_ID } : {}),
  },
  android: {
    ...config.android,
    package: identity.bundleId,
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    intentFilters: [
      // Android App Links — verified https links for link.evolella.com.
      // autoVerify requires assetlinks.json hosted on the domain.
      {
        action: 'VIEW',
        autoVerify: true,
        data: [{ scheme: 'https', host: DEEP_LINK_HOST }],
        category: ['BROWSABLE', 'DEFAULT'],
      },
      // Custom URL scheme (evolella://, evolella-preview://, evolella-dev://).
      // The top-level `scheme` field also registers this on both platforms.
      {
        action: 'VIEW',
        data: [{ scheme: identity.scheme }],
        category: ['BROWSABLE', 'DEFAULT'],
      },
    ],
  },
  // Web platform disabled — this is a mobile-only app (iOS + Android).
  // expo-sqlite's web worker chunk crashes Metro's web serializer on SDK 57,
  // which kills Metro and cascades into "No script URL provided" on device.
  platforms: ['ios', 'android'],
  plugins: [
    'expo-router',
    'expo-asset',
    'expo-font',
    'expo-image',
    'expo-secure-store',
    'expo-sqlite',
    [
      'expo-audio',
      {
        microphonePermission: 'Allow $(PRODUCT_NAME) to access your microphone.',
      },
    ],
    [
      'expo-splash-screen',
      {
        backgroundColor: '#208AEF',
        image: './assets/images/splash-icon.png',
        imageWidth: 76,
      },
    ],
    [
      '@sentry/react-native',
      {
        // Decided (matrix §3): `growth-mobile` project in the `evolella`
        // sentry.io org. DSN stays an env read — PENDING until the project is
        // created. SENTRY_AUTH_TOKEN (optional EAS secret) enables source-map
        // upload at build time only.
        organization: 'evolella',
        project: 'growth-mobile',
        dsn: process.env.EXPO_PUBLIC_SENTRY_DSN || '',
      },
    ],
    // Strip the aps-environment entitlement for local development builds so the
    // app can be signed with a free Personal Apple Developer team (which cannot
    // use the Push Notifications capability). EAS builds are unaffected because
    // `EAS_BUILD_PROFILE` is set there. See plugins/stripPushForLocalDev.js.
    ...((appEnv === 'development'
      ? [
          ['./plugins/stripPushForLocalDev', { enabled: true }],
          // Tell the dev build where Metro is running so a physical device can
          // reach it. Without this, RCTBundleURLProvider defaults to localhost.
          // Set EXPO_PUBLIC_METRO_HOST in .env to your Mac's LAN IP.
          ['./plugins/withDevBundleHost', { host: process.env.EXPO_PUBLIC_METRO_HOST }],
        ]
      : []) as ConfigPlugin[]),
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    // Readable at runtime via Constants.expoConfig.extra.appEnv — used for the
    // Sentry environment name (matrix §3) and any per-env feature gating.
    appEnv,
    eas: {
      projectId: easProjectId,
    },
  },
  // PENDING (matrix §4): Expo account `evolella` does not exist yet. When it
  // does, set EXPO_OWNER=evolella (or pass --owner to eas). Omitted otherwise
  // so the owner defaults to the logged-in Expo user.
  ...(process.env.EXPO_OWNER ? { owner: process.env.EXPO_OWNER } : {}),
});
