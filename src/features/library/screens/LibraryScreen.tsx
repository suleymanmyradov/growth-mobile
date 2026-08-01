/**
 * LibraryScreen — the Library tab composition.
 *
 * Paper (`mobile.md` §8.5): consolidates discovery without collapsing feature
 * boundaries. Segments: Explore, Saved, Templates. People is deferred — there
 * is no backend contract for people search, so it is hidden rather than
 * populated with fake content. A 44-unit search field searches articles via
 * the gateway search endpoint; results are debounced and cancelable so stale
 * results never render over a newer query. Explore shows a featured article,
 * article rows with save state, and template cards. Saved and result lists
 * use FlashList and preserve scroll/query state per segment. Article rows
 * navigate to `article/[id]`; template actions route to the native creation
 * flow (Plan tab create).
 *
 * Domain boundary: composition screen in `features/library`. Imports only
 * PUBLIC hooks/components from `features/articles`, `features/saved`,
 * `features/search`, and `features/templates`. Does not import feature
 * internals.
 */
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError } from '@/core/api/errors';
import type { Article, SavedItemDetailed } from '@/core/api/schemas';
import {
    EmptyState,
    ErrorState,
    SectionLabel,
    SegmentedTabs,
    Skeleton,
    ThemedText,
    type Segment,
} from '@/design-system';
import { useTheme } from '@/design-system/theme';
import { useArticles, useFeaturedArticle } from '@/features/articles';
import { useRemoveSaved, useSaveItem, useSavedDetailed } from '@/features/saved';
import { useDebouncedQuery, useSearch } from '@/features/search';
import { useGoalTemplates, useHabitTemplates } from '@/features/templates';

import { ArticleRow } from '../components/ArticleRow';
import { FeaturedArticleCard } from '../components/FeaturedArticleCard';
import { SavedRow } from '../components/SavedRow';
import { SearchBar } from '../components/SearchBar';
import { TemplateCard } from '../components/TemplateCard';

type LibrarySegment = 'explore' | 'saved' | 'templates';

export function LibraryScreen(): React.ReactNode {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors, spacing } = useTheme();

  const [segment, setSegment] = useState<LibrarySegment>('explore');
  const [rawQuery, setRawQuery] = useState('');
  const { debounced, pending: debouncePending } = useDebouncedQuery(rawQuery);
  const isSearching = debounced.trim().length > 0;

  const {
    data: articles,
    isLoading: articlesLoading,
    isError: articlesError,
    error: articlesErr,
    refetch: refetchArticles,
  } = useArticles();
  const {
    data: featured,
    isLoading: featuredLoading,
    refetch: refetchFeatured,
  } = useFeaturedArticle();
  const {
    data: saved,
    isLoading: savedLoading,
    isError: savedError,
    error: savedErr,
    refetch: refetchSaved,
  } = useSavedDetailed({ limit: 50 });
  const {
    data: habitTemplates,
    isLoading: habitTemplatesLoading,
    isError: habitTemplatesError,
    refetch: refetchHabitTemplates,
  } = useHabitTemplates();
  const {
    data: goalTemplates,
    isLoading: goalTemplatesLoading,
    isError: goalTemplatesError,
    refetch: refetchGoalTemplates,
  } = useGoalTemplates();
  const {
    data: searchResults,
    isLoading: searchLoading,
    isError: searchError,
    error: searchErr,
    refetch: refetchSearch,
  } = useSearch({ q: debounced, limit: 30 });

  const saveItem = useSaveItem();
  const removeSaved = useRemoveSaved();
  const [refreshing, setRefreshing] = useState(false);

  const segments: Segment[] = useMemo(
    () => [
      { id: 'explore', label: t('library.segmentExplore') },
      { id: 'saved', label: t('library.segmentSaved') },
      { id: 'templates', label: t('library.segmentTemplates') },
    ],
    [t],
  );

  const openArticle = (id: string) => router.push(`/(app)/article/${encodeURIComponent(id)}`);

  const handleSaveArticle = (article: Article) => {
    if (article.isSaved) return; // already saved; unsave uses the saved list remove action
    saveItem.mutate({ itemType: 'article', itemId: article.id });
  };

  const handleOpenSaved = (item: SavedItemDetailed) => {
    if (item.itemType === 'article' && item.article) {
      openArticle(item.article.id);
    }
    // habit/goal saved items have no detail screen yet; fall back to Plan tab.
    if (item.itemType === 'habit' || item.itemType === 'goal') {
      router.push('/(app)/(tabs)/plan');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (isSearching) {
        await refetchSearch();
      } else if (segment === 'explore') {
        await Promise.all([refetchArticles(), refetchFeatured()]);
      } else if (segment === 'saved') {
        await refetchSaved();
      } else {
        await Promise.all([refetchHabitTemplates(), refetchGoalTemplates()]);
      }
    } finally {
      setRefreshing(false);
    }
  };

  const separator = () => (
    <View
      style={{
        height: StyleSheet.hairlineWidth,
        backgroundColor: colors.border,
        marginHorizontal: spacing.xl,
      }}
    />
  );

  const renderExplore = (): React.ReactNode => {
    if (articlesLoading || featuredLoading) {
      return (
        <View style={{ gap: spacing.md, padding: spacing.xl }}>
          <Skeleton style={{ height: 200, borderRadius: 12 }} />
          {[0, 1, 2].map((i) => (
            <View key={i} style={{ gap: spacing.xs }}>
              <Skeleton style={{ width: '60%', height: 18 }} />
              <Skeleton style={{ width: '90%', height: 14 }} />
            </View>
          ))}
        </View>
      );
    }
    if (articlesError) {
      return (
        <ErrorState
          message={articlesErr instanceof ApiError ? articlesErr.message : undefined}
          onRetry={() => refetchArticles()}
        />
      );
    }
    if ((!articles || articles.length === 0) && !featured) {
      return (
        <EmptyState
          title={t('library.exploreEmptyTitle')}
          subtitle={t('library.exploreEmptyBody')}
        />
      );
    }
    return (
      <FlashList
        data={articles ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: spacing.xl }}>
            <ArticleRow
              article={item}
              onPress={openArticle}
              onSave={handleSaveArticle}
              savePending={saveItem.isPending}
            />
          </View>
        )}
        ListHeaderComponent={
          <View
            style={{ paddingHorizontal: spacing.xl, paddingVertical: spacing.md, gap: spacing.md }}
          >
            {featured ? <FeaturedArticleCard article={featured} onPress={openArticle} /> : null}
            <SectionLabel>{t('library.allArticles')}</SectionLabel>
          </View>
        }
        ItemSeparatorComponent={separator}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
        contentContainerStyle={{ paddingVertical: spacing.md }}
      />
    );
  };

  const renderSaved = (): React.ReactNode => {
    if (savedLoading) {
      return (
        <View style={{ gap: spacing.md, padding: spacing.xl }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} style={{ height: 70, borderRadius: 12 }} />
          ))}
        </View>
      );
    }
    if (savedError) {
      return (
        <ErrorState
          message={savedErr instanceof ApiError ? savedErr.message : undefined}
          onRetry={() => refetchSaved()}
        />
      );
    }
    if (!saved || saved.length === 0) {
      return (
        <EmptyState title={t('library.savedEmptyTitle')} subtitle={t('library.savedEmptyBody')} />
      );
    }
    return (
      <FlashList
        data={saved}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: spacing.xl }}>
            <SavedRow
              item={item}
              onPress={handleOpenSaved}
              onRemove={removeSaved.mutate}
              removePending={removeSaved.isPending}
            />
          </View>
        )}
        ItemSeparatorComponent={separator}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
        contentContainerStyle={{ paddingVertical: spacing.md }}
      />
    );
  };

  const renderTemplates = (): React.ReactNode => {
    if (habitTemplatesLoading || goalTemplatesLoading) {
      return (
        <View style={{ gap: spacing.md, padding: spacing.xl }}>
          {[0, 1].map((i) => (
            <Skeleton key={i} style={{ height: 90, borderRadius: 12 }} />
          ))}
        </View>
      );
    }
    if (habitTemplatesError || goalTemplatesError) {
      return (
        <ErrorState
          onRetry={() => {
            refetchHabitTemplates();
            refetchGoalTemplates();
          }}
        />
      );
    }
    const hasHabit = habitTemplates && habitTemplates.length > 0;
    const hasGoal = goalTemplates && goalTemplates.length > 0;
    if (!hasHabit && !hasGoal) {
      return (
        <EmptyState
          title={t('library.templatesEmptyTitle')}
          subtitle={t('library.templatesEmptyBody')}
        />
      );
    }
    return (
      <FlashList
        data={[
          ...(habitTemplates ?? []).map((h) => ({ kind: 'habit' as const, ...h })),
          ...(goalTemplates ?? []).map((g) => ({ kind: 'goal' as const, ...g })),
        ]}
        keyExtractor={(item) => `${item.kind}-${item.id}`}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: spacing.xl, paddingVertical: spacing.sm }}>
            <TemplateCard
              kind={item.kind}
              id={item.id}
              name={item.kind === 'habit' ? item.name : item.title}
              description={item.description}
              categoryName={item.category?.name}
              onPress={() =>
                router.push({
                  pathname: '/(app)/(tabs)/plan',
                  params: {
                    create: item.kind,
                    name: item.kind === 'habit' ? item.name : item.title,
                    description: item.description ?? '',
                    category: item.category?.slug ?? '',
                  },
                })
              }
            />
          </View>
        )}
        ListHeaderComponent={
          <View style={{ paddingHorizontal: spacing.xl, paddingVertical: spacing.md }}>
            <SectionLabel>{t('library.templatesHeading')}</SectionLabel>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
        contentContainerStyle={{ paddingVertical: spacing.md }}
      />
    );
  };

  const renderSearch = (): React.ReactNode => {
    if (searchLoading || debouncePending) {
      return (
        <View style={{ gap: spacing.md, padding: spacing.xl }}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={{ gap: spacing.xs }}>
              <Skeleton style={{ width: '70%', height: 18 }} />
              <Skeleton style={{ width: '90%', height: 14 }} />
            </View>
          ))}
        </View>
      );
    }
    if (searchError) {
      return (
        <ErrorState
          message={searchErr instanceof ApiError ? searchErr.message : undefined}
          onRetry={() => refetchSearch()}
        />
      );
    }
    if (!searchResults || searchResults.length === 0) {
      return (
        <EmptyState
          title={t('library.noResultsTitle')}
          subtitle={t('library.noResultsBody', { query: debounced })}
        />
      );
    }
    return (
      <FlashList
        data={searchResults}
        keyExtractor={(item) => `${item.type}-${item.id}`}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: spacing.xl }}>
            <SearchResultRow
              title={item.title}
              subtitle={item.description}
              typeLabel={t(`library.savedType.${item.type}`)}
              onPress={() => {
                if (item.type === 'article') openArticle(item.id);
                else router.push('/(app)/(tabs)/plan');
              }}
            />
          </View>
        )}
        ItemSeparatorComponent={separator}
        contentContainerStyle={{ paddingVertical: spacing.md }}
      />
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <View style={{ paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, gap: spacing.md }}>
        <ThemedText variant="screenTitle">{t('tabs.library')}</ThemedText>
        <SearchBar value={rawQuery} onChangeText={setRawQuery} />
        {!isSearching ? (
          <SegmentedTabs
            segments={segments}
            value={segment}
            onChange={(id) => setSegment(id as LibrarySegment)}
          />
        ) : null}
      </View>

      <View style={{ flex: 1 }}>
        {isSearching
          ? renderSearch()
          : segment === 'explore'
            ? renderExplore()
            : segment === 'saved'
              ? renderSaved()
              : renderTemplates()}
      </View>
    </SafeAreaView>
  );
}

/**
 * SearchResultRow — a lightweight search result row. Kept local to the
 * composition screen since it is only used here.
 */
function SearchResultRow({
  title,
  subtitle,
  typeLabel,
  onPress,
}: {
  title: string;
  subtitle: string;
  typeLabel: string;
  onPress: () => void;
}): React.ReactNode {
  const { colors, spacing } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [
        { opacity: pressed ? 0.6 : 1, paddingVertical: spacing.md, gap: spacing.xs, minHeight: 44 },
      ]}
    >
      <ThemedText variant="label" style={{ color: colors.accent }}>
        {typeLabel}
      </ThemedText>
      <ThemedText variant="cardTitle" numberOfLines={2}>
        {title}
      </ThemedText>
      <ThemedText variant="bodySmall" numberOfLines={2} style={{ color: colors.mutedForeground }}>
        {subtitle}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
