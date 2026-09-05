/**
 * AttachButton — composer attachment trigger.
 *
 * Opens the image picker (via `pickImageAttachment`), resizes/compresses the
 * selected image, base64-encodes it, and hands the resulting
 * `ComposerAttachment` to the parent. Disabled while a pick is in flight to
 * prevent duplicate submissions.
 *
 * Per AGENTS.md: no API calls from visual components — the base64 read is a
 * local file operation, and the actual attachment is sent by the parent via the
 * streaming hook. The picker permission is requested contextually (not at first
 * launch).
 */
import { Paperclip } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, StyleSheet } from 'react-native';

import { ApiError } from '@/core/api/errors';
import { useTheme } from '@/design-system/theme';

import type { ComposerAttachment } from '../attachments';
import { pickImageAttachment } from '../attachments';

export interface AttachButtonProps {
  onAttach: (attachment: ComposerAttachment) => void;
  disabled?: boolean;
}

export function AttachButton({ onAttach, disabled }: AttachButtonProps): ReactNode {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [picking, setPicking] = useState(false);

  const handlePress = async () => {
    if (picking || disabled) return;
    setPicking(true);
    try {
      const attachment = await pickImageAttachment();
      if (attachment) onAttach(attachment);
    } catch (err) {
      Alert.alert(t('coach.attachmentError'), err instanceof ApiError ? err.message : undefined);
    } finally {
      setPicking(false);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={picking || disabled}
      accessibilityRole="button"
      accessibilityLabel={t('coach.attach')}
      accessibilityState={{ disabled: picking || disabled, busy: picking }}
      hitSlop={8}
      style={[styles.button, { opacity: picking || disabled ? 0.5 : 1 }]}
    >
      <Paperclip color={colors.foreground} size={22} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
