/**
 * Forgot-password screen — email entry to request a reset link.
 *
 * Paper (`mobile.md` §8.8): onboardingTitle variant, sage accent, muted
 * secondary text, keyboard avoidance, 48-unit inputs.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { KeyRound } from 'lucide-react-native';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Button, Card, Input, ThemedText } from '@/design-system';
import { useTheme } from '@/design-system/theme';

import { AuthHeader } from '../components/AuthHeader';
import { AuthShell } from '../components/AuthShell';
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
      <AuthShell>
        <View style={{ alignItems: 'center', gap: spacing.md }}>
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: colors.successSoft, borderRadius: spacing.lg },
            ]}
          >
            <KeyRound color={colors.accent} size={48} />
          </View>
          <ThemedText variant="onboardingTitle" style={{ textAlign: 'center' }}>
            {t('auth.checkEmail')}
          </ThemedText>
          <ThemedText variant="body" style={{ color: colors.mutedForeground, textAlign: 'center' }}>
            {t('auth.forgotPasswordSuccess')}
          </ThemedText>
          <Link href="/(public)/sign-in" asChild>
            <Button variant="outline" fullWidth>
              {t('auth.backToSignIn')}
            </Button>
          </Link>
        </View>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <AuthHeader
        icon={KeyRound}
        title={t('auth.forgotPasswordTitle')}
        subtitle={t('auth.forgotPasswordSubtitle')}
      />

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
            {forgotPassword.isPending ? t('auth.sendingResetLink') : t('auth.forgotPasswordTitle')}
          </Button>
        </View>
      </Card>

      <Link href="/(public)/sign-in">
        <ThemedText variant="label" style={{ color: colors.accent, textAlign: 'center' }}>
          {t('auth.backToSignIn')}
        </ThemedText>
      </Link>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
