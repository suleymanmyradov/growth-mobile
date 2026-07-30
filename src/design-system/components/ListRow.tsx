/**
 * ListRow — a single tappable row with leading content, a trailing accessory,
 * and a hairline separator. Used for settings, navigation lists, and selection.
 *
 * Paper (`mobile.md` §7): 44-unit minimum target, hairline bottom border,
 * accent trailing chevron for disclosure. Press feedback via opacity/ripple.
 */
import { ChevronRight } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, View, type ViewProps } from 'react-native';

import { useAndroidRipple } from '../theme/use-press-feedback';
import { useTheme } from '../theme/theme';

export type ListRowProps = Omit<ViewProps, 'style'> & {
  /** Leading content (icon, avatar, etc.). */
  leading?: ReactNode;
  /** Main row content. */
  children: ReactNode;
  /** Trailing accessory; defaults to a disclosure chevron when `onPress` is set. */
  trailing?: ReactNode;
  /** Show the hairline bottom separator. */
  separator?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
};

export function ListRow({
  leading,
  children,
  trailing,
  separator = true,
  onPress,
  disabled = false,
  accessibilityLabel,
  ...rest
}: ListRowProps): ReactNode {
  const { colors, spacing } = useTheme();
  const ripple = useAndroidRipple(`${colors.foreground}10`);
  const pressable = !!onPress && !disabled;

  const content = (
    <View
      style={[
        styles.row,
        {
          gap: spacing.md,
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.md,
          minHeight: 44,
          borderBottomColor: separator ? colors.border : 'transparent',
          borderBottomWidth: separator ? StyleSheet.hairlineWidth : 0,
        },
      ]}
    >
      {leading ? <View>{leading}</View> : null}
      <View style={{ flex: 1 }}>{children}</View>
      <View>
        {trailing ?? (pressable ? <ChevronRight color={colors.mutedForeground} size={20} /> : null)}
      </View>
    </View>
  );

  if (!pressable) {
    return (
      <View accessibilityState={{ disabled }} {...rest}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [{ opacity: pressed && Platform.OS === 'ios' ? 0.6 : 1 }]}
      {...ripple}
      {...rest}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
});
