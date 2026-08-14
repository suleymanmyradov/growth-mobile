/**
 * Pure SSE event reducers for AI coaching streams.
 *
 * Both `/personalization/coaching-stream` (text coaching) and
 * `/personalization/voice-turn` (voice coaching) emit SSE events consumed by
 * `parseSSEStream`. This module owns the pure state machines that fold those
 * events into a renderable stream state — no React, no fetch, no native APIs.
 * Keeping the reducers pure lets us unit-test malformed events, cancellation,
 * auth failure, duplicate chunks, and terminal semantics without a device.
 *
 * Event contracts (see backend `custom-transports.yaml` + the
 * `streamPersonalizedCoachingHandler`):
 *
 * coaching-stream: thinking → delta* → complete | error
 * voice-turn:      transcript → [conversation] → delta* → complete → [audio] → ready | error
 *
 * Terminal rules:
 * - `complete` (coaching) / `ready` (voice) = terminal success; stream ends.
 * - `error` before `complete` = fatal; no terminal success follows.
 * - `error` after `complete` (voice only) = non-fatal; `ready` still follows.
 * - The reducer never logs content (AGENTS.md: do not log conversation text,
 *   transcripts, coaching content, or audio).
 */
import type { SSEEvent } from '@/core/api/sse';

// ─── Coaching stream (text) ───────────────────────────────────────────────────

export type CoachingStreamPhase = 'idle' | 'thinking' | 'streaming' | 'complete' | 'error';

/**
 * A proposal action emitted by the agentic coaching flow. The agent calls
 * a propose_* tool to prepare a goal/habit create/update/delete; the
 * backend forwards it as an SSE "proposal" event. The UI renders a confirm
 * card and calls the existing CRUD endpoint on accept.
 */
export type ProposalAction =
  | 'create_goal'
  | 'update_goal'
  | 'delete_goal'
  | 'create_habit'
  | 'update_habit'
  | 'delete_habit';

export interface CoachingProposal {
  id: string;
  action: ProposalAction;
  payload: Record<string, unknown>;
}

export interface CoachingStreamState {
  phase: CoachingStreamPhase;
  /** Concatenated delta text so far (the partial assistant response). */
  partialText: string;
  /** The final full response from the `complete` event, when received. */
  fullResponse: string | null;
  /** Latest thinking message, if any. */
  thinkingMessage: string | null;
  /** Fatal error message (set when an `error` event arrives before `complete`). */
  errorMessage: string | null;
  /** True once the terminal event (`complete` or fatal `error`) has arrived. */
  done: boolean;
  /** Proposals collected during the stream (agent-prepared CRUD actions). */
  proposals: CoachingProposal[];
}

export const initialCoachingStreamState: CoachingStreamState = {
  phase: 'idle',
  partialText: '',
  fullResponse: null,
  thinkingMessage: null,
  errorMessage: null,
  done: false,
  proposals: [],
};

/**
 * Folds one SSE event into the coaching-stream state.
 *
 * Returns the next state. Once `done` is true, further events are ignored
 * (defensive — the parser should stop after the terminal event, but a
 * malformed stream could emit trailing bytes).
 */
export function reduceCoachingEvent(
  state: CoachingStreamState,
  event: SSEEvent,
): CoachingStreamState {
  if (state.done) return state;

  switch (event.event) {
    case 'thinking': {
      const parsed = safeParse(event.data) as { message?: string } | null;
      return {
        ...state,
        phase: state.phase === 'streaming' ? state.phase : 'thinking',
        thinkingMessage: parsed?.message ?? state.thinkingMessage,
      };
    }
    case 'proposal': {
      const parsed = safeParse(event.data) as {
        id?: string;
        action?: string;
        payload?: Record<string, unknown>;
      } | null;
      if (!parsed?.id || !parsed?.action) return state;
      return {
        ...state,
        proposals: [
          ...state.proposals,
          {
            id: parsed.id,
            action: parsed.action as ProposalAction,
            payload: parsed.payload ?? {},
          },
        ],
      };
    }
    case 'delta': {
      const parsed = safeParse(event.data) as { text?: string } | null;
      const chunk = parsed?.text ?? '';
      if (!chunk) return state;
      return {
        ...state,
        phase: 'streaming',
        partialText: state.partialText + chunk,
        thinkingMessage: null,
      };
    }
    case 'complete': {
      const parsed = safeParse(event.data) as { fullResponse?: string } | null;
      const fullResponse = parsed?.fullResponse ?? state.partialText;
      return {
        ...state,
        phase: 'complete',
        fullResponse,
        thinkingMessage: null,
        done: true,
      };
    }
    case 'error': {
      const parsed = safeParse(event.data) as { message?: string } | null;
      // Fatal if before complete; non-fatal is not expected on the coaching
      // stream (only voice-turn emits non-fatal errors after complete).
      const fatal = state.phase !== 'complete';
      return {
        ...state,
        phase: fatal ? 'error' : state.phase,
        errorMessage: parsed?.message ?? 'An error occurred during coaching.',
        done: fatal,
      };
    }
    default:
      // Unknown event — ignore (forward-compatible).
      return state;
  }
}

// ─── Voice turn stream ────────────────────────────────────────────────────────

export type VoiceTurnPhase =
  'transcribing' | 'streaming' | 'complete' | 'synthesizing' | 'ready' | 'error';

export interface VoiceTurnStreamState {
  phase: VoiceTurnPhase;
  /** Transcribed user utterance (from the `transcript` event). */
  transcript: string | null;
  /** Detected/echoed language, when available. */
  language: string | null;
  /** Audio duration in seconds, when available. */
  duration: number | null;
  /** New conversation ID, when the `conversation` event is emitted. */
  conversationId: string | null;
  /** Concatenated delta text (the partial coaching response). */
  partialText: string;
  /** Final full coaching response from the `complete` event. */
  fullResponse: string | null;
  /** TTS audio payload (base64) + format from the `audio` event, when emitted. */
  audio: { format: string; data: string } | null;
  /** Error message. Fatal if before `complete`; non-fatal if after. */
  errorMessage: string | null;
  /** True once the terminal event (`ready` or fatal `error`) has arrived. */
  done: boolean;
}

export const initialVoiceTurnStreamState: VoiceTurnStreamState = {
  phase: 'transcribing',
  transcript: null,
  language: null,
  duration: null,
  conversationId: null,
  partialText: '',
  fullResponse: null,
  audio: null,
  errorMessage: null,
  done: false,
};

/**
 * Folds one SSE event into the voice-turn state.
 *
 * Honors the fatal/non-fatal error semantics: an `error` before `complete` is
 * fatal (stream ends, no `ready`); an `error` after `complete` is non-fatal
 * (e.g. TTS unavailable) and the stream still ends with `ready`.
 */
export function reduceVoiceTurnEvent(
  state: VoiceTurnStreamState,
  event: SSEEvent,
): VoiceTurnStreamState {
  if (state.done) return state;

  switch (event.event) {
    case 'transcript': {
      const parsed = safeParse(event.data) as {
        text?: string;
        language?: string;
        duration?: number;
      } | null;
      return {
        ...state,
        transcript: parsed?.text ?? state.transcript,
        language: parsed?.language ?? state.language,
        duration: typeof parsed?.duration === 'number' ? parsed.duration : state.duration,
      };
    }
    case 'conversation': {
      const parsed = safeParse(event.data) as { id?: string } | null;
      return {
        ...state,
        conversationId: parsed?.id ?? state.conversationId,
      };
    }
    case 'delta': {
      const parsed = safeParse(event.data) as { text?: string } | null;
      const chunk = parsed?.text ?? '';
      if (!chunk) return state;
      return {
        ...state,
        phase: 'streaming',
        partialText: state.partialText + chunk,
      };
    }
    case 'complete': {
      const parsed = safeParse(event.data) as { fullResponse?: string } | null;
      const fullResponse = parsed?.fullResponse ?? state.partialText;
      return {
        ...state,
        phase: 'complete',
        fullResponse,
      };
    }
    case 'audio': {
      const parsed = safeParse(event.data) as { format?: string; data?: string } | null;
      if (!parsed?.format || !parsed?.data) return state;
      return {
        ...state,
        phase: 'synthesizing',
        audio: { format: parsed.format, data: parsed.data },
      };
    }
    case 'ready': {
      return {
        ...state,
        phase: 'ready',
        done: true,
      };
    }
    case 'error': {
      const parsed = safeParse(event.data) as { message?: string } | null;
      // Fatal if before complete; non-fatal if after (e.g. TTS unavailable).
      const fatal = state.phase !== 'complete' && state.phase !== 'synthesizing';
      return {
        ...state,
        phase: fatal ? 'error' : state.phase,
        errorMessage: parsed?.message ?? 'An error occurred during voice coaching.',
        done: fatal,
      };
    }
    default:
      return state;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Safely parses an SSE `data` payload as JSON. Returns null on malformed JSON
 * so the reducer never throws on a truncated/corrupt event (per the SSE parser
 * robustness contract in AGENTS.md).
 */
function safeParse(data: string): Record<string, unknown> | null {
  if (!data) return null;
  try {
    const parsed = JSON.parse(data);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Convenience: run a list of SSE events through a reducer and return the final
 * state. Used by tests; not for production streaming (production consumes the
 * async generator incrementally).
 */
export function runCoachingReducer(events: SSEEvent[]): CoachingStreamState {
  return events.reduce(reduceCoachingEvent, initialCoachingStreamState);
}

export function runVoiceTurnReducer(events: SSEEvent[]): VoiceTurnStreamState {
  return events.reduce(reduceVoiceTurnEvent, initialVoiceTurnStreamState);
}
