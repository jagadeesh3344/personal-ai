import { FridayTool } from './FridayTool';
import { ProfileRepository } from '../../../services/repositories/ProfileRepository';
import { WorkoutRepository } from '../../../services/repositories/WorkoutRepository';
import { NutritionRepository } from '../../../services/repositories/NutritionRepository';
import { HydrationRepository } from '../../../services/repositories/HydrationRepository';
import { ProgressRepository } from '../../../services/repositories/ProgressRepository';
import { calculateNutritionTargets } from '../../../utils/nutritionCalculator';
import { calculateHydrationTarget } from '../../../utils/hydrationCalculator';

export const getUserProfileTool: FridayTool = {
  name: 'getUserProfile',
  description: 'Retrieves the authenticated user profile biometrics, goal, and training environment.',
  parameters: { type: 'object', properties: {} },
  execute: async () => {
    return ProfileRepository.getProfile();
  }
};

export const getTodayWorkoutTool: FridayTool = {
  name: 'getTodayWorkout',
  description: 'Retrieves active workout day routine, target exercises, sets and reps.',
  parameters: { type: 'object', properties: {} },
  execute: async () => {
    const plan = WorkoutRepository.getActivePlan();
    if (!plan || plan.days.length === 0) return { status: 'NO_ACTIVE_PLAN' };
    return { planName: plan.name, today: plan.days[0] };
  }
};

export const startWorkoutTool: FridayTool<{ dayId: string }> = {
  name: 'startWorkout',
  description: 'Starts a workout session for the specified day.',
  parameters: {
    type: 'object',
    properties: {
      dayId: { type: 'string', description: 'ID of the workout day to initiate' }
    },
    required: ['dayId']
  },
  execute: async ({ dayId }) => {
    const plan = WorkoutRepository.getActivePlan();
    const day = plan?.days.find(d => d.id === dayId) || plan?.days[0];
    if (!day) return { status: 'DAY_NOT_FOUND' };

    const session = {
      id: `sess-${Date.now()}`,
      userId: plan.userId,
      planId: plan.id,
      dayId: day.id,
      dayName: day.dayName,
      startedAt: new Date().toISOString(),
      completed: false,
      exercises: day.exercises
    };
    WorkoutRepository.saveSession(session);
    return { status: 'WORKOUT_STARTED', session };
  }
};

export const logWorkoutSetTool: FridayTool<{ sessionId: string; exerciseId: string; weightKg: number; reps: number }> = {
  name: 'logWorkoutSet',
  description: 'Logs a completed set for an exercise in the active session.',
  parameters: {
    type: 'object',
    properties: {
      sessionId: { type: 'string', description: 'Active workout session ID' },
      exerciseId: { type: 'string', description: 'Exercise ID' },
      weightKg: { type: 'number', description: 'Weight in kilograms used for set' },
      reps: { type: 'number', description: 'Number of repetitions completed' }
    },
    required: ['sessionId', 'exerciseId', 'weightKg', 'reps']
  },
  execute: async ({ sessionId, exerciseId, weightKg, reps }) => {
    const sessions = WorkoutRepository.getSessions();
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return { status: 'SESSION_NOT_FOUND' };

    const exercise = session.exercises.find(e => e.id === exerciseId || e.exerciseId === exerciseId);
    if (!exercise) return { status: 'EXERCISE_NOT_FOUND' };

    const newSet = {
      id: `set-${Date.now()}`,
      setNumber: exercise.sets.length + 1,
      weightKg,
      reps,
      completed: true,
      completedAt: new Date().toISOString()
    };
    exercise.sets.push(newSet);
    WorkoutRepository.saveSession(session);
    return { status: 'SET_LOGGED', set: newSet };
  }
};

export const completeWorkoutTool: FridayTool<{ sessionId: string }> = {
  name: 'completeWorkout',
  description: 'Marks an active workout session as completed.',
  parameters: {
    type: 'object',
    properties: {
      sessionId: { type: 'string', description: 'Session ID to finalize' }
    },
    required: ['sessionId']
  },
  execute: async ({ sessionId }) => {
    const sessions = WorkoutRepository.getSessions();
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return { status: 'SESSION_NOT_FOUND' };

    session.completed = true;
    session.completedAt = new Date().toISOString();
    WorkoutRepository.saveSession(session);
    return { status: 'WORKOUT_COMPLETED', session };
  }
};

export const getNutritionSummaryTool: FridayTool<{ dateStr?: string }> = {
  name: 'getNutritionSummary',
  description: 'Calculates targets and consumed calories, protein, carbs, and fat for the given date.',
  parameters: {
    type: 'object',
    properties: {
      dateStr: { type: 'string', description: 'Date in YYYY-MM-DD format (defaults to today)' }
    }
  },
  execute: async ({ dateStr }) => {
    const date = dateStr || new Date().toISOString().split('T')[0];
    const profile = ProfileRepository.getProfile();
    const targets = profile ? calculateNutritionTargets(profile) : null;
    const meals = NutritionRepository.getMeals(date);

    const consumed = {
      calories: meals.reduce((a, m) => a + m.totalCalories, 0),
      protein: meals.reduce((a, m) => a + m.totalProtein, 0),
      carbs: meals.reduce((a, m) => a + m.totalCarbs, 0),
      fat: meals.reduce((a, m) => a + m.totalFat, 0)
    };

    return { date, targets, consumed, meals };
  }
};

export const logMealTool: FridayTool<{ mealId: string; name: string; calories: number; protein: number; carbs?: number; fat?: number }> = {
  name: 'logMeal',
  description: 'Logs a food item into a specific meal (Breakfast, Lunch, Dinner, Snack).',
  parameters: {
    type: 'object',
    properties: {
      mealId: { type: 'string', description: 'Target meal ID (e.g. m-breakfast, m-lunch, m-dinner, m-snack)' },
      name: { type: 'string', description: 'Name of the food item' },
      calories: { type: 'number', description: 'Calories' },
      protein: { type: 'number', description: 'Protein in grams' },
      carbs: { type: 'number', description: 'Carbs in grams' },
      fat: { type: 'number', description: 'Fat in grams' }
    },
    required: ['mealId', 'name', 'calories', 'protein']
  },
  execute: async ({ mealId, name, calories, protein, carbs = 0, fat = 0 }) => {
    const today = new Date().toISOString().split('T')[0];
    const item = {
      id: `fi-${Date.now()}`,
      name,
      calories,
      protein,
      carbs,
      fat
    };
    NutritionRepository.addMealItem(today, mealId, item);
    return { status: 'MEAL_ITEM_LOGGED', item };
  }
};

export const getHydrationSummaryTool: FridayTool<{ dateStr?: string }> = {
  name: 'getHydrationSummary',
  description: 'Retrieves current water intake and daily target.',
  parameters: {
    type: 'object',
    properties: {
      dateStr: { type: 'string', description: 'Date in YYYY-MM-DD format (defaults to today)' }
    }
  },
  execute: async ({ dateStr }) => {
    const date = dateStr || new Date().toISOString().split('T')[0];
    const profile = ProfileRepository.getProfile();
    const targetMl = profile ? calculateHydrationTarget(profile) : 2500;
    return HydrationRepository.getHydration(date, targetMl);
  }
};

export const logHydrationTool: FridayTool<{ amountMl: number }> = {
  name: 'logHydration',
  description: 'Logs consumed water amount in milliliters.',
  parameters: {
    type: 'object',
    properties: {
      amountMl: { type: 'number', description: 'Amount of water consumed in milliliters (e.g. 250, 500)' }
    },
    required: ['amountMl']
  },
  execute: async ({ amountMl }) => {
    const date = new Date().toISOString().split('T')[0];
    const profile = ProfileRepository.getProfile();
    const targetMl = profile ? calculateHydrationTarget(profile) : 2500;
    const updated = HydrationRepository.logWater(date, amountMl, targetMl);
    return { status: 'WATER_LOGGED', hydration: updated };
  }
};

export const getProgressSummaryTool: FridayTool = {
  name: 'getProgressSummary',
  description: 'Retrieves historical weight readings and body measurements.',
  parameters: { type: 'object', properties: {} },
  execute: async () => {
    return ProgressRepository.getProgress();
  }
};

export const FRIDAY_SYSTEM_TOOLS: FridayTool[] = [
  getUserProfileTool,
  getTodayWorkoutTool,
  startWorkoutTool,
  logWorkoutSetTool,
  completeWorkoutTool,
  getNutritionSummaryTool,
  logMealTool,
  getHydrationSummaryTool,
  logHydrationTool,
  getProgressSummaryTool
];
