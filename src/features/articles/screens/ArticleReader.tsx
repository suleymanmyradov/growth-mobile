/**
 * ArticleReader — the pushed article content screen.
 *
 * Paper (`mobile.md` §8.7): renders supported markdown with
 * `react-native-markdown-display`; never uses arbitrary HTML in a WebView.
 * Header actions are Back, Save, native Share, and reading size — all 44-unit
 * targets. A three-unit reading progress line sits below the header. Three
 * reader-size choices are persisted as a non-secret preference and scroll
 * position is restored per article. The article title is NOT repeated in the
 * navigation header.
 *
 * Domain boundary: this screen lives in `features/articles`. It imports the
 * public `useArticle`, `useLikeArticle`, and `useShareArticle` hooks from this
 * feature and `useSaveItem`/`useRemoveSaved` from `features/saved`. It does
 * not import feature internals.
 */
import { useRouter } from 'expo-router';
import { ArrowLeft, Bookmark, Share as ShareIcon, Type } from 'lucide-react-native';
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
import { EmptyState, ErrorState, Skeleton, ThemedText } from '@/design-system';
import { useTheme } from '@/design-system/theme';
import { useReducedMotion } from '@/design-system/theme/use-reduced-motion';
import { useSaveItem } from '@/features/saved';

import { useArticle, useShareArticle } from '../hooks';
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

export type ArticleReaderProps = {
  id: string;
};

export function ArticleReader({ id }: ArticleReaderProps): React.ReactNode {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const { colors, spacing } = theme;
  const reduced = useReducedMotion();

  const { data: article, isLoading, isError, error, refetch } = useArticle(id);
  const shareArticle = useShareArticle();
  const saveItem = useSaveItem();

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

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['top']}
      >
        <ReaderHeader
          onBack={() => router.back()}
          onSave={handleSave}
          onShare={handleShare}
          onSize={cycleReaderSize}
          saveLabel={t('article.save')}
          shareLabel={t('article.share')}
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
          onShare={handleShare}
          onSize={cycleReaderSize}
          saveLabel={t('article.save')}
          shareLabel={t('article.share')}
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
          onShare={handleShare}
          onSize={cycleReaderSize}
          saveLabel={t('article.save')}
          shareLabel={t('article.share')}
          sizeLabel={t('article.readingSize')}
          backLabel={t('common.back')}
          colors={colors}
          spacing={spacing}
        />
        <EmptyState title={t('article.notFoundTitle')} subtitle={t('article.notFoundBody')} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <ReaderHeader
        onBack={() => router.back()}
        onSave={handleSave}
        onShare={handleShare}
        onSize={cycleReaderSize}
        saveLabel={t('article.save')}
        shareLabel={t('article.share')}
        sizeLabel={t('article.readingSize')}
        backLabel={t('common.back')}
        colors={colors}
        spacing={spacing}
        saved={article.isSaved}
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
        contentContainerStyle={{ paddingVertical: spacing.lg }}
      >
        {/* Article title + metadata (not in the nav header per §8.7). */}
        <View style={{ paddingHorizontal: 20, marginBottom: spacing.md, gap: spacing.xs }}>
          {article.category ? (
            <ThemedText variant="label" style={{ color: colors.accent }}>
              {article.category.name}
            </ThemedText>
          ) : null}
          <ThemedText variant="articleTitle">{article.title}</ThemedText>
          <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
            <ThemedText variant="meta" style={{ color: colors.mutedForeground }}>
              {article.author}
            </ThemedText>
            <ThemedText variant="meta" style={{ color: colors.mutedForeground }}>
              · {article.readTime} {t('library.minRead')}
            </ThemedText>
          </View>
        </View>

        <Markdown style={markdownStyle} onLinkPress={handleLinkPress}>
          {withoutDuplicateLeadingTitle(article.content, article.title)}
        </Markdown>
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * ReaderHeader — the article reader header with Back, Save, Share, and reading
 * size actions. All are 44-unit targets. The article title is NOT shown here
 * per `mobile.md` §8.7.
 */
type ReaderHeaderProps = {
  onBack: () => void;
  onSave: () => void;
  onShare: () => void;
  onSize: () => void;
  saveLabel: string;
  shareLabel: string;
  sizeLabel: string;
  backLabel: string;
  saved?: boolean;
  colors: import('@/design-system/tokens').ColorTokens;
  spacing: import('@/design-system/tokens').SpacingTokens;
};

function ReaderHeader({
  onBack,
  onSave,
  onShare,
  onSize,
  saveLabel,
  shareLabel,
  sizeLabel,
  backLabel,
  saved,
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
        onPress={onSave}
        accessibilityRole="button"
        accessibilityLabel={saveLabel}
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
});
