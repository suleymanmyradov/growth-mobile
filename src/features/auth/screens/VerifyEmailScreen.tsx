/**
 * Verify-email screen — receives a verification token (from a deep link or
 * manual entry), calls the backend, and redirects to onboarding on success.
 *
 * On error, shows a resend-verification form.
 */
import { Link, useLocalSearchParams } from 'expo-router';
import { CheckCircle2, MailWarning, XCircle } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { ApiError } from '@/core/api/errors';
import { Button, Card, Input, Screen, Spinner, ThemedText } from '@/design-system';
import { useTheme } from '@/design-system/theme';

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

  return (
    <Screen>
      <View style={[styles.container, { padding: spacing.lg, gap: spacing.md }]}>
        {status === 'loading' ? (
          <>
            <Spinner size="large" label={t('auth.verifyEmail')} />
          </>
        ) : status === 'success' ? (
          <>
            <View style={[styles.iconWrap, { backgroundColor: `${colors.primary}1A` }]}>
              <CheckCircle2 color={colors.primary} size={48} />
            </View>
            <ThemedText variant="heading" style={{ fontSize: 24, textAlign: 'center' }}>
              {t('auth.verifyEmailSuccess')}
            </ThemedText>
            <ThemedText variant="body" style={{ color: colors.secondaryText, textAlign: 'center' }}>
              {t('auth.verifyEmailRedirecting')}
            </ThemedText>
          </>
        ) : (
          <>
            <View style={[styles.iconWrap, { backgroundColor: `${colors.error}1A` }]}>
              <XCircle color={colors.error} size={48} />
            </View>
            <ThemedText variant="heading" style={{ fontSize: 24, textAlign: 'center' }}>
              {t('auth.verifyEmailFailed')}
            </ThemedText>
            <ThemedText variant="body" style={{ color: colors.secondaryText, textAlign: 'center' }}>
              {error}
            </ThemedText>

            <Card>
              <View style={{ gap: spacing.sm }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <MailWarning color={colors.secondaryText} size={16} />
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

            <Link href="/(public)/sign-in">
              <ThemedText style={{ color: colors.primary, textAlign: 'center' }}>
                {t('auth.backToSignIn')}
              </ThemedText>
            </Link>
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
