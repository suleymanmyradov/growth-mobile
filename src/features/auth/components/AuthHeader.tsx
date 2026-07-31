/**
 * AuthHeader — shared icon + title + subtitle header for auth screens.
 *
 * Paper (`mobile.md` §8.8): auth titles use the `onboardingTitle` semantic
 * variant (30/38). The icon sits in a sage-tinted soft surface (`successSoft`)
 * with an accent glyph, replacing the older ink-tinted hex-append backgrounds
 * that did not resolve on rgba border tokens.
 */
import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/design-system';
import { useTheme } from '@/design-system/theme';

export type AuthHeaderProps = {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  /** Icon size; defaults to 28. */
  iconSize?: number;
};

export function AuthHeader({ icon: Icon, title, subtitle, iconSize = 28 }: AuthHeaderProps) {
  const { colors, radius } = useTheme();

  return (
    <View style={styles.header}>
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: colors.successSoft, borderRadius: radius.card },
        ]}
      >
        <Icon color={colors.accent} size={iconSize} />
      </View>
      <ThemedText variant="onboardingTitle" style={{ textAlign: 'center' }}>
        {title}
      </ThemedText>
      {subtitle ? (
        <ThemedText variant="body" style={{ color: colors.mutedForeground, textAlign: 'center' }}>
          {subtitle}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', gap: 12, marginBottom: 24 },
  iconWrap: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
