/**
 * ProgressBar — a thin track with a sage fill, used for goal/habit progress.
 *
 * Paper (`mobile.md` §7): hairline track, accent fill, no glow. The fill is
 * clamped to [0, 1]. Decorative; the value is conveyed to assistive tech by
 * the caller through an accessible label.
 */
import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { useTheme } from '../theme/theme';

export type ProgressBarProps = ViewProps & {
  /** Progress in the range [0, 1]. Values outside are clamped. */
  value: number;
  /** Track height; defaults to 6. */
  height?: number;
};

export function ProgressBar({ value, height = 6, style, ...rest }: ProgressBarProps): ReactNode {
  const { colors, radius } = useTheme();
  const clamped = Math.min(1, Math.max(0, value));

  return (
    <View
      accessibilityRole="adjustable"
      style={[
        styles.track,
        { height, backgroundColor: colors.muted, borderRadius: radius.pill },
        style,
      ]}
      {...rest}
    >
      <View
        style={{
          height: '100%',
          width: `${clamped * 100}%`,
          backgroundColor: colors.accent,
          borderRadius: radius.pill,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { overflow: 'hidden', width: '100%' },
});
