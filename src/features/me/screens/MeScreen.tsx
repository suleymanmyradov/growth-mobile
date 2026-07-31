/**
 * MeScreen — the Me tab composition.
 *
 * Paper (`mobile.md` §8.6): combines account overview and settings navigation.
 * Profile header (avatar, name, joined metadata, Edit), summary cards (goals,
 * best streak, habits — only when contracts provide trustworthy values), and
 * sections: Coaching, Reminders, Appearance, Plan & data. Uses native Switch
 * controls with an accent track. Appearance offers System/Light/Dark via the
 * persisted theme mode and syncs to the backend settings theme. Export data is
 * omitted (no backend contract). Delete account uses real `deleteProfile` with
 * explicit confirmation and the established session cleanup flow.
 *
 * Domain boundary: this is a composition screen in `features/me`. It imports
 * only PUBLIC hooks from `features/profile`, `features/settings`, `features/auth`,
 * `features/habits`, and `features/goals`. It does not import feature internals.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { LogOut, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';

import { ApiError } from '@/core/api/errors';
import { UpdateProfileRequestSchema, type UpdateProfileRequest } from '@/core/api/schemas';
import { useSessionStore } from '@/core/auth/session';
import {
  Avatar,
  Button,
  Card,
  ErrorState,
  Input,
  ListRow,
  Screen,
  SectionLabel,
  SegmentedTabs,
  Skeleton,
  ThemedText,
} from '@/design-system';
import { useTheme, type ThemeMode } from '@/design-system/theme';
import { useLogout } from '@/features/auth';
import { useGoals } from '@/features/goals';
import { useHabits } from '@/features/habits';
import { useDeleteProfile, useProfile, useUpdateProfile } from '@/features/profile';
import { useSettings, useUpdateSettings } from '@/features/settings';

import { deriveMeSummary } from '../summary';

export function MeScreen(): React.ReactNode {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors, spacing, radius, themeMode, setThemeMode } = useTheme();
  const sessionUser = useSessionStore((s) => s.user);

  const { data: profile, isLoading, isError, error, refetch } = useProfile();
  const updateProfile = useUpdateProfile();
  const deleteProfile = useDeleteProfile();
  const logout = useLogout();
  const { data: habits } = useHabits();
  const { data: goals } = useGoals();
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();

  const [editing, setEditing] = useState(false);

  const summary = deriveMeSummary(habits, goals);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateProfileRequest>({
    resolver: zodResolver(UpdateProfileRequestSchema),
    defaultValues: {
      fullName: profile?.fullName ?? '',
      bio: profile?.bio ?? '',
      location: profile?.location ?? '',
      website: profile?.website ?? '',
    },
  });

  const handleLogout = () => {
    Alert.alert(t('me.logoutConfirmTitle'), t('me.logoutConfirmMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('me.logout'), style: 'destructive', onPress: () => logout.mutate() },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(t('me.deleteAccountConfirmTitle'), t('me.deleteAccountConfirmMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          deleteProfile.mutate(undefined, {
            onSuccess: () => logout.mutate(),
            onError: (err) => {
              Alert.alert(
                t('me.deleteAccountError'),
                err instanceof ApiError ? err.message : undefined,
              );
            },
          });
        },
      },
    ]);
  };

  const handleThemeChange = (mode: ThemeMode) => {
    setThemeMode(mode);
    updateSettings.mutate({ theme: mode });
  };

  const handleUpdate = (partial: Parameters<typeof updateSettings.mutate>[0]) => {
    updateSettings.mutate(partial);
  };

  if (isLoading) {
    return (
      <Screen title={t('me.title')}>
        <View style={{ padding: spacing.xl, gap: spacing.md }}>
          <Skeleton style={{ height: 120 }} radius={radius.card} />
          <Skeleton style={{ height: 72 }} radius={radius.card} />
          <Skeleton style={{ height: 160 }} radius={radius.card} />
        </View>
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen title={t('me.title')}>
        <ErrorState
          message={error instanceof ApiError ? error.message : undefined}
          onRetry={() => refetch()}
        />
      </Screen>
    );
  }

  if (editing) {
    const onSubmit = (data: UpdateProfileRequest) => {
      updateProfile.mutate(data, { onSuccess: () => setEditing(false) });
    };

    return (
      <Screen title={t('me.editProfile')} onBack={() => setEditing(false)} scrollable>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: spacing.xl,
              paddingVertical: spacing.lg,
              gap: spacing.md,
            }}
            keyboardShouldPersistTaps="handled"
          >
            <Controller
              control={control}
              name="fullName"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label={t('profile.fullName')}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.fullName?.message ? t('validation.fullNameRequired') : undefined}
                  accessibilityLabel={t('profile.fullName')}
                />
              )}
            />
            <Controller
              control={control}
              name="bio"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label={t('profile.bio')}
                  placeholder={t('profile.bioPlaceholder')}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  multiline
                  numberOfLines={3}
                  accessibilityLabel={t('profile.bio')}
                />
              )}
            />
            <Controller
              control={control}
              name="location"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label={t('profile.location')}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  accessibilityLabel={t('profile.location')}
                />
              )}
            />
            <Controller
              control={control}
              name="website"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label={t('profile.website')}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="url"
                  autoCapitalize="none"
                  accessibilityLabel={t('profile.website')}
                />
              )}
            />
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Button
                variant="outline"
                fullWidth
                onPress={() => setEditing(false)}
                disabled={updateProfile.isPending}
              >
                {t('common.cancel')}
              </Button>
              <Button fullWidth loading={updateProfile.isPending} onPress={handleSubmit(onSubmit)}>
                {t('common.save')}
              </Button>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Screen>
    );
  }

  const themeSegments: { id: ThemeMode; label: string }[] = [
    { id: 'system', label: t('me.themeSystem') },
    { id: 'light', label: t('me.themeLight') },
    { id: 'dark', label: t('me.themeDark') },
  ];

  const styleSegments: { id: 'gentle' | 'balanced' | 'strict'; label: string }[] = [
    { id: 'gentle', label: t('settings.styleGentle') },
    { id: 'balanced', label: t('settings.styleBalanced') },
    { id: 'strict', label: t('settings.styleStrict') },
  ];

  const displayName = profile?.fullName ?? sessionUser?.fullName ?? '';
  const email = profile?.email ?? sessionUser?.email ?? '';

  return (
    <Screen title={t('me.title')}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.lg,
          gap: spacing.lg,
        }}
      >
        {/* Profile header */}
        <Card>
          <View style={{ alignItems: 'center', gap: spacing.sm }}>
            <Avatar uri={profile?.avatarUrl} name={displayName} size={72} />
            <ThemedText variant="cardTitle">{displayName}</ThemedText>
            <ThemedText variant="meta" style={{ color: colors.mutedForeground }}>
              {email}
            </ThemedText>
            {profile?.emailVerified ? (
              <ThemedText variant="caption" style={{ color: colors.accent }}>
                {t('me.emailVerified')}
              </ThemedText>
            ) : null}
            {profile?.createdAt ? (
              <ThemedText variant="caption" style={{ color: colors.mutedForeground }}>
                {t('me.joined', {
                  date: new Date(profile.createdAt).toLocaleDateString(),
                })}
              </ThemedText>
            ) : null}
            <Button variant="outline" size="sm" onPress={() => setEditing(true)}>
              {t('me.editProfile')}
            </Button>
          </View>
        </Card>

        {/* Summary cards */}
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <SummaryCard
            label={t('me.summaryGoals')}
            value={String(summary.goalsCount)}
            colors={colors}
            radius={radius}
          />
          <SummaryCard
            label={t('me.summaryStreak')}
            value={
              summary.bestStreak === 1
                ? t('me.streakOneDay')
                : t('me.streakDays', { count: summary.bestStreak })
            }
            colors={colors}
            radius={radius}
          />
          <SummaryCard
            label={t('me.summaryHabits')}
            value={String(summary.habitsCount)}
            colors={colors}
            radius={radius}
          />
        </View>

        {/* Coaching */}
        <View style={{ gap: spacing.sm }}>
          <SectionLabel>{t('me.sectionCoaching')}</SectionLabel>
          <Card padded={false}>
            <View style={{ padding: spacing.lg, gap: spacing.md }}>
              <View>
                <ThemedText variant="label" style={{ marginBottom: spacing.xs }}>
                  {t('me.accountabilityStyle')}
                </ThemedText>
                <SegmentedTabs
                  segments={styleSegments}
                  value={settings?.accountabilityStyle ?? 'balanced'}
                  onChange={(id) =>
                    handleUpdate({ accountabilityStyle: id as 'gentle' | 'balanced' | 'strict' })
                  }
                />
              </View>
              <View>
                <ThemedText variant="label" style={{ marginBottom: spacing.xs }}>
                  {t('me.checkInTime')}
                </ThemedText>
                <ThemedText variant="body">{settings?.checkInTime ?? '09:00'}</ThemedText>
              </View>
            </View>
          </Card>
        </View>

        {/* Reminders */}
        <View style={{ gap: spacing.sm }}>
          <SectionLabel>{t('me.sectionReminders')}</SectionLabel>
          <Card padded={false}>
            <View style={{ paddingHorizontal: spacing.lg }}>
              <ToggleRow
                label={t('me.emailNotifications')}
                value={settings?.emailNotifications ?? false}
                onToggle={(v) => handleUpdate({ emailNotifications: v })}
                accent={colors.accent}
                input={colors.input}
              />
              <ToggleRow
                label={t('me.pushNotifications')}
                value={settings?.pushNotifications ?? false}
                onToggle={(v) => handleUpdate({ pushNotifications: v })}
                accent={colors.accent}
                input={colors.input}
              />
              <ToggleRow
                label={t('me.habitReminders')}
                value={settings?.habitReminders ?? false}
                onToggle={(v) => handleUpdate({ habitReminders: v })}
                accent={colors.accent}
                input={colors.input}
              />
              <ToggleRow
                label={t('me.goalReminders')}
                value={settings?.goalReminders ?? false}
                onToggle={(v) => handleUpdate({ goalReminders: v })}
                accent={colors.accent}
                input={colors.input}
                separator={false}
              />
            </View>
          </Card>
        </View>

        {/* Appearance */}
        <View style={{ gap: spacing.sm }}>
          <SectionLabel>{t('me.sectionAppearance')}</SectionLabel>
          <Card>
            <View style={{ gap: spacing.md }}>
              <ThemedText variant="label">{t('me.theme')}</ThemedText>
              <SegmentedTabs
                segments={themeSegments}
                value={themeMode}
                onChange={(id) => handleThemeChange(id as ThemeMode)}
              />
            </View>
          </Card>
        </View>

        {/* Plan & data */}
        <View style={{ gap: spacing.sm }}>
          <SectionLabel>{t('me.sectionPlanData')}</SectionLabel>
          <Card padded={false}>
            <View style={{ paddingHorizontal: spacing.lg }}>
              <ListRow
                onPress={() => router.push('/paywall')}
                accessibilityLabel={t('me.planBilling')}
                separator
              >
                <ThemedText variant="body">{t('me.planBilling')}</ThemedText>
              </ListRow>
              <ListRow
                onPress={handleLogout}
                accessibilityLabel={t('me.logout')}
                leading={<LogOut color={colors.foreground} size={20} />}
                separator
              >
                <ThemedText variant="body">{t('me.logout')}</ThemedText>
              </ListRow>
              <ListRow
                onPress={handleDeleteAccount}
                accessibilityLabel={t('me.deleteAccount')}
                leading={<Trash2 color={colors.destructive} size={20} />}
                separator={false}
              >
                <ThemedText variant="body" style={{ color: colors.destructive }}>
                  {t('me.deleteAccount')}
                </ThemedText>
              </ListRow>
            </View>
          </Card>
        </View>

        {updateSettings.isError ? (
          <ThemedText
            variant="bodySmall"
            style={{ color: colors.destructive, textAlign: 'center' }}
            accessibilityRole="alert"
          >
            {updateSettings.error instanceof ApiError
              ? updateSettings.error.message
              : t('common.errorGeneric')}
          </ThemedText>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

// ─── Summary card ────────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  colors,
  radius,
}: {
  label: string;
  value: string;
  colors: { surface: string; border: string; foreground: string; mutedForeground: string };
  radius: { card: number };
}) {
  return (
    <View
      style={[
        styles.summaryCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radius.card,
        },
      ]}
    >
      <ThemedText variant="numeric" style={{ color: colors.foreground }}>
        {value}
      </ThemedText>
      <ThemedText variant="caption" style={{ color: colors.mutedForeground }}>
        {label}
      </ThemedText>
    </View>
  );
}

// ─── Toggle row with native Switch ───────────────────────────────────────────

function ToggleRow({
  label,
  value,
  onToggle,
  accent,
  input,
  separator = true,
}: {
  label: string;
  value: boolean;
  onToggle: (value: boolean) => void;
  accent: string;
  input: string;
  separator?: boolean;
}) {
  return (
    <View
      style={[
        styles.toggleRow,
        {
          borderBottomColor: separator ? input : 'transparent',
          borderBottomWidth: separator ? StyleSheet.hairlineWidth : 0,
        },
      ]}
    >
      <ThemedText variant="body">{label}</ThemedText>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ true: accent, false: input }}
        accessibilityState={{ checked: value }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    flex: 1,
    borderWidth: 1,
    padding: 12,
    gap: 4,
    alignItems: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    minHeight: 44,
  },
});
