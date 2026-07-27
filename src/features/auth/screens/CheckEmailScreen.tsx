/**
 * Check-email screen — shown after successful registration.
 * Displays the "check your email" message and a link back to sign-in.
 */
import { Link, useLocalSearchParams } from 'expo-router';
import { MailCheck } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Button, Screen, ThemedText } from '@/design-system';
import { useTheme } from '@/design-system/theme';

export function CheckEmailScreen() {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = params.email ?? '';

  return (
    <Screen>
      <View style={[styles.container, { padding: spacing.lg, gap: spacing.md }]}>
        <View style={[styles.iconWrap, { backgroundColor: `${colors.primary}1A` }]}>
          <MailCheck color={colors.primary} size={48} />
        </View>
        <ThemedText variant="heading" style={{ fontSize: 24, textAlign: 'center' }}>
          {t('auth.checkEmail')}
        </ThemedText>
        <ThemedText variant="body" style={{ color: colors.secondaryText, textAlign: 'center' }}>
          {t('auth.checkEmailMessage', { email })}
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
