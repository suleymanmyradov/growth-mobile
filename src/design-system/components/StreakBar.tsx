/**
 * StreakBar — 14 visual bars paired with a textual summary.
 *
 * Paper (`mobile.md` §7): bars are hidden from accessibility (decorative);
 * the text carries the meaning. Bars use accent for completed days and muted
 * for missed. A failed/empty state must not rely on color alone — the summary
 * text is the source of truth.
 */
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../theme/theme';
import { ThemedText } from './ThemedText';

export type StreakBarProps = {
  /** Up to 14 most-recent day states, oldest → newest. */
  history: boolean[];
  /** Human-readable summary, e.g. "12 day streak" or "11 of 14". */
  summary: string;
};

export function StreakBar({ history, summary }: StreakBarProps): ReactNode {
  const { colors, spacing } = useTheme();
  // Render most-recent-first so the streak fills from the left.
  const bars = history.slice(-14).reverse();

  return (
    <View style={[styles.container, { gap: spacing.xs }]}>
      <View
        style={[styles.bars, { gap: spacing.xs }]}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {bars.map((done, i) => (
          <View
            key={i}
            style={[
              styles.bar,
              {
                backgroundColor: done ? colors.accent : colors.muted,
              },
            ]}
          />
        ))}
      </View>
      <ThemedText variant="meta" style={{ color: colors.mutedForeground }}>
        {summary}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center' },
  bars: { flexDirection: 'row' },
  bar: { width: 8, height: 8, borderRadius: 4 },
});
