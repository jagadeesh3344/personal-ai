export type VoiceConnectionState = 
  | 'idle' 
  | 'connecting' 
  | 'listening' 
  | 'processing' 
  | 'speaking' 
  | 'interrupted' 
  | 'error';

export interface VoiceProviderEvents {
  onStateChange?: (state: VoiceConnectionState) => void;
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  onSpokenChunk?: (chunk: string) => void;
  onError?: (error: string) => void;
  onResponse?: (reply: string, spokenText: string, toolCalls?: any[], conversationId?: string) => void;
}

export interface VoiceProvider {
  /** Request microphone permissions and begin active listening */
  start(): Promise<void>;
  /** Stop listening and shutdown voice session */
  stop(): void;
  /** Immediately halt any ongoing spoken audio response and return to listening */
  interrupt(): void;
  /** Check current state */
  getState(): VoiceConnectionState;
  /** Set conversation ID for context continuity */
  setConversationId(conversationId?: string): void;
  /** Get current conversation ID */
  getConversationId(): string | undefined;
  /** Register event handlers */
  setCallbacks(events: VoiceProviderEvents): void;
}
