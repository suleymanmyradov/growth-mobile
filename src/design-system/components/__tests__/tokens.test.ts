/**
 * Paper token tests — verifies the color/spacing/radius/motion/typography
 * token objects match the approved Paper values from `mobile.md` §5/§1l.
 */
import { darkColors, lightColors } from '../../tokens/colors';
import { duration, hitSlop } from '../../tokens/motion';
import { radius } from '../../tokens/radius';
import { spacing } from '../../tokens/spacing';
import { fontFamily, textStyles } from '../../tokens/typography';

describe('Paper color tokens', () => {
  test('light theme uses warm paper ground and sage accent', () => {
    expect(lightColors.background).toBe('#F6F4EF');
    expect(lightColors.foreground).toBe('#1C1A17');
    expect(lightColors.surface).toBe('#FFFFFF');
    expect(lightColors.accent).toBe('#4F6B57');
    expect(lightColors.destructive).toBe('#B4553F');
    expect(lightColors.successSoft).toBe('#F1F4EF');
  });

  test('dark theme is warm, not black', () => {
    expect(darkColors.background).toBe('#161514');
    expect(darkColors.surface).toBe('#201E1B');
    expect(darkColors.foreground).toBe('#F0EDE6');
    expect(darkColors.accent).toBe('#7FA189');
    expect(darkColors.destructive).toBe('#C9705A');
  });

  test('compatibility aliases mirror their canonical tokens', () => {
    expect(lightColors.error).toBe(lightColors.destructive);
    expect(lightColors.secondaryText).toBe(lightColors.mutedForeground);
    expect(lightColors.primaryText).toBe(lightColors.foreground);
    expect(darkColors.error).toBe(darkColors.destructive);
    expect(darkColors.secondaryText).toBe(darkColors.mutedForeground);
    expect(darkColors.primaryText).toBe(darkColors.foreground);
  });

  test('success shares the sage accent token', () => {
    expect(lightColors.success).toBe(lightColors.accent);
    expect(lightColors.successForeground).toBe(lightColors.accentForeground);
    expect(darkColors.success).toBe(darkColors.accent);
  });
});

describe('Paper spacing, radius, and motion tokens', () => {
  test('spacing scale matches the Paper handoff', () => {
    expect(spacing).toEqual({ xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, xxxl: 40 });
  });

  test('radius canonical scale matches the Paper handoff', () => {
    expect(radius.field).toBe(8);
    expect(radius.card).toBe(12);
    expect(radius.sheet).toBe(20);
    expect(radius.pill).toBe(999);
  });

  test('radius t-shirt aliases map to the closest canonical value', () => {
    expect(radius.md).toBe(radius.field);
    expect(radius.lg).toBe(radius.card);
    expect(radius.full).toBe(radius.pill);
  });

  test('motion durations match the Paper handoff', () => {
    expect(duration).toEqual({ instant: 80, quick: 140, base: 220, overlay: 260, slow: 1600 });
  });

  test('minimum touch target is 44', () => {
    expect(hitSlop.minTarget).toBe(44);
  });
});

describe('Paper typography tokens', () => {
  test('font family names match the loaded expo-font assets', () => {
    expect(fontFamily.display).toBe('Newsreader_400Regular');
    expect(fontFamily.displayMedium).toBe('Newsreader_500Medium');
    expect(fontFamily.body).toBe('InstrumentSans_400Regular');
    expect(fontFamily.bodyMedium).toBe('InstrumentSans_500Medium');
    expect(fontFamily.bodySemibold).toBe('InstrumentSans_600SemiBold');
    expect(fontFamily.mono).toBe('IBMPlexMono_400Regular');
    expect(fontFamily.monoMedium).toBe('IBMPlexMono_500Medium');
  });

  test('semantic text styles match the Paper type scale', () => {
    expect(textStyles.screenTitle).toEqual({ family: 'display', size: 34, lineHeight: 39 });
    expect(textStyles.sectionTitle).toEqual({ family: 'display', size: 22, lineHeight: 29 });
    expect(textStyles.cardTitle).toEqual({ family: 'display', size: 18, lineHeight: 24 });
    expect(textStyles.rowTitle).toEqual({ family: 'display', size: 17, lineHeight: 22 });
    expect(textStyles.body).toEqual({ family: 'body', size: 16, lineHeight: 24 });
    expect(textStyles.numeric).toEqual({
      family: 'monoMedium',
      size: 15,
      lineHeight: 20,
      weight: '500',
      fontVariant: ['tabular-nums'],
    });
  });

  test('12 is the floor and reserved for the smallest meta', () => {
    const sizes = Object.values(textStyles).map((s) => s.size);
    expect(Math.min(...sizes)).toBe(12);
    expect(textStyles.caption.size).toBe(12);
  });
});
