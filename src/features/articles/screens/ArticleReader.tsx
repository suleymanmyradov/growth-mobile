/**
 * ArticleReader — the pushed article content screen.
 *
 * Paper (`mobile.md` §8.7): renders supported markdown with
 * `react-native-markdown-display`; never uses arbitrary HTML in a WebView.
 * Header actions are Back, Save, Like, native Share, and reading size — all
 * 44-unit targets. A three-unit reading progress line sits below the header.
 * Three reader-size choices are persisted as a non-secret preference and
 * scroll position is restored per article. The article title is NOT repeated
 * in the navigation header.
 *
 * Below the markdown body: tags, an action bar (like count + Report link), a
 * "Make this a habit" CTA card, and a "Next" article card. The hero image
 * renders between the title/metadata and the body. The author row uses an
 * Avatar monogram.
 *
 * Domain boundary: this screen lives in `features/articles`. It imports the
 * public `useArticle`, `useArticles`, `useLikeArticle`, and `useShareArticle`
 * hooks from this feature and `useSaveItem` from `features/saved`. It does
 * not import feature internals.
 */
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Flag,
  Heart,
  Plus,
  Share as ShareIcon,
  Type,
} from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Animated,
  Easing,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError } from '@/core/api/errors';
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Skeleton,
  ThemedText,
} from '@/design-system';
import { useTheme } from '@/design-system/theme';
import { useReducedMotion } from '@/design-system/theme/use-reduced-motion';
import { useSaveItem } from '@/features/saved';

import { useArticle, useArticles, useLikeArticle, useShareArticle } from '../hooks';
import {
  READER_SIZES,
  buildMarkdownStyle,
  withoutDuplicateLeadingTitle,
  type ReaderSize,
} from '../markdown-style';
import {
  getReaderSize,
  getScrollPosition,
  setReaderSize,
  setScrollPosition,
} from '../reader-preferences';

const PROGRESS_LINE_HEIGHT = 3;
const HERO_ASPECT = 16 / 7;

export type ArticleReaderProps = {
  id: string;
};

export function ArticleReader({ id }: ArticleReaderProps): React.ReactNode {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const { colors, spacing, radius } = theme;
  const reduced = useReducedMotion();

  const { data: article, isLoading, isError, error, refetch } = useArticle(id);
  const { data: articlesPage } = useArticles({ limit: 20 });
  const shareArticle = useShareArticle();
  const saveItem = useSaveItem();
  const likeArticle = useLikeArticle();

  const [readerSize, setReaderSizeState] = useState<ReaderSize>('medium');
  const [progress, setProgress] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const scrollOffset = useRef(0);
  const restoredScroll = useRef(false);
  const progressAnim = useMemo(() => new Animated.Value(0), []);

  // Load persisted reader size on mount.
  useEffect(() => {
    let active = true;
    getReaderSize().then((size) => {
      if (active) setReaderSizeState(size);
    });
    return () => {
      active = false;
    };
  }, []);

  // Restore scroll position once the article content has loaded.
  useEffect(() => {
    if (restoredScroll.current || !article) return;
    restoredScroll.current = true;
    getScrollPosition(id).then((offset) => {
      if (offset > 0) {
        scrollRef.current?.scrollTo({ y: offset, animated: false });
      }
    });
  }, [article, id]);

  // Persist scroll position on unmount (debounced via the ref).
  useEffect(() => {
    return () => {
      setScrollPosition(id, scrollOffset.current);
    };
  }, [id]);

  const markdownStyle = useMemo(() => buildMarkdownStyle(theme, readerSize), [theme, readerSize]);

  // Pick the next article from the already-fetched list (same logic as web).
  const nextArticle = useMemo(() => {
    const all = articlesPage ?? [];
    const currentIndex = all.findIndex((a) => a.id === id);
    if (currentIndex >= 0 && currentIndex < all.length - 1) {
      return all[currentIndex + 1] ?? null;
    }
    if (all.length > 0 && all[0]?.id !== id) {
      return all[0] ?? null;
    }
    return null;
  }, [articlesPage, id]);

  const handleSave = () => {
    if (!article) return;
    if (article.isSaved) {
      // Find the saved item id — we only have the article id here, so we
      // remove via the article id. The saved list uses its own id, but the
      // backend remove endpoint takes the saved-item id. Until the article
      // detail exposes the saved-item id, we re-save-toggle via the save
      // endpoint only (save is idempotent). Unsave is handled from the Saved
      // list where the saved-item id is known. This keeps the reader's save
      // button honest: it only saves (does not fake an unsave).
      return;
    }
    saveItem.mutate({ itemType: 'article', itemId: article.id });
  };

  const handleLike = () => {
    if (!article) return;
    likeArticle.mutate(article.id);
  };

  const handleShare = async () => {
    if (!article) return;
    // Record the share via the backend analytics endpoint (fire-and-forget).
    shareArticle.mutate({ id: article.id, platform: Platform.OS });
    try {
      await Share.share({
        message: `${article.title}\n\n${article.excerpt}`,
        url: undefined,
        title: article.title,
      });
    } catch {
      // User cancelled or share failed; no action needed.
    }
  };

  const cycleReaderSize = () => {
    const currentIndex = READER_SIZES.indexOf(readerSize);
    const next = READER_SIZES[(currentIndex + 1) % READER_SIZES.length] ?? 'medium';
    setReaderSizeState(next);
    setReaderSize(next);
  };

  const onScroll = useCallback(
    (event: {
      nativeEvent: {
        contentOffset: { y: number };
        layoutMeasurement: { height: number };
        contentSize: { height: number };
      };
    }) => {
      const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
      scrollOffset.current = contentOffset.y;
      const scrollable = contentSize.height - layoutMeasurement.height;
      if (scrollable <= 0) return;
      const pct = Math.min(1, Math.max(0, contentOffset.y / scrollable));
      if (reduced) {
        setProgress(pct);
      } else {
        progressAnim.setValue(pct);
      }
    },
    [reduced, progressAnim],
  );

  const handleLinkPress = (url: string): boolean => {
    // Validate external URLs before opening.
    if (!/^https?:\/\//i.test(url)) return false;
    Linking.openURL(url).catch(() => {
      // Silently ignore — the link may be unsupported on the device.
    });
    return false;
  };

  const handleMakeHabit = () => {
    if (!article) return;
    const params = new URLSearchParams();
    params.set('create', 'habit');
    params.set('name', article.title);
    if (article.excerpt) params.set('description', article.excerpt);
    if (article.category?.slug) params.set('category', article.category.slug);
    router.push(`/(app)/(tabs)/plan?${params.toString()}`);
  };

  const handleReport = () => {
    if (!article) return;
    const params = new URLSearchParams();
    params.set('type', 'abuse');
    if (article.title) params.set('title', article.title);
    // Cast to satisfy typed routes — `/report` is a new route whose typed
    // declaration is regenerated on the next dev-server start.
    router.push(`/(app)/report?${params.toString()}` as Parameters<typeof router.push>[0]);
  };

  const openNext = (nextId: string) => {
    router.push(`/(app)/article/${encodeURIComponent(nextId)}`);
  };

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['top']}
      >
        <ReaderHeader
          onBack={() => router.back()}
          onSave={handleSave}
          onLike={handleLike}
          onShare={handleShare}
          onSize={cycleReaderSize}
          saveLabel={t('article.save')}
          shareLabel={t('article.share')}
          likeLabel={t('article.like')}
          sizeLabel={t('article.readingSize')}
          backLabel={t('common.back')}
          colors={colors}
          spacing={spacing}
        />
        <View style={{ flex: 1, padding: spacing.xl, gap: spacing.md }}>
          <Skeleton style={{ height: 32, width: '80%' }} />
          <Skeleton style={{ height: 20, width: '40%' }} />
          <View style={{ height: spacing.lg }} />
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} style={{ height: 16, width: '100%' }} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['top']}
      >
        <ReaderHeader
          onBack={() => router.back()}
          onSave={handleSave}
          onLike={handleLike}
          onShare={handleShare}
          onSize={cycleReaderSize}
          saveLabel={t('article.save')}
          shareLabel={t('article.share')}
          likeLabel={t('article.like')}
          sizeLabel={t('article.readingSize')}
          backLabel={t('common.back')}
          colors={colors}
          spacing={spacing}
        />
        <ErrorState
          message={error instanceof ApiError ? error.message : undefined}
          onRetry={() => refetch()}
        />
      </SafeAreaView>
    );
  }

  if (!article) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['top']}
      >
        <ReaderHeader
          onBack={() => router.back()}
          onSave={handleSave}
          onLike={handleLike}
          onShare={handleShare}
          onSize={cycleReaderSize}
          saveLabel={t('article.save')}
          shareLabel={t('article.share')}
          likeLabel={t('article.like')}
          sizeLabel={t('article.readingSize')}
          backLabel={t('common.back')}
          colors={colors}
          spacing={spacing}
        />
        <EmptyState title={t('article.notFoundTitle')} subtitle={t('article.notFoundBody')} />
      </SafeAreaView>
    );
  }

  const publishedDate = formatPublishedDate(article.publishedAt);
  const tags = article.tags ?? [];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <ReaderHeader
        onBack={() => router.back()}
        onSave={handleSave}
        onLike={handleLike}
        onShare={handleShare}
        onSize={cycleReaderSize}
        saveLabel={t('article.save')}
        shareLabel={t('article.share')}
        likeLabel={t('article.like')}
        sizeLabel={t('article.readingSize')}
        backLabel={t('common.back')}
        colors={colors}
        spacing={spacing}
        saved={article.isSaved}
        liked={article.isLiked}
      />
      {/* Reading progress line (3 units) below the header. */}
      <View style={{ height: PROGRESS_LINE_HEIGHT, backgroundColor: colors.muted }}>
        <Animated.View
          style={{
            height: PROGRESS_LINE_HEIGHT,
            backgroundColor: colors.accent,
            width: reduced
              ? `${Math.round(progress * 100)}%`
              : progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                  extrapolate: 'clamp',
                  easing: Easing.out(Easing.ease),
                }),
          }}
        />
      </View>

      <ScrollView
        ref={scrollRef}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingVertical: spacing.lg, paddingBottom: spacing.xxxl }}
      >
        {/* Article title + metadata (not in the nav header per §8.7). */}
        <View style={{ paddingHorizontal: 20, marginBottom: spacing.md, gap: spacing.xs }}>
          {article.category ? (
            <ThemedText variant="label" style={{ color: colors.accent }}>
              {article.category.name}
            </ThemedText>
          ) : null}
          <ThemedText variant="articleTitle">{article.title}</ThemedText>
          {article.excerpt ? (
            <ThemedText variant="bodySmall" style={{ color: colors.mutedForeground }}>
              {article.excerpt}
            </ThemedText>
          ) : null}
          {/* Author row with avatar monogram + date + read time. */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
              marginTop: spacing.xs,
            }}
          >
            <Avatar name={article.author} size={30} />
            <View style={{ flex: 1, gap: 1 }}>
              <ThemedText variant="label" style={{ color: colors.foreground }}>
                {article.author || 'Growth'}
              </ThemedText>
              <ThemedText variant="caption" style={{ color: colors.mutedForeground }}>
                {publishedDate ? `${publishedDate} · ` : ''}
                {article.readTime} {t('library.minRead')}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Hero image (16:7, rounded, with border). */}
        {article.imageUrl ? (
          <View
            style={{
              marginHorizontal: 20,
              marginBottom: spacing.lg,
              aspectRatio: HERO_ASPECT,
              borderRadius: radius.card,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.muted,
              overflow: 'hidden',
            }}
          >
            <Image
              source={{ uri: article.imageUrl }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              transition={150}
              accessibilityLabel={article.title}
            />
          </View>
        ) : null}

        <Markdown style={markdownStyle} onLinkPress={handleLinkPress}>
          {withoutDuplicateLeadingTitle(article.content, article.title)}
        </Markdown>

        {/* Tags */}
        {tags.length > 0 ? (
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: spacing.sm,
              paddingHorizontal: 20,
              marginTop: spacing.lg,
            }}
          >
            {tags.map((tag) => (
              <View
                key={tag}
                style={[
                  styles.tagPill,
                  {
                    backgroundColor: colors.muted,
                    borderRadius: radius.pill,
                  },
                ]}
              >
                <ThemedText variant="caption" style={{ color: colors.mutedForeground }}>
                  {tag}
                </ThemedText>
              </View>
            ))}
          </View>
        ) : null}

        {/* Action bar: like count + Report link. */}
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: spacing.sm,
            paddingHorizontal: 20,
            marginTop: spacing.xxl,
          }}
        >
          <View
            style={[
              styles.actionPill,
              {
                borderColor: colors.border,
                backgroundColor: colors.surface,
                borderRadius: radius.pill,
              },
            ]}
          >
            <Pressable
              onPress={handleLike}
              accessibilityRole="button"
              accessibilityLabel={article.isLiked ? t('article.liked') : t('article.like')}
              accessibilityState={{ selected: article.isLiked }}
              hitSlop={8}
              disabled={likeArticle.isPending}
              style={{ padding: 4 }}
            >
              <Heart
                color={article.isLiked ? colors.accent : colors.mutedForeground}
                fill={article.isLiked ? colors.accent : 'none'}
                size={16}
              />
            </Pressable>
            <ThemedText variant="caption" style={{ color: colors.mutedForeground }}>
              {article.likeCount}
            </ThemedText>
          </View>

          <Pressable
            onPress={handleReport}
            accessibilityRole="link"
            accessibilityLabel={t('article.report')}
            hitSlop={8}
            style={[
              styles.actionPill,
              {
                borderColor: colors.border,
                backgroundColor: colors.surface,
                borderRadius: radius.pill,
              },
            ]}
          >
            <Flag color={colors.mutedForeground} size={14} />
            <ThemedText variant="caption" style={{ color: colors.mutedForeground }}>
              {t('article.report')}
            </ThemedText>
          </Pressable>
        </View>

        {/* "Make this a habit" CTA card. */}
        <View style={{ paddingHorizontal: 20, marginTop: spacing.xxl }}>
          <Card>
            <View style={{ gap: spacing.xs }}>
              <ThemedText
                variant="caption"
                style={{ color: colors.mutedForeground, letterSpacing: 1.2 }}
              >
                {t('article.makeHabitEyebrow')}
              </ThemedText>
              <ThemedText variant="cardTitle">{t('article.makeHabitTitle')}</ThemedText>
              <ThemedText variant="bodySmall" style={{ color: colors.mutedForeground }}>
                {t('article.makeHabitBody')}
              </ThemedText>
              <View style={{ marginTop: spacing.sm }}>
                <Button size="sm" onPress={handleMakeHabit}>
                  <Plus color={colors.accentForeground} size={16} /> {t('article.makeHabitCta')}
                </Button>
              </View>
            </View>
          </Card>
        </View>

        {/* Next article card. */}
        {nextArticle ? (
          <View style={{ paddingHorizontal: 20, marginTop: spacing.xxl }}>
            <ThemedText
              variant="caption"
              style={{
                color: colors.mutedForeground,
                letterSpacing: 1.2,
                marginBottom: spacing.xs,
              }}
            >
              {t('article.nextArticle')}
            </ThemedText>
            <Pressable
              onPress={() => openNext(nextArticle.id)}
              accessibilityRole="link"
              accessibilityLabel={`${t('article.nextArticle')}: ${nextArticle.title}`}
              style={({ pressed }) => [
                styles.nextCard,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  borderRadius: radius.card,
                  opacity: pressed ? 0.6 : 1,
                },
              ]}
            >
              <View style={{ flex: 1, gap: spacing.xs }}>
                <ThemedText variant="rowTitle" numberOfLines={3}>
                  {nextArticle.title}
                </ThemedText>
                {nextArticle.category ? (
                  <ThemedText variant="caption" style={{ color: colors.mutedForeground }}>
                    {nextArticle.category.name}
                  </ThemedText>
                ) : null}
              </View>
              <ArrowRight color={colors.mutedForeground} size={20} />
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function formatPublishedDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * ReaderHeader — the article reader header with Back, Save, Like, Share, and
 * reading size actions. All are 44-unit targets. The article title is NOT
 * shown here per `mobile.md` §8.7.
 */
type ReaderHeaderProps = {
  onBack: () => void;
  onSave: () => void;
  onLike: () => void;
  onShare: () => void;
  onSize: () => void;
  saveLabel: string;
  shareLabel: string;
  likeLabel: string;
  sizeLabel: string;
  backLabel: string;
  saved?: boolean;
  liked?: boolean;
  colors: import('@/design-system/tokens').ColorTokens;
  spacing: import('@/design-system/tokens').SpacingTokens;
};

function ReaderHeader({
  onBack,
  onSave,
  onLike,
  onShare,
  onSize,
  saveLabel,
  shareLabel,
  likeLabel,
  sizeLabel,
  backLabel,
  saved,
  liked,
  colors,
  spacing,
}: ReaderHeaderProps): React.ReactNode {
  return (
    <View
      style={[
        headerStyles.header,
        {
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderBottomColor: colors.border,
          borderBottomWidth: StyleSheet.hairlineWidth,
          backgroundColor: colors.background,
        },
      ]}
    >
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel={backLabel}
        hitSlop={8}
        style={headerStyles.action}
      >
        <ArrowLeft color={colors.foreground} size={24} />
      </Pressable>
      <View style={{ flex: 1 }} />
      <Pressable
        onPress={onSize}
        accessibilityRole="button"
        accessibilityLabel={sizeLabel}
        hitSlop={8}
        style={headerStyles.action}
      >
        <Type color={colors.foreground} size={22} />
      </Pressable>
      <Pressable
        onPress={onLike}
        accessibilityRole="button"
        accessibilityLabel={likeLabel}
        accessibilityState={{ selected: liked }}
        hitSlop={8}
        style={headerStyles.action}
      >
        <Heart
          color={liked ? colors.accent : colors.foreground}
          fill={liked ? colors.accent : 'none'}
          size={22}
        />
      </Pressable>
      <Pressable
        onPress={onSave}
        accessibilityRole="button"
        accessibilityLabel={saveLabel}
        accessibilityState={{ selected: saved }}
        hitSlop={8}
        style={headerStyles.action}
      >
        <Bookmark
          color={saved ? colors.accent : colors.foreground}
          fill={saved ? colors.accent : 'none'}
          size={22}
        />
      </Pressable>
      <Pressable
        onPress={onShare}
        accessibilityRole="button"
        accessibilityLabel={shareLabel}
        hitSlop={8}
        style={headerStyles.action}
      >
        <ShareIcon color={colors.foreground} size={22} />
      </Pressable>
    </View>
  );
}

const headerStyles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  action: { padding: 8, minHeight: 44, minWidth: 44, justifyContent: 'center' },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  tagPill: { paddingHorizontal: 10, paddingVertical: 4 },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 36,
  },
  nextCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 44,
  },
});
