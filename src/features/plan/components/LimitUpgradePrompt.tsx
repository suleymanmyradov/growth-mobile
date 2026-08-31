/**
 * LimitUpgradePrompt — an inline dashed-border card shown when the user reaches
 * the Free plan habit or goal limit.
 *
 * Paper (`mobile.md` §8.2): the card offers two actions: "See Pro" (navigates
 * to the native paywall with the validated limit reason) and "Archive a
 * habit/goal" (opens the ArchiveSheet to delete one and free a slot). This
 * mirrors the web `LimitUpgradePrompt` + `UpgradePrompt` behavior using native
 * primitives instead of DOM dialogs. The card is dismissible; dismissal is
 * local UI state owned by the parent screen.
 *
 * Domain boundary: a pure presentation component — receives all data and
 * callbacks from the parent. Does not call hooks or the router directly.
 */
import { X } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, ThemedText } from '@/design-system';
import { useTheme } from '@/design-system/theme';

export type LimitTrigger = 'habit_limit' | 'goal_limit';

export type LimitUpgradePromptProps = {
  /** Which limit was reached. */
  trigger: LimitTrigger;
  /** Used vs available count, e.g. "5 of 5 habits used". */
  used: number;
  limit: number;
  onSeePro: () => void;
  onArchive: () => void;
  onDismiss: () => void;
};

export function LimitUpgradePrompt({
  trigger,
  used,
  limit,
  onSeePro,
  onArchive,
  onDismiss,
}: LimitUpgradePromptProps): ReactNode {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();

  const isHabit = trigger === 'habit_limit';
  const title = isHabit ? t('plan.habitLimitTitle') : t('plan.goalLimitTitle');
  const description = isHabit ? t('plan.habitLimitBody') : t('plan.goalLimitBody');
  const usage = isHabit
    ? t('plan.habitLimitUsage', { used, limit })
    : t('plan.goalLimitUsage', { used, limit });
  const archiveLabel = isHabit ? t('plan.archiveHabitAction') : t('plan.archiveGoalAction');

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: colors.border,
          borderRadius: 12,
          padding: spacing.lg,
          gap: spacing.sm,
        },
      ]}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: spacing.sm,
        }}
      >
        <View style={{ flex: 1, gap: 2 }}>
          <ThemedText variant="cardTitle">{title}</ThemedText>
          <ThemedText variant="bodySmall" style={{ color: colors.mutedForeground }}>
            {description}
          </ThemedText>
          <ThemedText variant="caption" style={{ color: colors.mutedForeground }}>
            {usage}
          </ThemedText>
        </View>
        <Pressable
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel={t('plan.dismissUpgrade')}
          hitSlop={8}
          style={{ padding: 4, minHeight: 44, justifyContent: 'center' }}
        >
          <X color={colors.mutedForeground} size={16} />
        </Pressable>
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          marginTop: spacing.xs,
        }}
      >
        <Button size="sm" onPress={onSeePro} accessibilityLabel={t('plan.seePro')}>
          {t('plan.seePro')}
        </Button>
        <Button size="sm" variant="ghost" onPress={onArchive} accessibilityLabel={archiveLabel}>
          {archiveLabel}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: 'dashed',
  },
});
