/**
 * Notifications API — list, unread count, mark read, mark all read.
 *
 * Push device registration (`/devices/:installationId`) is wired in Phase I
 * alongside the push delivery contract. This module covers the in-app
 * notification data used by Today's bell and the notification sheet.
 */
import { apiRequest } from '@/core/api/client';
import { notificationEndpoints } from '@/core/api/endpoints';
import {
  NotificationsResponseSchema,
  UnreadNotificationCountResponseSchema,
  type Notification,
  type NotificationsResponse,
  type UnreadNotificationCountResponse,
} from '@/core/api/schemas';

export type { Notification, NotificationsResponse, UnreadNotificationCountResponse };

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
