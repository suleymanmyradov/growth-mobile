/**
 * Theme context providing the active design tokens based on the user-selected
 * theme mode (system/light/dark) or the system color scheme as a fallback.
 *
 * The user-selected mode is persisted in the non-secret KV store so it
 * survives app relaunches. The `useTheme` hook returns the active theme plus
 * the current mode and a setter.
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { getItem, setItem } from '@/core/storage/kv';
import type { ColorTokens } from '../tokens/colors';
import { darkColors, lightColors } from '../tokens/colors';
import type { DurationTokens } from '../tokens/motion';
import { duration } from '../tokens/motion';
import type { RadiusTokens } from '../tokens/radius';
import { radius } from '../tokens/radius';
import type { SpacingTokens } from '../tokens/spacing';
import { spacing } from '../tokens/spacing';
import type { FontFamily, TextStyleVariant, TypographyTokens } from '../tokens/typography';
import { fontFamily as fontFamilyTokens, textStyles, typography } from '../tokens/typography';

export type ThemeMode = 'system' | 'light' | 'dark';

export type Theme = {
  colors: ColorTokens;
  spacing: SpacingTokens;
  typography: TypographyTokens;
  radius: RadiusTokens;
  duration: DurationTokens;
  /** Loaded (or fallback) font family names keyed by semantic role. */
  fonts: FontFamily;
  /** Semantic text style specs keyed by variant. */
  textStyles: typeof textStyles;
};

export type ThemeProviderProps = {
  children: ReactNode;
};

const THEME_MODE_KEY = 'growth.theme_mode';

/**
 * System font fallbacks used until the Paper fonts load (or permanently if a
 * font fails to load). The app must stay bootable without the custom fonts.
 * iOS: San Francisco / Menlo; Android: Roboto / monospace.
 */
const systemFonts: FontFamily = {
  display: 'System',
  displayMedium: 'System',
  body: 'System',
  bodyMedium: 'System',
  bodySemibold: 'System',
  mono: 'Menlo',
  monoMedium: 'Menlo',
};

const lightTheme: Theme = {
  colors: lightColors,
  spacing,
  typography,
  radius,
  duration,
  fonts: systemFonts,
  textStyles,
};

const darkTheme: Theme = {
  colors: darkColors,
  spacing,
  typography,
  radius,
  duration,
  fonts: systemFonts,
  textStyles,
};

type ThemeContextValue = Theme & {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  /** Whether the Paper fonts have finished loading. */
  fontsLoaded: boolean;
};

const ThemeContext = createContext<ThemeContextValue>({
  ...lightTheme,
  themeMode: 'system',
  setThemeMode: () => {},
  fontsLoaded: false,
});

export type ThemeProviderExtendedProps = ThemeProviderProps & {
  fontsLoaded: boolean;
};

/**
 * Provides the active theme to the React subtree. The color palette is chosen
 * from the user-selected theme mode, falling back to the system color scheme.
 * Pass `fontsLoaded` so the resolved font map switches from system fallbacks
 * to the loaded Paper families once `expo-font` reports ready.
 */
export function ThemeProvider({ children, fontsLoaded }: ThemeProviderExtendedProps): ReactNode {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

  // Hydrate persisted theme mode on mount.
  useEffect(() => {
    getItem<ThemeMode>(THEME_MODE_KEY)
      .then((persisted) => {
        if (persisted === 'light' || persisted === 'dark' || persisted === 'system') {
          setThemeModeState(persisted);
        }
      })
      .catch(() => {});
  }, []);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    setItem(THEME_MODE_KEY, mode).catch(() => {});
  };

  const effectiveScheme = themeMode === 'system' ? systemColorScheme : themeMode;

  const theme = useMemo<Theme>(() => {
    const base = effectiveScheme === 'dark' ? darkTheme : lightTheme;
    return { ...base, fonts: fontsLoaded ? fontFamilyTokens : systemFonts };
  }, [effectiveScheme, fontsLoaded]);

  const value = useMemo<ThemeContextValue>(
    () => ({ ...theme, themeMode, setThemeMode, fontsLoaded }),
    [theme, themeMode, fontsLoaded],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * Access the active theme and theme mode controls. Must be called within a
 * `ThemeProvider`.
 */
export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

export type { TextStyleVariant };
