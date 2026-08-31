/**
 * StreamingCoachCard — shows the streaming AI summary during generation.
 *
 * Ported from the web frontend's `StreamingCoachCard`: displays the partial
 * AI summary text as it streams in, with a typing indicator.
 */
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Card, SectionLabel, ThemedText } from '@/design-system';
import { useTheme } from '@/design-system/theme';

export interface StreamingCoachCardProps {
  partialText: string;
  isStreaming: boolean;
}

export function StreamingCoachCard({
  partialText,
  isStreaming,
}: StreamingCoachCardProps): ReactNode {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();

  if (!partialText && !isStreaming) return null;

  return (
    <View style={{ gap: spacing.sm }}>
      <SectionLabel>{t('progress.coachInterpretation')}</SectionLabel>
      <Card>
        <ThemedText variant="body" style={{ color: colors.foreground }}>
          {partialText || t('coach.thinking')}
          {isStreaming ? '▋' : ''}
        </ThemedText>
      </Card>
    </View>
  );
}
