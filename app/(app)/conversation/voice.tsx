import { VoiceScreen } from '@/features/ai-coach/screens/VoiceScreen';

/**
 * Voice coaching stack route (pushed full-screen voice mode).
 *
 * Phase H: renders the full-screen listening/transcribing state, live
 * transcript, restrained voice bars, stop/send/cancel controls, permissions,
 * interruption handling, and cleanup. This wrapper stays thin and contains no
 * business logic.
 */
export default function VoiceRoute() {
  return <VoiceScreen />;
}
