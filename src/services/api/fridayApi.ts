import { apiClient } from './client';

export interface FridayChatResponse {
  success: boolean;
  data: {
    conversationId: string;
    message: string;
    toolCalls?: Array<{
      name: string;
      arguments: Record<string, any>;
      result: any;
    }>;
  };
  error?: string;
}

export interface FridayVoiceResponse {
  success: boolean;
  data: {
    conversationId: string;
    reply: string;
    spokenText: string;
    toolCalls?: Array<{
      name: string;
      arguments: Record<string, any>;
      result: any;
    }>;
  };
  error?: string;
}

export const fridayApi = {
  async sendMessage(message: string, conversationId?: string): Promise<FridayChatResponse> {
    return apiClient.post<FridayChatResponse>('/friday/message', {
      message,
      conversationId
    });
  },

  async sendVoiceMessage(transcript: string, conversationId?: string): Promise<FridayVoiceResponse> {
    return apiClient.post<FridayVoiceResponse>('/friday/voice/message', {
      transcript,
      conversationId
    });
  },

  async startVoiceSession(): Promise<{ success: boolean; data: { sessionId: string; userId: string } }> {
    return apiClient.post('/friday/voice/session', {});
  },

  async getHistory(conversationId: string) {
    return apiClient.get<{ success: boolean; messages: any[] }>(`/friday/history/${conversationId}`);
  },

  async getTodayCoaching() {
    return apiClient.get<{ success: boolean; coaching: any }>('/friday/coaching/today');
  },

  async getWeeklyCoaching() {
    return apiClient.get<{ success: boolean; review: any }>('/friday/coaching/weekly');
  }
};

