/**
 * Check-email screen — shown after successful registration.
 * Displays the "check your email" message and a link back to sign-in.
 *
 * Paper (`mobile.md` §8.8): onboardingTitle variant, sage accent, muted
 * secondary text, centered.
 */
import { Link, useLocalSearchParams } from 'expo-router';
import { MailCheck } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Button, ThemedText } from '@/design-system';
import { useTheme } from '@/design-system/theme';

import { AuthShell } from '../components/AuthShell';

export function CheckEmailScreen() {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = params.email ?? '';

  return (
    <AuthShell>
      <View style={{ alignItems: 'center', gap: spacing.md }}>
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: colors.successSoft, borderRadius: spacing.lg },
          ]}
        >
          <MailCheck color={colors.accent} size={48} />
        </View>
        <ThemedText variant="onboardingTitle" style={{ textAlign: 'center' }}>
          {t('auth.checkEmail')}
        </ThemedText>
        <ThemedText variant="body" style={{ color: colors.mutedForeground, textAlign: 'center' }}>
          {t('auth.checkEmailMessage', { email })}
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

const styles = StyleSheet.create({
  iconWrap: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
