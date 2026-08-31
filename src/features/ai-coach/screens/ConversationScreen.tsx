/**
 * ConversationScreen — conversation history, composer, streaming, and
 * keyboard states.
 *
 * Paper (`mobile.md` §8.4):
 * - Native back title, thread title, overflow actions (archive/unarchive/delete).
 * - User messages use a muted bubble; assistant messages are visually quieter.
 * - Composer follows keyboard insets and remains usable with large text.
 * - Composer supports image attachments and dictate (speech-to-text).
 * - Streaming renders partial text, exposes Stop, handles cancel/reconnect/auth
 *   failure, and never duplicates chunks.
 * - Empty threads show tappable welcome suggestions to help the user start.
 * - Conversation history uses FlashList and keeps sensitive AI content out of
 *   persisted cache by default (messages query is non-persisted).
 *
 * Streaming flow: the user types a message → `useStreamCoaching.send()` opens
 * the SSE stream with the conversationId → the reducer appends deltas to the
 * partial assistant message → on `complete` the messages query is invalidated
 * to refetch the persisted assistant message. The user message is persisted
 * server-side by the streaming endpoint (not by the client). Attachments are
 * sent as base64 in the coaching-stream JSON body.
 */
import type { FlashListRef } from '@shopify/flash-list';
import { FlashList } from '@shopify/flash-list';
import { setStringAsync as clipboardSetString } from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, EllipsisVertical } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError } from '@/core/api/errors';
import type { CoachingAttachment, ConversationMessage } from '@/core/api/schemas';
import { ErrorState, Skeleton, ThemedText } from '@/design-system';
import { useTheme } from '@/design-system/theme';
import { useGoals } from '@/features/goals';
import { useHabits } from '@/features/habits';

import type { ComposerAttachment } from '../attachments';
import { Composer } from '../components/Composer';
import { ConversationActionsSheet } from '../components/ConversationActionsSheet';
import { MessageBubble } from '../components/MessageBubble';
import { ProposalCard } from '../components/ProposalCard';
import { ReferenceSheet } from '../components/ReferenceSheet';
import { WelcomeSuggestions } from '../components/WelcomeSuggestions';
import {
    useArchiveConversation,
    useConversation,
    useDeleteConversation,
    useInvalidateConversation,
    useMessages,
    useStreamCoaching,
    useUnarchiveConversation,
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
  const archiveMutation = useArchiveConversation();
  const unarchiveMutation = useUnarchiveConversation();
  const deleteMutation = useDeleteConversation();
  const { data: goals = [] } = useGoals();
  const { data: habits = [] } = useHabits();

  const [draft, setDraft] = useState('');
  const [attachments, setAttachments] = useState<ComposerAttachment[]>([]);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [referenceOpen, setReferenceOpen] = useState(false);
  const lastSentMessage = useRef<string | null>(null);
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
      } else if (stream.isStreaming) {
        // During the thinking phase (before any deltas), show the thinking
        // message so the user sees the coach is processing — not a blank screen.
        base.push({
          id: '__streaming__',
          role: 'assistant',
          content: stream.state.thinkingMessage ?? t('coach.thinking'),
          streaming: true,
        });
      }
    }
    return base;
  }, [messagesData, stream.isStreaming, stream.state, t]);

  const isEmpty = items.length === 0 && !stream.isStreaming;

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

  const buildAttachments = (): CoachingAttachment[] | undefined => {
    if (attachments.length === 0) return undefined;
    return attachments.map(({ attachmentType, name, contentType, data }) => ({
      attachmentType,
      name,
      contentType,
      data,
    }));
  };

  const handleSend = async (text?: string) => {
    const message = (text ?? draft).trim();
    if ((!message && attachments.length === 0) || !conversationId || stream.isStreaming) return;
    lastSentMessage.current = message;
    setDraft('');
    const attachmentPayload = buildAttachments();
    setAttachments([]);
    await stream.send({
      userMessage: message || ' ',
      conversationId,
      attachments: attachmentPayload,
    });
  };

  const handleStop = () => {
    stream.reset();
  };

  const handleRetry = () => {
    const text = lastSentMessage.current;
    if (!text || !conversationId || stream.isStreaming) return;
    void stream.send({ userMessage: text, conversationId });
  };

  const handleCopy = (content: string) => {
    clipboardSetString(content)
      .then(() => Alert.alert(t('coach.copied')))
      .catch(() => Alert.alert(t('common.errorGeneric')));
  };

  const handleEditMessage = (content: string) => {
    setDraft(content);
    // Focus is handled by the composer's controlled value; the user sees
    // their previous message in the input and can edit + resend.
  };

  const handleInsertReference = (reference: string) => {
    const prefix = draft && !/\s$/.test(draft) ? ' ' : '';
    setDraft(draft + prefix + reference);
  };

  // Find the last user message ID for the regenerate action.
  const lastUserMessageId = useMemo(() => {
    const persisted = messagesData?.data ?? [];
    for (let i = persisted.length - 1; i >= 0; i--) {
      const msg = persisted[i];
      if (msg && msg.role === 'user') return msg.id;
    }
    return null;
  }, [messagesData]);

  const handleAddAttachment = (attachment: ComposerAttachment) => {
    setAttachments((prev) => [...prev, attachment]);
  };

  const handleRemoveAttachment = (name: string) => {
    setAttachments((prev) => prev.filter((a) => a.name !== name));
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, { onSuccess: () => router.back() });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={{ flex: 1 }}>
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
            <Pressable
              onPress={() => setActionsOpen(true)}
              accessibilityRole="button"
              accessibilityLabel={t('coach.conversationActions')}
              hitSlop={8}
              style={styles.backButton}
            >
              <EllipsisVertical color={colors.foreground} size={24} />
            </Pressable>
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
                  <MessageBubble
                    role={item.role}
                    content={item.content}
                    streaming={item.streaming}
                    isLastUser={item.id === lastUserMessageId}
                    onCopy={handleCopy}
                    onEdit={item.role === 'user' ? handleEditMessage : undefined}
                    onRegenerate={item.id === lastUserMessageId ? handleRetry : undefined}
                  />
                </View>
              )}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingVertical: spacing.md }}
              ListEmptyComponent={
                isEmpty ? (
                  <WelcomeSuggestions
                    onSelect={(message) => void handleSend(message)}
                    disabled={stream.isStreaming}
                  />
                ) : null
              }
            />
          )}

          {/* Pending proposals from the agent (confirm/cancel cards) */}
          {stream.state.proposals.length > 0 ? (
            <View
              style={{
                paddingHorizontal: spacing.xl,
                paddingVertical: spacing.sm,
                gap: spacing.sm,
              }}
            >
              {stream.state.proposals.map((proposal) => (
                <ProposalCard key={proposal.id} proposal={proposal} />
              ))}
            </View>
          ) : null}

          {/* Streaming error + retry */}
          {stream.state.phase === 'error' ? (
            <View style={{ paddingHorizontal: spacing.xl, paddingVertical: spacing.sm }}>
              <ErrorState
                message={stream.state.errorMessage ?? t('common.errorGeneric')}
                onRetry={handleRetry}
              />
            </View>
          ) : null}
        </View>

        {/* Composer */}
        <Composer
          value={draft}
          onChangeText={setDraft}
          onSend={() => void handleSend()}
          onStop={handleStop}
          isStreaming={stream.isStreaming}
          disabled={!conversationId}
          attachments={attachments}
          onAttach={handleAddAttachment}
          onRemoveAttachment={handleRemoveAttachment}
          onReference={() => setReferenceOpen(true)}
        />
      </KeyboardAvoidingView>

      <ConversationActionsSheet
        conversation={conversation ?? null}
        open={actionsOpen}
        onClose={() => setActionsOpen(false)}
        onArchive={(id) => archiveMutation.mutate(id)}
        onUnarchive={(id) => unarchiveMutation.mutate(id)}
        onDelete={handleDelete}
      />

      <ReferenceSheet
        open={referenceOpen}
        onClose={() => setReferenceOpen(false)}
        goals={goals}
        habits={habits}
        onInsert={handleInsertReference}
      />
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
