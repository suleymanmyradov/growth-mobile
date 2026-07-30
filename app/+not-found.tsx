import { useTheme } from '@/design-system/theme';
import { Link, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function NotFoundScreen() {
  const { colors, typography } = useTheme();
  const { t } = useTranslation();

  return (
    <>
      <Stack.Screen options={{ title: t('notFound.headerTitle') }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text
          style={{
            color: colors.primaryText,
            fontSize: typography.fontSize.xxl,
            fontWeight: '700',
          }}
        >
          {t('notFound.title')}
        </Text>
        <Text
          style={{
            color: colors.secondaryText,
            fontSize: typography.fontSize.md,
            marginBottom: 24,
          }}
        >
          {t('notFound.message')}
        </Text>
        <Link href="/" asChild>
          <Pressable
            style={StyleSheet.flatten([styles.button, { backgroundColor: colors.primary }])}
          >
            <Text style={{ color: colors.background, fontWeight: '600' }}>
              {t('notFound.goHome')}
            </Text>
          </Pressable>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
});
