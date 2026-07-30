/**
 * Card — an in-flow surface with a hairline border.
 *
 * Paper rule (`mobile.md` §4/§7): in-flow cards use a one-unit semantic border,
 * radius 12 (`radius.card`), and NO shadow/elevation. Only sheets and the Plan
 * floating action button are raised surfaces.
 */
import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { useTheme } from '../theme/theme';

export type CardProps = ViewProps & {
  children?: ReactNode;
  padded?: boolean;
};

export function Card({ padded = true, style, children, ...rest }: CardProps): ReactNode {
  const { colors, spacing, radius } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: radius.card,
          padding: padded ? spacing.lg : 0,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {},
});
