/**
 * Push device registration — registers the Expo push token with the backend so
 * the notifications service can deliver push.
 *
 * Per AGENTS.md: push requires backend device registration. Actual push
 * delivery needs org configuration (Expo project ID, APNs/FCM credentials);
 * this module is best-effort and no-ops gracefully when no token can be
 * obtained (simulator, missing project id, offline). Tokens are never logged.
 *
 * Domain boundary: lives in `features/notifications` and uses the shared
 * installation id from `core/auth/installation`. It does not import other
 * features.
 */
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

import { getExpoProjectId, getOrCreateInstallationId } from '@/core/auth/installation';
import * as Localization from 'expo-localization';

import { registerDevice } from './api';

export interface RegisterPushTokenResult {
  registered: boolean;
  /** The installation id used for registration, when registered. */
  installationId?: string;
}

/**
 * Obtains the Expo push token (when available) and registers it with the
 * backend against the installation id. Returns `{ registered: false }` when
 * no token could be obtained (e.g. simulator, missing project id, network
 * failure). Never throws — callers may invoke this fire-and-forget on app
 * foreground / auth.
 */
export async function registerPushToken(): Promise<RegisterPushTokenResult> {
  // Physical device is required for a real push token.
  if (!Device.isDevice) {
    return { registered: false };
  }

  const projectId = getExpoProjectId();
  if (!projectId) {
    // No EAS project id configured — push cannot be addressed. Org blocker.
    return { registered: false };
  }

  let token: string;
  try {
    const result = await Notifications.getExpoPushTokenAsync({ projectId });
    token = result.data;
  } catch {
    // Token fetch failed (offline, credentials missing, etc.). Best-effort.
    return { registered: false };
  }

  const installationId = await getOrCreateInstallationId();

  try {
    await registerDevice(installationId, {
      pushToken: token,
      provider: 'expo',
      platform: Device.osName?.toLowerCase() ?? 'unknown',
      environment: __DEV__ ? 'development' : 'production',
      appId: Application.applicationId ?? undefined,
      appVersion: Application.nativeApplicationVersion ?? undefined,
      osVersion: Device.osVersion ?? undefined,
      locale: Localization.getLocales()[0]?.languageTag ?? undefined,
      timezone: Localization.getCalendars()[0]?.timeZone ?? undefined,
    });
    return { registered: true, installationId };
  } catch {
    // Registration failed — best-effort; will retry on next foreground.
    return { registered: false };
  }
}
