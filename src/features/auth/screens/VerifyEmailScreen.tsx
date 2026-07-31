/**
 * Verify-email screen — receives a verification token (from a deep link or
 * manual entry), calls the backend, and redirects to onboarding on success.
 *
 * On error, shows a resend-verification form.
 *
 * Paper (`mobile.md` §8.8): onboardingTitle variant, sage accent for success,
 * destructive for failure, muted secondary text, keyboard avoidance, 48-unit
 * inputs.
 */
import { Link, useLocalSearchParams } from 'expo-router';
import { CheckCircle2, MailWarning, XCircle } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { ApiError } from '@/core/api/errors';
import { Button, Card, Input, Spinner, ThemedText } from '@/design-system';
import { useTheme } from '@/design-system/theme';

import { AuthShell } from '../components/AuthShell';
import { authErrorKey, useResendVerification, useVerifyEmail } from '../hooks';

type Status = 'loading' | 'success' | 'error';

export function VerifyEmailScreen() {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const params = useLocalSearchParams<{ token?: string }>();
  const token = params.token ?? '';

  const verifyEmail = useVerifyEmail();
  const resend = useResendVerification();

  const [status, setStatus] = useState<Status>(() => (token ? 'loading' : 'error'));
  const [error, setError] = useState<string | null>(() =>
    token ? null : t('auth.verifyEmailNoToken'),
  );
  const [resendEmail, setResendEmail] = useState('');

  useEffect(() => {
    if (!token) return;
    verifyEmail.mutate(
      { token },
      {
        onSuccess: () => setStatus('success'),
        onError: (err) => {
          setStatus('error');
          if (err instanceof ApiError) {
            const key = authErrorKey(err.code);
            setError(key ? t(key) : err.message);
          } else {
            setError(t('common.networkError'));
          }
        },
      },
    );
  }, [token, t, verifyEmail]);

  const handleResend = () => {
    if (!resendEmail) return;
    resend.mutate({ email: resendEmail });
  };

  if (status === 'loading') {
    return (
      <AuthShell>
        <Spinner size="large" label={t('auth.verifyEmail')} />
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <View style={{ alignItems: 'center', gap: spacing.md, width: '100%' }}>
        <View
          style={[
            styles.iconWrap,
            {
              backgroundColor:
                status === 'success' ? colors.successSoft : `${colors.destructive}1A`,
              borderRadius: spacing.lg,
            },
          ]}
        >
          {status === 'success' ? (
            <CheckCircle2 color={colors.accent} size={48} />
          ) : (
            <XCircle color={colors.destructive} size={48} />
          )}
        </View>
        <ThemedText variant="onboardingTitle" style={{ textAlign: 'center' }}>
          {status === 'success' ? t('auth.verifyEmailSuccess') : t('auth.verifyEmailFailed')}
        </ThemedText>
        <ThemedText
          variant="body"
          style={{ color: colors.mutedForeground, textAlign: 'center' }}
          accessibilityRole={status === 'error' ? 'alert' : undefined}
        >
          {status === 'success' ? t('auth.verifyEmailRedirecting') : error}
        </ThemedText>

        {status === 'error' ? (
          <Card style={{ width: '100%' }}>
            <View style={{ gap: spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MailWarning color={colors.mutedForeground} size={16} />
                <ThemedText variant="label">{t('auth.resendVerification')}</ThemedText>
              </View>
              <Input
                placeholder={t('auth.emailPlaceholder')}
                value={resendEmail}
                onChangeText={setResendEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel={t('auth.email')}
              />
              <Button
                fullWidth
                loading={resend.isPending}
                onPress={handleResend}
                disabled={!resendEmail}
              >
                {resend.isPending ? t('auth.resending') : t('auth.resendVerification')}
              </Button>
            </View>
          </Card>
        ) : null}

        <Link href="/(public)/sign-in">
          <ThemedText variant="label" style={{ color: colors.accent, textAlign: 'center' }}>
            {t('auth.backToSignIn')}
          </ThemedText>
        </Link>
      </View>
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
