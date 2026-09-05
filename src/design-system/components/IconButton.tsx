/**
 * IconButton — a square touchable for a single icon action (Paper §7).
 *
 * 44-unit minimum touch target wrapping a 28-unit tinted icon container, so
 * icon-only actions stay visible, tappable, and labeled. Press feedback is
 * platform convention (§5.3): opacity on iOS, ripple on Android.
 */
import type { ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { useAndroidRipple } from '../theme/use-press-feedback';
import { useTheme } from '../theme/theme';

export type IconButtonProps = {
  /** Icon element, e.g. `<ClipboardList size={20} />`; size/color come from the caller. */
  icon: ReactNode;
  onPress?: () => void;
  /** Required — icon-only actions must be labeled (Paper §7 accessibility). */
  accessibilityLabel: string;
  /** Container background; defaults to a 10% accent tint. */
  tint?: string;
  disabled?: boolean;
};

export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  tint,
  disabled,
}: IconButtonProps): ReactNode {
  const { colors, radius } = useTheme();
  const ripple = useAndroidRipple(`${colors.foreground}14`);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={4}
      style={({ pressed }) => [
        styles.pressable,
        { opacity: disabled ? 0.5 : pressed && Platform.OS === 'ios' ? 0.6 : 1 },
      ]}
      {...ripple}
    >
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: tint ?? `${colors.accent}1A`,
            borderRadius: radius.field,
          },
        ]}
      >
        {icon}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: { alignItems: 'center', justifyContent: 'center', minWidth: 44, minHeight: 44 },
  iconContainer: { alignItems: 'center', justifyContent: 'center', width: 28, height: 28 },
});
