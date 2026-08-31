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
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Camera, Download, Flag, LifeBuoy, LogOut, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';

import { ApiError } from '@/core/api/errors';
import {
  UpdateProfileRequestSchema,
  type DifficultyPreference,
  type PreferredTone,
  type UpdateProfileRequest,
} from '@/core/api/schemas';
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
import { useCoachingProfile, useUpdateCoachingProfilePreferences } from '@/features/coaching';
import { useGoals } from '@/features/goals';
import { useHabits } from '@/features/habits';
import {
  requestAndRegisterPushToken,
  unregisterCurrentDevice,
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '@/features/notifications';
import {
  useDeleteProfile,
  useExportData,
  useProfile,
  useUpdateProfile,
  useUploadAvatar,
} from '@/features/profile';
import { useSettings, useUpdateSettings } from '@/features/settings';

import { MemorySection } from '../components/MemorySection';
import { deriveMeSummary } from '../summary';

type NotificationPreferenceUpdate = Partial<{
  emailEnabled: boolean;
  pushEnabled: boolean;
  habitRemindersEnabled: boolean;
  goalRemindersEnabled: boolean;
  streakWarningsEnabled: boolean;
  sundayReviewEnabled: boolean;
}>;

export function MeScreen(): React.ReactNode {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors, spacing, radius, themeMode, setThemeMode } = useTheme();
  const sessionUser = useSessionStore((s) => s.user);

  const { data: profile, isLoading, isError, error, refetch } = useProfile();
  const updateProfile = useUpdateProfile();
  const deleteProfile = useDeleteProfile();
  const uploadAvatar = useUploadAvatar();
  const exportMutation = useExportData();
  const logout = useLogout({ beforeLogout: unregisterCurrentDevice });
  const { data: habits } = useHabits();
  const { data: goals } = useGoals();
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();
  const { data: notificationPreferences } = useNotificationPreferences();
  const updateNotificationPreferences = useUpdateNotificationPreferences();
  const { data: coachingProfile } = useCoachingProfile();
  const updateCoachingPreferences = useUpdateCoachingProfilePreferences();

  const [editing, setEditing] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl ?? '');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const displayName = profile?.fullName ?? sessionUser?.fullName ?? '';
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

  const handlePickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('me.avatarPermissionTitle'), t('me.avatarPermissionBody'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;

    setUploadingAvatar(true);
    try {
      // Resize/compress to a reasonable avatar size before uploading.
      const manipulated = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 256, height: 256 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
      );
      const upload = await uploadAvatar.mutateAsync({
        fileUri: manipulated.uri,
        mimeType: 'image/jpeg',
      });
      setAvatarUrl(upload.url);
    } catch (err) {
      Alert.alert(t('me.avatarUploadError'), err instanceof ApiError ? err.message : undefined);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleExportData = async () => {
    try {
      const { downloadUrl } = await exportMutation.mutateAsync();
      const supported = await Linking.canOpenURL(downloadUrl);
      if (supported) {
        await Linking.openURL(downloadUrl);
      } else {
        Alert.alert(t('me.exportDataError'), t('me.exportDataOpenError'));
      }
    } catch (err) {
      Alert.alert(t('me.exportDataError'), err instanceof ApiError ? err.message : undefined);
    }
  };

  const handleEditCheckInTime = () => {
    const current = settings?.checkInTime ?? '09:00';
    if (Platform.OS === 'ios') {
      Alert.prompt(
        t('me.checkInTime'),
        t('me.checkInTimeHint'),
        (value) => {
          if (value && /^\d{2}:\d{2}$/.test(value)) {
            updateSettings.mutate({ checkInTime: value });
          }
        },
        'plain-text',
        current,
        'default',
      );
    } else {
      Alert.alert(t('me.checkInTime'), `${t('me.checkInTimeHint')} (${current})`, [
        { text: t('common.cancel'), style: 'cancel' },
      ]);
    }
  };

  const handleEditTimezone = () => {
    const current = settings?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (Platform.OS === 'ios') {
      Alert.prompt(
        t('me.timezone'),
        t('me.timezoneHint'),
        (value) => {
          if (value && value.trim()) {
            updateSettings.mutate({ timezone: value.trim() });
          }
        },
        'plain-text',
        current,
        'default',
      );
    } else {
      Alert.alert(t('me.timezone'), `${t('me.timezoneHint')} (${current})`, [
        { text: t('common.cancel'), style: 'cancel' },
      ]);
    }
  };

  const updateNotificationPreference = (partial: NotificationPreferenceUpdate) => {
    updateNotificationPreferences.mutate({
      emailEnabled: notificationPreferences?.emailEnabled ?? false,
      pushEnabled: notificationPreferences?.pushEnabled ?? false,
      habitRemindersEnabled: notificationPreferences?.habitRemindersEnabled ?? true,
      goalRemindersEnabled: notificationPreferences?.goalRemindersEnabled ?? false,
      streakWarningsEnabled: notificationPreferences?.streakWarningsEnabled ?? false,
      sundayReviewEnabled: notificationPreferences?.sundayReviewEnabled ?? false,
      ...partial,
    });
  };

  const handlePushNotificationToggle = async (enabled: boolean) => {
    if (!enabled) {
      updateNotificationPreference({ pushEnabled: false });
      return;
    }
    const result = await requestAndRegisterPushToken();
    if (!result.permissionGranted || !result.registered) {
      Alert.alert(t('me.pushPermissionTitle'), t('me.pushPermissionBody'));
      return;
    }
    updateNotificationPreference({ pushEnabled: true });
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
      updateProfile.mutate(
        { ...data, avatarUrl: avatarUrl || undefined },
        { onSuccess: () => setEditing(false) },
      );
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
            {/* Avatar picker */}
            <View style={{ alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md }}>
              <Pressable
                onPress={handlePickAvatar}
                disabled={uploadingAvatar}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={t('me.changePhoto')}
              >
                <Avatar uri={avatarUrl || undefined} name={displayName} size={88} />
                <View
                  style={[
                    styles.avatarCameraButton,
                    {
                      backgroundColor: colors.accent,
                      borderColor: colors.background,
                    },
                  ]}
                >
                  <Camera color={colors.accentForeground} size={16} />
                </View>
              </Pressable>
              <ThemedText variant="caption" style={{ color: colors.mutedForeground }}>
                {uploadingAvatar ? t('me.uploadingPhoto') : t('me.changePhoto')}
              </ThemedText>
            </View>

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

  const toneSegments: { id: PreferredTone; label: string }[] = [
    { id: 'supportive', label: t('me.toneSupportive') },
    { id: 'direct', label: t('me.toneDirect') },
    { id: 'warm', label: t('me.toneWarm') },
    { id: 'practical', label: t('me.tonePractical') },
    { id: 'challenging', label: t('me.toneChallenging') },
  ];

  const difficultySegments: { id: DifficultyPreference; label: string }[] = [
    { id: 'easy', label: t('me.difficultyEasy') },
    { id: 'adaptive', label: t('me.difficultyAdaptive') },
    { id: 'ambitious', label: t('me.difficultyAmbitious') },
  ];

  const handleCoachingPreferenceChange = (
    overrides: Partial<{
      accountabilityStyle: 'gentle' | 'balanced' | 'strict';
      preferredTone: PreferredTone;
      difficultyPreference: DifficultyPreference;
    }>,
  ) => {
    const current = {
      accountabilityStyle: coachingProfile?.accountabilityStyle ?? 'balanced',
      preferredTone: coachingProfile?.preferredTone ?? 'supportive',
      difficultyPreference: coachingProfile?.difficultyPreference ?? 'adaptive',
    };
    updateCoachingPreferences.mutate({ ...current, ...overrides });
  };

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
                  value={
                    coachingProfile?.accountabilityStyle ??
                    settings?.accountabilityStyle ??
                    'balanced'
                  }
                  onChange={(id) =>
                    handleCoachingPreferenceChange({
                      accountabilityStyle: id as 'gentle' | 'balanced' | 'strict',
                    })
                  }
                />
              </View>
              <View>
                <ThemedText variant="label" style={{ marginBottom: spacing.xs }}>
                  {t('me.preferredTone')}
                </ThemedText>
                <ThemedText
                  variant="caption"
                  style={{ color: colors.mutedForeground, marginBottom: spacing.xs }}
                >
                  {t('me.preferredToneHint')}
                </ThemedText>
                <SegmentedTabs
                  segments={toneSegments}
                  value={coachingProfile?.preferredTone ?? 'supportive'}
                  onChange={(id) =>
                    handleCoachingPreferenceChange({ preferredTone: id as PreferredTone })
                  }
                />
              </View>
              <View>
                <ThemedText variant="label" style={{ marginBottom: spacing.xs }}>
                  {t('me.difficultyPreference')}
                </ThemedText>
                <ThemedText
                  variant="caption"
                  style={{ color: colors.mutedForeground, marginBottom: spacing.xs }}
                >
                  {t('me.difficultyPreferenceHint')}
                </ThemedText>
                <SegmentedTabs
                  segments={difficultySegments}
                  value={coachingProfile?.difficultyPreference ?? 'adaptive'}
                  onChange={(id) =>
                    handleCoachingPreferenceChange({
                      difficultyPreference: id as DifficultyPreference,
                    })
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

        {/* Memory */}
        <MemorySection />

        {/* Reminders */}
        <View style={{ gap: spacing.sm }}>
          <SectionLabel>{t('me.sectionReminders')}</SectionLabel>
          <Card padded={false}>
            <View style={{ paddingHorizontal: spacing.lg }}>
              <ToggleRow
                label={t('me.emailNotifications')}
                value={notificationPreferences?.emailEnabled ?? false}
                onToggle={(v) => updateNotificationPreference({ emailEnabled: v })}
                accent={colors.accent}
                input={colors.input}
              />
              <ToggleRow
                label={t('me.pushNotifications')}
                value={notificationPreferences?.pushEnabled ?? false}
                onToggle={(v) => void handlePushNotificationToggle(v)}
                accent={colors.accent}
                input={colors.input}
              />
              <ToggleRow
                label={t('me.habitReminders')}
                value={notificationPreferences?.habitRemindersEnabled ?? true}
                onToggle={(v) => updateNotificationPreference({ habitRemindersEnabled: v })}
                accent={colors.accent}
                input={colors.input}
              />
              <ToggleRow
                label={t('me.goalReminders')}
                value={notificationPreferences?.goalRemindersEnabled ?? false}
                onToggle={(v) => updateNotificationPreference({ goalRemindersEnabled: v })}
                accent={colors.accent}
                input={colors.input}
              />
              <ToggleRow
                label={t('me.weeklyReviewReminders')}
                value={notificationPreferences?.sundayReviewEnabled ?? false}
                onToggle={(v) => updateNotificationPreference({ sundayReviewEnabled: v })}
                accent={colors.accent}
                input={colors.input}
              />
              <ToggleRow
                label={t('me.streakWarnings')}
                value={notificationPreferences?.streakWarningsEnabled ?? false}
                onToggle={(v) => updateNotificationPreference({ streakWarningsEnabled: v })}
                accent={colors.accent}
                input={colors.input}
              />
              <ListRow
                onPress={handleEditCheckInTime}
                accessibilityLabel={t('me.checkInTime')}
                separator
              >
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <ThemedText variant="body">{t('me.checkInTime')}</ThemedText>
                  <ThemedText variant="body" style={{ color: colors.mutedForeground }}>
                    {settings?.checkInTime ?? '09:00'}
                  </ThemedText>
                </View>
              </ListRow>
              <ListRow
                onPress={handleEditTimezone}
                accessibilityLabel={t('me.timezone')}
                separator={false}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <ThemedText variant="body">{t('me.timezone')}</ThemedText>
                  <ThemedText
                    variant="body"
                    style={{ color: colors.mutedForeground }}
                    numberOfLines={1}
                  >
                    {settings?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone}
                  </ThemedText>
                </View>
              </ListRow>
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
                onPress={() => void handleExportData()}
                accessibilityLabel={t('me.exportData')}
                leading={<Download color={colors.foreground} size={20} />}
                separator
              >
                <ThemedText variant="body">{t('me.exportData')}</ThemedText>
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

        {/* Support */}
        <View style={{ gap: spacing.sm }}>
          <SectionLabel>{t('me.sectionSupport')}</SectionLabel>
          <Card padded={false}>
            <View style={{ paddingHorizontal: spacing.lg }}>
              <ListRow
                onPress={() => router.push('/help')}
                accessibilityLabel={t('me.helpGuide')}
                leading={<LifeBuoy color={colors.foreground} size={20} />}
                separator
              >
                <ThemedText variant="body">{t('me.helpGuide')}</ThemedText>
              </ListRow>
              <ListRow
                onPress={() => router.push('/report')}
                accessibilityLabel={t('me.reportProblem')}
                leading={<Flag color={colors.foreground} size={20} />}
                separator={false}
              >
                <ThemedText variant="body">{t('me.reportProblem')}</ThemedText>
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
  avatarCameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
