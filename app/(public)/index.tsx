import { useTheme } from '@/design-system/theme';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Landing screen — entry point for unauthenticated users.
 * Shows links to sign in and register.
 */
export default function LandingScreen() {
  const { colors, typography } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text
          style={[styles.title, { color: colors.primaryText, fontSize: typography.fontSize.xxl }]}
        >
          Growth
        </Text>
        <Text
          style={[
            styles.subtitle,
            { color: colors.secondaryText, fontSize: typography.fontSize.lg },
          ]}
        >
          Build better habits, one day at a time.
        </Text>

        <Link href="/(public)/sign-in" asChild>
          <Pressable style={[styles.button, { backgroundColor: colors.primary, borderRadius: 8 }]}>
            <Text style={[styles.buttonText, { color: colors.background }]}>Sign In</Text>
          </Pressable>
        </Link>

        <Link href="/(public)/register" asChild>
          <Pressable
            style={[
              styles.button,
              styles.secondaryButton,
              {
                borderColor: colors.border,
                borderRadius: 8,
              },
            ]}
          >
            <Text style={[styles.buttonText, { color: colors.primaryText }]}>Create Account</Text>
          </Pressable>
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  title: {
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
