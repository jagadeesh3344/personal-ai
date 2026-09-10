import { VoiceProvider, VoiceProviderEvents, VoiceConnectionState } from './VoiceProvider';
import { fridayApi } from '../api/fridayApi';

// Browser global declarations for webkit speech recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export class WebSpeechVoiceProvider implements VoiceProvider {
  private state: VoiceConnectionState = 'idle';
  private callbacks: VoiceProviderEvents = {};
  private conversationId?: string;
  private recognition: any = null;
  private isExplicitlyStopped = true;
  private mediaStream: MediaStream | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor(conversationId?: string) {
    this.conversationId = conversationId;
  }

  setCallbacks(events: VoiceProviderEvents): void {
    this.callbacks = events;
  }

  getState(): VoiceConnectionState {
    return this.state;
  }

  setConversationId(conversationId?: string): void {
    this.conversationId = conversationId;
  }

  getConversationId(): string | undefined {
    return this.conversationId;
  }

  private setState(newState: VoiceConnectionState): void {
    this.state = newState;
    this.callbacks.onStateChange?.(newState);
  }

  async start(): Promise<void> {
    this.isExplicitlyStopped = false;
    this.setState('connecting');

    // 1. Verify browser speech support
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      const err = 'Voice recognition is not supported in this browser. Please use Chrome, Edge, or Safari.';
      this.setState('error');
      this.callbacks.onError?.(err);
      return;
    }

    // 2. Request microphone hardware permissions explicitly
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
    } catch (err: any) {
      let message = 'Unable to access your microphone.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        message = 'Microphone access denied. Please allow microphone permissions in your browser settings.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        message = 'No microphone device found on this system.';
      }
      this.setState('error');
      this.callbacks.onError?.(message);
      return;
    }

    // 3. Initialize SpeechRecognition instance
    try {
      this.recognition = new SpeechRecognitionClass();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onstart = () => {
        if (!this.isExplicitlyStopped) {
          this.setState('listening');
        }
      };

      this.recognition.onresult = async (event: any) => {
        // If speaking while user speaks, trigger instant interruption!
        if (this.state === 'speaking' || window.speechSynthesis.speaking) {
          this.interrupt();
        }

        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcriptPiece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptPiece;
          } else {
            interimTranscript += transcriptPiece;
          }
        }

        const displayText = finalTranscript.trim() || interimTranscript.trim();
        if (displayText) {
          this.callbacks.onTranscript?.(displayText, Boolean(finalTranscript.trim()));
        }

        if (finalTranscript.trim()) {
          await this.processFinalTranscript(finalTranscript.trim());
        }
      };

      this.recognition.onerror = (event: any) => {
        // 'no-speech' is a normal quiet pause, ignore unless fatal
        if (event.error === 'no-speech') {
          return;
        }

        if (event.error === 'not-allowed') {
          this.setState('error');
          this.callbacks.onError?.('Microphone permission was denied.');
          this.stop();
          return;
        }

        if (event.error === 'network') {
          this.setState('error');
          this.callbacks.onError?.('Network connection failed for speech recognition.');
          return;
        }

        console.warn('[WebSpeechVoiceProvider] Recognition notice:', event.error);
      };

      this.recognition.onend = () => {
        // If still in listening state and not explicitly stopped, restart automatically for hands-free loop
        if (!this.isExplicitlyStopped && (this.state === 'listening' || this.state === 'speaking')) {
          try {
            this.recognition.start();
          } catch {
            // Already started or restarting
          }
        } else if (this.isExplicitlyStopped) {
          this.setState('idle');
        }
      };

      this.recognition.start();
    } catch (err: any) {
      this.setState('error');
      this.callbacks.onError?.(err.message || 'Failed to start speech recognition.');
    }
  }

  private async processFinalTranscript(transcript: string): Promise<void> {
    this.setState('processing');

    try {
      const response = await fridayApi.sendVoiceMessage(transcript, this.conversationId);
      if (response.success && response.data) {
        if (response.data.conversationId) {
          this.conversationId = response.data.conversationId;
        }

        const replyText = response.data.reply;
        const spokenText = response.data.spokenText || replyText;
        const toolCalls = response.data.toolCalls;

        this.callbacks.onResponse?.(replyText, spokenText, toolCalls, this.conversationId);
        this.speak(spokenText);
      } else {
        const errorMsg = response.error || "I couldn't process your request right now. Please try again.";
        this.setState('error');
        this.callbacks.onError?.(errorMsg);
        this.speak("I couldn't process that right now. Please try again.");
      }
    } catch (err: any) {
      const errorMsg = err.message || "Voice connection to FRIDAY failed.";
      this.setState('error');
      this.callbacks.onError?.(errorMsg);
      this.speak("FRIDAY is temporarily unavailable. Please try again.");
    }
  }

  private speak(text: string): void {
    if (!('speechSynthesis' in window)) {
      this.setState('listening');
      return;
    }

    // Cancel any existing utterance
    window.speechSynthesis.cancel();

    this.setState('speaking');
    const utterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance = utterance;

    utterance.lang = 'en-US';
    utterance.rate = 1.05; // Natural, confident coaching pace
    utterance.pitch = 1.0;

    // Pick best English voice if available
    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(v => 
      (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel')) && v.lang.startsWith('en')
    );
    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }

    utterance.onend = () => {
      this.currentUtterance = null;
      if (!this.isExplicitlyStopped) {
        this.setState('listening');
      } else {
        this.setState('idle');
      }
    };

    utterance.onerror = (e) => {
      // Interrupted errors are expected when user cuts off speech
      this.currentUtterance = null;
      if (!this.isExplicitlyStopped) {
        this.setState('listening');
      }
    };

    window.speechSynthesis.speak(utterance);
  }

  interrupt(): void {
    if (window.speechSynthesis && (window.speechSynthesis.speaking || window.speechSynthesis.pending)) {
      window.speechSynthesis.cancel();
    }
    this.currentUtterance = null;
    this.setState('interrupted');
    setTimeout(() => {
      if (!this.isExplicitlyStopped) {
        this.setState('listening');
      }
    }, 200);
  }

  stop(): void {
    this.isExplicitlyStopped = true;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Ignore
      }
      this.recognition = null;
    }

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.currentUtterance = null;

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    this.setState('idle');
  }
}
