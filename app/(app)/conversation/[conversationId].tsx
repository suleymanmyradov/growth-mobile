import { ConversationScreen } from '@/features/ai-coach/screens/ConversationScreen';

/**
 * Conversation stack route (pushed coaching screen).
 *
 * Phase H: renders the conversation history, composer, streaming, cancellation,
 * retry, and keyboard states. Reads the `conversationId` route param. The
 * `conversationId` is validated as a UUID by the deep-link layer before
 * routing; this wrapper stays thin and contains no business logic.
 */
export default function ConversationRoute() {
  return <ConversationScreen />;
}
