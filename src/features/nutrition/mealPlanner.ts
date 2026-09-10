import { UserProfile, DietPreference } from '../../types/profile';
import { NutritionTargets, MealType, Meal } from '../../types';
import {
  MealRecipe,
  DailyNutritionState,
  AdaptiveMealRecommendation,
  AdaptiveDailyMealPlan,
  WorkoutStatus,
  MacroSplit
} from './adaptive/types';
import { MEAL_RECIPES } from './adaptive/recipes';
import {
  isMealSuitable,
  getNextMealType,
  scoreMealCandidate,
  generateAdaptiveMealRecommendation,
  generateAdaptiveDailyMealPlan
} from './adaptive/nutritionPlanner';

export * from './adaptive/types';
export * from './adaptive/recipes';
export * from './adaptive/nutritionPlanner';

export interface DailyMealPlan {
  breakfast: MealRecipe;
  lunch: MealRecipe;
  snack: MealRecipe;
  dinner: MealRecipe;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  targetCalories: number;
  targetProtein: number;
  nextRecommendedMeal?: AdaptiveMealRecommendation | null;
}

/**
 * Generates an adaptive daily meal plan with Breakfast, Lunch, Snack, and Dinner
 * aligned to the user's diet preferences, allergies, intolerances, nutrition targets,
 * and what the user has already eaten today.
 */
export function generateDailyMealPlan(
  profile: UserProfile,
  targets: NutritionTargets,
  consumedMeals: Meal[] = [],
  workoutStatus: WorkoutStatus = 'NOT_COMPLETED'
): DailyMealPlan {
  const targetMacros: MacroSplit = {
    calories: targets.targetCalories,
    protein: targets.proteinGrams,
    carbs: targets.carbsGrams,
    fat: targets.fatGrams
  };

  const consumedMacros: MacroSplit = (consumedMeals || []).reduce(
    (acc, m) => ({
      calories: acc.calories + (m.totalCalories || 0),
      protein: acc.protein + (m.totalProtein || 0),
      carbs: acc.carbs + (m.totalCarbs || 0),
      fat: acc.fat + (m.totalFat || 0)
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const loggedTypes = (consumedMeals || [])
    .filter(m => (m.items && m.items.length > 0) || (m.totalCalories > 0))
    .map(m => m.type);

  const plan = generateAdaptiveDailyMealPlan(
    {
      dietPreference: profile.dietPreference,
      allergies: profile.allergies,
      intolerances: profile.intolerances,
      foodPreferences: profile.foodPreferences,
      goal: profile.goal
    },
    targetMacros,
    consumedMacros,
    loggedTypes,
    workoutStatus
  );

  return {
    breakfast: plan.breakfast,
    lunch: plan.lunch,
    snack: plan.snack,
    dinner: plan.dinner,
    totalCalories: plan.totalCalories,
    totalProtein: plan.totalProtein,
    totalCarbs: plan.totalCarbs,
    totalFat: plan.totalFat,
    targetCalories: targets.targetCalories,
    targetProtein: targets.proteinGrams,
    nextRecommendedMeal: plan.nextRecommendedMeal
  };
}
