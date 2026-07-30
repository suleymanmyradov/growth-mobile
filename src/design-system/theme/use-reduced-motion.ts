/**
 * Reduced-motion hook.
 *
 * Reads `AccessibilityInfo.isReduceMotionEnabled` and subscribes to changes.
 * Per `mobile.md` §5.3: reduced motion sets movement durations to zero;
 * opacity may remain at 140 ms. Consumers use this to gate animation durations
 * rather than reading the raw setting themselves.
 */
import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;
    const update = (value: boolean) => {
      if (mounted) setReduced(value);
    };

    // iOS exposes isReduceMotionEnabled; Android may return false on older
    // OS versions. Best-effort — never throw.
    AccessibilityInfo.isReduceMotionEnabled?.()
      .then(update)
      .catch(() => {});

    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', update);
    return () => {
      mounted = false;
      // `removeEventListener` signature differs across RN versions; the
      // subscription object form is preferred when available.
      if (sub && typeof sub.remove === 'function') {
        sub.remove();
      }
      // The deprecated (handler, eventType) removal signature was removed in
      // recent RN; the subscription object form above is the supported path.
    };
  }, []);

  // The initial query is the source of truth on bridges where the change
  // event is unavailable; the listener keeps it current where supported.
  return reduced;
}
