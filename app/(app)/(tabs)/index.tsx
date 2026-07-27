import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/design-system/theme';

export default function HomeScreen() {
  const { colors, typography } = useTheme();
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text
          style={{ color: colors.primaryText, fontSize: typography.fontSize.xl, fontWeight: '700' }}
        >
          uindex
        </Text>
        <Text style={{ color: colors.secondaryText, fontSize: typography.fontSize.md }}>
          Coming in a later phase.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
});
