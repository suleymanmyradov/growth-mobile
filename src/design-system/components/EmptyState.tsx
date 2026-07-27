/**
 * EmptyState — centered illustration/icon, title, and optional subtitle/action.
 */
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../theme/theme';
import { ThemedText } from './ThemedText';

export type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

export function EmptyState({ icon, title, subtitle, action }: EmptyStateProps): ReactNode {
  const { colors, spacing } = useTheme();

  return (
    <View style={[styles.container, { gap: spacing.md }]}>
      {icon ? <View>{icon}</View> : null}
      <ThemedText variant="heading" style={{ textAlign: 'center' }}>
        {title}
      </ThemedText>
      {subtitle ? (
        <ThemedText variant="body" style={{ color: colors.secondaryText, textAlign: 'center' }}>
          {subtitle}
        </ThemedText>
      ) : null}
      {action ? <View style={{ marginTop: spacing.sm }}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
});
