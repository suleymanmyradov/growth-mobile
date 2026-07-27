/**
 * View component that uses the theme's background color by default.
 */
import type { ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';

import { useTheme } from '../theme/theme';

export type ThemedViewProps = ViewProps & {
  children?: ReactNode;
};

/**
 * Theme-aware view. Defaults to the theme's `background` color. Pass a `style`
 * override to customize further.
 */
export function ThemedView({ style, children, ...rest }: ThemedViewProps): ReactNode {
  const theme = useTheme();

  return (
    <View style={[{ backgroundColor: theme.colors.background }, style]} {...rest}>
      {children}
    </View>
  );
}
