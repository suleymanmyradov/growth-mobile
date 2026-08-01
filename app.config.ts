import { ConfigContext, ExpoConfig } from 'expo/config';

type ConfigPlugin = [string, Record<string, unknown>];

/**
 * Growth mobile app configuration.
 *
 * PLACEHOLDER VALUES: Bundle IDs, schemes, and display names below are
 * placeholders pending organizational decisions in
 * `docs/app-identity-environment-matrix.md`. Swap them when decisions are made.
 *
 * EAS profiles (development, preview, production) use distinct bundle IDs so
 * installs don't collide and push credentials are scoped correctly.
 */

const PLACEHOLDER_BUNDLE_ID_IOS = 'com.growth.app';
const PLACEHOLDER_BUNDLE_ID_ANDROID = 'com.growth.app';
const PLACEHOLDER_SCHEME = 'growth';

type EasProfile = 'development' | 'preview' | 'production';

const profileBundleIds: Record<EasProfile, { ios: string; android: string; scheme: string }> = {
  development: {
    ios: `${PLACEHOLDER_BUNDLE_ID_IOS}.dev`,
    android: `${PLACEHOLDER_BUNDLE_ID_ANDROID}.dev`,
    scheme: `${PLACEHOLDER_SCHEME}-dev`,
  },
  preview: {
    ios: `${PLACEHOLDER_BUNDLE_ID_IOS}.preview`,
    android: `${PLACEHOLDER_BUNDLE_ID_ANDROID}.preview`,
    scheme: `${PLACEHOLDER_SCHEME}-preview`,
  },
  production: {
    ios: PLACEHOLDER_BUNDLE_ID_IOS,
    android: PLACEHOLDER_BUNDLE_ID_ANDROID,
    scheme: PLACEHOLDER_SCHEME,
  },
};

// EAS_PROFILE is set by EAS Build; default to development for local runs.
const easProfile = (process.env.EAS_PROFILE as EasProfile | undefined) ?? 'development';
const ids = profileBundleIds[easProfile] ?? profileBundleIds.development;

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Growth',
  slug: 'growth-mobile',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: ids.scheme,
  userInterfaceStyle: 'automatic',
  ios: {
    ...config.ios,
    bundleIdentifier: ids.ios,
    icon: './assets/expo.icon',
  },
  android: {
    ...config.android,
    package: ids.android,
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-asset',
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
        organization: 'PLACEHOLDER',
        project: 'PLACEHOLDER',
        dsn: process.env.EXPO_PUBLIC_SENTRY_DSN || '',
      },
    ],
    // Strip the aps-environment entitlement for local development builds so the
    // app can be signed with a free Personal Apple Developer team (which cannot
    // use the Push Notifications capability). EAS builds are unaffected because
    // `EAS_BUILD_PROFILE` is set there. See plugins/stripPushForLocalDev.js.
    ...((easProfile === 'development'
      ? [
          ['./plugins/stripPushForLocalDev', { enabled: true }],
          // Tell the dev build where Metro is running so a physical device can
          // reach it. Without this, RCTBundleURLProvider defaults to localhost.
          // Set EXPO_PUBLIC_METRO_HOST in .env to your Mac's LAN IP.
          [
            './plugins/withDevBundleHost',
            { host: process.env.EXPO_PUBLIC_METRO_HOST },
          ],
        ]
      : []) as ConfigPlugin[]),
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    eas: {
      projectId: 'PLACEHOLDER_EAS_PROJECT_ID',
    },
  },
});
