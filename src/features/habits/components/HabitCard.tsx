/**
 * Habit card — displays a habit with streak, completion toggle, and actions.
 */
import { CheckCircle, Flame, Pencil, Trash2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import type { Habit } from '@/core/api/schemas';
import { Badge, Card, ThemedText } from '@/design-system';
import { useTheme } from '@/design-system/theme';

export function HabitCard({
  habit,
  onCheckIn,
  onEdit,
  onDelete,
  checkInLoading,
}: {
  habit: Habit;
  onCheckIn: () => void;
  onEdit: () => void;
  onDelete: () => void;
  checkInLoading?: boolean;
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
            <ThemedText variant="label" style={{ fontWeight: '600', fontSize: 16 }}>
              {habit.name}
            </ThemedText>
            {habit.description ? (
              <ThemedText variant="caption" style={{ color: colors.secondaryText, marginTop: 2 }}>
                {habit.description}
              </ThemedText>
            ) : null}
          </View>
          {habit.category ? <Badge>{habit.category}</Badge> : null}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Flame color={colors.warning} size={16} />
          <ThemedText variant="caption" style={{ color: colors.secondaryText }}>
            {habit.streak === 1
              ? t('habits.streakOne')
              : t('habits.streak', { count: habit.streak })}
          </ThemedText>
        </View>

        {/* Recent history dots */}
        {habit.recentHistory && habit.recentHistory.length > 0 ? (
          <View style={{ flexDirection: 'row', gap: 4 }}>
            {habit.recentHistory.slice(-7).map((done, i) => (
              <View
                key={i}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: done ? colors.success : colors.border,
                }}
              />
            ))}
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: 4 }}>
          <Pressable
            onPress={onCheckIn}
            disabled={habit.completed || checkInLoading}
            accessibilityRole="button"
            accessibilityLabel={habit.completed ? t('habits.doneToday') : t('habits.checkIn')}
            style={[
              {
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                paddingVertical: 10,
                borderRadius: radius.md,
                backgroundColor: habit.completed ? `${colors.success}1A` : colors.primary,
                opacity: habit.completed || checkInLoading ? 0.6 : 1,
                minHeight: 44,
              },
            ]}
          >
            <CheckCircle color={habit.completed ? colors.success : colors.background} size={18} />
            <ThemedText
              style={{
                color: habit.completed ? colors.success : colors.background,
                fontWeight: '600',
                fontSize: 14,
              }}
            >
              {habit.completed ? t('habits.doneToday') : t('habits.checkIn')}
            </ThemedText>
          </Pressable>

          <Pressable
            onPress={onEdit}
            accessibilityRole="button"
            accessibilityLabel={t('common.edit')}
            hitSlop={8}
            style={{ padding: 10, minHeight: 44, justifyContent: 'center' }}
          >
            <Pencil color={colors.secondaryText} size={18} />
          </Pressable>
          <Pressable
            onPress={onDelete}
            accessibilityRole="button"
            accessibilityLabel={t('common.delete')}
            hitSlop={8}
            style={{ padding: 10, minHeight: 44, justifyContent: 'center' }}
          >
            <Trash2 color={colors.error} size={18} />
          </Pressable>
        </View>
      </View>
    </Card>
  );
}

// (no styles needed — layout is inline)
