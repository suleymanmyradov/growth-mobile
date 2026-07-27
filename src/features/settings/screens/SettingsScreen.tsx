/**
 * Settings screen — theme, accountability style, check-in time, notifications.
 *
 * Updates are sent to the backend. The theme toggle also updates the local
 * ThemeProvider (which persists the choice in the non-secret KV store).
 */
import { useTheme } from '@/design-system/theme';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { ApiError } from '@/core/api/errors';
import { Card, ErrorState, Screen, Spinner, ThemedText } from '@/design-system';

import type { Settings } from '@/core/api/schemas';
import { useSettings, useUpdateSettings } from '../hooks';

export function SettingsScreen() {
  const { t } = useTranslation();
  const { colors, spacing, radius, setThemeMode, themeMode } = useTheme();
  const { data: settings, isLoading, isError, error, refetch } = useSettings();
  const updateSettings = useUpdateSettings();

  if (isLoading) {
    return (
      <Screen title={t('settings.title')}>
        <Spinner fullScreen label={t('common.loading')} />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen title={t('settings.title')}>
        <ErrorState
          message={error instanceof ApiError ? error.message : undefined}
          onRetry={() => refetch()}
        />
      </Screen>
    );
  }

  const handleUpdate = (data: Partial<Settings>) => {
    updateSettings.mutate(data);
  };

  const themeOptions: { value: 'system' | 'light' | 'dark'; label: string }[] = [
    { value: 'system', label: t('settings.themeSystem') },
    { value: 'light', label: t('settings.themeLight') },
    { value: 'dark', label: t('settings.themeDark') },
  ];

  const styleOptions: { value: 'gentle' | 'balanced' | 'strict'; label: string }[] = [
    { value: 'gentle', label: t('settings.styleGentle') },
    { value: 'balanced', label: t('settings.styleBalanced') },
    { value: 'strict', label: t('settings.styleStrict') },
  ];

  return (
    <Screen title={t('settings.title')} scrollable>
      <View style={{ padding: spacing.md, gap: spacing.md }}>
        {/* Appearance */}
        <Card>
          <View style={{ gap: spacing.md }}>
            <ThemedText variant="heading" style={{ fontSize: 18 }}>
              {t('settings.appearance')}
            </ThemedText>
            <View>
              <ThemedText variant="label" style={{ marginBottom: spacing.xs }}>
                {t('settings.theme')}
              </ThemedText>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                {themeOptions.map((opt) => (
                  <Pressable
                    key={opt.value}
                    onPress={() => {
                      setThemeMode(opt.value);
                      handleUpdate({ theme: opt.value });
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={opt.label}
                    style={[
                      {
                        flex: 1,
                        paddingVertical: 10,
                        alignItems: 'center',
                        borderWidth: 1,
                        borderRadius: radius.md,
                        borderColor: themeMode === opt.value ? colors.primary : colors.border,
                        backgroundColor:
                          themeMode === opt.value ? `${colors.primary}1A` : 'transparent',
                        minHeight: 44,
                        justifyContent: 'center',
                      },
                    ]}
                  >
                    <ThemedText
                      style={{
                        fontSize: 13,
                        fontWeight: '500',
                        color: themeMode === opt.value ? colors.primary : colors.primaryText,
                      }}
                    >
                      {opt.label}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        </Card>

        {/* Preferences */}
        <Card>
          <View style={{ gap: spacing.md }}>
            <ThemedText variant="heading" style={{ fontSize: 18 }}>
              {t('settings.preferences')}
            </ThemedText>

            {/* Accountability style */}
            <View>
              <ThemedText variant="label" style={{ marginBottom: spacing.xs }}>
                {t('settings.accountabilityStyle')}
              </ThemedText>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                {styleOptions.map((opt) => (
                  <Pressable
                    key={opt.value}
                    onPress={() => handleUpdate({ accountabilityStyle: opt.value })}
                    accessibilityRole="button"
                    accessibilityLabel={opt.label}
                    style={[
                      {
                        flex: 1,
                        paddingVertical: 10,
                        alignItems: 'center',
                        borderWidth: 1,
                        borderRadius: radius.md,
                        borderColor:
                          settings?.accountabilityStyle === opt.value
                            ? colors.primary
                            : colors.border,
                        backgroundColor:
                          settings?.accountabilityStyle === opt.value
                            ? `${colors.primary}1A`
                            : 'transparent',
                        minHeight: 44,
                        justifyContent: 'center',
                      },
                    ]}
                  >
                    <ThemedText
                      style={{
                        fontSize: 13,
                        fontWeight: '500',
                        color:
                          settings?.accountabilityStyle === opt.value
                            ? colors.primary
                            : colors.primaryText,
                      }}
                    >
                      {opt.label}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Check-in time */}
            <View>
              <ThemedText variant="label" style={{ marginBottom: spacing.xs }}>
                {t('settings.checkInTime')}
              </ThemedText>
              <ThemedText variant="body" style={{ color: colors.primaryText }}>
                {settings?.checkInTime ?? '09:00'}
              </ThemedText>
            </View>
          </View>
        </Card>

        {/* Notifications */}
        <Card>
          <View style={{ gap: spacing.md }}>
            <ThemedText variant="heading" style={{ fontSize: 18 }}>
              {t('settings.notifications')}
            </ThemedText>
            <ToggleRow
              label={t('settings.emailNotifications')}
              value={settings?.emailNotifications ?? false}
              onToggle={(v) => handleUpdate({ emailNotifications: v })}
              colors={colors}
            />
            <ToggleRow
              label={t('settings.pushNotifications')}
              value={settings?.pushNotifications ?? false}
              onToggle={(v) => handleUpdate({ pushNotifications: v })}
              colors={colors}
            />
            <ToggleRow
              label={t('settings.habitReminders')}
              value={settings?.habitReminders ?? false}
              onToggle={(v) => handleUpdate({ habitReminders: v })}
              colors={colors}
            />
            <ToggleRow
              label={t('settings.goalReminders')}
              value={settings?.goalReminders ?? false}
              onToggle={(v) => handleUpdate({ goalReminders: v })}
              colors={colors}
            />
          </View>
        </Card>

        {updateSettings.isError ? (
          <ThemedText style={{ color: colors.error, textAlign: 'center' }}>
            {updateSettings.error instanceof ApiError
              ? updateSettings.error.message
              : t('common.errorGeneric')}
          </ThemedText>
        ) : null}
        {updateSettings.isSuccess ? (
          <ThemedText style={{ color: colors.success, textAlign: 'center' }}>
            {t('settings.updated')}
          </ThemedText>
        ) : null}
      </View>
    </Screen>
  );
}

function ToggleRow({
  label,
  value,
  onToggle,
  colors,
}: {
  label: string;
  value: boolean;
  onToggle: (value: boolean) => void;
  colors: { primary: string; border: string; surface: string };
}) {
  return (
    <Pressable
      onPress={() => onToggle(!value)}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        minHeight: 44,
      }}
    >
      <ThemedText variant="body">{label}</ThemedText>
      <View
        style={{
          width: 44,
          height: 24,
          borderRadius: 12,
          backgroundColor: value ? colors.primary : colors.border,
          padding: 2,
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: '#FFFFFF',
            transform: [{ translateX: value ? 20 : 0 }],
          }}
        />
      </View>
    </Pressable>
  );
}

// (no styles needed — layout is inline)
