/**
 * CoachInsightCard — the coach insight card on the Today screen.
 *
 * Paper (`mobile.md` §8.1): coach insight card with primary and secondary
 * actions when data exists. The real coaching insight data is produced by the
 * AI coach personalization endpoints and is wired in Phase H alongside the
 * Coach tab. Until then this card renders a gentle, contract-safe placeholder
 * that links into the Coach tab — it never fabricates a coach read from
 * unrelated fields (per `mobile.md` §8.3).
 *
 * Domain boundary: presentation component owned by `features/home`. It does
 * not import `features/ai-coach` internals; Phase H will pass real insight
 * data + actions in as props.
 */
import { MessageCircle, Sparkles } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Card, ThemedText } from '@/design-system';
import { useTheme } from '@/design-system/theme';

export type CoachInsightCardProps = {
  /** Insight headline. When absent, a placeholder is shown. */
  headline?: string;
  /** Insight body. When absent, a placeholder is shown. */
  body?: string;
  /** Primary action label. */
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  /** Secondary action label. */
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
};

export function CoachInsightCard({
  headline,
  body,
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
}: CoachInsightCardProps): ReactNode {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();

  const hasData = !!(headline || body);

  return (
    <Card>
      <View style={{ gap: spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          {hasData ? (
            <Sparkles color={colors.accent} size={18} />
          ) : (
            <MessageCircle color={colors.mutedForeground} size={18} />
          )}
          <ThemedText variant="label" style={{ color: colors.mutedForeground }}>
            {t('today.coachInsight')}
          </ThemedText>
        </View>

        {hasData ? (
          <View style={{ gap: spacing.xs }}>
            {headline ? <ThemedText variant="cardTitle">{headline}</ThemedText> : null}
            {body ? (
              <ThemedText variant="body" style={{ color: colors.mutedForeground }}>
                {body}
              </ThemedText>
            ) : null}
          </View>
        ) : (
          <View style={{ gap: spacing.xs }}>
            <ThemedText variant="cardTitle">{t('today.coachPlaceholderTitle')}</ThemedText>
            <ThemedText variant="body" style={{ color: colors.mutedForeground }}>
              {t('today.coachPlaceholderBody')}
            </ThemedText>
          </View>
        )}

        {(primaryActionLabel || secondaryActionLabel) && (onPrimaryAction || onSecondaryAction) ? (
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs }}>
            {primaryActionLabel && onPrimaryAction ? (
              <Pressable
                onPress={onPrimaryAction}
                accessibilityRole="button"
                accessibilityLabel={primaryActionLabel}
                hitSlop={8}
                style={{
                  paddingVertical: spacing.sm,
                  paddingHorizontal: spacing.md,
                  borderRadius: 999,
                  backgroundColor: colors.accent,
                  minHeight: 44,
                  justifyContent: 'center',
                }}
              >
                <ThemedText style={{ color: colors.accentForeground, fontWeight: '600' }}>
                  {primaryActionLabel}
                </ThemedText>
              </Pressable>
            ) : null}
            {secondaryActionLabel && onSecondaryAction ? (
              <Pressable
                onPress={onSecondaryAction}
                accessibilityRole="button"
                accessibilityLabel={secondaryActionLabel}
                hitSlop={8}
                style={{
                  paddingVertical: spacing.sm,
                  paddingHorizontal: spacing.md,
                  minHeight: 44,
                  justifyContent: 'center',
                }}
              >
                <ThemedText style={{ color: colors.accent, fontWeight: '600' }}>
                  {secondaryActionLabel}
                </ThemedText>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
    </Card>
  );
}
