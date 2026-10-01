/**
 * Device timezone sync — mounted once at the app root.
 *
 * When the device's IANA zone differs from `settings.timezone`, asks the user
 * once — per detected zone — whether to update. The answer is recorded in the
 * KV store, so a dismissal doesn't re-ask on every boot but travelling to a
 * new zone prompts again. Mirrors the web `TimezoneSync` component.
 *
 * Inert unless the user is authenticated and settings have loaded.
 */
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { useSessionStore } from '@/core/auth/session';
import { getDeviceTimezone } from '@/core/timezone';

import { useSettings, useUpdateSettings } from './hooks';
import { getTimezonePromptRecord, recordTimezonePrompt } from './timezone';

export function useDeviceTimezoneSync(): void {
  const { t } = useTranslation();
  const isAuthenticated = useSessionStore((s) => s.isAuthenticated);
  const isHydrated = useSessionStore((s) => s.isHydrated);
  const userId = useSessionStore((s) => s.user?.id ?? null);
  const { data: settings } = useSettings({ enabled: isAuthenticated });
  // `mutate` is referentially stable; the mutation result object is not, so
  // depending on it would re-run the effect on every render.
  const { mutate: updateSettings } = useUpdateSettings();
  // Guards against double-effects and re-renders re-firing the prompt.
  const promptedRef = useRef(false);

  const deviceTz = getDeviceTimezone();
  const storedTz = settings?.timezone;
  const mismatch = !!deviceTz && storedTz !== undefined && deviceTz !== storedTz;

  useEffect(() => {
    if (!isHydrated || !isAuthenticated || !userId || promptedRef.current) return;
    if (!mismatch || !deviceTz) return;
    promptedRef.current = true;

    let cancelled = false;
    void (async () => {
      // Already answered for this zone — don't re-ask.
      const record = await getTimezonePromptRecord(userId);
      if (cancelled || record?.timezone === deviceTz) return;

      Alert.alert(
        t('me.timezoneSyncTitle'),
        t('me.timezoneSyncBody', { timezone: deviceTz, current: storedTz || 'UTC' }),
        [
          {
            text: t('me.timezoneSyncKeep'),
            style: 'cancel',
            onPress: () => void recordTimezonePrompt(userId, deviceTz, 'dismissed'),
          },
          {
            text: t('me.timezoneSyncUpdate'),
            onPress: () => {
              void recordTimezonePrompt(userId, deviceTz, 'updated');
              updateSettings({ timezone: deviceTz });
            },
          },
        ],
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [isHydrated, isAuthenticated, userId, mismatch, deviceTz, storedTz, t, updateSettings]);
}
