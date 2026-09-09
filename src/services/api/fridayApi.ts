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

export const fridayApi = {
  async sendMessage(message: string, conversationId?: string): Promise<FridayChatResponse> {
    return apiClient.post<FridayChatResponse>('/friday/message', {
      message,
      conversationId
    });
  },

  async getHistory(conversationId: string) {
    return apiClient.get<{ success: boolean; messages: any[] }>(`/friday/history/${conversationId}`);
  }
};
