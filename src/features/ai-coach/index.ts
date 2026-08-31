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
    CoachingAttachment,
    Conversation,
    ConversationMessage,
    GeneratePersonalizedCoachingRequest,
    GetConversationResponse,
    GetMessagesResponse,
    ListConversationsResponse,
    StartConversationRequest,
    StartConversationResponse
} from './api';

export {
    archiveConversation,
    deleteConversation,
    getConversation,
    getMessages,
    listConversations,
    startConversation,
    unarchiveConversation
} from './api';

export {
    initialCoachingStreamState,
    initialVoiceTurnStreamState,
    reduceCoachingEvent,
    reduceVoiceTurnEvent,
    runCoachingReducer,
    runVoiceTurnReducer
} from './streaming';
export type {
    CoachingStreamPhase,
    CoachingStreamState,
    VoiceTurnPhase,
    VoiceTurnStreamState
} from './streaming';

export {
    initialVoiceRecorderState,
    reduceVoiceRecorder,
    runVoiceRecorderReducer
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
    useUnarchiveConversation,
    useVoiceTurn
} from './hooks';
export type { UseStreamCoachingResult, UseVoiceTurnResult } from './hooks';

export { RECORDED_MIME_TYPE, useVoiceRecorder } from './useVoiceRecorder';
export type { UseVoiceRecorderResult } from './useVoiceRecorder';

export { pickImageAttachment } from './attachments';
export type { ComposerAttachment } from './attachments';

export { MessageBubble } from './components/MessageBubble';
export type { MessageBubbleProps } from './components/MessageBubble';
export { ReferenceSheet } from './components/ReferenceSheet';
export type { ReferenceSheetProps } from './components/ReferenceSheet';
export { ToolFallback } from './components/ToolFallback';
export type { ToolFallbackProps } from './components/ToolFallback';

