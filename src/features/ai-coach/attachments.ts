/**
 * Composer attachment helpers — pick, resize, and base64-encode images for the
 * coaching-stream request.
 *
 * The backend `Attachment` type carries base64 `data` (no data-URL prefix) for
 * images and PDFs. On native we use `expo-image-picker` to select,
 * `expo-image-manipulator` to resize/compress, and `expo-file-system` to read
 * the result as base64.
 *
 * Per AGENTS.md: resize/compress uploads before sending. Only formats the
 * coaching LLM can process are allowed (images for vision). Text documents are
 * inlined into the user message by the caller rather than sent as attachments.
 */
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import type { CoachingAttachment } from '@/core/api/schemas';

/** A composer attachment with a local preview URI for the UI. */
export interface ComposerAttachment extends CoachingAttachment {
  /** Local file URI for rendering a thumbnail preview. */
  previewUri: string;
}

const MAX_IMAGE_DIMENSION = 1280;
const COMPRESS_QUALITY = 0.8;

/**
 * Picks a single image from the library, resizes/compresses it, reads it as
 * base64, and returns a `ComposerAttachment` ready to send in the
 * coaching-stream request. Returns `null` if the user cancels or permission is
 * denied.
 */
export async function pickImageAttachment(): Promise<ComposerAttachment | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: false,
    quality: 1,
  });
  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  const resized = await ImageManipulator.manipulateAsync(
    asset.uri,
    [{ resize: { width: MAX_IMAGE_DIMENSION, height: MAX_IMAGE_DIMENSION } }],
    { compress: COMPRESS_QUALITY, format: ImageManipulator.SaveFormat.JPEG },
  );

  const base64 = await FileSystem.readAsStringAsync(resized.uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const name = asset.fileName ?? `attachment-${Date.now()}.jpg`;

  return {
    attachmentType: 'image',
    name,
    contentType: 'image/jpeg',
    data: base64,
    previewUri: resized.uri,
  };
}
