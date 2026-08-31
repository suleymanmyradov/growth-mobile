/**
 * DictateButton — composer speech-to-text control.
 *
 * Press to start recording (mic permission requested contextually), press again
 * to stop — the captured audio is sent to `/personalization/transcribe` and the
 * returned text is appended to the composer input via `onTranscript`.
 *
 * Uses the existing `useVoiceRecorder` (expo-audio) and `useTranscribeAudio`
 * hooks. Resources are released on unmount, interruption, and cancellation by
 * the recorder hook. Audio content is never logged.
 *
 * Per AGENTS.md: voice capture uses expo-audio and uploads a file URI. Stop and
 * release recorder resources on interruption/navigation/cancellation/error.
 */
import { LoaderCircle, Mic, Square } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, StyleSheet } from 'react-native';

import { ApiError } from '@/core/api/errors';
import { useTheme } from '@/design-system/theme';

import { useTranscribeAudio } from '../hooks';
import { RECORDED_MIME_TYPE, useVoiceRecorder } from '../useVoiceRecorder';

type DictatePhase = 'idle' | 'recording' | 'transcribing';

export interface DictateButtonProps {
  /** Called with the transcribed text to append to the composer input. */
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export function DictateButton({ onTranscript, disabled }: DictateButtonProps): ReactNode {
  const { colors, radius } = useTheme();
  const { t } = useTranslation();
  const recorder = useVoiceRecorder();
  const transcribe = useTranscribeAudio();
  const [phase, setPhase] = useState<DictatePhase>('idle');

  const handlePress = async () => {
    if (disabled) return;

    if (phase === 'recording') {
      const uri = await recorder.stopRecording();
      if (!uri) {
        setPhase('idle');
        return;
      }
      setPhase('transcribing');
      try {
        const result = await transcribe.mutateAsync({
          fileUri: uri,
          mimeType: RECORDED_MIME_TYPE,
        });
        if (result.text) onTranscript(result.text);
      } catch (err) {
        Alert.alert(t('coach.dictateError'), err instanceof ApiError ? err.message : undefined);
      } finally {
        recorder.reset();
        setPhase('idle');
      }
      return;
    }

    if (phase === 'idle') {
      recorder.reset();
      await recorder.startRecording();
      // The recorder state machine transitions to 'recording' or
      // 'permission-denied'/'error' synchronously via dispatch.
      if (recorder.state.phase === 'recording') {
        setPhase('recording');
      } else if (recorder.state.phase === 'permission-denied') {
        Alert.alert(t('coach.permissionDeniedTitle'), t('coach.permissionDeniedBody'));
      }
    }
  };

  const label =
    phase === 'recording'
      ? t('coach.dictateStop')
      : phase === 'transcribing'
        ? t('coach.dictateTranscribing')
        : t('coach.dictate');

  const isRecording = phase === 'recording';

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || phase === 'transcribing'}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{
        disabled: disabled || phase === 'transcribing',
        busy: phase === 'transcribing',
      }}
      hitSlop={8}
      style={[
        styles.button,
        {
          borderColor: isRecording ? colors.destructive : colors.border,
          borderRadius: radius.field,
          backgroundColor: isRecording ? colors.destructive : colors.surface,
          opacity: phase === 'transcribing' || disabled ? 0.5 : 1,
        },
      ]}
    >
      {phase === 'transcribing' ? (
        <LoaderCircle color={colors.foreground} size={20} />
      ) : phase === 'recording' ? (
        <Square color={colors.background} size={20} />
      ) : (
        <Mic color={colors.foreground} size={20} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
