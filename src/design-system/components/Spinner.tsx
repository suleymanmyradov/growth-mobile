/**
 * Spinner — a centered loading indicator with optional label.
 */
import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useTheme } from '../theme/theme';
import { ThemedText } from './ThemedText';

export type SpinnerProps = {
  label?: string;
  size?: 'small' | 'large';
  fullScreen?: boolean;
};

export function Spinner({ label, size = 'small', fullScreen = false }: SpinnerProps): ReactNode {
  const { colors, spacing } = useTheme();

  return (
    <View style={[styles.container, fullScreen && styles.fullScreen, { gap: spacing.sm }]}>
      <ActivityIndicator color={colors.primary} size={size} />
      {label ? (
        <ThemedText variant="caption" style={{ color: colors.secondaryText }}>
          {label}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: 16 },
  fullScreen: { flex: 1 },
});
