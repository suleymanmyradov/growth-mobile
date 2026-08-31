/**
 * MetricCard — a single metric tile for the Progress screen.
 *
 * Ported from the web frontend's `MetricCard`: shows a label, value, and
 * optional accent color. Used for check-ins, consistency, missed, and total
 * habits metrics.
 */
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/design-system';
import { useTheme } from '@/design-system/theme';

export interface MetricCardProps {
  label: string;
  value: string | number;
  accent?: boolean;
}

export function MetricCard({ label, value, accent }: MetricCardProps): ReactNode {
  const { colors, spacing, radius } = useTheme();
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radius.card,
          padding: spacing.md,
          gap: 4,
        },
      ]}
    >
      <ThemedText
        variant="numeric"
        style={{ color: accent ? colors.accent : colors.foreground, fontSize: 22, lineHeight: 28 }}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
      >
        {value}
      </ThemedText>
      <ThemedText variant="caption" style={{ color: colors.mutedForeground }} numberOfLines={1}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderWidth: 1,
    minWidth: 0,
  },
});
