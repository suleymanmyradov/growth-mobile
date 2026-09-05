/**
 * Composer — the conversation text input + send/stop control.
 *
 * Paper (`mobile.md` §8.4): composer follows keyboard insets and remains
 * usable with large text. Exposes Send while idle and Stop while streaming.
 * The composer is a controlled input; the owning screen owns the streaming
 * state and passes `isStreaming` to toggle the trailing control.
 *
 * Attachments: an attach button (paperclip) opens the image picker; selected
 * image attachments render as thumbnails above the input and are sent with the
 * next coaching turn. A dictate button (mic) records audio, transcribes it
 * server-side, and appends the transcript to the input.
 */
import { ArrowUp, AtSign, Square } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { useTheme } from '@/design-system/theme';

import type { ComposerAttachment } from '../attachments';
import { AttachButton } from './AttachButton';
import { AttachmentPreview } from './AttachmentPreview';
import { DictateButton } from './DictateButton';

const COMPOSER_MIN_HEIGHT = 44;
const COMPOSER_MAX_HEIGHT = 120;

export interface ComposerProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onStop?: () => void;
  isStreaming: boolean;
  disabled?: boolean;
  /** Optional placeholder text. */
  placeholder?: string;
  /** Composer attachments to send with the next turn. */
  attachments?: ComposerAttachment[];
  /** Called when the user picks an image attachment. */
  onAttach?: (attachment: ComposerAttachment) => void;
  /** Called when the user removes an attachment by name. */
  onRemoveAttachment?: (name: string) => void;
  /** Called when the user taps the reference button (insert goal/habit reference). */
  onReference?: () => void;
}

export function Composer({
  value,
  onChangeText,
  onSend,
  onStop,
  isStreaming,
  disabled,
  placeholder,
  attachments,
  onAttach,
  onRemoveAttachment,
  onReference,
}: ComposerProps): ReactNode {
  const { colors, spacing, radius, typography } = useTheme();
  const { t } = useTranslation();
  const canSend =
    (value.trim().length > 0 || (attachments?.length ?? 0) > 0) && !disabled && !isStreaming;
  const hasAttachments = (attachments?.length ?? 0) > 0;
  const [contentHeight, setContentHeight] = useState(COMPOSER_MIN_HEIGHT);
  // iOS never shrinks a grown multiline input back after its text is cleared
  // (e.g. after sending), so the height is driven explicitly and reset while
  // the draft is empty.
  const inputHeight =
    value.length === 0
      ? COMPOSER_MIN_HEIGHT
      : Math.min(Math.max(contentHeight, COMPOSER_MIN_HEIGHT), COMPOSER_MAX_HEIGHT);

  return (
    <View
      style={{
        borderTopColor: colors.border,
        borderTopWidth: StyleSheet.hairlineWidth,
        backgroundColor: colors.background,
      }}
    >
      {hasAttachments ? (
        <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.sm }}>
          <AttachmentPreview
            attachments={attachments ?? []}
            onRemove={(name) => onRemoveAttachment?.(name)}
          />
        </View>
      ) : null}

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: spacing.xs,
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.sm,
        }}
      >
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'flex-end',
            backgroundColor: colors.surface,
            borderColor: colors.input,
            borderWidth: 1,
            borderRadius: radius.pill,
            paddingHorizontal: spacing.xs,
            paddingVertical: 4,
            gap: spacing.xs,
          }}
        >
          {onAttach ? <AttachButton onAttach={onAttach} disabled={disabled} /> : null}

          {onReference ? (
            <Pressable
              onPress={onReference}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityLabel={t('coach.reference')}
              hitSlop={8}
              style={styles.inlineAction}
            >
              <AtSign color={colors.mutedForeground} size={22} />
            </Pressable>
          ) : null}

          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder ?? t('coach.composerPlaceholder')}
            placeholderTextColor={colors.mutedForeground}
            multiline
            editable={!disabled}
            accessibilityLabel={t('coach.composerLabel')}
            onContentSizeChange={(e) => {
              const next = e.nativeEvent.contentSize.height;
              if (next > 0) setContentHeight(next);
            }}
            style={{
              flex: 1,
              color: colors.foreground,
              paddingHorizontal: spacing.xs,
              paddingVertical: spacing.sm,
              fontSize: typography.fontSize.md,
              height: inputHeight,
            }}
          />

          <DictateButton onTranscript={onChangeText} disabled={disabled} />
        </View>

        {isStreaming ? (
          <Pressable
            onPress={onStop}
            accessibilityRole="button"
            accessibilityLabel={t('coach.stop')}
            hitSlop={8}
            style={[
              styles.send,
              { backgroundColor: colors.mutedForeground },
            ]}
          >
            <Square color={colors.background} size={18} />
          </Pressable>
        ) : (
          <Pressable
            onPress={canSend ? onSend : undefined}
            disabled={!canSend}
            accessibilityRole="button"
            accessibilityLabel={t('coach.send')}
            hitSlop={8}
            style={[
              styles.send,
              {
                backgroundColor: canSend ? colors.accent : colors.input,
                opacity: disabled ? 0.5 : 1,
              },
            ]}
          >
            <ArrowUp color={canSend ? colors.accentForeground : colors.mutedForeground} size={20} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inlineAction: {
    width: 40,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    // Bottom-aligns with the pill's content edge (paddingVertical: 4), so the
    // button is vertically centered on the single-line input and stays aligned
    // with the last line when the input grows multiline.
    marginBottom: 4,
  },
});
