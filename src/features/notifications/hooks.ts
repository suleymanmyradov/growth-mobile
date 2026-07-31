/**
 * Notifications hooks — React Query queries and mutations.
 *
 * The unread count powers Today's bell badge. Mark-read mutations invalidate
 * both the list and the unread count so the badge stays in sync.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import type { NotificationsResponse, RegisterDeviceRequest } from '@/core/api/schemas';
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
      const previous = queryClient.getQueriesData<NotificationsResponse>({
        queryKey: notificationKeys.all,
      });
      queryClient.setQueriesData<NotificationsResponse | undefined>(
        { queryKey: notificationKeys.all },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((n) => (n.id === id ? { ...n, read: true } : n)),
          };
        },
      );
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        for (const [key, value] of context.previous) {
          queryClient.setQueryData(key, value);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.all });
      const previous = queryClient.getQueriesData<NotificationsResponse>({
        queryKey: notificationKeys.all,
      });
      queryClient.setQueriesData<NotificationsResponse | undefined>(
        { queryKey: notificationKeys.all },
        (old) => {
          if (!old) return old;
          return { ...old, data: old.data.map((n) => ({ ...n, read: true })) };
        },
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) {
        for (const [key, value] of context.previous) {
          queryClient.setQueryData(key, value);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
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
    let cancelled = false;
    (async () => {
      try {
        const result = await registerPushToken();
        if (cancelled || !result.registered) return;
      } catch {
        // Best-effort; ignore.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
}
