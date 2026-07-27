/**
 * Register screen — username/email/password/fullName registration form.
 *
 * On success, navigates to the check-email screen (the backend sends a
 * verification email and does not return tokens).
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useRouter } from 'expo-router';
import { UserPlus } from 'lucide-react-native';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { ApiError } from '@/core/api/errors';
import { Button, Card, Input, Screen, ThemedText } from '@/design-system';
import { useTheme } from '@/design-system/theme';

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
    <Screen scrollable>
      <View style={[styles.container, { padding: spacing.lg }]}>
        <View style={styles.header}>
          <View style={[styles.iconWrap, { backgroundColor: `${colors.primary}1A` }]}>
            <UserPlus color={colors.primary} size={28} />
          </View>
          <ThemedText variant="heading" style={{ fontSize: 24 }}>
            {t('auth.createAccount')}
          </ThemedText>
          <ThemedText variant="body" style={{ color: colors.secondaryText }}>
            {t('auth.registerSubtitle')}
          </ThemedText>
        </View>

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
                <Input
                  label={t('auth.password')}
                  placeholder={t('auth.passwordPlaceholder')}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message ? t('validation.passwordTooShort') : undefined}
                  secureTextEntry
                  accessibilityLabel={t('auth.password')}
                  hint="Min 8 chars, 1 uppercase, 1 number, 1 special character"
                />
              )}
            />

            {serverError ? (
              <ThemedText style={{ color: colors.error, fontSize: 14 }}>{serverError}</ThemedText>
            ) : null}

            <Button fullWidth loading={register.isPending} onPress={handleSubmit(onSubmit)}>
              {register.isPending ? t('auth.registering') : t('auth.createAccount')}
            </Button>
          </View>
        </Card>

        <View style={styles.footer}>
          <ThemedText variant="body" style={{ color: colors.secondaryText }}>
            {t('auth.alreadyHaveAccount')}{' '}
          </ThemedText>
          <Link href="/(public)/sign-in">
            <ThemedText style={{ color: colors.primary, fontWeight: '600' }}>
              {t('auth.signIn')}
            </ThemedText>
          </Link>
        </View>
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
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16 },
});
