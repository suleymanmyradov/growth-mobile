import { CoachScreen } from '@/features/ai-coach/screens/CoachScreen';

/**
 * Coach tab route (thin wrapper).
 *
 * Phase H: renders the Coach composition screen — text/voice entry cards,
 * earlier conversations list, and entitlement/usage banner. This route file
 * stays thin and contains no business logic.
 */
export default function CoachRoute() {
  return <CoachScreen />;
}
