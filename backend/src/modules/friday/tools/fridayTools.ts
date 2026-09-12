import { ToolDefinition } from '../ai/AIProvider.js';
import { ProfileService } from '../../../services/profile.service.js';
import { WorkoutsService } from '../../../services/workouts.service.js';
import { NutritionService } from '../../../services/nutrition.service.js';
import { HydrationService } from '../../../services/hydration.service.js';
import { ProgressService } from '../../../services/progress.service.js';
import { CoachingEngine } from '../coaching/coachingEngine.js';

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
    name: 'getDailyNutritionState',
    description: 'Retrieves authoritative daily nutrition state: target calories and macros, consumed calories and macros, remaining calories and macros, logged meals, next recommended meal slot, workout completion status, and on-track evaluation for the authenticated user.',
    parameters: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Date in YYYY-MM-DD format (defaults to today)' }
      }
    }
  },
  {
    name: 'getMealRecommendation',
    description: 'Calculates a deterministic adaptive meal recommendation for a specific meal (or next meal slot) calibrated to remaining daily calories and macros, dietary preferences (STANDARD, VEGETARIAN, VEGAN, KETO, PALEO), allergies, intolerances, and today workout recovery status.',
    parameters: {
      type: 'object',
      properties: {
        mealType: { type: 'string', description: 'Target meal slot: "BREAKFAST", "LUNCH", "SNACK", "DINNER", or "NEXT"' },
        preferenceFilter: { type: 'string', description: 'Optional dietary or nutritional filter: "HIGH_PROTEIN", "VEGETARIAN", "VEGAN", "KETO", or "LOW_CALORIE"' },
        date: { type: 'string', description: 'Date in YYYY-MM-DD format' }
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
  },
  {
    name: 'getExerciseHistory',
    description: 'Retrieves actual historical exercise performance sets, performance classification (NO_HISTORY, INCOMPLETE, FAILED, CHALLENGING, GOOD, TOO_EASY), and deterministic progression status (NEW, DEVELOPING, STABLE, READY_TO_PROGRESS, NEEDS_REGRESSION) for the authenticated user.',
    parameters: {
      type: 'object',
      properties: {
        exerciseId: { type: 'string', description: 'Optional exercise ID (e.g. "knee-push-up", "wall-push-up", "box-squat") to evaluate' }
      }
    }
  },
  {
    name: 'getProgressIntelligence',
    description: 'Retrieves comprehensive deterministic progress intelligence for the authenticated user, including weight trend direction, workout completion rates, exercise progression states, nutrition adherence, body measurements, data quality, and goal-aligned status.',
    parameters: {
      type: 'object',
      properties: {
        periodDays: { type: 'number', description: 'Evaluation window in days (default 30)' }
      }
    }
  },
  {
    name: 'getTodayCoachingContext',
    description: 'Retrieves the authoritative daily coaching brief, including today workout status, nutrition adherence, hydration status, progress status, current coaching priority, and next recommended action.',
    parameters: { type: 'object', properties: {} }
  },
  {
    name: 'getWeeklyCoachingReview',
    description: 'Retrieves the authoritative weekly coaching review for the past 7 days, including workouts completed, consistency %, exercise improvements, nutrition tracking days, calorie & protein adherence, hydration consistency, weight trend, key accomplishments, areas needing attention, and next focus.',
    parameters: { type: 'object', properties: {} }
  },
  {
    name: 'getCoachingPriority',
    description: 'Evaluates the user immediate coaching priority (PROFILE_SETUP, WORKOUT, NUTRITION, HYDRATION, RECOVERY, PROGRESS_TRACKING) and returns the rationale and next recommended action.',
    parameters: { type: 'object', properties: {} }
  },
  {
    name: 'updateUserPreferences',
    description: 'Deterministically updates the user fitness preferences, equipment inventory, schedule, or disliked exercises in the database and long-term memory.',
    parameters: {
      type: 'object',
      properties: {
        message: { type: 'string', description: 'The natural language preference statement, e.g. "I bought dumbbells", "I dislike burpees", "I prefer vegetarian meals"' }
      },
      required: ['message']
    }
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
        completionMethod: 'VOICE',
        verification: 'SELF_REPORTED'
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
    case 'getDailyNutritionState': {
      return NutritionService.getDailyNutritionState(userId, args.date);
    }
    case 'getMealRecommendation': {
      return NutritionService.getAdaptiveMealRecommendation(userId, {
        mealType: args.mealType,
        preferenceFilter: args.preferenceFilter,
        date: args.date
      });
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
    case 'getProgressIntelligence': {
      return ProgressService.getProgressIntelligence(userId, args.periodDays ? Number(args.periodDays) : 30);
    }
    case 'getExerciseHistory': {
      return WorkoutsService.getExerciseHistoryWithProgression(userId, args.exerciseId);
    }
    case 'getTodayCoachingContext': {
      return CoachingEngine.getTodayCoaching(userId);
    }
    case 'getWeeklyCoachingReview': {
      return CoachingEngine.getWeeklyCoaching(userId);
    }
    case 'getCoachingPriority': {
      const brief = await CoachingEngine.getTodayCoaching(userId);
      return {
        priority: brief.priority,
        rationale: brief.priorityRationale,
        nextRecommendedAction: brief.nextRecommendedAction
      };
    }
    case 'updateUserPreferences': {
      return CoachingEngine.handlePreferenceOrProfileUpdate(userId, args.message || '');
    }
    default:
      throw new Error(`Unhandled tool: ${toolName}`);
  }
}
