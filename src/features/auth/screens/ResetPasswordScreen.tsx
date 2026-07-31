/**
 * Reset-password screen — sets a new password using a token from the reset email.
 *
 * Paper (`mobile.md` §8.8): onboardingTitle variant, sage accent, accessible
 * show/hide password, keyboard avoidance, 48-unit inputs, destructive error text.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams } from 'expo-router';
import { CheckCircle2 } from 'lucide-react-native';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { ApiError } from '@/core/api/errors';
import { Button, Card, ThemedText } from '@/design-system';
import { useTheme } from '@/design-system/theme';

import { AuthHeader } from '../components/AuthHeader';
import { AuthShell } from '../components/AuthShell';
import { PasswordInput } from '../components/PasswordInput';
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
    <AuthShell>
      <AuthHeader
        icon={CheckCircle2}
        title={t('auth.resetPasswordTitle')}
        subtitle={t('auth.resetPasswordSubtitle')}
      />

      <Card>
        <View style={{ gap: spacing.md }}>
          <Controller
            control={control}
            name="newPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <PasswordInput
                showLabel={t('auth.showPassword')}
                hideLabel={t('auth.hidePassword')}
                label={t('auth.newPassword')}
                placeholder={t('auth.passwordPlaceholder')}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.newPassword?.message ? t('validation.passwordTooShort') : undefined}
                accessibilityLabel={t('auth.newPassword')}
                hint={t('auth.passwordHint')}
              />
            )}
          />

          {serverError ? (
            <ThemedText
              variant="bodySmall"
              style={{ color: colors.destructive }}
              accessibilityRole="alert"
            >
              {serverError}
            </ThemedText>
          ) : null}

          <Button fullWidth loading={resetPassword.isPending} onPress={handleSubmit(onSubmit)}>
            {resetPassword.isPending ? t('auth.resetting') : t('auth.resetPasswordTitle')}
          </Button>
        </View>
      </Card>
    </AuthShell>
  );
}
