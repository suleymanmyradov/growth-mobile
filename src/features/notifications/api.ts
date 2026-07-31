/**
 * Notifications API — list, unread count, mark read, mark all read,
 * preferences, and push device registration.
 *
 * Push device registration (`/devices/:installationId`) registers the Expo push
 * token with the backend so the notifications service can deliver push. Actual
 * push delivery requires org configuration (Expo project ID, credentials); the
 * registration call is best-effort and no-ops when no token is available.
 */
import { apiRequest } from '@/core/api/client';
import { deviceEndpoints, notificationEndpoints } from '@/core/api/endpoints';
import {
  NotificationPreferencesResponseSchema,
  NotificationsResponseSchema,
  UnreadNotificationCountResponseSchema,
  type Notification,
  type NotificationPreferences,
  type NotificationPreferencesResponse,
  type NotificationsResponse,
  type RegisterDeviceRequest,
  type UnreadNotificationCountResponse,
} from '@/core/api/schemas';

export type {
  Notification,
  NotificationPreferences,
  NotificationPreferencesResponse,
  NotificationsResponse,
  RegisterDeviceRequest,
  UnreadNotificationCountResponse,
};

export async function listNotifications(params?: {
  page?: number;
  limit?: number;
}): Promise<Notification[]> {
  const response = await apiRequest<unknown>({
    method: 'GET',
    url: notificationEndpoints.list,
    params: { page: 1, limit: 20, ...params },
  });
  const parsed = NotificationsResponseSchema.parse(response);
  return parsed.data;
}

export async function getUnreadNotificationCount(): Promise<UnreadNotificationCountResponse> {
  const response = await apiRequest<unknown>({
    method: 'GET',
    url: notificationEndpoints.unreadCount,
  });
  return UnreadNotificationCountResponseSchema.parse(response);
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiRequest<unknown>({
    method: 'PUT',
    url: notificationEndpoints.markRead(encodeURIComponent(id)),
  });
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiRequest<unknown>({ method: 'PUT', url: notificationEndpoints.markAllRead });
}

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const response = await apiRequest<unknown>({
    method: 'GET',
    url: notificationEndpoints.preferences,
  });
  return NotificationPreferencesResponseSchema.parse(response).preferences;
}

export async function updateNotificationPreferences(
  preferences: NotificationPreferences,
): Promise<NotificationPreferences> {
  const response = await apiRequest<unknown>({
    method: 'PUT',
    url: notificationEndpoints.preferences,
    data: { preferences },
  });
  return NotificationPreferencesResponseSchema.parse(response).preferences;
}

export async function registerDevice(
  installationId: string,
  request: RegisterDeviceRequest,
): Promise<void> {
  await apiRequest<unknown>({
    method: 'PUT',
    url: deviceEndpoints.register(installationId),
    data: request,
  });
}

export async function unregisterDevice(installationId: string): Promise<void> {
  await apiRequest<unknown>({
    method: 'DELETE',
    url: deviceEndpoints.unregister(installationId),
  });
}
