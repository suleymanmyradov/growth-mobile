/**
 * Public barrel for the AI coach feature.
 *
 * Exposes conversation queries/mutations, streaming coaching + voice-turn
 * hooks, the voice recorder hook, and the pure streaming/voice state machines
 * (for testing). Screens and the Coach tab import from here only.
 */
export type {
  AppendMessageRequest,
  AppendMessageResponse,
  Conversation,
  ConversationMessage,
  GeneratePersonalizedCoachingRequest,
  GetConversationResponse,
  GetMessagesResponse,
  ListConversationsResponse,
  StartConversationRequest,
  StartConversationResponse,
} from './api';

export {
  archiveConversation,
  deleteConversation,
  getConversation,
  getMessages,
  listConversations,
  startConversation,
} from './api';

export {
  initialCoachingStreamState,
  initialVoiceTurnStreamState,
  reduceCoachingEvent,
  reduceVoiceTurnEvent,
  runCoachingReducer,
  runVoiceTurnReducer,
} from './streaming';
export type {
  CoachingStreamPhase,
  CoachingStreamState,
  VoiceTurnPhase,
  VoiceTurnStreamState,
} from './streaming';

export {
  initialVoiceRecorderState,
  reduceVoiceRecorder,
  runVoiceRecorderReducer,
} from './voice-state';
export type { VoiceRecorderAction, VoiceRecorderPhase, VoiceRecorderState } from './voice-state';

export {
  useAppendMessage,
  useArchiveConversation,
  useConversation,
  useConversations,
  useDeleteConversation,
  useInvalidateConversation,
  useMessages,
  useStartConversation,
  useStreamCoaching,
  useTranscribeAudio,
  useVoiceTurn,
} from './hooks';
export type { UseStreamCoachingResult, UseVoiceTurnResult } from './hooks';

export { RECORDED_MIME_TYPE, useVoiceRecorder } from './useVoiceRecorder';
export type { UseVoiceRecorderResult } from './useVoiceRecorder';
