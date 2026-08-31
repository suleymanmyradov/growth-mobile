/**
 * CoachScreen — the Coach tab composition.
 *
 * Paper (`mobile.md` §8.4): two primary entry cards (text conversation and
 * voice), earlier conversations in a long-list implementation, and an
 * entitlement/usage banner with a specific Upgrade action when limits are
 * known. Starting a text conversation navigates to the conversation stack
 * screen (creating a conversation first via the start endpoint). Voice entry
 * navigates to the voice screen.
 *
 * Conversation management: a search field filters the loaded list client-side
 * (by title/lastMessage, matching the web behavior — there is no dedicated
 * conversation search endpoint). Segmented tabs switch between Active and
 * Archived lists (`archived` query param). Long-pressing a row opens an action
 * sheet with Archive/Unarchive/Delete (delete requires confirmation).
 *
 * Domain boundary: composition screen in `features/ai-coach`. Imports only
 * PUBLIC hooks from `features/ai-coach` and `features/billing`. Does not import
 * feature internals beyond its own components.
 */
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { MessageCircle, Mic, Search, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, RefreshControl, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError } from '@/core/api/errors';
import type { Conversation } from '@/core/api/schemas';
import {
  EmptyState,
  ErrorState,
  SectionLabel,
  SegmentedTabs,
  Skeleton,
  ThemedText,
} from '@/design-system';
import { useTheme } from '@/design-system/theme';
import { useBillingOverview } from '@/features/billing';

import { ConversationActionsSheet } from '../components/ConversationActionsSheet';
import { ConversationRow } from '../components/ConversationRow';
import { EntitlementBanner } from '../components/EntitlementBanner';
import {
  useArchiveConversation,
  useConversations,
  useDeleteConversation,
  useStartConversation,
  useUnarchiveConversation,
} from '../hooks';

type Tab = 'active' | 'archived';

export function CoachScreen(): React.ReactNode {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors, spacing, radius, typography } = useTheme();

  const [tab, setTab] = useState<Tab>('active');
  const [search, setSearch] = useState('');
  const [actionTarget, setActionTarget] = useState<Conversation | null>(null);

  const {
    data: conversationsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useConversations({ limit: 50, archived: tab === 'archived' });
  const { data: billing } = useBillingOverview();
  const startConversation = useStartConversation();
  const archiveMutation = useArchiveConversation();
  const unarchiveMutation = useUnarchiveConversation();
  const deleteMutation = useDeleteConversation();

  const conversations = useMemo(() => {
    const all = (conversationsData?.data ?? []).filter(
      (conversation) => conversation.title.trim() || conversation.lastMessage.trim(),
    );
    const query = search.trim().toLowerCase();
    if (!query) return all;
    return all.filter(
      (conversation) =>
        conversation.title.toLowerCase().includes(query) ||
        conversation.lastMessage.toLowerCase().includes(query),
    );
  }, [conversationsData, search]);

  const handleStartText = async () => {
    const conv = await startConversation.mutateAsync({ type: 'coach' });
    router.push(`/conversation/${conv.data.id}`);
  };

  const handleOpenConversation = (conv: Conversation) => {
    router.push(`/conversation/${conv.id}`);
  };

  const handleStartVoice = () => {
    router.push('/conversation/voice');
  };

  const tabs = [
    { id: 'active' as const, label: t('coach.tabActive') },
    { id: 'archived' as const, label: t('coach.tabArchived') },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View
        style={[styles.header, { paddingHorizontal: spacing.xl, borderBottomColor: colors.border }]}
      >
        <ThemedText variant="sectionTitle">{t('tabs.coach')}</ThemedText>
      </View>

      <FlashList
        data={conversations}
        renderItem={({ item }) => (
          <ConversationRow
            conversation={item}
            onPress={handleOpenConversation}
            onLongPress={setActionTarget}
          />
        )}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.accent} />
        }
        ListHeaderComponent={
          <View style={{ gap: spacing.md, paddingHorizontal: 0, paddingBottom: spacing.md }}>
            {billing?.entitlements ? (
              <View style={{ paddingHorizontal: spacing.xl }}>
                <EntitlementBanner
                  entitlements={billing.entitlements}
                  onUpgrade={() => router.push('/paywall')}
                />
              </View>
            ) : null}

            <View style={{ paddingHorizontal: spacing.xl, gap: spacing.sm }}>
              <Pressable
                onPress={handleStartText}
                accessibilityRole="button"
                accessibilityLabel={t('coach.startText')}
                style={({ pressed }) => [
                  styles.entryCard,
                  {
                    borderColor: colors.border,
                    backgroundColor: pressed ? colors.surface : colors.background,
                  },
                ]}
              >
                <MessageCircle color={colors.accent} size={24} />
                <View style={{ flex: 1 }}>
                  <ThemedText variant="cardTitle">{t('coach.textCardTitle')}</ThemedText>
                  <ThemedText variant="body" style={{ color: colors.mutedForeground }}>
                    {t('coach.textCardBody')}
                  </ThemedText>
                </View>
              </Pressable>

              <Pressable
                onPress={handleStartVoice}
                accessibilityRole="button"
                accessibilityLabel={t('coach.startVoice')}
                style={({ pressed }) => [
                  styles.entryCard,
                  {
                    borderColor: colors.border,
                    backgroundColor: pressed ? colors.surface : colors.background,
                  },
                ]}
              >
                <Mic color={colors.accent} size={24} />
                <View style={{ flex: 1 }}>
                  <ThemedText variant="cardTitle">{t('coach.voiceCardTitle')}</ThemedText>
                  <ThemedText variant="body" style={{ color: colors.mutedForeground }}>
                    {t('coach.voiceCardBody')}
                  </ThemedText>
                </View>
              </Pressable>
            </View>

            {/* Search + Active/Archived tabs */}
            <View style={{ paddingHorizontal: spacing.xl, gap: spacing.sm }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.sm,
                  backgroundColor: colors.surface,
                  borderColor: colors.input,
                  borderWidth: 1,
                  borderRadius: radius.field,
                  paddingHorizontal: spacing.md,
                  minHeight: 48,
                }}
              >
                <Search color={colors.mutedForeground} size={18} />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder={t('coach.searchPlaceholder')}
                  placeholderTextColor={colors.mutedForeground}
                  accessibilityLabel={t('coach.searchLabel')}
                  style={{
                    flex: 1,
                    color: colors.foreground,
                    fontSize: typography.fontSize.md,
                    paddingVertical: spacing.sm,
                  }}
                />
                {search ? (
                  <Pressable
                    onPress={() => setSearch('')}
                    accessibilityRole="button"
                    accessibilityLabel={t('coach.searchClear')}
                    hitSlop={8}
                  >
                    <X color={colors.mutedForeground} size={18} />
                  </Pressable>
                ) : null}
              </View>

              <SegmentedTabs segments={tabs} value={tab} onChange={(id) => setTab(id as Tab)} />
            </View>

            <View style={{ paddingHorizontal: spacing.xl }}>
              <SectionLabel>
                {tab === 'archived' ? t('coach.archivedSection') : t('coach.recent')}
              </SectionLabel>
            </View>
          </View>
        }
        ListEmptyComponent={
          isError ? (
            <ErrorState
              message={error instanceof ApiError ? error.message : t('common.errorGeneric')}
              onRetry={refetch}
            />
          ) : isLoading ? (
            <View
              style={{ paddingHorizontal: spacing.xl, gap: spacing.sm, paddingTop: spacing.sm }}
            >
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} style={{ height: 64 }} radius={12} />
              ))}
            </View>
          ) : search ? (
            <EmptyState title={t('coach.searchEmptyTitle')} subtitle={t('coach.searchEmptyBody')} />
          ) : tab === 'archived' ? (
            <EmptyState title={t('coach.noArchivedTitle')} subtitle={t('coach.noArchivedBody')} />
          ) : (
            <EmptyState
              title={t('coach.noConversationsTitle')}
              subtitle={t('coach.noConversationsBody')}
            />
          )
        }
        contentContainerStyle={{ paddingBottom: spacing.xl }}
      />

      <ConversationActionsSheet
        conversation={actionTarget}
        open={actionTarget !== null}
        onClose={() => setActionTarget(null)}
        onArchive={(id) => archiveMutation.mutate(id)}
        onUnarchive={(id) => unarchiveMutation.mutate(id)}
        onDelete={(id) => deleteMutation.mutate(id)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 64,
  },
});
