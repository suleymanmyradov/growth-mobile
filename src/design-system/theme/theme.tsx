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
import type { RadiusTokens } from '../tokens/radius';
import { radius } from '../tokens/radius';
import type { SpacingTokens } from '../tokens/spacing';
import { spacing } from '../tokens/spacing';
import type { TypographyTokens } from '../tokens/typography';
import { typography } from '../tokens/typography';

export type ThemeMode = 'system' | 'light' | 'dark';

export type Theme = {
  colors: ColorTokens;
  spacing: SpacingTokens;
  typography: TypographyTokens;
  radius: RadiusTokens;
};

export type ThemeProviderProps = {
  children: ReactNode;
};

const THEME_MODE_KEY = 'growth.theme_mode';

const lightTheme: Theme = {
  colors: lightColors,
  spacing,
  typography,
  radius,
};

const darkTheme: Theme = {
  colors: darkColors,
  spacing,
  typography,
  radius,
};

type ThemeContextValue = Theme & {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  ...lightTheme,
  themeMode: 'system',
  setThemeMode: () => {},
});

/**
 * Provides the active theme to the React subtree. The color palette is chosen
 * from the user-selected theme mode, falling back to the system color scheme.
 */
export function ThemeProvider({ children }: ThemeProviderProps): ReactNode {
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
    return effectiveScheme === 'dark' ? darkTheme : lightTheme;
  }, [effectiveScheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({ ...theme, themeMode, setThemeMode }),
    [theme, themeMode],
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
