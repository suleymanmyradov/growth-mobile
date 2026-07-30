/**
 * CheckInControl — the one-tap check-in circle.
 *
 * Paper (`mobile.md` §7/§4): a 28-unit circle inside a 44-unit pressable.
 * States: rest, pressed, syncing, done, failed, disabled. Check-in is one tap
 * with an inline note expand — no modal for the normal check-in.
 *
 * Accessibility (`mobile.md` §7): `accessibilityRole="checkbox"`, correct
 * checked/busy/disabled state, and a label containing the habit name. Visual
 * color is never the only state indicator (the check glyph + strikethrough
 * carry meaning alongside the sage fill).
 */
import { Check } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { useAndroidRipple } from '../theme/use-press-feedback';
import { useTheme } from '../theme/theme';

export type CheckInState = 'rest' | 'syncing' | 'done' | 'failed' | 'disabled';

export type CheckInControlProps = {
  state?: CheckInState;
  /** Habit name, included in the accessibility label. */
  habitName: string;
  onPress?: () => void;
  /** Diameter of the circle; defaults to 28. The pressable is always ≥44. */
  size?: number;
};

export function CheckInControl({
  state = 'rest',
  habitName,
  onPress,
  size = 28,
}: CheckInControlProps): ReactNode {
  const { colors } = useTheme();
  const checked = state === 'done';
  const busy = state === 'syncing';
  const failed = state === 'failed';
  const disabled = state === 'disabled';
  const pressable = !!onPress && !disabled && !busy;

  const fill = checked ? colors.accent : failed ? colors.destructive : 'transparent';
  const stroke = checked
    ? colors.accent
    : failed
      ? colors.destructive
      : disabled
        ? colors.mutedForeground
        : colors.foreground;
  const ripple = useAndroidRipple(`${colors.foreground}14`);

  const a11yLabel = `${habitName} — ${checked ? 'done' : 'not done'}`;
  const a11yState = {
    checked,
    disabled: disabled || busy,
    busy,
  };

  return (
    <Pressable
      onPress={pressable ? onPress : undefined}
      disabled={!pressable}
      accessibilityRole="checkbox"
      accessibilityLabel={a11yLabel}
      accessibilityState={a11yState}
      hitSlop={8}
      style={({ pressed }) => [
        styles.pressable,
        { opacity: disabled ? 0.5 : pressed && Platform.OS === 'ios' ? 0.6 : 1 },
      ]}
      {...ripple}
    >
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: fill,
            borderColor: stroke,
            borderWidth: 2,
          },
        ]}
      >
        {checked ? <Check color={colors.accentForeground} size={size * 0.6} /> : null}
        {failed ? (
          <View style={[styles.cross, { borderColor: colors.destructiveForeground }]} />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: { alignItems: 'center', justifyContent: 'center', minWidth: 44, minHeight: 44 },
  circle: { alignItems: 'center', justifyContent: 'center' },
  cross: { width: 10, height: 2, borderWidth: 0, transform: [{ rotate: '45deg' }] },
});
