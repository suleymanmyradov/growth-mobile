/**
 * Badge — a small pill-shaped label for categories, tags, and status indicators.
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
  const { colors, radius, typography } = useTheme();

  const variantColor =
    variant === 'success'
      ? colors.success
      : variant === 'warning'
        ? colors.warning
        : variant === 'error'
          ? colors.error
          : (color ?? colors.primary);

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: `${variantColor}1A`, // ~10% opacity
          borderRadius: radius.full,
          paddingHorizontal: 8,
          paddingVertical: 2,
        },
      ]}
    >
      <ThemedText
        style={{
          color: variantColor,
          fontSize: typography.fontSize.xs,
          fontWeight: typography.fontWeight.medium,
        }}
      >
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
