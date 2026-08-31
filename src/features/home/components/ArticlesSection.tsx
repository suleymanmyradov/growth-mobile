/**
 * ArticlesSection — "Worth reading tonight" section for the Today screen.
 *
 * Ported from the web frontend's `components/home/articles-section.tsx`:
 * shows a horizontal scroll of article cards with like and save actions.
 * Tapping a card navigates to the article reader. A "Library" link routes
 * to the Library tab.
 *
 * Domain boundary: presentation component owned by `features/home`. Receives
 * articles and action callbacks from the parent screen, which wires the
 * public hooks from `features/articles` and `features/saved`.
 */
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Bookmark, Heart } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import type { Article } from '@/core/api/schemas';
import { SectionLabel, ThemedText } from '@/design-system';
import { useTheme } from '@/design-system/theme';

export type ArticlesSectionProps = {
  articles: Article[];
  onLike: (id: string) => void;
  onToggleSave: (articleId: string) => void;
  isLikePendingFor: (id: string) => boolean;
  getIsSaved: (articleId: string) => boolean;
};

export function ArticlesSection({
  articles,
  onLike,
  onToggleSave,
  isLikePendingFor,
  getIsSaved,
}: ArticlesSectionProps): React.ReactNode {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors, spacing, radius } = useTheme();

  if (articles.length === 0) return null;

  return (
    <View style={{ gap: spacing.md }}>
      <View
        style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <SectionLabel>{t('today.worthReadingTonight')}</SectionLabel>
        <Pressable
          onPress={() => router.push('/(app)/(tabs)/library')}
          hitSlop={8}
          accessibilityRole="link"
          accessibilityLabel={t('today.libraryLink')}
        >
          <ThemedText variant="label" style={{ color: colors.accent }}>
            {t('today.libraryLink')}
          </ThemedText>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: spacing.md, paddingHorizontal: 1 }}
      >
        {articles.slice(0, 6).map((article) => {
          const saved = getIsSaved(article.id) || article.isSaved;
          const likePending = isLikePendingFor(article.id);
          return (
            <Pressable
              key={article.id}
              onPress={() => router.push(`/article/${article.id}`)}
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderRadius: radius.card,
                },
              ]}
              accessibilityRole="link"
              accessibilityLabel={article.title}
            >
              {article.imageUrl ? (
                <Image
                  source={{ uri: article.imageUrl }}
                  style={styles.image}
                  contentFit="cover"
                />
              ) : null}
              <View style={{ padding: spacing.md, gap: spacing.xs }}>
                {article.category?.name ? (
                  <ThemedText
                    variant="caption"
                    style={{ color: colors.mutedForeground, textTransform: 'uppercase' }}
                    numberOfLines={1}
                  >
                    {article.category.name}
                  </ThemedText>
                ) : null}
                <ThemedText variant="rowTitle" numberOfLines={2}>
                  {article.title}
                </ThemedText>
                {article.excerpt ? (
                  <ThemedText
                    variant="caption"
                    style={{ color: colors.mutedForeground }}
                    numberOfLines={2}
                  >
                    {article.excerpt}
                  </ThemedText>
                ) : null}
                <View style={styles.actions}>
                  <Pressable
                    onPress={() => onLike(article.id)}
                    disabled={likePending}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={
                      article.isLiked ? t('articles.unlike') : t('articles.like')
                    }
                    style={styles.actionButton}
                  >
                    <Heart
                      size={16}
                      color={article.isLiked ? colors.destructive : colors.mutedForeground}
                      fill={article.isLiked ? colors.destructive : 'none'}
                    />
                    <ThemedText
                      variant="caption"
                      style={{ color: colors.mutedForeground, marginLeft: 4 }}
                    >
                      {article.likeCount}
                    </ThemedText>
                  </Pressable>
                  <Pressable
                    onPress={() => onToggleSave(article.id)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={
                      saved ? t('articles.removeFromSaved') : t('articles.save')
                    }
                    style={styles.actionButton}
                  >
                    <Bookmark
                      size={16}
                      color={saved ? colors.accent : colors.mutedForeground}
                      fill={saved ? colors.accent : 'none'}
                    />
                  </Pressable>
                </View>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const CARD_WIDTH = 240;

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    borderWidth: 1,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 120,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
});
