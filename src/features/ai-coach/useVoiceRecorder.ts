/**
 * useVoiceRecorder — a hook wrapping expo-audio for voice coaching capture.
 *
 * Manages microphone permission, recording lifecycle, interruption cleanup,
 * and file-URI output. Uses the pure `reduceVoiceRecorder` state machine so
 * transitions are testable. Resources are released on unmount, cancellation,
 * error, and interruption (app backgrounding / phone call).
 *
 * Per AGENTS.md: voice capture uses `expo-audio` and uploads a file URI as
 * multipart with a supported extension/MIME type. Stop and release recorder
 * resources on interruption, navigation, phone call, backgrounding,
 * cancellation, and error. Do not log audio content.
 */
import {
  RecordingPresets,
  getRecordingPermissionsAsync,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
} from 'expo-audio';
import { useCallback, useEffect, useReducer, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import {
  initialVoiceRecorderState,
  reduceVoiceRecorder,
  type VoiceRecorderState,
} from './voice-state';

export interface UseVoiceRecorderResult {
  state: VoiceRecorderState;
  /** Requests microphone permission and starts recording if granted. */
  startRecording: () => Promise<void>;
  /** Stops recording and yields the file URI via `state.fileUri`. */
  stopRecording: () => Promise<string | null>;
  /** Cancels an in-flight recording and releases resources. */
  cancel: () => void;
  /** Resets to idle after consuming a completed recording. */
  reset: () => void;
}

/**
 * Recording options: M4A/AAC is a supported format for the transcribe and
 * voice-turn endpoints (extension `.m4a`, MIME `audio/m4a`).
 */
const RECORDING_OPTIONS = RecordingPresets.HIGH_QUALITY;

export const RECORDED_MIME_TYPE = 'audio/m4a';

/**
 * Hook for voice recording with permission, interruption cleanup, and a pure
 * state machine. The recorder is created via `useAudioRecorder` (auto-released
 * on unmount).
 */
export function useVoiceRecorder(): UseVoiceRecorderResult {
  const recorder = useAudioRecorder(RECORDING_OPTIONS);
  const [state, dispatch] = useReducer(reduceVoiceRecorder, initialVoiceRecorderState);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // Release the recorder on unmount.
  useEffect(() => {
    return () => {
      try {
        if (recorder.isRecording) {
          void recorder.stop();
        }
      } catch {
        // Best-effort cleanup; ignore errors during teardown.
      }
    };
  }, [recorder]);

  // Interrupt recording on app backgrounding (phone call / backgrounding rule).
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextStatus: AppStateStatus) => {
      const previous = appStateRef.current;
      appStateRef.current = nextStatus;
      if (previous === 'active' && nextStatus !== 'active' && recorder.isRecording) {
        // Backgrounded while recording — cancel to release resources.
        try {
          void recorder.stop();
        } catch {
          // ignore
        }
        dispatch({ type: 'cancel' });
      }
    });
    return () => subscription.remove();
  }, [recorder]);

  const startRecording = useCallback(async () => {
    dispatch({ type: 'request-permission' });

    let permission = await getRecordingPermissionsAsync();
    if (permission.status !== 'granted') {
      permission = await requestRecordingPermissionsAsync();
    }

    if (permission.status !== 'granted') {
      dispatch({ type: 'permission-denied' });
      return;
    }

    dispatch({ type: 'permission-granted' });

    // Configure the audio session for recording.
    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: false,
        interruptionMode: 'duckOthers',
      });
    } catch {
      // Non-fatal: continue even if audio mode setup fails.
    }

    try {
      await recorder.prepareToRecordAsync();
      recorder.record();
      dispatch({ type: 'start-recording' });
    } catch {
      dispatch({ type: 'error', message: 'Could not start recording.' });
    }
  }, [recorder]);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    if (!recorder.isRecording) return null;
    dispatch({ type: 'stop' });
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) {
        dispatch({ type: 'error', message: 'Recording produced no file.' });
        return null;
      }
      dispatch({ type: 'recording-stopped', fileUri: uri });
      return uri;
    } catch {
      dispatch({ type: 'error', message: 'Could not stop recording.' });
      return null;
    }
  }, [recorder]);

  const cancel = useCallback(() => {
    try {
      if (recorder.isRecording) {
        void recorder.stop();
      }
    } catch {
      // ignore
    }
    dispatch({ type: 'cancel' });
  }, [recorder]);

  const reset = useCallback(() => {
    dispatch({ type: 'reset' });
  }, []);

  return { state, startRecording, stopRecording, cancel, reset };
}
