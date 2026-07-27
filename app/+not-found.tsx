import { Link, Stack } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '@/design-system/theme';

export default function NotFoundScreen() {
  const { colors, typography } = useTheme();

  return (
    <>
      <Stack.Screen options={{ title: 'Not Found' }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text
          style={{
            color: colors.primaryText,
            fontSize: typography.fontSize.xxl,
            fontWeight: '700',
          }}
        >
          404
        </Text>
        <Text
          style={{
            color: colors.secondaryText,
            fontSize: typography.fontSize.md,
            marginBottom: 24,
          }}
        >
          This screen doesn&apos;t exist.
        </Text>
        <Link href="/" asChild>
          <Pressable style={[styles.button, { backgroundColor: colors.primary }]}>
            <Text style={{ color: colors.background, fontWeight: '600' }}>Go Home</Text>
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
