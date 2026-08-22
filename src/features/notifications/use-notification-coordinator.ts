import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { notificationKeys } from '@/core/query/query-keys';

import { markNotificationRead } from './api';
import { parsePushPayload } from './push-payload';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export function useNotificationCoordinator(): void {
  const router = useRouter();
  const queryClient = useQueryClient();
  const handled = useRef(new Set<string>());

  useEffect(() => {
    const invalidate = () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    };
    const handleResponse = (response: Notifications.NotificationResponse) => {
      const identifier = response.notification.request.identifier;
      if (handled.current.has(identifier)) return;
      const payload = parsePushPayload(response.notification.request.content.data);
      if (!payload) return;
      handled.current.add(identifier);
      void markNotificationRead(payload.notificationId).finally(invalidate);
      router.push((payload.route ?? '/(app)/notifications') as Parameters<typeof router.push>[0]);
    };

    const lastResponse = Notifications.getLastNotificationResponse();
    if (lastResponse) {
      handleResponse(lastResponse);
      void Notifications.clearLastNotificationResponseAsync();
    }
    const receivedSubscription = Notifications.addNotificationReceivedListener(invalidate);
    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener(handleResponse);
    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, [queryClient, router]);
}
