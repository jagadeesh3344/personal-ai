export type VoiceStatus = 'UNAVAILABLE' | 'INITIALIZING' | 'READY' | 'LISTENING' | 'SPEAKING' | 'ERROR';

export interface IVoiceProvider {
  status: VoiceStatus;
  isSupported(): boolean;
  startListening(onTranscript: (text: string) => void): Promise<void>;
  stopListening(): Promise<void>;
  speak(text: string): Promise<void>;
}

/**
 * Standard Web Speech API abstraction ready to connect to real speech recognition and TTS
 */
export class WebSpeechVoiceProvider implements IVoiceProvider {
  status: VoiceStatus = 'INITIALIZING';

  isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }

  async startListening(onTranscript: (text: string) => void): Promise<void> {
    if (!this.isSupported()) {
      this.status = 'UNAVAILABLE';
      throw new Error('Speech recognition not supported on this browser.');
    }
    this.status = 'LISTENING';
    // Implementation placeholder for real SpeechRecognition instance
  }

  async stopListening(): Promise<void> {
    this.status = 'READY';
  }

  async speak(text: string): Promise<void> {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  }
}
