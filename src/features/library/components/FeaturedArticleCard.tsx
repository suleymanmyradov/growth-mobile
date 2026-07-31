/**
 * FeaturedArticleCard — a large card for the featured article at the top of
 * the Explore segment. Shows cover image, category eyebrow, title, excerpt,
 * and read time. Tapping navigates to the article reader.
 *
 * Paper (`mobile.md` §8.5): Explore has a featured article. In-flow card with
 * hairline border, no shadow.
 */
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Article } from '@/core/api/schemas';
import { Card, ThemedText } from '@/design-system';
import { useTheme } from '@/design-system/theme';

export type FeaturedArticleCardProps = {
  article: Article;
  onPress: (id: string) => void;
};

export function FeaturedArticleCard({
  article,
  onPress,
}: FeaturedArticleCardProps): React.ReactNode {
  const { colors, spacing } = useTheme();
  const { t } = useTranslation();

  return (
    <Card padded={false}>
      <Pressable
        onPress={() => onPress(article.id)}
        accessibilityRole="button"
        accessibilityLabel={article.title}
        style={{ gap: spacing.sm }}
      >
        {article.imageUrl ? (
          <Image
            source={{ uri: article.imageUrl }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
        ) : null}
        <View style={{ padding: spacing.lg, gap: spacing.xs }}>
          {article.category ? (
            <ThemedText variant="label" style={{ color: colors.accent }}>
              {article.category.name}
            </ThemedText>
          ) : null}
          <ThemedText variant="articleTitle" numberOfLines={3}>
            {article.title}
          </ThemedText>
          <ThemedText variant="body" numberOfLines={3} style={{ color: colors.mutedForeground }}>
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
        </View>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  image: { height: 180, borderTopLeftRadius: 12, borderTopRightRadius: 12 },
});
