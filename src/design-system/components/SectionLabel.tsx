/**
 * SectionLabel — a small uppercase meta label that introduces a screen section.
 *
 * Paper (`mobile.md` §1a): mono, letter-spaced, muted-foreground. Used above
 * grouped content like "Check in" or "This week".
 */
import type { ReactNode } from 'react';
import { Text, type TextProps } from 'react-native';

import { useTheme } from '../theme/theme';

export type SectionLabelProps = TextProps & {
  children: ReactNode;
};

export function SectionLabel({ children, style, ...rest }: SectionLabelProps): ReactNode {
  const { colors, fonts } = useTheme();
  return (
    <Text
      accessibilityRole="header"
      style={[
        {
          fontFamily: fonts.monoMedium,
          fontSize: 13,
          lineHeight: 18,
          fontWeight: '500',
          letterSpacing: 0.9,
          textTransform: 'uppercase',
          color: colors.mutedForeground,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}
