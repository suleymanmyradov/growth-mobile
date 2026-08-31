/**
 * AttachmentPreview — thumbnail row of composer attachments with remove
 * controls. Renders above the text input. Image attachments use `expo-image`
 * for cached thumbnail display.
 */
import { Image } from 'expo-image';
import { X } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/design-system';
import { useTheme } from '@/design-system/theme';

import type { ComposerAttachment } from '../attachments';

export interface AttachmentPreviewProps {
  attachments: ComposerAttachment[];
  onRemove: (id: string) => void;
}

export function AttachmentPreview({ attachments, onRemove }: AttachmentPreviewProps): ReactNode {
  const { colors, spacing, radius } = useTheme();
  const { t } = useTranslation();

  if (attachments.length === 0) return null;

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
      {attachments.map((attachment) => (
        <View
          key={attachment.name + attachment.previewUri}
          style={[
            styles.chip,
            {
              borderColor: colors.border,
              borderRadius: radius.field,
              backgroundColor: colors.surface,
            },
          ]}
        >
          {attachment.attachmentType === 'image' ? (
            <Image
              source={attachment.previewUri}
              style={styles.thumb}
              contentFit="cover"
              recyclingKey={attachment.previewUri}
            />
          ) : (
            <View style={[styles.docThumb, { backgroundColor: colors.input }]}>
              <ThemedText variant="label" numberOfLines={2}>
                {attachment.name}
              </ThemedText>
            </View>
          )}
          <Pressable
            onPress={() => onRemove(attachment.name)}
            accessibilityRole="button"
            accessibilityLabel={t('coach.removeAttachment', { name: attachment.name })}
            hitSlop={8}
            style={[styles.remove, { backgroundColor: colors.mutedForeground }]}
          >
            <X color={colors.background} size={12} />
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderWidth: 1,
  },
  thumb: { width: 40, height: 40, borderRadius: 6 },
  docThumb: { width: 40, height: 40, borderRadius: 6, padding: 4, justifyContent: 'center' },
  remove: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
