/**
 * Goal card — displays a goal with progress, toggle, and actions.
 *
 * Supports measurement-aware display:
 * - numeric: shows current/target with unit + a "log value" button
 * - milestone: shows milestone steps with toggle + delete
 * - binary/habit/manual: shows the standard progress bar + toggle
 */
import { CheckCircle, Circle, Pencil, Plus, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import type { Goal, GoalMilestone } from '@/core/api/schemas';
import { Badge, Button, Card, Input, ThemedText } from '@/design-system';
import { useTheme } from '@/design-system/theme';

export function GoalCard({
  goal,
  onToggle,
  onEdit,
  onDelete,
  onToggleMilestone,
  onDeleteMilestone,
  onAddMilestone,
  onLogValue,
}: {
  goal: Goal;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleMilestone?: (milestoneId: string) => void;
  onDeleteMilestone?: (milestoneId: string) => void;
  onAddMilestone?: (title: string) => void;
  onLogValue?: (value: number) => void;
}) {
  const { t } = useTranslation();
  const { colors, spacing, radius } = useTheme();
  const [showLogValue, setShowLogValue] = useState(false);
  const [logValueInput, setLogValueInput] = useState('');
  const [newMilestoneInput, setNewMilestoneInput] = useState('');
  const [showAddMilestone, setShowAddMilestone] = useState(false);

  const measurement = goal.measurement ?? 'manual';
  const milestones = goal.milestones ?? [];

  const handleLogValueSubmit = () => {
    const value = Number(logValueInput);
    if (Number.isNaN(value)) return;
    onLogValue?.(value);
    setLogValueInput('');
    setShowLogValue(false);
  };

  const handleAddMilestoneSubmit = () => {
    const title = newMilestoneInput.trim();
    if (!title) return;
    onAddMilestone?.(title);
    setNewMilestoneInput('');
    setShowAddMilestone(false);
  };

  const handleDeleteMilestone = (milestone: GoalMilestone) => {
    Alert.alert(t('common.delete'), t('goals.deleteMilestoneConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => onDeleteMilestone?.(milestone.id),
      },
    ]);
  };

  return (
    <Card>
      <View style={{ gap: spacing.sm }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <View style={{ flex: 1 }}>
            <ThemedText variant="cardTitle">{goal.title}</ThemedText>
            {goal.description ? (
              <ThemedText variant="caption" style={{ color: colors.mutedForeground, marginTop: 2 }}>
                {goal.description}
              </ThemedText>
            ) : null}
          </View>
          {goal.category ? <Badge>{goal.category}</Badge> : null}
        </View>

        {/* Measurement-aware display */}
        {measurement === 'numeric' && goal.targetValue !== undefined ? (
          <View style={{ gap: spacing.xs }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <ThemedText variant="caption" style={{ color: colors.mutedForeground }}>
                {t('goals.currentValue')}: {goal.currentValue ?? goal.startValue ?? 0}
                {goal.unit ? ` ${goal.unit}` : ''}
              </ThemedText>
              <ThemedText variant="caption" style={{ color: colors.mutedForeground }}>
                {t('goals.targetValue')}: {goal.targetValue}
                {goal.unit ? ` ${goal.unit}` : ''}
              </ThemedText>
            </View>
            {/* Progress bar */}
            <View>
              <View
                style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}
              >
                <ThemedText variant="caption" style={{ color: colors.mutedForeground }}>
                  {t('goals.progress')}
                </ThemedText>
                <ThemedText variant="caption" style={{ color: colors.primary, fontWeight: '600' }}>
                  {t('goals.progressPercent', { percent: Math.round(goal.progress) })}
                </ThemedText>
              </View>
              <View
                style={[
                  styles.progressTrack,
                  { backgroundColor: colors.border, borderRadius: radius.full },
                ]}
              >
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(100, Math.max(0, goal.progress))}%`,
                      backgroundColor: goal.completed ? colors.success : colors.primary,
                      borderRadius: radius.full,
                    },
                  ]}
                />
              </View>
            </View>
            {/* Log value */}
            {showLogValue ? (
              <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-end' }}>
                <Input
                  label={t('goals.logValueLabel')}
                  placeholder="0"
                  value={logValueInput}
                  onChangeText={setLogValueInput}
                  keyboardType="numeric"
                  accessibilityLabel={t('goals.logValueLabel')}
                  containerStyle={{ flex: 1 }}
                />
                <Button onPress={handleLogValueSubmit} size="sm">
                  {t('common.save')}
                </Button>
              </View>
            ) : (
              <Pressable
                onPress={() => setShowLogValue(true)}
                accessibilityRole="button"
                accessibilityLabel={t('goals.logValue')}
                style={[
                  styles.outlineButton,
                  { borderColor: colors.accent, borderRadius: radius.field },
                ]}
              >
                <ThemedText variant="label" style={{ color: colors.accent }}>
                  {t('goals.logValue')}
                </ThemedText>
              </Pressable>
            )}
          </View>
        ) : measurement === 'milestone' ? (
          <View style={{ gap: spacing.xs }}>
            {/* Progress bar */}
            <View>
              <View
                style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}
              >
                <ThemedText variant="caption" style={{ color: colors.mutedForeground }}>
                  {t('goals.progress')}
                </ThemedText>
                <ThemedText variant="caption" style={{ color: colors.primary, fontWeight: '600' }}>
                  {t('goals.progressPercent', { percent: Math.round(goal.progress) })}
                </ThemedText>
              </View>
              <View
                style={[
                  styles.progressTrack,
                  { backgroundColor: colors.border, borderRadius: radius.full },
                ]}
              >
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(100, Math.max(0, goal.progress))}%`,
                      backgroundColor: goal.completed ? colors.success : colors.primary,
                      borderRadius: radius.full,
                    },
                  ]}
                />
              </View>
            </View>
            {/* Milestone list */}
            {milestones.map((milestone) => (
              <View
                key={milestone.id}
                style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
              >
                <Pressable
                  onPress={() => onToggleMilestone?.(milestone.id)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: !!milestone.doneAt }}
                  accessibilityLabel={milestone.title}
                  hitSlop={8}
                  style={{ padding: 4, minHeight: 44, justifyContent: 'center' }}
                >
                  {milestone.doneAt ? (
                    <CheckCircle color={colors.success} size={22} />
                  ) : (
                    <Circle color={colors.mutedForeground} size={22} />
                  )}
                </Pressable>
                <ThemedText
                  variant="body"
                  style={{
                    flex: 1,
                    textDecorationLine: milestone.doneAt ? 'line-through' : 'none',
                    color: milestone.doneAt ? colors.mutedForeground : colors.foreground,
                  }}
                >
                  {milestone.title}
                </ThemedText>
                <Pressable
                  onPress={() => handleDeleteMilestone(milestone)}
                  accessibilityRole="button"
                  accessibilityLabel={t('common.delete')}
                  hitSlop={8}
                  style={{ padding: 8, minHeight: 44, justifyContent: 'center' }}
                >
                  <Trash2 color={colors.destructive} size={16} />
                </Pressable>
              </View>
            ))}
            {/* Add milestone */}
            {showAddMilestone ? (
              <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-end' }}>
                <Input
                  label={t('goals.milestoneTitle')}
                  placeholder={t('goals.milestoneTitlePlaceholder')}
                  value={newMilestoneInput}
                  onChangeText={setNewMilestoneInput}
                  accessibilityLabel={t('goals.milestoneTitle')}
                  containerStyle={{ flex: 1 }}
                />
                <Button onPress={handleAddMilestoneSubmit} size="sm">
                  {t('common.save')}
                </Button>
              </View>
            ) : (
              <Pressable
                onPress={() => setShowAddMilestone(true)}
                accessibilityRole="button"
                accessibilityLabel={t('goals.addMilestone')}
                hitSlop={8}
                style={[
                  styles.outlineButton,
                  {
                    borderColor: colors.accent,
                    borderRadius: radius.field,
                    flexDirection: 'row',
                    gap: 6,
                    alignItems: 'center',
                    justifyContent: 'center',
                  },
                ]}
              >
                <Plus color={colors.accent} size={16} />
                <ThemedText variant="label" style={{ color: colors.accent }}>
                  {t('goals.addMilestone')}
                </ThemedText>
              </Pressable>
            )}
          </View>
        ) : (
          /* Default: progress bar */
          <View>
            <View
              style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}
            >
              <ThemedText variant="caption" style={{ color: colors.mutedForeground }}>
                {t('goals.progress')}
              </ThemedText>
              <ThemedText variant="caption" style={{ color: colors.primary, fontWeight: '600' }}>
                {t('goals.progressPercent', { percent: Math.round(goal.progress) })}
              </ThemedText>
            </View>
            <View
              style={[
                styles.progressTrack,
                { backgroundColor: colors.border, borderRadius: radius.full },
              ]}
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(100, Math.max(0, goal.progress))}%`,
                    backgroundColor: goal.completed ? colors.success : colors.primary,
                    borderRadius: radius.full,
                  },
                ]}
              />
            </View>
          </View>
        )}

        {goal.dueDate ? (
          <ThemedText variant="caption" style={{ color: colors.mutedForeground }}>
            {t('goals.dueDate')}: {new Date(goal.dueDate).toLocaleDateString()}
          </ThemedText>
        ) : null}

        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: 4 }}>
          <Pressable
            onPress={onToggle}
            accessibilityRole="button"
            accessibilityLabel={
              goal.completed ? t('goals.markIncomplete') : t('goals.markComplete')
            }
            style={[
              {
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                paddingVertical: 10,
                borderRadius: radius.md,
                backgroundColor: goal.completed ? `${colors.success}1A` : colors.surface,
                borderWidth: 1,
                borderColor: goal.completed ? colors.success : colors.border,
                minHeight: 44,
              },
            ]}
          >
            {goal.completed ? (
              <CheckCircle color={colors.success} size={18} />
            ) : (
              <Circle color={colors.mutedForeground} size={18} />
            )}
            <ThemedText
              variant="label"
              style={{
                color: goal.completed ? colors.success : colors.foreground,
              }}
            >
              {goal.completed ? t('goals.completed') : t('goals.markComplete')}
            </ThemedText>
          </Pressable>

          <Pressable
            onPress={onEdit}
            accessibilityRole="button"
            accessibilityLabel={t('common.edit')}
            hitSlop={8}
            style={{ padding: 10, minHeight: 44, justifyContent: 'center' }}
          >
            <Pencil color={colors.mutedForeground} size={18} />
          </Pressable>
          <Pressable
            onPress={onDelete}
            accessibilityRole="button"
            accessibilityLabel={t('common.delete')}
            hitSlop={8}
            style={{ padding: 10, minHeight: 44, justifyContent: 'center' }}
          >
            <Trash2 color={colors.destructive} size={18} />
          </Pressable>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  progressTrack: { height: 6, width: '100%' },
  progressFill: { height: 6 },
  outlineButton: {
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
