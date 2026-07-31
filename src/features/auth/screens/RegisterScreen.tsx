/**
 * Register screen — username/email/password/fullName registration form.
 *
 * On success, navigates to the check-email screen (the backend sends a
 * verification email and does not return tokens).
 *
 * Paper (`mobile.md` §8.8): onboardingTitle variant, sage accent, accessible
 * show/hide password, keyboard avoidance, 48-unit inputs, inline validation.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useRouter } from 'expo-router';
import { UserPlus } from 'lucide-react-native';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { ApiError } from '@/core/api/errors';
import { Button, Card, Input, ThemedText } from '@/design-system';
import { useTheme } from '@/design-system/theme';

import { AuthHeader } from '../components/AuthHeader';
import { AuthShell } from '../components/AuthShell';
import { PasswordInput } from '../components/PasswordInput';
import { authErrorKey, useRegister } from '../hooks';
import { RegisterRequestSchema, type RegisterRequest } from '../schemas';

export function RegisterScreen() {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const router = useRouter();
  const register = useRegister();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterRequest>({
    resolver: zodResolver(RegisterRequestSchema),
    defaultValues: { username: '', email: '', password: '', fullName: '' },
  });

  const onSubmit = (data: RegisterRequest) => {
    setServerError(null);
    register.mutate(data, {
      onSuccess: () => {
        router.replace({ pathname: '/(public)/check-email', params: { email: data.email } });
      },
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
        icon={UserPlus}
        title={t('auth.createAccount')}
        subtitle={t('auth.registerSubtitle')}
      />

      <Card>
        <View style={{ gap: spacing.md }}>
          <Controller
            control={control}
            name="fullName"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label={t('auth.fullName')}
                placeholder={t('auth.fullNamePlaceholder')}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.fullName?.message ? t('validation.fullNameRequired') : undefined}
                accessibilityLabel={t('auth.fullName')}
              />
            )}
          />
          <Controller
            control={control}
            name="username"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label={t('auth.username')}
                placeholder={t('auth.usernamePlaceholder')}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.username?.message ? t('validation.usernameInvalid') : undefined}
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel={t('auth.username')}
              />
            )}
          />
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label={t('auth.email')}
                placeholder={t('auth.emailPlaceholder')}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.email?.message ? t('validation.emailInvalid') : undefined}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel={t('auth.email')}
              />
            )}
          />
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <PasswordInput
                showLabel={t('auth.showPassword')}
                hideLabel={t('auth.hidePassword')}
                label={t('auth.password')}
                placeholder={t('auth.passwordPlaceholder')}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message ? t('validation.passwordTooShort') : undefined}
                accessibilityLabel={t('auth.password')}
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

          <Button fullWidth loading={register.isPending} onPress={handleSubmit(onSubmit)}>
            {register.isPending ? t('auth.registering') : t('auth.createAccount')}
          </Button>
        </View>
      </Card>

      <View style={styles.footer}>
        <ThemedText variant="body" style={{ color: colors.mutedForeground }}>
          {t('auth.alreadyHaveAccount')}{' '}
        </ThemedText>
        <Link href="/(public)/sign-in">
          <ThemedText variant="label" style={{ color: colors.accent }}>
            {t('auth.signIn')}
          </ThemedText>
        </Link>
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
});
