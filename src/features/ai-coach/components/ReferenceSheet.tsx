/**
 * ReferenceSheet — a bottom sheet for inserting goal/habit text references
 * into the composer.
 *
 * Ported from the web frontend's `composer-attach-menu.tsx`: the web version
 * uses a dropdown sub-menu; mobile uses a bottom sheet with two segments
 * (Goals / Habits). Selecting an item inserts `[Goal: "title"]` or
 * `[Habit: "name"]` into the composer text.
 *
 * Domain boundary: this component receives goals/habits and an onInsert
 * callback from the parent screen, which wires the public hooks from
 * `features/goals` and `features/habits`.
 */
import { Target, Trophy } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import type { Goal, Habit } from '@/core/api/schemas';
import { Sheet, ThemedText } from '@/design-system';
import { useTheme } from '@/design-system/theme';

export interface ReferenceSheetProps {
  open: boolean;
  onClose: () => void;
  goals: Goal[];
  habits: Habit[];
  onInsert: (reference: string) => void;
}

export function ReferenceSheet({
  open,
  onClose,
  goals,
  habits,
  onInsert,
}: ReferenceSheetProps): React.ReactNode {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();

  const handleInsertGoal = (title: string) => {
    onInsert(`[Goal: "${title}"]`);
    onClose();
  };

  const handleInsertHabit = (name: string) => {
    onInsert(`[Habit: "${name}"]`);
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose}>
      <View style={{ padding: spacing.lg, gap: spacing.lg }}>
        <ThemedText variant="sectionTitle">{t('coach.referenceTitle')}</ThemedText>

        {/* Goals */}
        <View style={{ gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
            <Trophy color={colors.accent} size={16} />
            <ThemedText variant="label">{t('coach.referenceGoals')}</ThemedText>
          </View>
          {goals.length > 0 ? (
            <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
              {goals.map((goal) => (
                <Pressable
                  key={goal.id}
                  onPress={() => handleInsertGoal(goal.title)}
                  style={({ pressed }) => [
                    styles.item,
                    { backgroundColor: pressed ? colors.surface : 'transparent' },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={goal.title}
                >
                  <ThemedText variant="body" numberOfLines={1}>
                    {goal.title}
                  </ThemedText>
                </Pressable>
              ))}
            </ScrollView>
          ) : (
            <ThemedText variant="caption" style={{ color: colors.mutedForeground }}>
              {t('coach.referenceNoGoals')}
            </ThemedText>
          )}
        </View>

        {/* Habits */}
        <View style={{ gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
            <Target color={colors.accent} size={16} />
            <ThemedText variant="label">{t('coach.referenceHabits')}</ThemedText>
          </View>
          {habits.length > 0 ? (
            <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
              {habits.map((habit) => (
                <Pressable
                  key={habit.id}
                  onPress={() => handleInsertHabit(habit.name)}
                  style={({ pressed }) => [
                    styles.item,
                    { backgroundColor: pressed ? colors.surface : 'transparent' },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={habit.name}
                >
                  <ThemedText variant="body" numberOfLines={1}>
                    {habit.name}
                  </ThemedText>
                </Pressable>
              ))}
            </ScrollView>
          ) : (
            <ThemedText variant="caption" style={{ color: colors.mutedForeground }}>
              {t('coach.referenceNoHabits')}
            </ThemedText>
          )}
        </View>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  item: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: 8,
  },
});
