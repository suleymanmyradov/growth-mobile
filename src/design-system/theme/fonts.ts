/**
 * Font loading for the Paper design system.
 *
 * Loads Newsreader (display), Instrument Sans (body), and IBM Plex Mono (mono)
 * via `expo-font`. The family names here match the `fontFamily` token in
 * `tokens/typography.ts` so `ThemedText` can reference them directly.
 *
 * Keep the splash screen visible until `useFonts` reports loaded, and degrade
 * to system fonts on failure so a font error never blocks boot.
 */
import { IBMPlexMono_400Regular, IBMPlexMono_500Medium } from '@expo-google-fonts/ibm-plex-mono';
import {
  InstrumentSans_400Regular,
  InstrumentSans_500Medium,
  InstrumentSans_600SemiBold,
} from '@expo-google-fonts/instrument-sans';
import { Newsreader_400Regular, Newsreader_500Medium } from '@expo-google-fonts/newsreader';
import * as Font from 'expo-font';
import { useEffect, useState } from 'react';

import { fontFamily as fontFamilyTokens } from '../tokens/typography';

/** Map of token family name → font asset, loaded once at boot. */
export const fontAssets = {
  [fontFamilyTokens.display]: Newsreader_400Regular,
  [fontFamilyTokens.displayMedium]: Newsreader_500Medium,
  [fontFamilyTokens.body]: InstrumentSans_400Regular,
  [fontFamilyTokens.bodyMedium]: InstrumentSans_500Medium,
  [fontFamilyTokens.bodySemibold]: InstrumentSans_600SemiBold,
  [fontFamilyTokens.mono]: IBMPlexMono_400Regular,
  [fontFamilyTokens.monoMedium]: IBMPlexMono_500Medium,
} as const;

/**
 * Loads the Paper fonts. Returns `{ loaded, error }`. Fonts load once; later
 * mounts reuse the cached `expo-font` state. On error the app continues with
 * system fallbacks — a font failure must not block boot.
 */
export function usePaperFonts(): { loaded: boolean; error: Error | null } {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    Font.loadAsync(fontAssets)
      .then(() => {
        if (mounted) setLoaded(true);
      })
      .catch((e: unknown) => {
        if (mounted) {
          setError(e instanceof Error ? e : new Error(String(e)));
          setLoaded(true);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  return { loaded, error };
}
