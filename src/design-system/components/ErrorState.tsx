/**
 * ErrorState — centered error icon, message, and retry action.
 */
import type { ReactNode } from 'react';
import { AlertCircle } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '../theme/theme';
import { Button } from './Button';
import { ThemedText } from './ThemedText';

export type ErrorStateProps = {
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  icon?: ReactNode;
};

export function ErrorState({ message, onRetry, retryLabel, icon }: ErrorStateProps): ReactNode {
  const { colors, spacing } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={[styles.container, { gap: spacing.md }]}>
      <View>{icon ?? <AlertCircle color={colors.error} size={48} />}</View>
      <ThemedText variant="heading" style={{ textAlign: 'center', color: colors.error }}>
        {t('common.errorGeneric')}
      </ThemedText>
      {message ? (
        <ThemedText variant="body" style={{ color: colors.secondaryText, textAlign: 'center' }}>
          {message}
        </ThemedText>
      ) : null}
      {onRetry ? (
        <Button variant="outline" onPress={onRetry}>
          {retryLabel ?? t('common.retry')}
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
});
