import { ToolDefinition } from '../ai/AIProvider.js';
import { ProfileService } from '../../../services/profile.service.js';
import { WorkoutsService } from '../../../services/workouts.service.js';
import { NutritionService } from '../../../services/nutrition.service.js';
import { HydrationService } from '../../../services/hydration.service.js';
import { ProgressService } from '../../../services/progress.service.js';

export const FRIDAY_TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: 'getUserProfile',
    description: 'Retrieves the authenticated user biometrics, fitness goal, training environment, and available equipment.',
    parameters: { type: 'object', properties: {} }
  },
  {
    name: 'getTodayWorkout',
    description: 'Retrieves today targeted workout routine, equipment requirements, exercises, target sets and reps.',
    parameters: { type: 'object', properties: {} }
  },
  {
    name: 'startWorkout',
    description: 'Starts a new live workout session for the authenticated user.',
    parameters: {
      type: 'object',
      properties: {
        notes: { type: 'string', description: 'Optional workout session notes' }
      }
    }
  },
  {
    name: 'logWorkoutSet',
    description: 'Logs a completed exercise set to an active workout session. Validates equipment compatibility.',
    parameters: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'The active workout session ID' },
        exerciseId: { type: 'string', description: 'The exercise identifier' },
        setNumber: { type: 'number', description: 'Set index' },
        weightKg: { type: 'number', description: 'Weight used in kilograms' },
        reps: { type: 'number', description: 'Completed repetition count' },
        completed: { type: 'boolean', description: 'Whether set was fully completed' }
      },
      required: ['sessionId', 'exerciseId', 'setNumber', 'weightKg', 'reps']
    }
  },
  {
    name: 'completeWorkout',
    description: 'Finalizes and marks an active workout session as completed.',
    parameters: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'ID of session to finalize' },
        durationSeconds: { type: 'number', description: 'Workout duration in seconds' },
        notes: { type: 'string', description: 'Summary notes' }
      },
      required: ['sessionId']
    }
  },
  {
    name: 'getNutritionSummary',
    description: 'Retrieves current daily caloric and macronutrient targets and consumed totals.',
    parameters: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Date in YYYY-MM-DD format (defaults to today)' }
      }
    }
  },
  {
    name: 'logMeal',
    description: 'Logs a meal or food item for the authenticated user.',
    parameters: {
      type: 'object',
      properties: {
        type: { type: 'string', description: 'BREAKFAST, LUNCH, DINNER, or SNACK' },
        name: { type: 'string', description: 'Name of the meal' },
        totalCalories: { type: 'number', description: 'Total calories' },
        totalProtein: { type: 'number', description: 'Total protein in grams' },
        totalCarbs: { type: 'number', description: 'Total carbohydrates in grams' },
        totalFat: { type: 'number', description: 'Total fat in grams' }
      },
      required: ['type', 'name', 'totalCalories', 'totalProtein']
    }
  },
  {
    name: 'getHydrationSummary',
    description: 'Retrieves current hydration telemetry (consumed ml, target ml, remaining ml, percentage).',
    parameters: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Date in YYYY-MM-DD format (defaults to today)' }
      }
    }
  },
  {
    name: 'logHydration',
    description: 'Logs a specific volume of consumed water in milliliters.',
    parameters: {
      type: 'object',
      properties: {
        amountMl: { type: 'number', description: 'Milliliters of water consumed (e.g. 250, 500)' }
      },
      required: ['amountMl']
    }
  },
  {
    name: 'getProgressSummary',
    description: 'Retrieves bodyweight progression history, body measurements, and monthly checkins.',
    parameters: { type: 'object', properties: {} }
  }
];

export async function executeBackendTool(
  userId: string,
  toolName: string,
  args: Record<string, any>
): Promise<any> {
  // Validate tool exists
  const toolDef = FRIDAY_TOOL_DEFINITIONS.find(t => t.name === toolName);
  if (!toolDef) {
    throw new Error(`Unauthorized tool execution: "${toolName}" is not a registered FRIDAY tool.`);
  }

  // Execute strictly with authenticated userId
  switch (toolName) {
    case 'getUserProfile': {
      return ProfileService.getProfile(userId);
    }
    case 'getTodayWorkout': {
      return WorkoutsService.getTodayWorkout(userId);
    }
    case 'startWorkout': {
      const session = await WorkoutsService.createSession(userId, { notes: args.notes || 'Live FRIDAY Session' });
      const today = await WorkoutsService.getTodayWorkout(userId);
      return { session, today };
    }
    case 'logWorkoutSet': {
      let sessionId = args.sessionId;
      if (!sessionId) {
        const sessions = await WorkoutsService.getSessions(userId);
        const active = sessions.find(s => !s.completed);
        if (active) {
          sessionId = active.id;
        } else {
          const newSession = await WorkoutsService.createSession(userId, { notes: 'Live Voice Session' });
          sessionId = newSession.id;
        }
      }
      let exerciseId = args.exerciseId;
      if (!exerciseId) {
        const todayWorkout = await WorkoutsService.getTodayWorkout(userId);
        exerciseId = todayWorkout.exercises[0]?.exerciseId || 'push-up';
      }
      const reps = typeof args.reps === 'number' ? args.reps : 10;
      const weightKg = typeof args.weightKg === 'number' ? args.weightKg : 0;
      return WorkoutsService.addSet(userId, sessionId, {
        exerciseId,
        setNumber: args.setNumber || 1,
        weightKg,
        reps,
        completed: args.completed ?? true,
        completionMethod: args.completionMethod || 'VOICE',
        verification: args.verification || 'SELF_REPORTED'
      });
    }
    case 'completeWorkout': {
      let sessionId = args.sessionId;
      if (!sessionId) {
        const sessions = await WorkoutsService.getSessions(userId);
        const active = sessions.find(s => !s.completed);
        if (active) {
          sessionId = active.id;
        } else {
          throw new Error('No active workout session found to complete.');
        }
      }
      return WorkoutsService.completeSession(userId, sessionId, args.durationSeconds || 1800, args.notes);
    }

    case 'getNutritionSummary': {
      const targets = await NutritionService.getTargets(userId);
      const meals = await NutritionService.getTodayMeals(userId, args.date);
      return { targets, ...meals };
    }
    case 'logMeal': {
      if (!args.name || typeof args.totalCalories !== 'number') {
        throw new Error('Invalid meal arguments: name and totalCalories are required.');
      }
      return NutritionService.createMeal(userId, {
        date: new Date().toISOString().split('T')[0],
        type: args.type || 'SNACK',
        name: args.name,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        totalCalories: args.totalCalories,
        totalProtein: args.totalProtein || 0,
        totalCarbs: args.totalCarbs || 0,
        totalFat: args.totalFat || 0,
        items: []
      });
    }
    case 'getHydrationSummary': {
      return HydrationService.getTodayHydration(userId, args.date);
    }
    case 'logHydration': {
      const amount = Number(args.amountMl);
      if (!amount || isNaN(amount) || amount <= 0) {
        throw new Error('Invalid hydration amount: amountMl must be a positive number.');
      }
      const entry = await HydrationService.logHydration(userId, amount);
      const updated = await HydrationService.getTodayHydration(userId);
      return { entry, status: updated };
    }
    case 'getProgressSummary': {
      return ProgressService.getProgress(userId);
    }
    default:
      throw new Error(`Unhandled tool: ${toolName}`);
  }
}
