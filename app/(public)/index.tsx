import { Button, Screen, ThemedText } from '@/design-system';
import { useTheme } from '@/design-system/theme';
import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

/**
 * Welcome screen — entry point for unauthenticated users.
 *
 * Paper (`mobile.md` §8.8): brand display title ("Small things, kept.") using
 * the `welcomeTitle` semantic variant (38/44), a short subtitle, a primary
 * "Get started" action leading to register, and a secondary "I already have an
 * account" action leading to sign in. Centered, full-screen, no header.
 */
export default function LandingScreen() {
  const { colors, spacing } = useTheme();
  const { t } = useTranslation();

  return (
    <Screen>
      <View style={[styles.container, { paddingHorizontal: spacing.xxl, gap: spacing.xxl }]}>
        <View style={{ gap: spacing.sm }}>
          <ThemedText variant="welcomeTitle" style={{ textAlign: 'center' }}>
            {t('auth.welcomeTitle')}
          </ThemedText>
          <ThemedText variant="body" style={{ color: colors.mutedForeground, textAlign: 'center' }}>
            {t('auth.welcomeSubtitle')}
          </ThemedText>
        </View>

        <View style={{ gap: spacing.sm, width: '100%' }}>
          <Link href="/(public)/register" asChild>
            <Button fullWidth size="lg" accessibilityLabel={t('auth.getStarted')}>
              {t('auth.getStarted')}
            </Button>
          </Link>
          <Link href="/(public)/sign-in" asChild>
            <Button variant="ghost" fullWidth accessibilityLabel={t('auth.haveAccount')}>
              {t('auth.haveAccount')}
            </Button>
          </Link>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 56,
  },
});
