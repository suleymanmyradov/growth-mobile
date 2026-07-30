/**
 * Toast — a brief status message shown one at a time above tab/navigation
 * chrome.
 *
 * Paper (`mobile.md` §8.10): appears one at a time, dismisses after 4 seconds,
 * supports one optional action, and pauses while screen reader focus is on
 * them. The toast announces concise status without stealing focus.
 *
 * This is the presentational component; the queueing/timing host lives in a
 * provider (added when a screen wires it). Variants map to semantic colors.
 */
import type { ReactNode } from 'react';
import { useEffect, useMemo } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../theme/theme';
import { useReducedMotion } from '../theme/use-reduced-motion';

export type ToastVariant = 'default' | 'success' | 'error';

export type ToastProps = {
  message: string;
  variant?: ToastVariant;
  actionLabel?: string;
  onAction?: () => void;
  /** Auto-dismiss after this many ms; 0 disables. Defaults to 4000. */
  duration?: number;
  onDismiss?: () => void;
};

export function Toast({
  message,
  variant = 'default',
  actionLabel,
  onAction,
  duration = 4000,
  onDismiss,
}: ToastProps): ReactNode {
  const { colors, radius, spacing, duration: durations } = useTheme();
  const reduced = useReducedMotion();
  const fade = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: reduced ? durations.quick : durations.overlay,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    if (duration <= 0) return;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const schedule = () => {
      timer = setTimeout(() => {
        Animated.timing(fade, {
          toValue: 0,
          duration: reduced ? durations.quick : durations.overlay,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }).start(() => onDismiss?.());
      }, duration);
    };

    // Pause auto-dismiss while screen reader focus is on the toast.
    const sub = AccessibilityInfo.addEventListener('screenReaderChanged', (enabled) => {
      if (timer) clearTimeout(timer);
      if (!enabled) schedule();
    });

    schedule();
    return () => {
      if (timer) clearTimeout(timer);
      sub.remove();
    };
  }, [duration, fade, onDismiss, reduced, durations.overlay, durations.quick]);

  const accent =
    variant === 'success'
      ? colors.accent
      : variant === 'error'
        ? colors.destructive
        : colors.foreground;

  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      style={[
        styles.container,
        {
          backgroundColor: colors.surfaceElevated,
          borderColor: colors.border,
          borderRadius: radius.card,
          opacity: fade,
        },
      ]}
    >
      <Text style={{ color: colors.foreground, fontSize: 15, lineHeight: 22, flex: 1 }}>
        {message}
      </Text>
      {actionLabel ? (
        <View style={{ paddingLeft: spacing.md }}>
          <Text
            accessibilityRole="button"
            onPress={onAction}
            style={{ color: accent, fontSize: 15, fontWeight: '600' }}
          >
            {actionLabel}
          </Text>
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
  },
});
