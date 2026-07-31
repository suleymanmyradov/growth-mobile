/**
 * ArticleRow — a compact article list row for the Library Explore/Search
 * segments. Shows cover image, title, excerpt, read time, and a save toggle.
 *
 * Paper (`mobile.md` §8.5): article rows navigate to `article/[id]`; save
 * state is shown inline. 44-unit tap target on the row; the save button is a
 * separate 44-unit target so it does not trigger navigation.
 */
import { Bookmark } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Article } from '@/core/api/schemas';
import { ThemedText } from '@/design-system';
import { useTheme } from '@/design-system/theme';

export type ArticleRowProps = {
  article: Article;
  onPress: (id: string) => void;
  onSave: (article: Article) => void;
  savePending?: boolean;
};

export function ArticleRow({
  article,
  onPress,
  onSave,
  savePending,
}: ArticleRowProps): React.ReactNode {
  const { colors, spacing } = useTheme();
  const { t } = useTranslation();

  return (
    <View
      style={{
        flexDirection: 'row',
        gap: spacing.md,
        paddingVertical: spacing.md,
        minHeight: 44,
      }}
    >
      <Pressable
        onPress={() => onPress(article.id)}
        accessibilityRole="button"
        accessibilityLabel={article.title}
        style={{ flex: 1, gap: spacing.xs }}
      >
        {article.category ? (
          <ThemedText variant="label" style={{ color: colors.accent }}>
            {article.category.name}
          </ThemedText>
        ) : null}
        <ThemedText variant="cardTitle" numberOfLines={2}>
          {article.title}
        </ThemedText>
        <ThemedText variant="bodySmall" numberOfLines={2} style={{ color: colors.mutedForeground }}>
          {article.excerpt}
        </ThemedText>
        <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
          <ThemedText variant="meta" style={{ color: colors.mutedForeground }}>
            {article.author}
          </ThemedText>
          <ThemedText variant="meta" style={{ color: colors.mutedForeground }}>
            · {article.readTime} {t('library.minRead')}
          </ThemedText>
        </View>
      </Pressable>
      <Pressable
        onPress={() => onSave(article)}
        disabled={savePending}
        accessibilityRole="button"
        accessibilityLabel={article.isSaved ? t('library.unsaveArticle') : t('library.saveArticle')}
        hitSlop={8}
        style={styles.saveButton}
      >
        <Bookmark
          color={article.isSaved ? colors.accent : colors.mutedForeground}
          fill={article.isSaved ? colors.accent : 'none'}
          size={22}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  saveButton: { padding: 8, minHeight: 44, justifyContent: 'center' },
});
