/**
 * Notifications hooks — React Query queries and mutations.
 *
 * The unread count powers Today's bell badge. Mark-read mutations invalidate
 * both the list and the unread count so the badge stays in sync.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import type { RegisterDeviceRequest } from '@/core/api/schemas';
import { notificationKeys } from '@/core/query/query-keys';

import {
  getNotificationPreferences,
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  registerDevice,
  unregisterDevice,
  updateNotificationPreferences,
} from './api';
import { registerPushToken } from './push-registration';

type NotificationList = Awaited<ReturnType<typeof listNotifications>>;
type UnreadCount = Awaited<ReturnType<typeof getUnreadNotificationCount>>;

export function useNotifications(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: () => listNotifications(params),
    staleTime: 30 * 1000,
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => getUnreadNotificationCount(),
    staleTime: 30 * 1000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.all });
      const previous = queryClient.getQueriesData<NotificationList>({
        queryKey: notificationKeys.lists(),
      });
      const previousCount = queryClient.getQueryData<UnreadCount>(notificationKeys.unreadCount());
      queryClient.setQueriesData<NotificationList>({ queryKey: notificationKeys.lists() }, (old) =>
        old?.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
      queryClient.setQueryData<UnreadCount | undefined>(notificationKeys.unreadCount(), (old) =>
        old ? { count: Math.max(0, old.count - 1) } : old,
      );
      return { previous, previousCount };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        for (const [key, value] of context.previous) {
          queryClient.setQueryData(key, value);
        }
      }
      if (context?.previousCount) {
        queryClient.setQueryData(notificationKeys.unreadCount(), context.previousCount);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.all });
      const previous = queryClient.getQueriesData<NotificationList>({
        queryKey: notificationKeys.lists(),
      });
      const previousCount = queryClient.getQueryData<UnreadCount>(notificationKeys.unreadCount());
      queryClient.setQueriesData<NotificationList>({ queryKey: notificationKeys.lists() }, (old) =>
        old?.map((n) => ({ ...n, read: true })),
      );
      queryClient.setQueryData(notificationKeys.unreadCount(), { count: 0 });
      return { previous, previousCount };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) {
        for (const [key, value] of context.previous) {
          queryClient.setQueryData(key, value);
        }
      }
      if (context?.previousCount) {
        queryClient.setQueryData(notificationKeys.unreadCount(), context.previousCount);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
  });
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: notificationKeys.preferences(),
    queryFn: () => getNotificationPreferences(),
    staleTime: 60 * 1000,
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (preferences: import('@/core/api/schemas').NotificationPreferences) =>
      updateNotificationPreferences(preferences),
    onSuccess: (preferences) => {
      queryClient.setQueryData(notificationKeys.preferences(), preferences);
    },
  });
}

export function useRegisterDevice() {
  return useMutation({
    mutationFn: ({
      installationId,
      request,
    }: {
      installationId: string;
      request: RegisterDeviceRequest;
    }) => registerDevice(installationId, request),
  });
}

export function useUnregisterDevice() {
  return useMutation({
    mutationFn: (installationId: string) => unregisterDevice(installationId),
  });
}

/**
 * Registers the Expo push token with the backend on mount. Best-effort and
 * fire-and-forget — no-ops on simulators, when no EAS project id is configured,
 * or when the token fetch fails. Per AGENTS.md, push delivery requires org
 * configuration; this only wires the registration call.
 */
export function useRegisterPushTokenOnMount(): void {
  useEffect(() => {
    void registerPushToken();
    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void registerPushToken();
    });
    const tokenSubscription = Notifications.addPushTokenListener(() => {
      void registerPushToken();
    });
    return () => {
      appStateSubscription.remove();
      tokenSubscription.remove();
    };
  }, []);
}
