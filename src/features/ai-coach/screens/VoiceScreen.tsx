/**
 * VoiceScreen — full-screen voice coaching mode.
 *
 * Paper (`mobile.md` §8.4): full-screen listening/transcribing state, live
 * transcript, restrained voice bars, stop/send/cancel controls, permissions,
 * interruption handling, and cleanup.
 *
 * Flow:
 * 1. User taps the mic to start recording (permission requested if needed).
 * 2. Voice bars animate while recording; stop yields a file URI.
 * 3. Send uploads the audio via the voice-turn SSE endpoint (multipart in,
 *    SSE out): transcript → [conversation] → delta* → complete → [audio] →
 *    ready.
 * 4. The live transcript and streamed coaching response render inline.
 * 5. Cancel/stop aborts the stream and releases resources. On unmount the
 *    recorder is released (handled by `useVoiceRecorder`).
 *
 * Per AGENTS.md: never introduce browser MediaRecorder or Blob assumptions.
 * Voice capture uses expo-audio and uploads a file URI. Do not log transcripts
 * or coaching content.
 */
import { useRouter } from 'expo-router';
import { ArrowLeft, Mic, Send, Square, X } from 'lucide-react-native';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErrorState, ThemedText } from '@/design-system';
import { useTheme } from '@/design-system/theme';

import { MessageBubble } from '../components/MessageBubble';
import { VoiceBars } from '../components/VoiceBars';
import { useVoiceTurn } from '../hooks';
import { RECORDED_MIME_TYPE, useVoiceRecorder } from '../useVoiceRecorder';

export function VoiceScreen(): React.ReactNode {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors, spacing } = useTheme();

  const recorder = useVoiceRecorder();
  const voiceTurn = useVoiceTurn();

  // Clean up the voice turn stream on unmount.
  useEffect(() => {
    return () => {
      voiceTurn.stop();
    };
  }, [voiceTurn]);

  const phase = recorder.state.phase;

  const handleMicToggle = async () => {
    if (phase === 'recording') {
      const uri = await recorder.stopRecording();
      if (uri) {
        await voiceTurn.send({ fileUri: uri, mimeType: RECORDED_MIME_TYPE });
      }
    } else if (
      phase === 'idle' ||
      phase === 'recorded' ||
      phase === 'permission-denied' ||
      phase === 'error'
    ) {
      recorder.reset();
      voiceTurn.reset();
      await recorder.startRecording();
    }
  };

  const handleCancel = () => {
    voiceTurn.stop();
    voiceTurn.reset();
    recorder.cancel();
  };

  const handleDone = () => {
    voiceTurn.stop();
    recorder.reset();
    router.back();
  };

  const isRecording = phase === 'recording';
  const isProcessing = voiceTurn.isActive && !isRecording;
  const showTranscript = voiceTurn.state.transcript;
  const showResponse =
    voiceTurn.state.partialText || voiceTurn.state.fullResponse
      ? (voiceTurn.state.fullResponse ?? voiceTurn.state.partialText)
      : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      {/* Header */}
      <View
        style={[styles.header, { paddingHorizontal: spacing.xl, borderBottomColor: colors.border }]}
      >
        <Pressable
          onPress={handleDone}
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          hitSlop={8}
          style={styles.backButton}
        >
          <ArrowLeft color={colors.foreground} size={24} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <ThemedText variant="sectionTitle">{t('coach.voiceTitle')}</ThemedText>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: spacing.xl, gap: spacing.md }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Permission denied state */}
        {phase === 'permission-denied' ? (
          <View style={{ alignItems: 'center', gap: spacing.md, paddingTop: spacing.xl }}>
            <ThemedText variant="cardTitle">{t('coach.permissionDeniedTitle')}</ThemedText>
            <ThemedText
              variant="body"
              style={{ color: colors.mutedForeground, textAlign: 'center' }}
            >
              {t('coach.permissionDeniedBody')}
            </ThemedText>
          </View>
        ) : null}

        {/* Error state */}
        {recorder.state.phase === 'error' || voiceTurn.state.phase === 'error' ? (
          <ErrorState
            message={
              recorder.state.errorMessage ??
              voiceTurn.state.errorMessage ??
              t('common.errorGeneric')
            }
            onRetry={() => {
              recorder.reset();
              voiceTurn.reset();
            }}
          />
        ) : null}

        {/* Live transcript + response */}
        {showTranscript || showResponse ? (
          <View style={{ gap: spacing.sm }}>
            {showTranscript ? <MessageBubble role="user" content={showTranscript} /> : null}
            {showResponse ? (
              <MessageBubble
                role="assistant"
                content={showResponse}
                streaming={voiceTurn.state.phase === 'streaming'}
              />
            ) : null}
          </View>
        ) : null}

        {/* Idle prompt */}
        {!showTranscript && !showResponse && phase === 'idle' ? (
          <View style={{ alignItems: 'center', gap: spacing.md, paddingTop: spacing.xl }}>
            <ThemedText variant="cardTitle">{t('coach.voicePromptTitle')}</ThemedText>
            <ThemedText
              variant="body"
              style={{ color: colors.mutedForeground, textAlign: 'center' }}
            >
              {t('coach.voicePromptBody')}
            </ThemedText>
          </View>
        ) : null}
      </ScrollView>

      {/* Controls */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.lg,
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.lg,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
        }}
      >
        <Pressable
          onPress={handleCancel}
          accessibilityRole="button"
          accessibilityLabel={t('common.cancel')}
          hitSlop={8}
          style={[styles.control, { borderColor: colors.border }]}
        >
          <X color={colors.foreground} size={24} />
        </Pressable>

        <Pressable
          onPress={handleMicToggle}
          accessibilityRole="button"
          accessibilityLabel={isRecording ? t('coach.stop') : t('coach.record')}
          hitSlop={8}
          style={[
            styles.micButton,
            { backgroundColor: isRecording ? colors.destructive : colors.accent },
          ]}
        >
          {isRecording ? (
            <Square color={colors.background} size={28} />
          ) : (
            <Mic color={colors.accentForeground} size={28} />
          )}
        </Pressable>

        <Pressable
          onPress={handleDone}
          accessibilityRole="button"
          accessibilityLabel={t('common.done')}
          hitSlop={8}
          style={[styles.control, { borderColor: colors.border }]}
        >
          <Send color={colors.foreground} size={24} />
        </Pressable>
      </View>

      {/* Voice bars indicator */}
      {(isRecording || isProcessing) && voiceTurn.state.phase !== 'streaming' ? (
        <View style={{ position: 'absolute', top: 80, left: 0, right: 0, alignItems: 'center' }}>
          <VoiceBars active={isRecording} />
        </View>
      ) : null}
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
  control: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
