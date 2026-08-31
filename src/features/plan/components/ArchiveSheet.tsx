/**
 * ArchiveSheet — a bottom sheet listing habits or goals to delete when the
 * user has reached the Free plan limit.
 *
 * Paper (`mobile.md` §8.2): when the user hits the habit or goal limit, the
 * limit-upgrade prompt offers "Archive a habit/goal" as an alternative to
 * upgrading. This sheet lists the user's current habits or goals with a
 * destructive delete button each. Deleting one frees a slot and the sheet
 * closes so the user can retry the create action. This mirrors the web
 * `ArchiveDialog` behavior (delete-to-make-room) using a native bottom sheet
 * instead of a DOM dialog.
 *
 * Domain boundary: receives the items and a delete callback from the parent
 * screen — does not call hooks itself. The parent owns the mutation so
 * invalidation stays centralized in the Plan composition.
 */
import { Trash2 } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import type { Goal, Habit } from '@/core/api/schemas';
import { Sheet, ThemedText } from '@/design-system';
import { useTheme } from '@/design-system/theme';

export type ArchiveMode = 'habit' | 'goal';

export type ArchiveSheetProps = {
  open: boolean;
  onClose: () => void;
  mode: ArchiveMode;
  habits: Habit[];
  goals: Goal[];
  onDeleteHabit: (id: string) => void;
  onDeleteGoal: (id: string) => void;
};

export function ArchiveSheet({
  open,
  onClose,
  mode,
  habits,
  goals,
  onDeleteHabit,
  onDeleteGoal,
}: ArchiveSheetProps): ReactNode {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();

  const items =
    mode === 'habit'
      ? habits.map((h) => ({
          id: h.id,
          label: h.name,
          sub: h.category || t('library.uncategorized'),
        }))
      : goals.map((g) => ({
          id: g.id,
          label: g.title,
          sub: g.category || t('library.uncategorized'),
        }));

  const handleDelete = (id: string) => {
    if (mode === 'habit') onDeleteHabit(id);
    else onDeleteGoal(id);
    // Close after deleting one — the limit is resolved and the user can retry.
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} snapPoints={['60%']}>
      <View style={{ gap: spacing.md }}>
        <ThemedText variant="sectionTitle">
          {mode === 'habit' ? t('plan.archiveHabitTitle') : t('plan.archiveGoalTitle')}
        </ThemedText>
        <ThemedText variant="body" style={{ color: colors.mutedForeground }}>
          {mode === 'habit' ? t('plan.archiveHabitBody') : t('plan.archiveGoalBody')}
        </ThemedText>
        <ScrollView style={{ maxHeight: 300 }}>
          {items.length === 0 ? (
            <ThemedText
              variant="body"
              style={{
                color: colors.mutedForeground,
                paddingVertical: spacing.lg,
                textAlign: 'center',
              }}
            >
              {t('plan.archiveEmpty')}
            </ThemedText>
          ) : (
            items.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.row,
                  {
                    borderColor: colors.border,
                    borderRadius: 8,
                    marginBottom: spacing.sm,
                  },
                ]}
              >
                <View style={{ flex: 1, gap: 2 }}>
                  <ThemedText variant="rowTitle" numberOfLines={1}>
                    {item.label}
                  </ThemedText>
                  <ThemedText
                    variant="caption"
                    style={{ color: colors.mutedForeground }}
                    numberOfLines={1}
                  >
                    {item.sub}
                  </ThemedText>
                </View>
                <Pressable
                  onPress={() => handleDelete(item.id)}
                  accessibilityRole="button"
                  accessibilityLabel={t('plan.archiveDeleteLabel', { name: item.label })}
                  hitSlop={8}
                  style={{ padding: 8, minHeight: 44, justifyContent: 'center' }}
                >
                  <Trash2 color={colors.destructive} size={18} />
                </Pressable>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    minHeight: 44,
  },
});
