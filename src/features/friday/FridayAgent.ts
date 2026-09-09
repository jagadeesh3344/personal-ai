import { FridayTool } from './tools/FridayTool';
import { FRIDAY_SYSTEM_TOOLS } from './tools/systemTools';

export class FridayAgent {
  private tools: Map<string, FridayTool> = new Map();

  constructor() {
    FRIDAY_SYSTEM_TOOLS.forEach(tool => {
      this.tools.set(tool.name, tool);
    });
  }

  getRegisteredTools(): FridayTool[] {
    return Array.from(this.tools.values());
  }

  getTool(name: string): FridayTool | undefined {
    return this.tools.get(name);
  }

  async executeTool(name: string, input: Record<string, unknown>): Promise<unknown> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool "${name}" is not registered on FRIDAY Agent.`);
    }
    return tool.execute(input);
  }

  /**
   * Evaluates user intent and executes local action or prepares prompt context for future backend LLM calls.
   */
  async processIntent(userInput: string): Promise<{ reply: string; toolCalled?: string; toolResult?: unknown }> {
    const normalized = userInput.toLowerCase().trim();

    // Natural language command heuristics for local actions
    if (normalized.includes('water') && (normalized.includes('drank') || normalized.includes('log') || normalized.includes('add'))) {
      const match = normalized.match(/(\d+)\s*ml/);
      const amount = match ? parseInt(match[1], 10) : 250;
      const res = await this.executeTool('logHydration', { amountMl: amount });
      return {
        reply: `Logged ${amount} ml of water. Your telemetry has been updated.`,
        toolCalled: 'logHydration',
        toolResult: res
      };
    }

    if (normalized.includes('workout') || normalized.includes('today')) {
      const workout = await this.executeTool('getTodayWorkout', {}) as any;
      if (workout?.today) {
        const names = workout.today.exercises.map((e: any) => e.name).join(', ');
        return {
          reply: `Today's session is "${workout.today.dayName}". Target exercises: ${names}.`,
          toolCalled: 'getTodayWorkout',
          toolResult: workout
        };
      }
      return {
        reply: 'No active workout is scheduled for today. You can configure your routine in Settings.',
        toolCalled: 'getTodayWorkout'
      };
    }

    if (normalized.includes('protein') || normalized.includes('nutrition') || normalized.includes('calories')) {
      const nut = await this.executeTool('getNutritionSummary', {}) as any;
      if (nut?.targets) {
        return {
          reply: `Today you have logged ${nut.consumed.calories} / ${nut.targets.targetCalories} kcal and ${nut.consumed.protein} / ${nut.targets.proteinGrams}g of protein.`,
          toolCalled: 'getNutritionSummary',
          toolResult: nut
        };
      }
      return {
        reply: 'Complete your onboarding profile to calculate your personalized nutrition targets.',
        toolCalled: 'getNutritionSummary'
      };
    }

    return {
      reply: "FRIDAY Agent online. I am monitoring your telemetry and training metrics. What would you like to review?"
    };
  }
}

export const defaultFridayAgent = new FridayAgent();
