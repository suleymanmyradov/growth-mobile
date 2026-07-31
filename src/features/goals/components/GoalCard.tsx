/**
 * Goal card — displays a goal with progress, toggle, and actions.
 */
import { CheckCircle, Circle, Pencil, Trash2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Goal } from '@/core/api/schemas';
import { Badge, Card, ThemedText } from '@/design-system';
import { useTheme } from '@/design-system/theme';

export function GoalCard({
  goal,
  onToggle,
  onEdit,
  onDelete,
}: {
  goal: Goal;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const { colors, spacing, radius } = useTheme();

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

        {/* Progress bar */}
        <View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
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
});
