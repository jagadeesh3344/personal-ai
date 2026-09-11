import { FridayAgent, FridayAgentResponse } from '../modules/friday/FridayAgent.js';
import { FridayRepository } from '../repositories/friday.repo.js';

import { CoachingEngine } from '../modules/friday/coaching/coachingEngine.js';

const agentInstance = new FridayAgent();

export class FridayService {
  static async handleMessage(
    userId: string, 
    message: string, 
    conversationId?: string
  ): Promise<FridayAgentResponse> {
    return agentInstance.processUserMessage(userId, message, conversationId);
  }

  static async handleVoiceMessage(
    userId: string,
    transcript: string,
    conversationId?: string
  ): Promise<FridayAgentResponse & { spokenText: string }> {
    const response = await agentInstance.processUserMessage(userId, transcript, conversationId);
    // Clean, natural speech text without markdown formatting
    const spokenText = response.reply
      .replace(/[*_#`~]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    return {
      ...response,
      spokenText
    };
  }

  static async getConversationHistory(userId: string, conversationId: string) {
    return FridayRepository.getRecentMessages(userId, conversationId, 30);
  }

  static async getTodayCoaching(userId: string) {
    return CoachingEngine.getTodayCoaching(userId);
  }

  static async getWeeklyCoaching(userId: string) {
    return CoachingEngine.getWeeklyCoaching(userId);
  }
}
