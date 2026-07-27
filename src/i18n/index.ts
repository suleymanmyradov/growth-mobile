/**
 * i18n foundation — i18next + react-i18next + expo-localization.
 *
 * Per AGENTS.md: no new user-facing string may be hardcoded after the i18n
 * foundation lands. All user-visible copy lives in locale resource files and
 * is accessed via `useTranslation()` / `t()`.
 *
 * The default language is English. The system locale from expo-localization is
 * used if a matching resource file exists. Fallback is always English.
 */
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

import en from './locales/en.json';

export const defaultNamespace = 'translation';
export const defaultLocale = 'en';

/**
 * Returns the best matching locale from the device's system locales.
 * Falls back to `defaultLocale` if no resource matches.
 */
function resolveSystemLocale(): string {
  try {
    const locales = getLocales();
    for (const loc of locales) {
      const lang = loc.languageCode ?? loc.languageTag;
      if (lang === defaultLocale) return defaultLocale;
      // Future: add more language resources here as they become available.
    }
  } catch {
    // expo-localization may not be available in all environments.
  }
  return defaultLocale;
}

let initialized = false;

/**
 * Initializes i18next. Safe to call once at app startup; subsequent calls are
 * no-ops. Returns the i18next instance for chaining.
 */
export function initI18n(): typeof i18next {
  if (initialized) return i18next;
  initialized = true;

  const lng = resolveSystemLocale();

  i18next.use(initReactI18next).init({
    lng,
    fallbackLng: defaultLocale,
    defaultNS: defaultNamespace,
    resources: {
      [defaultLocale]: { [defaultNamespace]: en },
    },
    interpolation: {
      escapeValue: false, // React Native does not need HTML escaping
    },
    returnNull: false, // Zod v4 / i18next v23 compatibility
  });

  return i18next;
}

/**
 * Changes the active language at runtime. Loads resources if needed.
 * Currently only English is bundled; additional languages would be added here.
 */
export async function changeLanguage(lng: string): Promise<void> {
  await i18next.changeLanguage(lng);
}

export { i18next };
