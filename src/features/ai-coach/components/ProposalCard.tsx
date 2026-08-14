/**
 * ProposalCard — inline confirm/cancel card for agent-prepared goal/habit
 * CRUD actions emitted as SSE `proposal` events during agentic coaching.
 *
 * On confirm, calls the existing feature mutation hook (which invalidates
 * React Query caches). On cancel, dismisses without mutation. The agent
 * never mutates directly — it only proposes; the user confirms.
 */
import { AlertCircle, Check, Loader2 } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Button, ThemedText } from '@/design-system';
import { useTheme } from '@/design-system/theme';
import { useCreateGoal, useDeleteGoal, useUpdateGoal } from '@/features/goals/hooks';
import { useCreateHabit, useDeleteHabit, useUpdateHabit } from '@/features/habits/hooks';

import type { CoachingProposal, ProposalAction } from '../streaming';

interface ProposalCardProps {
  proposal: CoachingProposal;
  onDismiss?: () => void;
}

const actionLabelKeys: Record<ProposalAction, string> = {
  create_goal: 'coach.proposalCreateGoal',
  update_goal: 'coach.proposalUpdateGoal',
  delete_goal: 'coach.proposalDeleteGoal',
  create_habit: 'coach.proposalCreateHabit',
  update_habit: 'coach.proposalUpdateHabit',
  delete_habit: 'coach.proposalDeleteHabit',
};

const actionIcons: Record<ProposalAction, string> = {
  create_goal: '+',
  update_goal: '~',
  delete_goal: '-',
  create_habit: '+',
  update_habit: '~',
  delete_habit: '-',
};

type CardStatus = 'pending' | 'applying' | 'applied' | 'error';

export function ProposalCard({ proposal, onDismiss }: ProposalCardProps): ReactNode {
  const { t } = useTranslation();
  const { colors, spacing, radius } = useTheme();
  const [status, setStatus] = useState<CardStatus>('pending');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();
  const createHabit = useCreateHabit();
  const updateHabit = useUpdateHabit();
  const deleteHabit = useDeleteHabit();

  const labelKey = actionLabelKeys[proposal.action] ?? 'coach.proposalCreateGoal';
  const label = t(labelKey);
  const icon = actionIcons[proposal.action] ?? '?';

  const handleConfirm = () => {
    setStatus('applying');
    setErrorMsg(null);
    const p = proposal.payload;

    let promise: Promise<unknown>;
    switch (proposal.action) {
      case 'create_goal':
        promise = createGoal.mutateAsync({
          title: String(p.title ?? ''),
          description: String(p.description ?? ''),
          category: String(p.category ?? ''),
          dueDate: p.dueDate ? String(p.dueDate) : undefined,
          relatedHabitIds: Array.isArray(p.relatedHabitIds)
            ? (p.relatedHabitIds as string[])
            : undefined,
        });
        break;
      case 'update_goal':
        promise = updateGoal.mutateAsync({
          id: String(p.goalId ?? ''),
          data: {
            title: p.title ? String(p.title) : undefined,
            description: p.description ? String(p.description) : undefined,
            category: p.category ? String(p.category) : undefined,
            dueDate: p.dueDate ? String(p.dueDate) : undefined,
            relatedHabitIds: Array.isArray(p.relatedHabitIds)
              ? (p.relatedHabitIds as string[])
              : undefined,
          },
        });
        break;
      case 'delete_goal':
        promise = deleteGoal.mutateAsync(String(p.goalId ?? ''));
        break;
      case 'create_habit':
        promise = createHabit.mutateAsync({
          name: String(p.name ?? ''),
          description: String(p.description ?? ''),
          category: String(p.category ?? ''),
        });
        break;
      case 'update_habit':
        promise = updateHabit.mutateAsync({
          id: String(p.habitId ?? ''),
          data: {
            name: p.name ? String(p.name) : undefined,
            description: p.description ? String(p.description) : undefined,
            category: p.category ? String(p.category) : undefined,
          },
        });
        break;
      case 'delete_habit':
        promise = deleteHabit.mutateAsync(String(p.habitId ?? ''));
        break;
      default:
        setStatus('error');
        setErrorMsg(t('coach.proposalUnknownAction', { action: proposal.action }));
        return;
    }

    promise
      .then(() => setStatus('applied'))
      .catch((err: unknown) => {
        setStatus('error');
        setErrorMsg(err instanceof Error ? err.message : t('coach.proposalFailed'));
      });
  };

  const handleCancel = () => {
    setStatus('pending');
    setErrorMsg(null);
    onDismiss?.();
  };

  if (status === 'applied') {
    return (
      <View
        style={[
          styles.applied,
          {
            borderColor: colors.accent,
            backgroundColor: colors.surface,
            borderRadius: radius.md,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            gap: spacing.xs,
          },
        ]}
      >
        <Check color={colors.accent} size={16} />
        <ThemedText variant="body" style={{ color: colors.accent }}>
          {t('coach.proposalApplied', { label })}
        </ThemedText>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.card,
        {
          borderColor: status === 'error' ? colors.destructive : colors.border,
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.md,
          gap: spacing.xs,
        },
      ]}
    >
      <View style={[styles.header, { gap: spacing.xs }]}>
        <View
          style={[
            styles.iconBadge,
            {
              backgroundColor: colors.accent + '22',
              borderRadius: radius.sm,
            },
          ]}
        >
          <ThemedText variant="caption" style={{ color: colors.accent, fontWeight: '700' }}>
            {icon}
          </ThemedText>
        </View>
        <ThemedText variant="body" style={{ fontWeight: '600' }}>
          {label}
        </ThemedText>
      </View>

      <ProposalSummary action={proposal.action} payload={proposal.payload} />

      {status === 'error' && errorMsg && (
        <View style={[styles.errorRow, { gap: spacing.xs }]}>
          <AlertCircle color={colors.destructive} size={14} />
          <ThemedText variant="caption" style={{ color: colors.destructive, flex: 1 }}>
            {errorMsg}
          </ThemedText>
        </View>
      )}

      {status !== 'applying' && (
        <View style={[styles.actions, { gap: spacing.sm }]}>
          <Button
            variant="primary"
            size="sm"
            onPress={handleConfirm}
            accessibilityLabel={t('coach.proposalConfirmLabel', { label })}
          >
            {t('coach.proposalConfirm')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onPress={handleCancel}
            accessibilityLabel={t('coach.proposalCancelLabel', { label })}
          >
            {t('coach.proposalCancel')}
          </Button>
        </View>
      )}

      {status === 'applying' && (
        <View style={[styles.applyingRow, { gap: spacing.xs }]}>
          <Loader2 color={colors.mutedForeground} size={14} />
          <ThemedText variant="caption" style={{ color: colors.mutedForeground }}>
            {t('coach.proposalApplying')}
          </ThemedText>
        </View>
      )}
    </View>
  );
}

/**
 * Renders a compact, human-readable summary of the proposal payload so the
 * user can see exactly what will change before confirming.
 */
function ProposalSummary({
  action,
  payload,
}: {
  action: ProposalAction;
  payload: Record<string, unknown>;
}): ReactNode {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const fields: { label: string; value: string }[] = [];

  const push = (labelKey: string, value: unknown) => {
    if (value !== undefined && value !== null && value !== '') {
      fields.push({ label: t(labelKey), value: String(value) });
    }
  };

  switch (action) {
    case 'create_goal':
    case 'update_goal':
      push('coach.proposalFieldTitle', payload.title);
      push('coach.proposalFieldCategory', payload.category);
      push('coach.proposalFieldDue', payload.dueDate);
      if (payload.description) push('coach.proposalFieldDescription', payload.description);
      break;
    case 'delete_goal':
      push('coach.proposalFieldGoalId', payload.goalId);
      break;
    case 'create_habit':
    case 'update_habit':
      push('coach.proposalFieldName', payload.name);
      push('coach.proposalFieldCategory', payload.category);
      if (payload.description) push('coach.proposalFieldDescription', payload.description);
      break;
    case 'delete_habit':
      push('coach.proposalFieldHabitId', payload.habitId);
      break;
  }

  if (fields.length === 0) return null;

  return (
    <View style={{ gap: 2 }}>
      {fields.map((f, i) => (
        <ThemedText key={i} variant="caption" style={{ color: colors.mutedForeground }}>
          {f.label}: {f.value}
        </ThemedText>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  applied: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBadge: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  applyingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
});
