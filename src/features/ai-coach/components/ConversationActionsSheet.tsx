/**
 * ConversationActionsSheet — bottom-sheet action menu for a conversation.
 *
 * Surfaces Archive/Unarchive and Delete actions. Delete is destructive and
 * requires a confirmation alert before invoking `onDelete`. The sheet is
 * reusable from both the Coach tab row (long-press) and the conversation
 * header overflow menu.
 *
 * Per AGENTS.md: destructive actions require confirmation and remain reversible
 * where the backend supports it. Archive is reversible (unarchive); delete is
 * permanent, hence the confirmation step.
 */
import { Archive, ArchiveRestore, Trash2 } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';

import { ListRow, Sheet, ThemedText } from '@/design-system';
import { useTheme } from '@/design-system/theme';

import type { Conversation } from '@/core/api/schemas';

export interface ConversationActionsSheetProps {
  conversation: Conversation | null;
  open: boolean;
  onClose: () => void;
  onArchive: (id: string) => void;
  onUnarchive: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ConversationActionsSheet({
  conversation,
  open,
  onClose,
  onArchive,
  onUnarchive,
  onDelete,
}: ConversationActionsSheetProps): ReactNode {
  const { colors, spacing } = useTheme();
  const { t } = useTranslation();

  const handleDelete = () => {
    if (!conversation) return;
    const id = conversation.id;
    const title =
      conversation.title.trim() ||
      conversation.lastMessage.trim() ||
      t('coach.untitledConversation');
    Alert.alert(t('coach.deleteConfirmTitle'), t('coach.deleteConfirmBody', { title }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          onClose();
          onDelete(id);
        },
      },
    ]);
  };

  return (
    <Sheet open={open} onClose={onClose} snapPoints={['40%']}>
      <View style={{ gap: spacing.xs }}>
        <ThemedText variant="sectionTitle" numberOfLines={1}>
          {conversation?.title.trim() ||
            conversation?.lastMessage.trim() ||
            t('coach.untitledConversation')}
        </ThemedText>

        {conversation?.archived ? (
          <ListRow
            leading={<ArchiveRestore color={colors.foreground} size={20} />}
            onPress={() => {
              if (!conversation) return;
              onClose();
              onUnarchive(conversation.id);
            }}
            accessibilityLabel={t('coach.unarchive')}
            separator={false}
          >
            <ThemedText variant="body">{t('coach.unarchive')}</ThemedText>
          </ListRow>
        ) : (
          <ListRow
            leading={<Archive color={colors.foreground} size={20} />}
            onPress={() => {
              if (!conversation) return;
              onClose();
              onArchive(conversation.id);
            }}
            accessibilityLabel={t('coach.archive')}
            separator={false}
          >
            <ThemedText variant="body">{t('coach.archive')}</ThemedText>
          </ListRow>
        )}

        <ListRow
          leading={<Trash2 color={colors.destructive} size={20} />}
          onPress={handleDelete}
          accessibilityLabel={t('coach.delete')}
          separator={false}
        >
          <ThemedText variant="body" style={{ color: colors.destructive }}>
            {t('coach.delete')}
          </ThemedText>
        </ListRow>
      </View>
    </Sheet>
  );
}
