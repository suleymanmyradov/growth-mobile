import * as Application from 'expo-application';
import * as Device from 'expo-device';
import * as Localization from 'expo-localization';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { getExpoProjectId, getOrCreateInstallationId } from '@/core/auth/installation';

import { registerDevice, unregisterDevice } from './api';

export interface RegisterPushTokenResult {
  registered: boolean;
  permissionGranted: boolean;
  installationId?: string;
}

export async function ensureNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Growth reminders',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
  });
}

export function notificationPermissionGranted(
  permission: Notifications.NotificationPermissionsStatus,
): boolean {
  if (Platform.OS !== 'ios') return permission.status === 'granted';
  const status = permission.ios?.status;
  return (
    status === Notifications.IosAuthorizationStatus.AUTHORIZED ||
    status === Notifications.IosAuthorizationStatus.PROVISIONAL ||
    status === Notifications.IosAuthorizationStatus.EPHEMERAL
  );
}

let registrationInFlight: Promise<RegisterPushTokenResult> | null = null;

export async function registerPushToken(options?: {
  requestPermission?: boolean;
}): Promise<RegisterPushTokenResult> {
  if (registrationInFlight) {
    const result = await registrationInFlight;
    if (!options?.requestPermission || result.permissionGranted) return result;
  }
  const task = performPushRegistration(options);
  registrationInFlight = task;
  try {
    return await task;
  } finally {
    if (registrationInFlight === task) registrationInFlight = null;
  }
}

async function performPushRegistration(options?: {
  requestPermission?: boolean;
}): Promise<RegisterPushTokenResult> {
  if (!Device.isDevice) {
    return { registered: false, permissionGranted: false };
  }
  const projectId = getExpoProjectId();
  if (!projectId) {
    return { registered: false, permissionGranted: false };
  }

  try {
    await ensureNotificationChannel();
    let permission = await Notifications.getPermissionsAsync();
    if (!notificationPermissionGranted(permission) && options?.requestPermission) {
      permission = await Notifications.requestPermissionsAsync();
    }
    if (!notificationPermissionGranted(permission)) {
      return { registered: false, permissionGranted: false };
    }

    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    const installationId = await getOrCreateInstallationId();
    await registerDevice(installationId, {
      pushToken: token,
      provider: 'expo',
      platform: Platform.OS,
      environment: __DEV__ ? 'development' : 'production',
      appId: Application.applicationId ?? undefined,
      appVersion: Application.nativeApplicationVersion ?? undefined,
      osVersion: Device.osVersion ?? undefined,
      locale: Localization.getLocales()[0]?.languageTag ?? undefined,
      timezone: Localization.getCalendars()[0]?.timeZone ?? undefined,
    });
    return { registered: true, permissionGranted: true, installationId };
  } catch {
    return { registered: false, permissionGranted: false };
  }
}

export async function requestAndRegisterPushToken(): Promise<RegisterPushTokenResult> {
  return registerPushToken({ requestPermission: true });
}

export async function unregisterCurrentDevice(): Promise<void> {
  const installationId = await getOrCreateInstallationId();
  await unregisterDevice(installationId);
}
