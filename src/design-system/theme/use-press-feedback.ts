/**
 * Platform press feedback (Paper §5.3 / §1a).
 *
 * `instant` 80 ms: press — opacity on iOS, ripple on Android. This hook returns
 * the props a `Pressable` needs to apply that feedback consistently, gated by
 * the reduced-motion setting (opacity may remain at 140 ms; movement drops to
 * zero).
 *
 * On Android the native ripple is provided by `android_ripple` on `Pressable`,
 * not a custom animation. On iOS an opacity animation is applied via Reanimated
 * worklets. Components that already use `Pressable` can spread these props.
 */
import { Platform } from 'react-native';

import { duration } from '../tokens/motion';
import { useReducedMotion } from './use-reduced-motion';

export type PressFeedbackOptions = {
  /** Ripple color for Android (defaults to a subtle foreground tint). */
  rippleColor?: string;
  /** Resting opacity (usually 1). */
  restOpacity?: number;
  /** Pressed opacity (usually ~0.6). */
  pressedOpacity?: number;
};

export type PressFeedbackProps = {
  android_ripple?: { color: string; radius?: number; foreground?: boolean };
  unstable_pressDelay?: number;
};

/**
 * Returns Android ripple props for a `Pressable`. Returns `undefined` on iOS so
 * the native ripple is not applied there.
 */
export function useAndroidRipple(rippleColor?: string): PressFeedbackProps {
  if (Platform.OS !== 'android' || !rippleColor) {
    return {};
  }
  return {
    android_ripple: { color: rippleColor, radius: 28, foreground: true },
  };
}

/**
 * Returns the press animation duration for opacity, respecting reduced motion.
 * Reduced motion keeps opacity at 140 ms (`quick`); movement durations are
 * zeroed by the caller.
 */
export function usePressDuration(): number {
  const reduced = useReducedMotion();
  return reduced ? duration.quick : duration.instant;
}
