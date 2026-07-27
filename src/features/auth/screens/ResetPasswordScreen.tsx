/**
 * Reset-password screen — sets a new password using a token from the reset email.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams } from 'expo-router';
import { CheckCircle2 } from 'lucide-react-native';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { ApiError } from '@/core/api/errors';
import { Button, Card, Input, Screen, ThemedText } from '@/design-system';
import { useTheme } from '@/design-system/theme';

import { authErrorKey, useResetPassword } from '../hooks';
import { ResetPasswordRequestSchema, type ResetPasswordRequest } from '../schemas';

export function ResetPasswordScreen() {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const params = useLocalSearchParams<{ token?: string }>();
  const token = params.token ?? '';
  const resetPassword = useResetPassword();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordRequest>({
    resolver: zodResolver(ResetPasswordRequestSchema),
    defaultValues: { token, newPassword: '' },
  });

  const onSubmit = (data: ResetPasswordRequest) => {
    setServerError(null);
    resetPassword.mutate(data, {
      onError: (error) => {
        if (error instanceof ApiError) {
          const key = authErrorKey(error.code);
          setServerError(key ? t(key) : error.message);
        } else {
          setServerError(t('common.networkError'));
        }
      },
    });
  };

  return (
    <Screen scrollable>
      <View style={[styles.container, { padding: spacing.lg }]}>
        <View style={styles.header}>
          <View style={[styles.iconWrap, { backgroundColor: `${colors.primary}1A` }]}>
            <CheckCircle2 color={colors.primary} size={28} />
          </View>
          <ThemedText variant="heading" style={{ fontSize: 24 }}>
            {t('auth.resetPasswordTitle')}
          </ThemedText>
          <ThemedText variant="body" style={{ color: colors.secondaryText }}>
            {t('auth.resetPasswordSubtitle')}
          </ThemedText>
        </View>

        <Card>
          <View style={{ gap: spacing.md }}>
            <Controller
              control={control}
              name="newPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label={t('auth.newPassword')}
                  placeholder={t('auth.passwordPlaceholder')}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.newPassword?.message ? t('validation.passwordTooShort') : undefined}
                  secureTextEntry
                  accessibilityLabel={t('auth.newPassword')}
                  hint="Min 8 chars, 1 uppercase, 1 number, 1 special character"
                />
              )}
            />

            {serverError ? (
              <ThemedText style={{ color: colors.error, fontSize: 14 }}>{serverError}</ThemedText>
            ) : null}

            <Button fullWidth loading={resetPassword.isPending} onPress={handleSubmit(onSubmit)}>
              {resetPassword.isPending ? t('auth.resetting') : t('auth.resetPasswordTitle')}
            </Button>
          </View>
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center' },
  header: { alignItems: 'center', gap: 8, marginBottom: 24 },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
