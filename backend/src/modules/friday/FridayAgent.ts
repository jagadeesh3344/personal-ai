import { AIProvider, ChatMessage } from './ai/AIProvider.js';
import { GeminiProvider } from './ai/GeminiProvider.js';
import { FRIDAY_SYSTEM_PROMPT } from './ai/prompt.js';
import { FRIDAY_TOOL_DEFINITIONS, executeBackendTool } from './tools/fridayTools.js';
import { FridayRepository } from '../../repositories/friday.repo.js';
import { ProfileRepository } from '../../repositories/profile.repo.js';
import { logFridayEvent } from './ai/fridayLogger.js';

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

    logFridayEvent('FRIDAY_REQUEST', {
      userId,
      conversationId: conversation.id,
      messageLength: messageText.length
    });

    // 2. Persist user incoming message
    await FridayRepository.saveMessage(userId, conversation.id, 'user', messageText);

    // 3. Load short-term history, long-term memory, and user equipment profile
    const recentMessages = await FridayRepository.getRecentMessages(userId, conversation.id, 10);
    const longTermMemories = await FridayRepository.getLongTermMemories(userId);
    const profile = await ProfileRepository.getProfile(userId);

    // 4. Construct equipment safety & memory context
    let memoryPrompt = '';
    if (longTermMemories.length > 0) {
      memoryPrompt += `\n### USER'S ESTABLISHED PREFERENCES & MEMORY:\n` +
        longTermMemories.map(m => `- ${m.key}: ${m.value}`).join('\n');
    }

    const equipmentConstraint = `\n### USER PROFILE & EQUIPMENT SAFETY CONSTRAINTS:\n` +
      `- Environment: ${profile?.trainingEnvironment || 'HOME'}\n` +
      `- Stored Equipment: ${(profile?.equipment || ['NONE']).join(', ')}\n` +
      `- Fitness Goal: ${profile?.goal || 'GENERAL_FITNESS'}\n` +
      `STRICT RULE: Never recommend equipment not listed above. The deterministic workout engine is the ultimate authority.\n`;

    const fullSystemInstruction = `${FRIDAY_SYSTEM_PROMPT}${equipmentConstraint}${memoryPrompt}`;

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
        logFridayEvent('TOOL_CALL_REQUESTED', {
          tool: call.name,
          arguments: call.arguments
        });

        try {
          const result = await executeBackendTool(userId, call.name, call.arguments);
          logFridayEvent('TOOL_EXECUTED', { tool: call.name, success: true });
          logFridayEvent('TOOL_RESULT_RETURNED', { tool: call.name, result });
          executedTools.push({
            name: call.name,
            arguments: call.arguments,
            result
          });
        } catch (err: any) {
          logFridayEvent('TOOL_EXECUTED', { tool: call.name, success: false, error: err.message });
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
          content: `Tool Execution Results:\n${JSON.stringify(executedTools, null, 2)}\nProvide a natural, encouraging coaching response directly addressing the user based strictly on these actual results.`
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
      finalReply = "I have updated your training log. What would you like to focus on next?";
    }

    // 7. Persist FRIDAY response message with tool metadata
    await FridayRepository.saveMessage(
      userId, 
      conversation.id, 
      'friday', 
      finalReply, 
      { toolCalls: executedTools }
    );

    logFridayEvent('FRIDAY_FINAL_RESPONSE', {
      conversationId: conversation.id,
      replyLength: finalReply.length,
      toolsCount: executedTools.length
    });

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
      const amount = hydrTool.result.entry?.amountMl || 500;
      const consumed = hydrTool.result.status?.consumedMl;
      const target = hydrTool.result.status?.targetMl;
      return `Logged ${amount} ml of water for you. You've reached ${consumed} ml toward your ${target} ml daily target. Great hydration habit!`;
    }

    const hydrSummary = tools.find(t => t.name === 'getHydrationSummary');
    if (hydrSummary && !hydrSummary.result.error) {
      return `You have had ${hydrSummary.result.consumedMl} ml of water today (${hydrSummary.result.percentage}% of your ${hydrSummary.result.targetMl} ml goal). Keep it up!`;
    }

    const workoutToday = tools.find(t => t.name === 'getTodayWorkout');
    if (workoutToday && !workoutToday.result.error) {
      const names = (workoutToday.result.exercises || []).map((e: any) => e.name).join(', ');
      return `Here is your workout for today: ${workoutToday.result.dayName}. Planned exercises: ${names}. Let's get to work!`;
    }

    const progressSummary = tools.find(t => t.name === 'getProgressSummary');
    if (progressSummary && !progressSummary.result.error) {
      const count = progressSummary.result.measurements?.length || 0;
      return `You currently have ${count} biometric entries logged. Keep staying consistent with your training and measurements!`;
    }

    const nutritionSummary = tools.find(t => t.name === 'getNutritionSummary');
    if (nutritionSummary && !nutritionSummary.result.error) {
      const targets = nutritionSummary.result.targets;
      if (targets) {
        return `Your daily nutrition targets are ${targets.targetCalories} kcal with ${targets.proteinGrams}g of protein, ${targets.carbsGrams}g of carbs, and ${targets.fatGrams}g of fat.`;
      }
    }

    const startWorkoutTool = tools.find(t => t.name === 'startWorkout');
    if (startWorkoutTool && !startWorkoutTool.result.error) {
      const today = startWorkoutTool.result.today;
      const firstEx = today?.exercises?.[0]?.name || 'your first exercise';
      return `Workout session initiated. First exercise on deck: ${firstEx}. Let's get after it!`;
    }

    const logSetTool = tools.find(t => t.name === 'logWorkoutSet');
    if (logSetTool && !logSetTool.result.error) {
      const reps = logSetTool.result.reps || 10;
      return `Set logged: ${reps} reps recorded. Catch your breath and prepare for the next set.`;
    }

    const completeWorkoutTool = tools.find(t => t.name === 'completeWorkout');
    if (completeWorkoutTool && !completeWorkoutTool.result.error) {
      return `Workout complete! Phenomenal training effort today. Your entire session has been saved to your progress record.`;
    }

    return "I've recorded that in your training log. What would you like to review next?";
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

