/**
 * Forgot-password screen — email entry to request a reset link.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { KeyRound } from 'lucide-react-native';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Button, Card, Input, Screen, ThemedText } from '@/design-system';
import { useTheme } from '@/design-system/theme';

import { useForgotPassword } from '../hooks';
import { ForgotPasswordRequestSchema, type ForgotPasswordRequest } from '../schemas';

export function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const forgotPassword = useForgotPassword();
  const [sent, setSent] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordRequest>({
    resolver: zodResolver(ForgotPasswordRequestSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = (data: ForgotPasswordRequest) => {
    forgotPassword.mutate(data, { onSuccess: () => setSent(true) });
  };

  if (sent) {
    return (
      <Screen>
        <View style={[styles.container, { padding: spacing.lg, gap: spacing.md }]}>
          <View style={[styles.iconWrap, { backgroundColor: `${colors.primary}1A` }]}>
            <KeyRound color={colors.primary} size={48} />
          </View>
          <ThemedText variant="heading" style={{ fontSize: 24, textAlign: 'center' }}>
            {t('auth.checkEmail')}
          </ThemedText>
          <ThemedText variant="body" style={{ color: colors.secondaryText, textAlign: 'center' }}>
            {t('auth.forgotPasswordSuccess')}
          </ThemedText>
          <Link href="/(public)/sign-in" asChild>
            <Button variant="outline" fullWidth>
              {t('auth.backToSignIn')}
            </Button>
          </Link>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scrollable>
      <View style={[styles.container, { padding: spacing.lg }]}>
        <View style={styles.header}>
          <View style={[styles.iconWrap, { backgroundColor: `${colors.primary}1A` }]}>
            <KeyRound color={colors.primary} size={28} />
          </View>
          <ThemedText variant="heading" style={{ fontSize: 24 }}>
            {t('auth.forgotPasswordTitle')}
          </ThemedText>
          <ThemedText variant="body" style={{ color: colors.secondaryText }}>
            {t('auth.forgotPasswordSubtitle')}
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
            <Button fullWidth loading={forgotPassword.isPending} onPress={handleSubmit(onSubmit)}>
              {forgotPassword.isPending
                ? t('auth.sendingResetLink')
                : t('auth.forgotPasswordTitle')}
            </Button>
          </View>
        </Card>

        <Link href="/(public)/sign-in">
          <ThemedText style={{ color: colors.primary, textAlign: 'center', marginTop: 16 }}>
            {t('auth.backToSignIn')}
          </ThemedText>
        </Link>
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
