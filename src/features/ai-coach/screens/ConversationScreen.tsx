/**
 * ConversationScreen — conversation history, composer, streaming, and
 * keyboard states.
 *
 * Paper (`mobile.md` §8.4):
 * - Native back title, thread title, overflow actions.
 * - User messages use a muted bubble; assistant messages are visually quieter.
 * - Composer follows keyboard insets and remains usable with large text.
 * - Streaming renders partial text, exposes Stop, handles cancel/reconnect/auth
 *   failure, and never duplicates chunks.
 * - Conversation history uses FlashList and keeps sensitive AI content out of
 *   persisted cache by default (messages query is non-persisted).
 *
 * Streaming flow: the user types a message → `useStreamCoaching.send()` opens
 * the SSE stream with the conversationId → the reducer appends deltas to the
 * partial assistant message → on `complete` the messages query is invalidated
 * to refetch the persisted assistant message. The user message is persisted
 * server-side by the streaming endpoint (not by the client).
 */
import type { FlashListRef } from '@shopify/flash-list';
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError } from '@/core/api/errors';
import type { ConversationMessage } from '@/core/api/schemas';
import { ErrorState, Skeleton, ThemedText } from '@/design-system';
import { useTheme } from '@/design-system/theme';

import { Composer } from '../components/Composer';
import { MessageBubble } from '../components/MessageBubble';
import {
  useConversation,
  useInvalidateConversation,
  useMessages,
  useStreamCoaching,
} from '../hooks';

interface MessageListItem {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  streaming?: boolean;
}

export function ConversationScreen(): React.ReactNode {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors, spacing } = useTheme();
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();

  const { data: conversation, isLoading: convLoading } = useConversation(conversationId);
  const {
    data: messagesData,
    isLoading: messagesLoading,
    isError: messagesError,
    error: messagesErr,
    refetch,
  } = useMessages(conversationId);
  const stream = useStreamCoaching();
  const invalidateConversation = useInvalidateConversation();

  const [draft, setDraft] = useState('');
  const listRef = useRef<FlashListRef<MessageListItem>>(null);

  // Build the render list: persisted messages + a streaming partial assistant
  // message (if active). The streaming partial is appended after persisted
  // messages so it appears at the bottom while streaming.
  const items: MessageListItem[] = useMemo(() => {
    const persistedMessages: ConversationMessage[] = messagesData?.data ?? [];
    const base: MessageListItem[] = persistedMessages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
    }));

    if (stream.isStreaming || (stream.state.phase === 'complete' && stream.state.fullResponse)) {
      // Show the streaming partial only while streaming; once complete, the
      // messages query invalidation refetches the persisted assistant message.
      if (stream.isStreaming && stream.state.partialText) {
        base.push({
          id: '__streaming__',
          role: 'assistant',
          content: stream.state.partialText,
          streaming: true,
        });
      }
    }
    return base;
  }, [messagesData, stream.isStreaming, stream.state]);

  // When the stream completes, invalidate the messages query to refetch the
  // persisted assistant message and clear the streaming partial.
  useEffect(() => {
    if (stream.state.phase === 'complete' && stream.state.fullResponse && conversationId) {
      invalidateConversation(conversationId);
    }
  }, [stream.state.phase, stream.state.fullResponse, conversationId, invalidateConversation]);

  // Scroll to bottom when items change.
  useEffect(() => {
    if (items.length > 0) {
      requestAnimationFrame(() => {
        listRef.current?.scrollToEnd({ animated: false });
      });
    }
  }, [items.length]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || !conversationId || stream.isStreaming) return;
    setDraft('');
    await stream.send({ userMessage: text, conversationId });
  };

  const handleStop = () => {
    stream.stop();
  };

  const handleRetry = () => {
    stream.reset();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            { paddingHorizontal: spacing.xl, borderBottomColor: colors.border },
          ]}
        >
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
            hitSlop={8}
            style={styles.backButton}
          >
            <ArrowLeft color={colors.foreground} size={24} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <ThemedText variant="sectionTitle" numberOfLines={1}>
              {convLoading
                ? t('common.loading')
                : (conversation?.title ?? t('screens.conversation.title'))}
            </ThemedText>
          </View>
        </View>

        {/* Messages */}
        {messagesError ? (
          <ErrorState
            message={
              messagesErr instanceof ApiError ? messagesErr.message : t('common.errorGeneric')
            }
            onRetry={refetch}
          />
        ) : messagesLoading ? (
          <View style={{ padding: spacing.xl, gap: spacing.sm }}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} style={{ height: 48 }} radius={12} />
            ))}
          </View>
        ) : (
          <FlashList
            ref={listRef}
            data={items}
            renderItem={({ item }) => (
              <View style={{ paddingHorizontal: spacing.xl }}>
                <MessageBubble role={item.role} content={item.content} streaming={item.streaming} />
              </View>
            )}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingVertical: spacing.md }}
            ListEmptyComponent={
              <View style={{ padding: spacing.xl, alignItems: 'center' }}>
                <ThemedText
                  variant="body"
                  style={{ color: colors.mutedForeground, textAlign: 'center' }}
                >
                  {t('coach.emptyConversation')}
                </ThemedText>
              </View>
            }
          />
        )}

        {/* Streaming error + retry */}
        {stream.state.phase === 'error' ? (
          <View style={{ paddingHorizontal: spacing.xl, paddingVertical: spacing.sm }}>
            <ErrorState
              message={stream.state.errorMessage ?? t('common.errorGeneric')}
              onRetry={handleRetry}
            />
          </View>
        ) : null}

        {/* Composer */}
        <Composer
          value={draft}
          onChangeText={setDraft}
          onSend={handleSend}
          onStop={handleStop}
          isStreaming={stream.isStreaming}
          disabled={!conversationId}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  backButton: { padding: 4, minHeight: 44, minWidth: 44, justifyContent: 'center' },
});
