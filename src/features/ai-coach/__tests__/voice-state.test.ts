/**
 * Tests for the pure voice recorder state machine.
 *
 * Covers: permission grant/deny, recording start/stop, cancellation,
 * interruption cleanup, error, and reset. All transitions are pure (no native
 * APIs) so interruption semantics are testable without a device.
 */
import { describe, expect, it } from '@jest/globals';

import {
  initialVoiceRecorderState,
  reduceVoiceRecorder,
  runVoiceRecorderReducer,
  type VoiceRecorderAction,
} from '../voice-state';

describe('reduceVoiceRecorder', () => {
  it('starts idle with no file URI', () => {
    expect(initialVoiceRecorderState.phase).toBe('idle');
    expect(initialVoiceRecorderState.fileUri).toBeNull();
  });

  it('requests permission from idle', () => {
    const state = reduceVoiceRecorder(initialVoiceRecorderState, { type: 'request-permission' });
    expect(state.phase).toBe('requesting-permission');
  });

  it('grants permission and returns to idle', () => {
    const actions: VoiceRecorderAction[] = [
      { type: 'request-permission' },
      { type: 'permission-granted' },
    ];
    expect(runVoiceRecorderReducer(actions).phase).toBe('idle');
  });

  it('denies permission and sets an error message', () => {
    const actions: VoiceRecorderAction[] = [
      { type: 'request-permission' },
      { type: 'permission-denied' },
    ];
    const state = runVoiceRecorderReducer(actions);
    expect(state.phase).toBe('permission-denied');
    expect(state.errorMessage).toBe('Microphone permission denied.');
  });

  it('starts recording from idle', () => {
    const state = reduceVoiceRecorder(initialVoiceRecorderState, { type: 'start-recording' });
    expect(state.phase).toBe('recording');
  });

  it('stops recording and yields the file URI', () => {
    const actions: VoiceRecorderAction[] = [
      { type: 'start-recording' },
      { type: 'stop' },
      { type: 'recording-stopped', fileUri: 'file:///recording.m4a' },
    ];
    const state = runVoiceRecorderReducer(actions);
    expect(state.phase).toBe('recorded');
    expect(state.fileUri).toBe('file:///recording.m4a');
  });

  it('cancel resets to idle from recording (interruption cleanup)', () => {
    const actions: VoiceRecorderAction[] = [{ type: 'start-recording' }, { type: 'cancel' }];
    const state = runVoiceRecorderReducer(actions);
    expect(state.phase).toBe('idle');
    expect(state.fileUri).toBeNull();
  });

  it('cancel resets to idle from stopping', () => {
    const actions: VoiceRecorderAction[] = [
      { type: 'start-recording' },
      { type: 'stop' },
      { type: 'cancel' },
    ];
    expect(runVoiceRecorderReducer(actions).phase).toBe('idle');
  });

  it('cancel does not affect the recorded (completed) state', () => {
    const actions: VoiceRecorderAction[] = [
      { type: 'start-recording' },
      { type: 'stop' },
      { type: 'recording-stopped', fileUri: 'file:///r.m4a' },
      { type: 'cancel' },
    ];
    const state = runVoiceRecorderReducer(actions);
    expect(state.phase).toBe('recorded');
  });

  it('reset clears any state back to idle', () => {
    const actions: VoiceRecorderAction[] = [
      { type: 'start-recording' },
      { type: 'error', message: 'boom' },
      { type: 'reset' },
    ];
    const state = runVoiceRecorderReducer(actions);
    expect(state.phase).toBe('idle');
    expect(state.errorMessage).toBeNull();
  });

  it('error sets the error phase and message', () => {
    const state = reduceVoiceRecorder(initialVoiceRecorderState, {
      type: 'error',
      message: 'Could not start recording.',
    });
    expect(state.phase).toBe('error');
    expect(state.errorMessage).toBe('Could not start recording.');
  });

  it('ignores start-recording from non-idle phases (illegal transition)', () => {
    const recording = reduceVoiceRecorder(initialVoiceRecorderState, { type: 'start-recording' });
    const state = reduceVoiceRecorder(recording, { type: 'start-recording' });
    expect(state.phase).toBe('recording');
  });

  it('ignores stop from non-recording phases', () => {
    const state = reduceVoiceRecorder(initialVoiceRecorderState, { type: 'stop' });
    expect(state.phase).toBe('idle');
  });

  it('ignores permission-granted from non-requesting phases', () => {
    const state = reduceVoiceRecorder(initialVoiceRecorderState, { type: 'permission-granted' });
    expect(state.phase).toBe('idle');
  });
});
