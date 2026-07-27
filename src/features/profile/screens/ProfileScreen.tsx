/**
 * Profile screen — display and edit user profile, navigate to settings/goals/saved.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import {
  LogOut,
  Mail,
  Settings as SettingsIcon,
  Target,
  User as UserIcon,
} from 'lucide-react-native';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { ApiError } from '@/core/api/errors';
import { UpdateProfileRequestSchema, type UpdateProfileRequest } from '@/core/api/schemas';
import { useSessionStore } from '@/core/auth/session';
import { Button, Card, ErrorState, Input, Screen, Spinner, ThemedText } from '@/design-system';
import { useTheme } from '@/design-system/theme';
import { useLogout } from '@/features/auth';

import { useProfile, useUpdateProfile } from '../hooks';

export function ProfileScreen() {
  const { t } = useTranslation();
  const { colors, spacing, radius } = useTheme();
  const sessionUser = useSessionStore((s) => s.user);
  const { data: profile, isLoading, isError, error, refetch } = useProfile();
  const updateProfile = useUpdateProfile();
  const logout = useLogout();
  const [editing, setEditing] = useState(false);

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
    Alert.alert(t('settings.logout'), t('auth.logoutConfirmMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('settings.logout'), style: 'destructive', onPress: () => logout.mutate() },
    ]);
  };

  if (isLoading) {
    return (
      <Screen title={t('profile.title')}>
        <Spinner fullScreen label={t('common.loading')} />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen title={t('profile.title')}>
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
      <Screen title={t('profile.editProfile')} onBack={() => setEditing(false)} scrollable>
        <View style={{ padding: spacing.md, gap: spacing.md }}>
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
        </View>
      </Screen>
    );
  }

  return (
    <Screen title={t('profile.title')} scrollable>
      <View style={{ padding: spacing.md, gap: spacing.md }}>
        {/* Profile header */}
        <Card>
          <View style={{ alignItems: 'center', gap: spacing.sm }}>
            <View
              style={[
                styles.avatar,
                { backgroundColor: `${colors.primary}1A`, borderRadius: radius.full },
              ]}
            >
              <UserIcon color={colors.primary} size={32} />
            </View>
            <ThemedText variant="heading" style={{ fontSize: 20 }}>
              {profile?.fullName ?? sessionUser?.fullName ?? ''}
            </ThemedText>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Mail color={colors.secondaryText} size={14} />
              <ThemedText variant="caption" style={{ color: colors.secondaryText }}>
                {profile?.email ?? sessionUser?.email ?? ''}
              </ThemedText>
            </View>
            {profile?.emailVerified ? (
              <ThemedText variant="caption" style={{ color: colors.success }}>
                ✓ {t('profile.emailVerified')}
              </ThemedText>
            ) : null}
            {profile?.createdAt ? (
              <ThemedText variant="caption" style={{ color: colors.secondaryText }}>
                {t('profile.memberSince', {
                  date: new Date(profile.createdAt).toLocaleDateString(),
                })}
              </ThemedText>
            ) : null}
          </View>
        </Card>

        {profile?.bio ? (
          <Card>
            <ThemedText variant="label" style={{ marginBottom: spacing.xs }}>
              {t('profile.bio')}
            </ThemedText>
            <ThemedText variant="body" style={{ color: colors.secondaryText }}>
              {profile.bio}
            </ThemedText>
          </Card>
        ) : null}

        {/* Navigation links */}
        <Card>
          <View style={{ gap: spacing.sm }}>
            <Link href="/(app)/goals" asChild>
              <Pressable
                style={styles.navRow}
                accessibilityRole="button"
                accessibilityLabel={t('profile.goals')}
              >
                <Target color={colors.primary} size={20} />
                <ThemedText variant="body" style={{ flex: 1 }}>
                  {t('profile.goals')}
                </ThemedText>
              </Pressable>
            </Link>
            <Link href="/(app)/settings" asChild>
              <Pressable
                style={styles.navRow}
                accessibilityRole="button"
                accessibilityLabel={t('profile.settings')}
              >
                <SettingsIcon color={colors.primary} size={20} />
                <ThemedText variant="body" style={{ flex: 1 }}>
                  {t('profile.settings')}
                </ThemedText>
              </Pressable>
            </Link>
          </View>
        </Card>

        <Button variant="outline" fullWidth onPress={() => setEditing(true)}>
          {t('profile.editProfile')}
        </Button>

        <Button variant="destructive" fullWidth loading={logout.isPending} onPress={handleLogout}>
          <LogOut color="#FFFFFF" size={18} /> {t('settings.logout')}
        </Button>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatar: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center' },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    minHeight: 44,
  },
});
