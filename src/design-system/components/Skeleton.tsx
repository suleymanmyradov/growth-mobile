/**
 * Skeleton — a neutral placeholder that matches loaded geometry.
 *
 * Paper (`mobile.md` §7/§10): two neutral tones, pulse for 1.6s (`slow`), no
 * shimmer. Skeleton content is not announced as real data (accessibility
 * `accessibilityElementsHidden`).
 */
import type { ReactNode } from 'react';
import { useEffect, useMemo } from 'react';
import { Animated, Easing, StyleSheet, type ViewProps } from 'react-native';

import { useTheme } from '../theme/theme';
import { useReducedMotion } from '../theme/use-reduced-motion';

export type SkeletonProps = ViewProps & {
  /** Corner radius; defaults to `radius.card` (12). */
  radius?: number;
};

export function Skeleton({ style, radius, ...rest }: SkeletonProps): ReactNode {
  const { colors, radius: themeRadius, duration } = useTheme();
  const reduced = useReducedMotion();
  // Create the Animated.Value once; it is a stable object across renders.
  const opacity = useMemo(() => new Animated.Value(1), []);

  useEffect(() => {
    if (reduced) {
      opacity.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: duration.slow,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: duration.slow,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity, reduced, duration.slow]);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.base,
        {
          backgroundColor: colors.muted,
          opacity: reduced ? 1 : opacity,
          borderRadius: radius ?? themeRadius.card,
        },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: {},
});
