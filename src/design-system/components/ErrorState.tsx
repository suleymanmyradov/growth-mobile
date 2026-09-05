/**
 * ErrorState — centered error icon, message, and retry action.
 *
 * `tone="destructive"` (default) renders the error styling. `tone="neutral"`
 * renders the same layout in muted colors for expected, non-error empty
 * states (e.g. offerings not configured) that still warrant a retry action.
 */
import { AlertCircle } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../theme/theme';
import { Button } from './Button';
import { ThemedText } from './ThemedText';

export type ErrorStateProps = {
  /** Heading; defaults to the generic error title. */
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  icon?: ReactNode;
  /** `destructive` (default) for failures; `neutral` for expected unavailable states. */
  tone?: 'destructive' | 'neutral';
};

export function ErrorState({
  title,
  message,
  onRetry,
  retryLabel,
  icon,
  tone = 'destructive',
}: ErrorStateProps): ReactNode {
  const { colors, spacing } = useTheme();
  const { t } = useTranslation();
  const toneColor = tone === 'neutral' ? colors.mutedForeground : colors.destructive;

  return (
    <View style={[styles.container, { gap: spacing.md }]}>
      <View>{icon ?? <AlertCircle color={toneColor} size={48} />}</View>
      <ThemedText variant="sectionTitle" style={{ textAlign: 'center', color: toneColor }}>
        {title ?? t('common.errorGeneric')}
      </ThemedText>
      {message ? (
        <ThemedText variant="body" style={{ color: colors.mutedForeground, textAlign: 'center' }}>
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
