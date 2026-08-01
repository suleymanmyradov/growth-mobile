/**
 * Tests for the pure SSE event reducers (coaching stream + voice turn).
 *
 * Covers: happy path, malformed JSON, chunk boundaries (via multiple data
 * lines are handled by the parser, not the reducer — here we test malformed
 * payloads), duplicate/empty deltas, terminal semantics (fatal vs non-fatal
 * errors), cancellation (done state ignores further events), and the
 * thinking → streaming → complete phase transitions.
 */
import { describe, expect, it } from '@jest/globals';

import type { SSEEvent } from '@/core/api/sse';
import {
    initialCoachingStreamState,
    initialVoiceTurnStreamState,
    reduceCoachingEvent,
    reduceVoiceTurnEvent,
    runCoachingReducer,
    runVoiceTurnReducer,
} from '../streaming';

const ev = (event: string, data: string): SSEEvent => ({ event, data });

describe('reduceCoachingEvent', () => {
  it('starts idle before the first message is sent', () => {
    expect(initialCoachingStreamState.phase).toBe('idle');
    expect(initialCoachingStreamState.done).toBe(false);
  });

  it('handles thinking events', () => {
    const state = reduceCoachingEvent(
      initialCoachingStreamState,
      ev('thinking', '{"message":"Reviewing your goals..."}'),
    );
    expect(state.phase).toBe('thinking');
    expect(state.thinkingMessage).toBe('Reviewing your goals...');
  });

  it('transitions to streaming on first delta and concatenates text', () => {
    const s1 = reduceCoachingEvent(initialCoachingStreamState, ev('delta', '{"text":"Hello"}'));
    expect(s1.phase).toBe('streaming');
    expect(s1.partialText).toBe('Hello');
    expect(s1.thinkingMessage).toBeNull();

    const s2 = reduceCoachingEvent(s1, ev('delta', '{"text":" world"}'));
    expect(s2.partialText).toBe('Hello world');
  });

  it('ignores empty delta chunks', () => {
    const s1 = reduceCoachingEvent(initialCoachingStreamState, ev('delta', '{"text":"Hi"}'));
    const s2 = reduceCoachingEvent(s1, ev('delta', '{"text":""}'));
    expect(s2.partialText).toBe('Hi');
  });

  it('completes with the full response and marks done', () => {
    const events: SSEEvent[] = [
      ev('delta', '{"text":"Consistency "}'),
      ev('delta', '{"text":"grows."}'),
      ev('complete', '{"fullResponse":"Consistency grows."}'),
    ];
    const state = runCoachingReducer(events);
    expect(state.phase).toBe('complete');
    expect(state.fullResponse).toBe('Consistency grows.');
    expect(state.done).toBe(true);
  });

  it('falls back to partialText when complete has no fullResponse', () => {
    const events: SSEEvent[] = [ev('delta', '{"text":"Partial"}'), ev('complete', '{}')];
    const state = runCoachingReducer(events);
    expect(state.fullResponse).toBe('Partial');
  });

  it('treats error before complete as fatal', () => {
    const events: SSEEvent[] = [
      ev('delta', '{"text":"Partial"}'),
      ev('error', '{"message":"stream ended before completion"}'),
    ];
    const state = runCoachingReducer(events);
    expect(state.phase).toBe('error');
    expect(state.errorMessage).toBe('stream ended before completion');
    expect(state.done).toBe(true);
  });

  it('ignores events after the terminal event (cancellation safety)', () => {
    const events: SSEEvent[] = [
      ev('complete', '{"fullResponse":"Done"}'),
      ev('delta', '{"text":"late chunk"}'),
      ev('error', '{"message":"late error"}'),
    ];
    const state = runCoachingReducer(events);
    expect(state.phase).toBe('complete');
    expect(state.fullResponse).toBe('Done');
    expect(state.errorMessage).toBeNull();
  });

  it('handles malformed JSON in delta gracefully (no throw, no append)', () => {
    const s1 = reduceCoachingEvent(initialCoachingStreamState, ev('delta', '{"text":"Hi"}'));
    const s2 = reduceCoachingEvent(s1, ev('delta', '{not valid json'));
    expect(s2.partialText).toBe('Hi');
  });

  it('handles malformed JSON in error gracefully', () => {
    const state = reduceCoachingEvent(initialCoachingStreamState, ev('error', 'not json'));
    expect(state.phase).toBe('error');
    expect(state.errorMessage).toBe('An error occurred during coaching.');
    expect(state.done).toBe(true);
  });

  it('handles empty data payload', () => {
    const state = reduceCoachingEvent(initialCoachingStreamState, ev('delta', ''));
    expect(state.partialText).toBe('');
    expect(state.phase).toBe('idle');
  });

  it('ignores unknown event types (forward-compatible)', () => {
    const s1 = reduceCoachingEvent(initialCoachingStreamState, ev('delta', '{"text":"Hi"}'));
    const s2 = reduceCoachingEvent(s1, ev('unknown-event', '{"foo":"bar"}'));
    expect(s2).toEqual(s1);
  });
});

describe('reduceVoiceTurnEvent', () => {
  it('starts in the transcribing phase', () => {
    expect(initialVoiceTurnStreamState.phase).toBe('transcribing');
    expect(initialVoiceTurnStreamState.done).toBe(false);
  });

  it('processes transcript as the first event', () => {
    const state = reduceVoiceTurnEvent(
      initialVoiceTurnStreamState,
      ev('transcript', '{"text":"How do I stay consistent?","language":"en","duration":2.4}'),
    );
    expect(state.transcript).toBe('How do I stay consistent?');
    expect(state.language).toBe('en');
    expect(state.duration).toBe(2.4);
  });

  it('captures the conversation event for new conversations', () => {
    const state = reduceVoiceTurnEvent(
      initialVoiceTurnStreamState,
      ev('conversation', '{"id":"0192be94-1234-5678-9aaa-09876543210a"}'),
    );
    expect(state.conversationId).toBe('0192be94-1234-5678-9aaa-09876543210a');
  });

  it('runs the full happy path: transcript → delta → complete → ready', () => {
    const events: SSEEvent[] = [
      ev('transcript', '{"text":"Hello"}'),
      ev('conversation', '{"id":"conv-1"}'),
      ev('delta', '{"text":"Hi "}'),
      ev('delta', '{"text":"there!"}'),
      ev('complete', '{"fullResponse":"Hi there!"}'),
      ev('ready', '{}'),
    ];
    const state = runVoiceTurnReducer(events);
    expect(state.phase).toBe('ready');
    expect(state.transcript).toBe('Hello');
    expect(state.conversationId).toBe('conv-1');
    expect(state.fullResponse).toBe('Hi there!');
    expect(state.done).toBe(true);
  });

  it('processes the audio event (TTS payload)', () => {
    const events: SSEEvent[] = [
      ev('transcript', '{"text":"Hello"}'),
      ev('delta', '{"text":"Hi"}'),
      ev('complete', '{"fullResponse":"Hi"}'),
      ev('audio', '{"format":"mp3","data":"base64payload"}'),
      ev('ready', '{}'),
    ];
    const state = runVoiceTurnReducer(events);
    expect(state.audio).toEqual({ format: 'mp3', data: 'base64payload' });
    expect(state.done).toBe(true);
  });

  it('treats error before complete as fatal (no ready)', () => {
    const events: SSEEvent[] = [
      ev('transcript', '{"text":"Hello"}'),
      ev('error', '{"message":"transcribe failed"}'),
    ];
    const state = runVoiceTurnReducer(events);
    expect(state.phase).toBe('error');
    expect(state.errorMessage).toBe('transcribe failed');
    expect(state.done).toBe(true);
  });

  it('treats error after complete as non-fatal (ready still follows)', () => {
    const events: SSEEvent[] = [
      ev('transcript', '{"text":"Hello"}'),
      ev('delta', '{"text":"Hi"}'),
      ev('complete', '{"fullResponse":"Hi"}'),
      ev('error', '{"message":"voice synthesis unavailable"}'),
      ev('ready', '{}'),
    ];
    const state = runVoiceTurnReducer(events);
    // Non-fatal error: phase stays on complete/synthesizing path, ready wins.
    expect(state.done).toBe(true);
    expect(state.errorMessage).toBe('voice synthesis unavailable');
    expect(state.fullResponse).toBe('Hi');
  });

  it('ignores events after the terminal ready event', () => {
    const events: SSEEvent[] = [
      ev('transcript', '{"text":"Hello"}'),
      ev('complete', '{"fullResponse":"Hi"}'),
      ev('ready', '{}'),
      ev('delta', '{"text":"late"}'),
    ];
    const state = runVoiceTurnReducer(events);
    expect(state.phase).toBe('ready');
    expect(state.partialText).toBe('');
  });

  it('handles malformed JSON in transcript gracefully', () => {
    const state = reduceVoiceTurnEvent(initialVoiceTurnStreamState, ev('transcript', 'not json'));
    expect(state.transcript).toBeNull();
  });

  it('handles malformed audio event (missing fields) gracefully', () => {
    const s1 = reduceVoiceTurnEvent(initialVoiceTurnStreamState, ev('transcript', '{"text":"Hi"}'));
    const s2 = reduceVoiceTurnEvent(s1, ev('audio', '{"format":"mp3"}'));
    expect(s2.audio).toBeNull();
  });

  it('ignores unknown event types', () => {
    const s1 = reduceVoiceTurnEvent(initialVoiceTurnStreamState, ev('transcript', '{"text":"Hi"}'));
    const s2 = reduceVoiceTurnEvent(s1, ev('mystery', '{"x":1}'));
    expect(s2).toEqual(s1);
  });
});
