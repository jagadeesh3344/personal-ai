export type DietPreference = 'STANDARD' | 'VEGETARIAN' | 'VEGAN' | 'KETO' | 'PALEO';

export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';

export type NextMealType = MealType | 'DAILY_COMPLETE';

export type WorkoutStatus = 'COMPLETED' | 'PLANNED' | 'NOT_COMPLETED' | 'REST_DAY';

export type OnTrackStatus = 'ON_TRACK' | 'UNDER_CALORIES' | 'OVER_CALORIES' | 'PROTEIN_DEFICIT';

export interface MealRecipe {
  id: string;
  name: string;
  mealType: MealType;
  description: string;
  servingSize: string;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  ingredients: string[];
  allergens: string[]; // e.g. ['dairy', 'gluten', 'nuts', 'eggs', 'soy', 'shellfish', 'fish', 'sesame']
  dietSuitability: DietPreference[];
  isRecoveryOriented?: boolean;
}

export interface MacroSplit {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface DailyNutritionState {
  userId: string;
  date: string;
  targets: {
    targetCalories: number;
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
    maintenanceCalories: number;
    bmr: number;
  };
  consumed: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  remaining: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  meals: any[];
  loggedMealTypes: MealType[];
  nextMealType: NextMealType;
  workoutStatus: WorkoutStatus;
  onTrackStatus: OnTrackStatus;
}

export interface AdaptiveMealRecommendation {
  mealType: MealType;
  recipe: MealRecipe | null;
  score: number;
  rationale: string;
  targetMacrosForSlot?: MacroSplit;
  remainingAfterMeal?: MacroSplit;
  remainingCaloriesBeforeMeal?: number;
  remainingProteinBeforeMeal?: number;
  remainingCarbsBeforeMeal?: number;
  remainingFatBeforeMeal?: number;
  isRecoveryOriented: boolean;
  status: 'RECOMMENDED' | 'DAILY_COMPLETE' | 'NO_RECIPE_MATCH';
  macroFitScore?: number;
}

export interface AdaptiveDailyMealPlan {
  breakfast: MealRecipe;
  lunch: MealRecipe;
  snack: MealRecipe;
  dinner: MealRecipe;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  targets: MacroSplit;
  nextRecommendedMeal?: AdaptiveMealRecommendation | null;
}
