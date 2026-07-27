/**
 * Card — a raised surface with border, radius, and optional padding.
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
          borderRadius: radius.lg,
          padding: padded ? spacing.md : 0,
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
