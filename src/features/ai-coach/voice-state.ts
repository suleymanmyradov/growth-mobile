/**
 * Pure voice recording state machine.
 *
 * Owns the transitions between idle → requesting-permission → recording →
 * stopping → recorded (and the error/cancelled branches). Kept pure (no React,
 * no native APIs) so interruption, cancellation, and cleanup semantics are
 * unit-testable without a device.
 *
 * Per AGENTS.md §"SSE, AI coaching, and voice": stop and release recorder/player
 * resources on interruption, navigation, phone call, backgrounding,
 * cancellation, and error. The state machine makes those transitions explicit.
 */
export type VoiceRecorderPhase =
  | 'idle'
  | 'requesting-permission'
  | 'permission-denied'
  | 'recording'
  | 'stopping'
  | 'recorded'
  | 'error';

export interface VoiceRecorderState {
  phase: VoiceRecorderPhase;
  /** File URI of the completed recording, when available. */
  fileUri: string | null;
  /** Error message for the `error` / `permission-denied` phases. */
  errorMessage: string | null;
}

export const initialVoiceRecorderState: VoiceRecorderState = {
  phase: 'idle',
  fileUri: null,
  errorMessage: null,
};

export type VoiceRecorderAction =
  | { type: 'request-permission' }
  | { type: 'permission-granted' }
  | { type: 'permission-denied'; message?: string }
  | { type: 'start-recording' }
  | { type: 'stop' }
  | { type: 'recording-stopped'; fileUri: string }
  | { type: 'cancel' }
  | { type: 'reset' }
  | { type: 'error'; message?: string };

/**
 * Reduces the voice recorder state by action. Enforces legal transitions:
 * - Recording can only start from idle (after permission granted).
 * - Stop transitions recording → stopping → recorded.
 * - Cancel resets to idle from any non-terminal phase.
 * - Error is terminal until `reset`.
 */
export function reduceVoiceRecorder(
  state: VoiceRecorderState,
  action: VoiceRecorderAction,
): VoiceRecorderState {
  switch (action.type) {
    case 'request-permission': {
      if (state.phase !== 'idle') return state;
      return { ...state, phase: 'requesting-permission', errorMessage: null };
    }
    case 'permission-granted': {
      if (state.phase !== 'requesting-permission') return state;
      return { ...state, phase: 'idle' };
    }
    case 'permission-denied': {
      if (state.phase !== 'requesting-permission') return state;
      return {
        ...state,
        phase: 'permission-denied',
        errorMessage: action.message ?? 'Microphone permission denied.',
      };
    }
    case 'start-recording': {
      if (state.phase !== 'idle') return state;
      return { ...state, phase: 'recording', fileUri: null, errorMessage: null };
    }
    case 'stop': {
      if (state.phase !== 'recording') return state;
      return { ...state, phase: 'stopping' };
    }
    case 'recording-stopped': {
      if (state.phase !== 'stopping' && state.phase !== 'recording') return state;
      return { ...state, phase: 'recorded', fileUri: action.fileUri };
    }
    case 'cancel': {
      // Cancel resets to idle from any non-terminal phase (idle/permission/
      // recording/stopping). Recorded is a completed state — use reset.
      if (state.phase === 'recorded' || state.phase === 'error') return state;
      return { ...initialVoiceRecorderState };
    }
    case 'reset': {
      return { ...initialVoiceRecorderState };
    }
    case 'error': {
      return {
        ...state,
        phase: 'error',
        errorMessage: action.message ?? 'Recording failed.',
      };
    }
    default:
      return state;
  }
}

/**
 * Convenience: run a list of actions through the reducer. Used by tests.
 */
export function runVoiceRecorderReducer(actions: VoiceRecorderAction[]): VoiceRecorderState {
  return actions.reduce(reduceVoiceRecorder, initialVoiceRecorderState);
}
