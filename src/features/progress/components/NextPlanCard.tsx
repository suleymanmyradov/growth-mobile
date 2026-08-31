/**
 * NextPlanCard — next-week plan from the weekly review.
 *
 * Ported from the web frontend's `NextPlanCard`: shows the focus, commitments,
 * risks, and recovery actions lists.
 */
import { AlertCircle, CheckCircle2, Heart } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import type { WeeklyReviewNextWeekPlan } from '@/core/api/schemas';
import { Card, SectionLabel, ThemedText } from '@/design-system';
import { useTheme } from '@/design-system/theme';

export interface NextPlanCardProps {
  plan: WeeklyReviewNextWeekPlan;
}

export function NextPlanCard({ plan }: NextPlanCardProps): ReactNode {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();

  const hasCommitments = plan.commitments.length > 0;
  const hasRisks = plan.risks.length > 0;
  const hasRecovery = plan.recoveryActions.length > 0;

  if (!plan.focus && !hasCommitments && !hasRisks && !hasRecovery) return null;

  return (
    <View style={{ gap: spacing.sm }}>
      <SectionLabel>{t('progress.nextWeekPlan')}</SectionLabel>
      <Card>
        <View style={{ gap: spacing.md }}>
          {plan.focus ? (
            <ThemedText variant="body" style={{ color: colors.foreground }}>
              {plan.focus}
            </ThemedText>
          ) : null}

          {hasCommitments ? (
            <View style={{ gap: spacing.xs }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 color={colors.accent} size={14} />
                <ThemedText variant="label">{t('progress.commitments')}</ThemedText>
              </View>
              {plan.commitments.map((c, i) => (
                <ThemedText key={i} variant="caption" style={{ color: colors.mutedForeground }}>
                  • {c}
                </ThemedText>
              ))}
            </View>
          ) : null}

          {hasRisks ? (
            <View style={{ gap: spacing.xs }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <AlertCircle color={colors.destructive} size={14} />
                <ThemedText variant="label">{t('progress.risks')}</ThemedText>
              </View>
              {plan.risks.map((r, i) => (
                <ThemedText key={i} variant="caption" style={{ color: colors.mutedForeground }}>
                  • {r}
                </ThemedText>
              ))}
            </View>
          ) : null}

          {hasRecovery ? (
            <View style={{ gap: spacing.xs }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Heart color={colors.accent} size={14} />
                <ThemedText variant="label">{t('progress.recoveryActions')}</ThemedText>
              </View>
              {plan.recoveryActions.map((r, i) => (
                <ThemedText key={i} variant="caption" style={{ color: colors.mutedForeground }}>
                  • {r}
                </ThemedText>
              ))}
            </View>
          ) : null}
        </View>
      </Card>
    </View>
  );
}
