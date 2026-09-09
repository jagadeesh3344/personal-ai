import { AIProvider, ChatMessage } from './ai/AIProvider.js';
import { GeminiProvider } from './ai/GeminiProvider.js';
import { FRIDAY_SYSTEM_PROMPT } from './ai/prompt.js';
import { FRIDAY_TOOL_DEFINITIONS, executeBackendTool } from './tools/fridayTools.js';
import { FridayRepository } from '../../repositories/friday.repo.js';

export interface FridayAgentResponse {
  conversationId: string;
  reply: string;
  toolCalls?: Array<{
    name: string;
    arguments: Record<string, any>;
    result: any;
  }>;
}

export class FridayAgent {
  private aiProvider: AIProvider;

  constructor(aiProvider?: AIProvider) {
    this.aiProvider = aiProvider || new GeminiProvider();
  }

  async processUserMessage(
    userId: string,
    messageText: string,
    conversationId?: string
  ): Promise<FridayAgentResponse> {
    // 1. Get or create conversation record for authenticated user
    const conversation = await FridayRepository.getOrCreateConversation(userId, conversationId);

    // 2. Persist user incoming message
    await FridayRepository.saveMessage(userId, conversation.id, 'user', messageText);

    // 3. Load short-term history & long-term memory
    const recentMessages = await FridayRepository.getRecentMessages(userId, conversation.id, 10);
    const longTermMemories = await FridayRepository.getLongTermMemories(userId);

    // 4. Construct memory context
    let memoryPrompt = '';
    if (longTermMemories.length > 0) {
      memoryPrompt = `\n### USER'S ESTABLISHED PREFERENCES & MEMORY:\n` +
        longTermMemories.map(m => `- ${m.key}: ${m.value}`).join('\n');
    }

    const fullSystemInstruction = `${FRIDAY_SYSTEM_PROMPT}${memoryPrompt}`;

    const formattedMessages: ChatMessage[] = recentMessages.map(m => ({
      role: m.sender === 'friday' ? 'model' : 'user',
      content: m.text
    }));

    // 5. Query Gemini Provider with registered tools
    const initialResult = await this.aiProvider.generate({
      systemInstruction: fullSystemInstruction,
      messages: formattedMessages,
      tools: FRIDAY_TOOL_DEFINITIONS
    });

    // 6. Handle Tool Calling Loop if requested by model
    const executedTools: Array<{ name: string; arguments: Record<string, any>; result: any }> = [];
    let finalReply = initialResult.text;

    if (initialResult.toolCalls && initialResult.toolCalls.length > 0) {
      for (const call of initialResult.toolCalls) {
        try {
          const result = await executeBackendTool(userId, call.name, call.arguments);
          executedTools.push({
            name: call.name,
            arguments: call.arguments,
            result
          });
        } catch (err: any) {
          executedTools.push({
            name: call.name,
            arguments: call.arguments,
            result: { error: err.message || 'Tool execution failed' }
          });
        }
      }

      // Feed tool execution results back to generate natural conversational summary
      const followUpMessages: ChatMessage[] = [
        ...formattedMessages,
        {
          role: 'user',
          content: `Tool Execution Results:\n${JSON.stringify(executedTools, null, 2)}\nProvide a natural, concise, coaching response directly addressing the user based strictly on these actual results.`
        }
      ];

      try {
        const followUp = await this.aiProvider.generate({
          systemInstruction: fullSystemInstruction,
          messages: followUpMessages
        });
        finalReply = followUp.text || this.formatFallbackFromToolResults(executedTools);
      } catch {
        finalReply = this.formatFallbackFromToolResults(executedTools);
      }
    }

    if (!finalReply) {
      finalReply = "I have reviewed your request. Telemetry status is synchronized.";
    }

    // 7. Persist FRIDAY response message with tool metadata
    await FridayRepository.saveMessage(
      userId, 
      conversation.id, 
      'friday', 
      finalReply, 
      { toolCalls: executedTools }
    );

    // 8. Extract long-term preferences if mentioned (e.g. "I don't like burpees")
    this.extractAndSavePreferences(userId, messageText).catch(err => {
      console.warn('[FridayAgent] Memory preference extraction warning:', err.message);
    });

    return {
      conversationId: conversation.id,
      reply: finalReply,
      toolCalls: executedTools.length > 0 ? executedTools : undefined
    };
  }

  private formatFallbackFromToolResults(tools: Array<{ name: string; result: any }>): string {
    const hydrTool = tools.find(t => t.name === 'logHydration');
    if (hydrTool && !hydrTool.result.error) {
      return `Logged ${hydrTool.result.entry?.amountMl || 500} ml of water. Your current total is ${hydrTool.result.status?.consumedMl} ml of your ${hydrTool.result.status?.targetMl} ml target.`;
    }

    const hydrSummary = tools.find(t => t.name === 'getHydrationSummary');
    if (hydrSummary && !hydrSummary.result.error) {
      return `You have consumed ${hydrSummary.result.consumedMl} ml of water today (${hydrSummary.result.percentage}% of your ${hydrSummary.result.targetMl} ml target).`;
    }

    const workoutToday = tools.find(t => t.name === 'getTodayWorkout');
    if (workoutToday && !workoutToday.result.error) {
      const names = (workoutToday.result.exercises || []).map((e: any) => e.name).join(', ');
      return `Today's protocol: ${workoutToday.result.dayName}. Planned exercises: ${names}.`;
    }

    const progressSummary = tools.find(t => t.name === 'getProgressSummary');
    if (progressSummary && !progressSummary.result.error) {
      const count = progressSummary.result.measurements?.length || 0;
      return `You have ${count} logged biometric measurements on record. Keep maintaining consistent adherence.`;
    }

    return "Action completed and recorded to your telemetry log.";
  }

  private async extractAndSavePreferences(userId: string, message: string): Promise<void> {
    const lower = message.toLowerCase();
    if (lower.includes("don't like") || lower.includes("dislike") || lower.includes("hate")) {
      await FridayRepository.saveLongTermMemory(userId, 'disliked_activity', message, 'preferences');
    } else if (lower.includes("prefer") || lower.includes("only have")) {
      await FridayRepository.saveLongTermMemory(userId, 'workout_preference', message, 'preferences');
    }
  }
}
