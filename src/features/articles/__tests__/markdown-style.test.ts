/**
 * Tests for the article reader markdown style map.
 *
 * Verifies that `buildMarkdownStyle` produces the Paper-approved style values
 * (`mobile.md` §8.7) for each markdown node type, and that the reader-size
 * multiplier scales sizes correctly.
 */
import { describe, expect, it } from '@jest/globals';
import type { TextStyle } from 'react-native';

import type { Theme } from '@/design-system/theme';
import {
  buildMarkdownStyle,
  READER_SIZE_MULTIPLIER,
  READER_SIZES,
  withoutDuplicateLeadingTitle,
} from '../markdown-style';

const mockTheme: Theme = {
  colors: {
    background: '#F6F4EF',
    foreground: '#1C1A17',
    surface: '#FFFFFF',
    surfaceForeground: '#1C1A17',
    surfaceElevated: '#FFFFFF',
    surfaceElevatedForeground: '#1C1A17',
    primary: '#1C1A17',
    primaryForeground: '#F6F4EF',
    secondary: '#EAE6DE',
    muted: '#EAE6DE',
    secondaryForeground: '#1C1A17',
    mutedForeground: '#6E6A63',
    accent: '#4F6B57',
    accentForeground: '#F6F4EF',
    success: '#4F6B57',
    successForeground: '#F6F4EF',
    successSoft: '#F1F4EF',
    border: 'rgba(28,26,23,0.10)',
    input: 'rgba(28,26,23,0.14)',
    ring: '#4F6B57',
    destructive: '#B4553F',
    destructiveForeground: '#F6F4EF',
    overlay: 'rgba(28,26,23,0.40)',
  },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 } as never,
  radius: { sm: 8, md: 12, lg: 16, xl: 20, pill: 999, field: 10, card: 12 } as never,
  duration: { fast: 150, normal: 220, slow: 1600 } as never,
  fonts: {
    display: 'Newsreader_400Regular',
    displayMedium: 'Newsreader_500Medium',
    body: 'InstrumentSans_400Regular',
    bodyMedium: 'InstrumentSans_500Medium',
    bodySemibold: 'InstrumentSans_600SemiBold',
    mono: 'IBMPlexMono_400Regular',
    monoMedium: 'IBMPlexMono_500Medium',
  },
  typography: {} as never,
  textStyles: {} as never,
};

describe('buildMarkdownStyle', () => {
  it('produces body style with Instrument Sans 17/29 at medium', () => {
    const style = buildMarkdownStyle(mockTheme, 'medium');
    expect(style.body).toMatchObject({
      fontFamily: 'InstrumentSans_400Regular',
      fontSize: 17,
      lineHeight: 29,
    });
  });

  it('produces h1 with Newsreader 32/38 at medium', () => {
    const style = buildMarkdownStyle(mockTheme, 'medium');
    expect(style.heading1).toMatchObject({
      fontFamily: 'Newsreader_400Regular',
      fontSize: 32,
      lineHeight: 38,
    });
  });

  it('produces h2 with Newsreader 24/30 and top margin', () => {
    const style = buildMarkdownStyle(mockTheme, 'medium');
    expect(style.heading2).toMatchObject({
      fontFamily: 'Newsreader_400Regular',
      fontSize: 24,
      lineHeight: 30,
      marginTop: 28,
    });
  });

  it('produces h3 with Instrument Sans semibold 19/25', () => {
    const style = buildMarkdownStyle(mockTheme, 'medium');
    expect(style.heading3).toMatchObject({
      fontFamily: 'InstrumentSans_600SemiBold',
      fontSize: 19,
      lineHeight: 25,
    });
  });

  it('produces blockquote with accent text and accent left rule, no background', () => {
    const style = buildMarkdownStyle(mockTheme, 'medium');
    expect(style.blockquote).toMatchObject({
      fontFamily: 'Newsreader_400Regular',
      fontStyle: 'italic',
      color: '#4F6B57',
      borderLeftWidth: 2,
      borderLeftColor: '#4F6B57',
      backgroundColor: 'transparent',
    });
  });

  it('produces links with accent and underline', () => {
    const style = buildMarkdownStyle(mockTheme, 'medium');
    expect(style.link).toMatchObject({
      color: '#4F6B57',
      textDecorationLine: 'underline',
    });
  });

  it('produces code with IBM Plex Mono 14/22 on muted background', () => {
    const style = buildMarkdownStyle(mockTheme, 'medium');
    expect(style.code_inline).toMatchObject({
      fontFamily: 'IBMPlexMono_400Regular',
      fontSize: 14,
      lineHeight: 22,
      backgroundColor: '#EAE6DE',
    });
  });

  it('produces fence with radius 10', () => {
    const style = buildMarkdownStyle(mockTheme, 'medium');
    expect(style.fence).toMatchObject({
      fontFamily: 'IBMPlexMono_400Regular',
      borderRadius: 10,
    });
  });

  it('produces image with full width and radius 8', () => {
    const style = buildMarkdownStyle(mockTheme, 'medium');
    expect(style.image).toMatchObject({
      width: '100%',
      borderRadius: 8,
    });
  });

  it('produces hr with hairline height and 28-unit vertical clearance', () => {
    const style = buildMarkdownStyle(mockTheme, 'medium');
    expect(style.hr).toMatchObject({
      marginTop: 28,
      marginBottom: 28,
    });
  });

  it('scales sizes by the reader-size multiplier', () => {
    const small = buildMarkdownStyle(mockTheme, 'small');
    const medium = buildMarkdownStyle(mockTheme, 'medium');
    const large = buildMarkdownStyle(mockTheme, 'large');
    const m = READER_SIZE_MULTIPLIER.medium;
    const smallBody = small.body as TextStyle;
    const mediumBody = medium.body as TextStyle;
    const largeBody = large.body as TextStyle;
    expect(smallBody.fontSize).toBe(Math.round(17 * READER_SIZE_MULTIPLIER.small));
    expect(mediumBody.fontSize).toBe(Math.round(17 * m));
    expect(largeBody.fontSize).toBe(Math.round(17 * READER_SIZE_MULTIPLIER.large));
    expect(largeBody.fontSize).toBeGreaterThan(mediumBody.fontSize!);
    expect(smallBody.fontSize).toBeLessThan(mediumBody.fontSize!);
  });

  it('READER_SIZES contains small, medium, large', () => {
    expect(READER_SIZES).toEqual(['small', 'medium', 'large']);
  });

  it('removes a duplicate leading markdown title', () => {
    expect(withoutDuplicateLeadingTitle('# The Title\n\nBody copy.', 'The Title')).toBe(
      'Body copy.',
    );
  });

  it('keeps content when the leading heading differs', () => {
    const content = '# Introduction\n\nBody copy.';
    expect(withoutDuplicateLeadingTitle(content, 'The Title')).toBe(content);
  });
});
