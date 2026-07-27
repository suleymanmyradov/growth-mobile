/**
 * Sign-in screen — email/password login form.
 *
 * Route file (`app/(public)/sign-in.tsx`) renders this screen. The screen
 * contains all UI and form logic; the route file stays thin.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { LogIn } from 'lucide-react-native';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { ApiError } from '@/core/api/errors';
import { Button, Card, Input, Screen, ThemedText } from '@/design-system';
import { useTheme } from '@/design-system/theme';

import { authErrorKey, useLogin } from '../hooks';
import { LoginRequestSchema, type LoginRequest } from '../schemas';

export function SignInScreen() {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const login = useLogin();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>({
    resolver: zodResolver(LoginRequestSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = (data: LoginRequest) => {
    setServerError(null);
    login.mutate(data, {
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
            <LogIn color={colors.primary} size={28} />
          </View>
          <ThemedText variant="heading" style={{ fontSize: 24 }}>
            {t('auth.signIn')}
          </ThemedText>
          <ThemedText variant="body" style={{ color: colors.secondaryText }}>
            {t('auth.signInSubtitle')}
          </ThemedText>
        </View>

        <Card>
          <View style={{ gap: spacing.md }}>
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
                />
              )}
            />

            {serverError ? (
              <ThemedText style={{ color: colors.error, fontSize: 14 }}>{serverError}</ThemedText>
            ) : null}

            <Button fullWidth loading={login.isPending} onPress={handleSubmit(onSubmit)}>
              {login.isPending ? t('auth.signingIn') : t('auth.signIn')}
            </Button>

            <Link href="/(public)/forgot-password" asChild>
              <Button variant="ghost" size="sm">
                {t('auth.forgotPassword')}
              </Button>
            </Link>
          </View>
        </Card>

        <View style={styles.footer}>
          <ThemedText variant="body" style={{ color: colors.secondaryText }}>
            {t('auth.dontHaveAccount')}{' '}
          </ThemedText>
          <Link href="/(public)/register">
            <ThemedText style={{ color: colors.primary, fontWeight: '600' }}>
              {t('auth.createAccount')}
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
