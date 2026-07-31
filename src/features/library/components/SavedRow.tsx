/**
 * SavedRow — a row for a saved item in the Saved segment. Renders the
 * hydrated entity (article/habit/goal) with a remove (unsave) action.
 *
 * Paper (`mobile.md` §8.5): Saved lists use FlashList and preserve scroll/query
 * state. Article rows navigate to `article/[id]`.
 */
import { Bookmark, FileText, ListChecks, Target } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import type { SavedItemDetailed } from '@/core/api/schemas';
import { ThemedText } from '@/design-system';
import { useTheme } from '@/design-system/theme';

export type SavedRowProps = {
  item: SavedItemDetailed;
  onPress: (item: SavedItemDetailed) => void;
  onRemove: (id: string) => void;
  removePending?: boolean;
};

export function SavedRow({
  item,
  onPress,
  onRemove,
  removePending,
}: SavedRowProps): React.ReactNode {
  const { colors, spacing } = useTheme();
  const { t } = useTranslation();

  const title =
    item.article?.title ?? item.habit?.name ?? item.goal?.title ?? t('library.savedItem');
  const subtitle = item.article?.excerpt ?? item.habit?.description ?? item.goal?.description ?? '';
  const Icon =
    item.itemType === 'article' ? FileText : item.itemType === 'habit' ? ListChecks : Target;

  return (
    <View
      style={{ flexDirection: 'row', gap: spacing.md, paddingVertical: spacing.md, minHeight: 44 }}
    >
      <Pressable
        onPress={() => onPress(item)}
        accessibilityRole="button"
        accessibilityLabel={title}
        style={{ flex: 1, gap: spacing.xs }}
      >
        <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
          <Icon color={colors.mutedForeground} size={16} />
          <ThemedText variant="label" style={{ color: colors.mutedForeground }}>
            {t(`library.savedType.${item.itemType}`)}
          </ThemedText>
        </View>
        <ThemedText variant="cardTitle" numberOfLines={2}>
          {title}
        </ThemedText>
        {subtitle ? (
          <ThemedText
            variant="bodySmall"
            numberOfLines={2}
            style={{ color: colors.mutedForeground }}
          >
            {subtitle}
          </ThemedText>
        ) : null}
      </Pressable>
      <Pressable
        onPress={() => onRemove(item.id)}
        disabled={removePending}
        accessibilityRole="button"
        accessibilityLabel={t('library.unsaveArticle')}
        hitSlop={8}
        style={styles.removeButton}
      >
        <Bookmark color={colors.accent} fill={colors.accent} size={22} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  removeButton: { padding: 8, minHeight: 44, justifyContent: 'center' },
});
