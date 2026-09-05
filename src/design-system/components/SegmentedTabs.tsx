/**
 * SegmentedTabs — a segmented control for switching between segments
 * (Library: Explore/Saved/Templates/People; Plan filters).
 *
 * Paper (`mobile.md` §7): pill container, selected segment on surface with a
 * hairline border, unselected transparent. 44-unit target. The selected segment
 * is conveyed via `accessibilityState.selected`.
 *
 * The pill hugs its content; when the segments exceed the available width the
 * row scrolls horizontally instead of overflowing off-screen.
 */
import type { ReactNode } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View, type ViewProps } from 'react-native';

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
    <View {...rest}>
      <ScrollView
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.container,
          { backgroundColor: colors.muted, borderRadius: radius.pill },
        ]}
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    padding: 4,
    gap: 4,
  },
  segment: { alignItems: 'center', justifyContent: 'center' },
});
