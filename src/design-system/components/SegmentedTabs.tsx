/**
 * SegmentedTabs — a segmented control for switching between segments
 * (Library: Explore/Saved/Templates/People; Plan filters).
 *
 * Paper (`mobile.md` §7): pill container, selected segment on surface with a
 * hairline border, unselected transparent. 44-unit target. The selected segment
 * is conveyed via `accessibilityState.selected`.
 */
import type { ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, View, type ViewProps } from 'react-native';

import { useTheme } from '../theme/theme';
import { useAndroidRipple } from '../theme/use-press-feedback';
import { ThemedText } from './ThemedText';

export type Segment = {
  id: string;
  label: string;
};

export type SegmentedTabsProps = Omit<ViewProps, 'style'> & {
  segments: Segment[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
};

function SegmentButton({
  segment,
  selected,
  disabled,
  onPress,
}: {
  segment: Segment;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
}): ReactNode {
  const { colors, radius, spacing } = useTheme();
  const ripple = useAndroidRipple(selected ? colors.surface : 'transparent');
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.segment,
        {
          backgroundColor: selected ? colors.surface : 'transparent',
          borderRadius: radius.pill,
          paddingHorizontal: spacing.md,
          minHeight: 44,
          opacity: disabled ? 0.5 : pressed && Platform.OS === 'ios' ? 0.6 : 1,
        },
      ]}
      {...ripple}
    >
      <ThemedText
        variant="label"
        style={{ color: selected ? colors.foreground : colors.mutedForeground }}
      >
        {segment.label}
      </ThemedText>
    </Pressable>
  );
}

export function SegmentedTabs({
  segments,
  value,
  onChange,
  disabled = false,
  ...rest
}: SegmentedTabsProps): ReactNode {
  const { colors, radius } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.muted, borderRadius: radius.pill, padding: 4, gap: 4 },
      ]}
      {...rest}
    >
      {segments.map((seg) => (
        <SegmentButton
          key={seg.id}
          segment={seg}
          selected={seg.id === value}
          disabled={disabled}
          onPress={() => onChange(seg.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center' },
  segment: { alignItems: 'center', justifyContent: 'center' },
});
