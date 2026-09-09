import { FridayAgent, FridayAgentResponse } from '../modules/friday/FridayAgent.js';
import { FridayRepository } from '../repositories/friday.repo.js';

const agentInstance = new FridayAgent();

export class FridayService {
  static async handleMessage(
    userId: string, 
    message: string, 
    conversationId?: string
  ): Promise<FridayAgentResponse> {
    return agentInstance.processUserMessage(userId, message, conversationId);
  }

  static async getConversationHistory(userId: string, conversationId: string) {
    return FridayRepository.getRecentMessages(userId, conversationId, 30);
  }
}
