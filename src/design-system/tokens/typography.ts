/**
 * Typography tokens (Paper).
 *
 * Three families are loaded via `expo-font` in `app/_layout.tsx` (see
 * `mobile.md` §5.2): Newsreader (display), Instrument Sans (body), and IBM
 * Plex Mono (numeric/technical metadata). Until fonts are loaded, `fontFamily`
 * falls back to platform system fonts so the app stays bootable.
 *
 * `textStyles` is the canonical set of semantic text styles; screens compose
 * through `ThemedText variant=…` so type never drifts. The t-shirt
 * `fontSize`/`fontWeight`/`lineHeight` scales remain for one-off cases.
 */
import type { TextStyle } from 'react-native';

export type FontFamilyName =
  'display' | 'displayMedium' | 'body' | 'bodyMedium' | 'bodySemibold' | 'mono' | 'monoMedium';

export type FontFamily = Record<FontFamilyName, string>;

/**
 * Loaded expo-font family names. `app/_layout.tsx` maps these to the actual
 * loaded fonts; until then the theme resolves them to system fallbacks.
 */
export const fontFamily: FontFamily = {
  display: 'Newsreader_400Regular',
  displayMedium: 'Newsreader_500Medium',
  body: 'InstrumentSans_400Regular',
  bodyMedium: 'InstrumentSans_500Medium',
  bodySemibold: 'InstrumentSans_600SemiBold',
  mono: 'IBMPlexMono_400Regular',
  monoMedium: 'IBMPlexMono_500Medium',
};

export type TextStyleVariant =
  | 'screenTitle'
  | 'sectionTitle'
  | 'cardTitle'
  | 'rowTitle'
  | 'body'
  | 'bodySmall'
  | 'label'
  | 'meta'
  | 'caption'
  | 'numeric'
  | 'reader'
  // Role-specific display titles from dedicated frames (§5.2).
  | 'onboardingTitle'
  | 'articleTitle'
  | 'welcomeTitle';

export type TextStyleSpec = {
  family: FontFamilyName;
  size: number;
  lineHeight: number;
  weight?: '400' | '500' | '600';
  fontVariant?: string[];
};

export const textStyles: Record<TextStyleVariant, TextStyleSpec> = {
  screenTitle: { family: 'display', size: 34, lineHeight: 39 },
  sectionTitle: { family: 'display', size: 22, lineHeight: 29 },
  cardTitle: { family: 'display', size: 18, lineHeight: 24 },
  rowTitle: { family: 'display', size: 17, lineHeight: 22 },
  body: { family: 'body', size: 16, lineHeight: 24 },
  bodySmall: { family: 'body', size: 15, lineHeight: 22 },
  label: { family: 'bodyMedium', size: 13, lineHeight: 18, weight: '500' },
  meta: { family: 'body', size: 13, lineHeight: 18 },
  caption: { family: 'body', size: 12, lineHeight: 16 },
  numeric: {
    family: 'monoMedium',
    size: 15,
    lineHeight: 20,
    weight: '500',
    fontVariant: ['tabular-nums'],
  },
  reader: { family: 'body', size: 17, lineHeight: 29 },
  onboardingTitle: { family: 'display', size: 30, lineHeight: 38 },
  articleTitle: { family: 'display', size: 32, lineHeight: 38 },
  welcomeTitle: { family: 'display', size: 38, lineHeight: 44 },
};

export type FontSizeScale = {
  xs: 12;
  sm: 14;
  md: 16;
  lg: 20;
  xl: 24;
  xxl: 32;
};

export type FontWeightScale = {
  regular: '400';
  medium: '500';
  semibold: '600';
  bold: '700';
};

export type LineHeightScale = {
  xs: 16;
  sm: 20;
  md: 24;
  lg: 28;
  xl: 32;
  xxl: 40;
};

export type TypographyTokens = {
  fontFamily: FontFamily;
  fontSize: FontSizeScale;
  fontWeight: FontWeightScale;
  lineHeight: LineHeightScale;
};

export const typography: TypographyTokens = {
  fontFamily,
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
  },
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 28,
    xl: 32,
    xxl: 40,
  },
};

/**
 * Resolves a semantic text style spec to a React Native `TextStyle` font
 * recipe, using the provided family map (loaded fonts) or system fallbacks.
 */
export function resolveTextStyle(
  spec: TextStyleSpec,
  families: FontFamily,
): Pick<TextStyle, 'fontFamily' | 'fontSize' | 'lineHeight' | 'fontWeight' | 'fontVariant'> {
  return {
    fontFamily: families[spec.family],
    fontSize: spec.size,
    lineHeight: spec.lineHeight,
    fontWeight: spec.weight ?? '400',
    fontVariant: spec.fontVariant as TextStyle['fontVariant'],
  };
}
