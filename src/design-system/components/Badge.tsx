/**
 * Badge — a small pill-shaped label for categories, tags, and status indicators.
 *
 * Paper (`mobile.md` §7): pill radius, label-sized text. The `warning` variant
 * is retained as a temporary alias (Paper has no warning color); it maps to the
 * destructive token until its callers migrate.
 */
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../theme/theme';
import { ThemedText } from './ThemedText';

export type BadgeProps = {
  children: ReactNode;
  color?: string;
  variant?: 'default' | 'success' | 'warning' | 'error';
};

export function Badge({ children, color, variant = 'default' }: BadgeProps): ReactNode {
  const { colors, radius } = useTheme();

  const variantColor =
    variant === 'success'
      ? colors.success
      : variant === 'warning'
        ? colors.warning
        : variant === 'error'
          ? colors.destructive
          : (color ?? colors.accent);

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: `${variantColor}1A`, // ~10% opacity tint
          borderRadius: radius.pill,
          paddingHorizontal: 8,
          paddingVertical: 2,
        },
      ]}
    >
      <ThemedText variant="label" style={{ color: variantColor }}>
        {children}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
  },
});
