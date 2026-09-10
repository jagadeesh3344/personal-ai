import { NutritionRepository, MealEntity, NutritionTargetsEntity } from '../repositories/nutrition.repo.js';
import { ProfileRepository } from '../repositories/profile.repo.js';
import { WorkoutsRepository } from '../repositories/workouts.repo.js';
import {
  generateAdaptiveMealRecommendation,
  generateAdaptiveDailyMealPlan,
  getNextMealType
} from '../modules/nutrition/adaptive/nutritionPlanner.js';
import {
  DailyNutritionState,
  AdaptiveMealRecommendation,
  AdaptiveDailyMealPlan,
  WorkoutStatus,
  OnTrackStatus,
  MacroSplit,
  MealType
} from '../modules/nutrition/adaptive/types.js';

export class NutritionService {
  static calculateTargets(weightKg: number, heightCm: number, age: number, sex: string, activityLevel: string, goal: string): NutritionTargetsEntity {
    // Mifflin-St Jeor
    const base = (10 * weightKg) + (6.25 * heightCm) - (5 * age);
    let bmr = Math.round(base + (sex === 'MALE' ? 5 : (sex === 'FEMALE' ? -161 : -78)));

    const multipliers: Record<string, number> = {
      SEDENTARY: 1.2,
      LIGHTLY_ACTIVE: 1.375,
      MODERATELY_ACTIVE: 1.55,
      VERY_ACTIVE: 1.725
    };
    const mult = multipliers[activityLevel] || 1.55;
    const maintenance = Math.round(bmr * mult);

    let targetCalories = maintenance;
    let proteinMult = 1.8;

    switch (goal) {
      case 'FAT_LOSS':
        targetCalories = Math.round(maintenance * 0.80);
        proteinMult = 2.2;
        break;
      case 'GAIN_MUSCLE':
        targetCalories = Math.round(maintenance * 1.10);
        proteinMult = 2.0;
        break;
      case 'BODY_RECOMPOSITION':
        targetCalories = Math.round(maintenance * 0.95);
        proteinMult = 2.1;
        break;
      case 'STRENGTH':
        targetCalories = Math.round(maintenance * 1.05);
        proteinMult = 2.0;
        break;
      case 'ENDURANCE':
        targetCalories = Math.round(maintenance * 1.05);
        proteinMult = 1.5;
        break;
      default:
        targetCalories = maintenance;
        proteinMult = 1.8;
        break;
    }

    const minCals = sex === 'MALE' ? 1500 : 1200;
    if (targetCalories < minCals) targetCalories = minCals;

    const proteinGrams = Math.round(weightKg * proteinMult);
    const fatGrams = Math.round((targetCalories * 0.25) / 9);
    const carbsGrams = Math.max(0, Math.round((targetCalories - (proteinGrams * 4) - (fatGrams * 9)) / 4));

    return {
      userId: '',
      targetCalories,
      maintenanceCalories: maintenance,
      proteinGrams,
      carbsGrams,
      fatGrams,
      bmr
    };
  }

  static async getTargets(userId: string): Promise<NutritionTargetsEntity> {
    const existing = await NutritionRepository.getTargets(userId);
    if (existing) return existing;

    const profile = await ProfileRepository.getProfile(userId);
    const calculated = this.calculateTargets(
      profile?.currentWeightKg || 70,
      profile?.heightCm || 175,
      profile?.age || 25,
      profile?.sex || 'MALE',
      profile?.activityLevel || 'MODERATELY_ACTIVE',
      profile?.goal || 'GENERAL_FITNESS'
    );
    calculated.userId = userId;
    return NutritionRepository.saveTargets(userId, calculated);
  }

  static async getTodayMeals(userId: string, date?: string): Promise<{ date: string; meals: MealEntity[]; totals: { calories: number; protein: number; carbs: number; fat: number } }> {
    const today = date || new Date().toISOString().split('T')[0];
    const meals = await NutritionRepository.getMealsForDate(userId, today);
    const totals = meals.reduce(
      (acc, m) => ({
        calories: acc.calories + m.totalCalories,
        protein: acc.protein + m.totalProtein,
        carbs: acc.carbs + m.totalCarbs,
        fat: acc.fat + m.totalFat
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    return { date: today, meals, totals };
  }

  static async createMeal(
    userId: string, 
    data: Omit<MealEntity, 'id' | 'userId' | 'items'> & { items?: Array<Omit<MealEntity['items'][0], 'id'> & { id?: string }> }
  ): Promise<MealEntity> {
    return NutritionRepository.createMeal(userId, data);
  }

  static async updateMeal(userId: string, mealId: string, updates: Partial<MealEntity>): Promise<MealEntity> {
    return NutritionRepository.updateMeal(userId, mealId, updates);
  }

  static async deleteMeal(userId: string, mealId: string): Promise<boolean> {
    return NutritionRepository.deleteMeal(userId, mealId);
  }

  static async getDailyNutritionState(userId: string, date?: string): Promise<DailyNutritionState> {
    const today = date || new Date().toISOString().split('T')[0];
    const targets = await this.getTargets(userId);
    const mealsData = await this.getTodayMeals(userId, today);
    const profile = await ProfileRepository.getProfile(userId);

    // Workout status calculation from real database records
    const sessions = await WorkoutsRepository.getSessions(userId);
    const todaySessions = sessions.filter(s => s.date === today);
    let workoutStatus: WorkoutStatus = 'NOT_COMPLETED';

    if (todaySessions.some(s => s.completed)) {
      workoutStatus = 'COMPLETED';
    } else if (todaySessions.some(s => !s.completed)) {
      workoutStatus = 'PLANNED';
    } else {
      const dayOfWeek = new Date(today).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
      const plannedDays = (profile?.availableWorkoutDays || []).map(d => d.toUpperCase());
      if (plannedDays.includes(dayOfWeek)) {
        workoutStatus = 'PLANNED';
      } else {
        workoutStatus = 'REST_DAY';
      }
    }

    const caloriesConsumed = mealsData.totals.calories;
    const proteinConsumed = mealsData.totals.protein;
    const carbsConsumed = mealsData.totals.carbs;
    const fatConsumed = mealsData.totals.fat;

    const caloriesRemaining = Math.max(0, targets.targetCalories - caloriesConsumed);
    const proteinRemaining = Math.max(0, targets.proteinGrams - proteinConsumed);
    const carbsRemaining = Math.max(0, targets.carbsGrams - carbsConsumed);
    const fatRemaining = Math.max(0, targets.fatGrams - fatConsumed);

    const loggedMealTypes = mealsData.meals
      .filter(m => (m.items && m.items.length > 0) || m.totalCalories > 0)
      .map(m => m.type);

    const nextMealType = getNextMealType(loggedMealTypes);

    let onTrackStatus: OnTrackStatus = 'ON_TRACK';
    if (caloriesConsumed > targets.targetCalories + 150) {
      onTrackStatus = 'OVER_CALORIES';
    } else if (caloriesConsumed < targets.targetCalories * 0.4 && nextMealType === 'DAILY_COMPLETE') {
      onTrackStatus = 'UNDER_CALORIES';
    } else if (proteinRemaining > targets.proteinGrams * 0.45 && nextMealType === 'DAILY_COMPLETE') {
      onTrackStatus = 'PROTEIN_DEFICIT';
    }

    return {
      userId,
      date: today,
      targets: {
        targetCalories: targets.targetCalories,
        proteinGrams: targets.proteinGrams,
        carbsGrams: targets.carbsGrams,
        fatGrams: targets.fatGrams,
        maintenanceCalories: targets.maintenanceCalories,
        bmr: targets.bmr
      },
      consumed: {
        calories: caloriesConsumed,
        protein: proteinConsumed,
        carbs: carbsConsumed,
        fat: fatConsumed
      },
      remaining: {
        calories: caloriesRemaining,
        protein: proteinRemaining,
        carbs: carbsRemaining,
        fat: fatRemaining
      },
      meals: mealsData.meals,
      loggedMealTypes,
      nextMealType,
      workoutStatus,
      onTrackStatus
    };
  }

  static async getAdaptiveMealRecommendation(
    userId: string,
    options: {
      mealType?: MealType | 'NEXT';
      date?: string;
      preferenceFilter?: 'HIGH_PROTEIN' | 'VEGETARIAN' | 'VEGAN' | 'KETO' | 'LOW_CALORIE';
    } = {}
  ): Promise<AdaptiveMealRecommendation | null> {
    const state = await this.getDailyNutritionState(userId, options.date);
    const profile = await ProfileRepository.getProfile(userId);

    const userContext = {
      dietPreference: profile?.dietPreference,
      allergies: profile?.allergies,
      intolerances: profile?.intolerances,
      foodPreferences: profile?.foodPreferences,
      goal: profile?.goal
    };

    const targetMacros: MacroSplit = {
      calories: state.targets.targetCalories,
      protein: state.targets.proteinGrams,
      carbs: state.targets.carbsGrams,
      fat: state.targets.fatGrams
    };

    const consumedMacros: MacroSplit = {
      calories: state.consumed.calories,
      protein: state.consumed.protein,
      carbs: state.consumed.carbs,
      fat: state.consumed.fat
    };

    return generateAdaptiveMealRecommendation(
      userContext,
      targetMacros,
      consumedMacros,
      state.loggedMealTypes,
      {
        mealType: options.mealType,
        workoutStatus: state.workoutStatus,
        preferenceFilter: options.preferenceFilter
      }
    );
  }

  static async getAdaptiveDailyMealPlan(
    userId: string,
    date?: string
  ): Promise<AdaptiveDailyMealPlan> {
    const state = await this.getDailyNutritionState(userId, date);
    const profile = await ProfileRepository.getProfile(userId);

    const userContext = {
      dietPreference: profile?.dietPreference,
      allergies: profile?.allergies,
      intolerances: profile?.intolerances,
      foodPreferences: profile?.foodPreferences,
      goal: profile?.goal
    };

    const targetMacros: MacroSplit = {
      calories: state.targets.targetCalories,
      protein: state.targets.proteinGrams,
      carbs: state.targets.carbsGrams,
      fat: state.targets.fatGrams
    };

    const consumedMacros: MacroSplit = {
      calories: state.consumed.calories,
      protein: state.consumed.protein,
      carbs: state.consumed.carbs,
      fat: state.consumed.fat
    };

    return generateAdaptiveDailyMealPlan(
      userContext,
      targetMacros,
      consumedMacros,
      state.loggedMealTypes,
      state.workoutStatus
    );
  }
}
