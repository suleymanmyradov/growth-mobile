/**
 * Markdown style map for the article reader.
 *
 * Paper (`mobile.md` §8.7): translates the approved markdown visual system
 * into `react-native-markdown-display` style keys. This is a pure function of
 * the theme + reader-size multiplier so it can be unit-tested without a
 * render tree.
 *
 * Style map (base sizes at multiplier 1):
 * - Body: Instrument Sans 17/29, 20-unit gutters, 14-unit paragraph gap.
 * - h1: Newsreader 32/38.
 * - h2: Newsreader 24/30 with 28 top space.
 * - h3: Instrument Sans semibold 19/25.
 * - Blockquote: Newsreader italic 18, accent text, two-unit accent left rule,
 *   no tinted background.
 * - Links: accent with an underline.
 * - Code: IBM Plex Mono 14/22 on muted background, radius 10.
 * - Lists: body reader style, muted marker, 8-unit item gap.
 * - Images: full content width, radius 8, centered 13-unit muted caption.
 * - Divider: semantic hairline with 28-unit vertical clearance.
 */
import type { Theme } from '@/design-system/theme';
import { StyleSheet, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';

export type ReaderSize = 'small' | 'medium' | 'large';

export const READER_SIZES: readonly ReaderSize[] = ['small', 'medium', 'large'];

export const READER_SIZE_MULTIPLIER: Record<ReaderSize, number> = {
  small: 0.9,
  medium: 1,
  large: 1.15,
};

/**
 * Builds the `react-native-markdown-display` style object for the article
 * reader, given the current theme and reader-size multiplier.
 */
export function buildMarkdownStyle(
  theme: Theme,
  size: ReaderSize,
): Record<string, TextStyle | ViewStyle | ImageStyle> {
  const { colors, fonts, radius } = theme;
  const m = READER_SIZE_MULTIPLIER[size];
  const bodySize = Math.round(17 * m);
  const bodyLine = Math.round(29 * m);

  return {
    body: {
      color: colors.foreground,
      fontFamily: fonts.body,
      fontSize: bodySize,
      lineHeight: bodyLine,
      paddingHorizontal: 20,
      paddingBottom: 14,
    },
    paragraph: {
      marginTop: 0,
      marginBottom: 14,
      lineHeight: bodyLine,
    },
    heading1: {
      fontFamily: fonts.display,
      fontSize: Math.round(32 * m),
      lineHeight: Math.round(38 * m),
      color: colors.foreground,
      marginTop: 28,
      marginBottom: 10,
    },
    heading2: {
      fontFamily: fonts.display,
      fontSize: Math.round(24 * m),
      lineHeight: Math.round(30 * m),
      color: colors.foreground,
      marginTop: 28,
      marginBottom: 8,
    },
    heading3: {
      fontFamily: fonts.bodySemibold,
      fontSize: Math.round(19 * m),
      lineHeight: Math.round(25 * m),
      color: colors.foreground,
      marginTop: 20,
      marginBottom: 6,
    },
    heading4: {
      fontFamily: fonts.bodySemibold,
      fontSize: Math.round(17 * m),
      lineHeight: Math.round(23 * m),
      color: colors.foreground,
      marginTop: 16,
      marginBottom: 4,
    },
    heading5: {
      fontFamily: fonts.bodySemibold,
      fontSize: Math.round(15 * m),
      lineHeight: Math.round(21 * m),
      color: colors.foreground,
    },
    heading6: {
      fontFamily: fonts.bodySemibold,
      fontSize: Math.round(13 * m),
      lineHeight: Math.round(18 * m),
      color: colors.mutedForeground,
    },
    blockquote: {
      fontFamily: fonts.display,
      fontStyle: 'italic',
      fontSize: Math.round(18 * m),
      lineHeight: Math.round(26 * m),
      color: colors.accent,
      borderLeftWidth: 2,
      borderLeftColor: colors.accent,
      marginLeft: 0,
      paddingLeft: 16,
      backgroundColor: 'transparent',
      marginTop: 14,
      marginBottom: 14,
    },
    link: {
      color: colors.accent,
      textDecorationLine: 'underline',
    },
    blocklink: {
      color: colors.accent,
      textDecorationLine: 'underline',
    },
    code_inline: {
      fontFamily: fonts.mono,
      fontSize: Math.round(14 * m),
      lineHeight: Math.round(22 * m),
      color: colors.foreground,
      backgroundColor: colors.muted,
      paddingHorizontal: 6,
      borderRadius: radius.sm,
    },
    fence: {
      fontFamily: fonts.mono,
      fontSize: Math.round(14 * m),
      lineHeight: Math.round(22 * m),
      color: colors.foreground,
      backgroundColor: colors.muted,
      borderRadius: 10,
      padding: 12,
      marginTop: 14,
      marginBottom: 14,
    },
    list_item: {
      marginBottom: 8,
      lineHeight: bodyLine,
    },
    list_item_icon: {
      color: colors.mutedForeground,
    },
    image: {
      width: '100%',
      borderRadius: 8,
      marginTop: 14,
      marginBottom: 6,
    },
    hr: {
      backgroundColor: colors.border,
      height: StyleSheet.hairlineWidth,
      marginTop: 28,
      marginBottom: 28,
    },
    strong: {
      fontWeight: '600' as const,
    },
    em: {
      fontStyle: 'italic' as const,
    },
  };
}

/** Removes a leading markdown title when the reader already renders the title header. */
export function withoutDuplicateLeadingTitle(content: string, title: string): string {
  const match = /^\s{0,3}#{1,6}\s+(.+?)(?:\s+#+)?\s*(?:\r?\n|$)/.exec(content);
  if (!match || match[1]?.trim() !== title.trim()) return content;

  return content.slice(match[0].length).replace(/^\s+/, '');
}
