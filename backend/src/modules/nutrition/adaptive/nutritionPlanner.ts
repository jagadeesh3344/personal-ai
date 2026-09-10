import {
  DietPreference,
  MealType,
  NextMealType,
  WorkoutStatus,
  MealRecipe,
  MacroSplit,
  AdaptiveMealRecommendation,
  AdaptiveDailyMealPlan
} from './types.js';
import { MEAL_RECIPES } from './recipes.js';

export interface UserNutritionContext {
  dietPreference?: string;
  allergies?: string[];
  intolerances?: string[];
  foodPreferences?: string[];
  dislikes?: string[];
  goal?: string;
}

export interface RemainingBudget {
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  consumedCalories: number;
  consumedProtein: number;
  consumedCarbs: number;
  consumedFat: number;
  remainingCalories: number;
  remainingProtein: number;
  remainingCarbs: number;
  remainingFat: number;
  rawRemainingCalories: number;
  rawRemainingProtein: number;
  rawRemainingCarbs: number;
  rawRemainingFat: number;
}

/**
 * Calculates remaining nutrition budget from targets and consumed meals/macros.
 * Clamps remaining macros to 0 while raw tracks overages.
 */
export function calculateRemainingBudget(
  targets: { targetCalories?: number; calories?: number; proteinGrams?: number; protein?: number; carbsGrams?: number; carbs?: number; fatGrams?: number; fat?: number },
  consumedMeals: any[] | { calories?: number; protein?: number; carbs?: number; fat?: number }
): RemainingBudget {
  const targetCal = targets.targetCalories ?? targets.calories ?? 2000;
  const targetPro = targets.proteinGrams ?? targets.protein ?? 140;
  const targetCarb = targets.carbsGrams ?? targets.carbs ?? 200;
  const targetFat = targets.fatGrams ?? targets.fat ?? 60;

  let consCal = 0;
  let consPro = 0;
  let consCarb = 0;
  let consFat = 0;

  if (Array.isArray(consumedMeals)) {
    for (const m of consumedMeals) {
      consCal += m.totalCalories || 0;
      consPro += m.totalProtein || 0;
      consCarb += m.totalCarbs || 0;
      consFat += m.totalFat || 0;
    }
  } else if (consumedMeals && typeof consumedMeals === 'object') {
    consCal = consumedMeals.calories || 0;
    consPro = consumedMeals.protein || 0;
    consCarb = consumedMeals.carbs || 0;
    consFat = consumedMeals.fat || 0;
  }

  const rawRemainingCalories = targetCal - consCal;
  const rawRemainingProtein = targetPro - consPro;
  const rawRemainingCarbs = targetCarb - consCarb;
  const rawRemainingFat = targetFat - consFat;

  return {
    targetCalories: targetCal,
    targetProtein: targetPro,
    targetCarbs: targetCarb,
    targetFat: targetFat,
    consumedCalories: consCal,
    consumedProtein: consPro,
    consumedCarbs: consCarb,
    consumedFat: consFat,
    remainingCalories: Math.max(0, rawRemainingCalories),
    remainingProtein: Math.max(0, rawRemainingProtein),
    remainingCarbs: Math.max(0, rawRemainingCarbs),
    remainingFat: Math.max(0, rawRemainingFat),
    rawRemainingCalories,
    rawRemainingProtein,
    rawRemainingCarbs,
    rawRemainingFat
  };
}

/**
 * Deterministically verifies if a recipe is safe and suitable for user's dietary requirements.
 */
export function isMealSuitable(
  recipe: MealRecipe,
  dietOrProfile: string | UserNutritionContext = 'STANDARD',
  allergies: string[] = [],
  intolerances: string[] = [],
  dislikes: string[] = []
): boolean {
  let diet = 'STANDARD';
  let allg = allergies;
  let intol = intolerances;
  let disl = dislikes;

  if (typeof dietOrProfile === 'object' && dietOrProfile !== null) {
    diet = dietOrProfile.dietPreference || 'STANDARD';
    allg = dietOrProfile.allergies || [];
    intol = dietOrProfile.intolerances || [];
    disl = dietOrProfile.dislikes || [];
  } else if (typeof dietOrProfile === 'string') {
    diet = dietOrProfile;
  }

  const normDiet = (diet || 'STANDARD').toUpperCase() as DietPreference;

  // 1. Diet Suitability
  if (normDiet === 'VEGAN') {
    if (!recipe.dietSuitability.includes('VEGAN')) return false;
    if (recipe.allergens.some((a: string) => ['dairy', 'eggs', 'egg', 'fish', 'shellfish'].includes(a.toLowerCase()))) return false;
    if (recipe.ingredients.some((i: string) => {
      const s = i.toLowerCase();
      return s.includes('meat') || s.includes('chicken') || s.includes('beef') || 
             s.includes('turkey') || s.includes('steak') || s.includes('salmon') || 
             s.includes('cod') || s.includes('tuna') || s.includes('egg') || 
             s.includes('dairy') || s.includes('whey') || s.includes('yogurt') || 
             s.includes('butter') || s.includes('cheese');
    })) {
      return false;
    }
  } else if (normDiet === 'VEGETARIAN') {
    const isVeg = recipe.dietSuitability.includes('VEGETARIAN') || recipe.dietSuitability.includes('VEGAN');
    if (!isVeg) return false;
    if (recipe.allergens.some((a: string) => ['fish', 'shellfish'].includes(a.toLowerCase()))) return false;
    if (recipe.ingredients.some((i: string) => {
      const s = i.toLowerCase();
      return s.includes('chicken') || s.includes('beef') || s.includes('turkey') || 
             s.includes('steak') || s.includes('salmon') || s.includes('cod') || 
             s.includes('tuna') || s.includes('bacon') || s.includes('pork') || s.includes('meat');
    })) {
      return false;
    }
  } else if (normDiet === 'KETO') {
    if (!recipe.dietSuitability.includes('KETO') && recipe.carbsGrams > 15) return false;
  } else if (normDiet === 'PALEO') {
    if (!recipe.dietSuitability.includes('PALEO')) return false;
  }

  // 2. Allergies check
  const normAllergies = (allg || []).map((a: string) => a.toLowerCase().trim()).filter(Boolean);
  for (const allergy of normAllergies) {
    if (recipe.allergens.some((a: string) => a.toLowerCase().includes(allergy) || allergy.includes(a.toLowerCase()))) {
      return false;
    }
    if (recipe.ingredients.some((ing: string) => ing.toLowerCase().includes(allergy))) {
      return false;
    }
  }

  // 3. Intolerances check
  const normIntolerances = (intol || []).map((i: string) => i.toLowerCase().trim()).filter(Boolean);
  for (const intolerance of normIntolerances) {
    if (intolerance.includes('dairy') || intolerance.includes('lactose')) {
      if (recipe.allergens.includes('dairy')) return false;
      if (recipe.ingredients.some((ing: string) => {
        const s = ing.toLowerCase();
        return s.includes('milk') || s.includes('cheese') || s.includes('yogurt') || 
               s.includes('butter') || s.includes('whey') || s.includes('cream');
      })) {
        return false;
      }
    }
    if (intolerance.includes('gluten')) {
      if (recipe.allergens.includes('gluten')) return false;
      if (recipe.ingredients.some((ing: string) => {
        const s = ing.toLowerCase();
        return (s.includes('bread') || s.includes('sourdough') || s.includes('wheat') || s.includes('wrap')) && 
               !s.includes('gluten-free');
      })) {
        return false;
      }
    }
    if (recipe.allergens.some((a: string) => a.toLowerCase().includes(intolerance) || intolerance.includes(a.toLowerCase()))) {
      return false;
    }
    if (recipe.ingredients.some((ing: string) => ing.toLowerCase().includes(intolerance))) {
      return false;
    }
  }

  // 4. Disliked ingredients
  const normDislikes = (disl || []).map((d: string) => d.toLowerCase().trim()).filter(Boolean);
  for (const dislike of normDislikes) {
    if (recipe.ingredients.some((ing: string) => ing.toLowerCase().includes(dislike))) {
      return false;
    }
  }

  return true;
}

/**
 * Deterministically determines which meal comes next based on logged meal types or meals and current hour.
 */
export function getNextMealType(
  loggedMealInput: (MealType | any)[] | Set<MealType> = [],
  currentHour?: number
): NextMealType {
  const logged = new Set<MealType>();

  if (loggedMealInput instanceof Set) {
    for (const item of loggedMealInput) logged.add(item);
  } else if (Array.isArray(loggedMealInput)) {
    for (const item of loggedMealInput) {
      if (typeof item === 'string') {
        logged.add(item as MealType);
      } else if (item && typeof item === 'object') {
        const t = (item.type || item.mealType) as MealType;
        if (t) {
          const hasItems = Array.isArray(item.items) && item.items.length > 0;
          const hasCals = (item.totalCalories || 0) > 0 || (item.calories || 0) > 0;
          if (hasItems || hasCals) {
            logged.add(t);
          }
        }
      }
    }
  }

  if (!logged.has('BREAKFAST')) {
    return 'BREAKFAST';
  }
  if (!logged.has('LUNCH')) {
    return 'LUNCH';
  }
  if (!logged.has('SNACK') && !logged.has('DINNER')) {
    const hour = currentHour !== undefined ? currentHour : new Date().getHours();
    return hour >= 18 ? 'DINNER' : 'SNACK';
  }
  if (!logged.has('DINNER')) {
    return 'DINNER';
  }
  return 'DAILY_COMPLETE';
}

/**
 * Calculates a deterministic score for a candidate recipe against target & remaining macros.
 * Lower distance score is better (bonuses lower the score).
 * Also supports direct number parameters: (candidate, remCal, remPro, remCarb, remFat, targetCal, isPostWorkout, preferredFoods).
 */
export function scoreMealCandidate(
  candidate: MealRecipe,
  arg2: MacroSplit | number,
  arg3: MacroSplit | number,
  arg4?: UserNutritionContext | number,
  arg5?: WorkoutStatus | number,
  arg6?: number,
  arg7?: boolean,
  arg8?: string[]
): any {
  // Check if called with flat numbers: (candidate, remCal, remPro, remCarb, remFat, targetCal, isPostWorkout, preferredFoods)
  if (typeof arg2 === 'number') {
    const remainingCalories = arg2;
    const remainingProtein = Number(arg3);
    const remainingCarbs = Number(arg4 || 0);
    const remainingFat = Number(arg5 || 0);
    const targetCalories = Number(arg6 || 2000);
    const isPostWorkout = Boolean(arg7);
    const preferredFoods = Array.isArray(arg8) ? arg8 : [];

    // Distance metrics
    const calDist = Math.abs(candidate.calories - (remainingCalories > 0 ? remainingCalories : 500)) / Math.max(100, remainingCalories || 500);
    const proDist = Math.abs(candidate.proteinGrams - (remainingProtein > 0 ? remainingProtein : 35)) / Math.max(10, remainingProtein || 35);

    let rawScore = 100 - (calDist * 20 + proDist * 25);

    // Reward high protein if protein deficit is high
    if (remainingProtein >= 40 && candidate.proteinGrams >= 35) {
      rawScore += 15;
    }

    // Reward recovery if post workout
    if (isPostWorkout && (candidate.isRecoveryOriented || candidate.proteinGrams >= 30)) {
      rawScore += 20;
    }

    // Reward preferred foods
    for (const pref of preferredFoods) {
      const p = pref.toLowerCase();
      if (candidate.name.toLowerCase().includes(p) || candidate.ingredients.some((i: string) => i.toLowerCase().includes(p))) {
        rawScore += 25;
      }
    }

    return rawScore;
  }

  // Otherwise standard structured scoring: (candidate, slotTarget, remainingDay, context, workoutStatus)
  const slotTarget = arg2;
  const remainingDay = arg3 as MacroSplit;
  const context = (arg4 || {}) as UserNutritionContext;
  const workoutStatus = (arg5 || 'NOT_COMPLETED') as WorkoutStatus;

  const calDist = Math.abs(candidate.calories - slotTarget.calories) / Math.max(100, slotTarget.calories);
  const proDist = Math.abs(candidate.proteinGrams - slotTarget.protein) / Math.max(10, slotTarget.protein);
  const carbDist = Math.abs(candidate.carbsGrams - slotTarget.carbs) / Math.max(15, slotTarget.carbs);
  const fatDist = Math.abs(candidate.fatGrams - slotTarget.fat) / Math.max(5, slotTarget.fat);

  let score = (calDist * 1.6) + (proDist * 2.2) + (carbDist * 1.0) + (fatDist * 1.2);

  // Penalties for blowing past remaining daily budget
  if (remainingDay.calories > 0 && candidate.calories > remainingDay.calories + 50) {
    const overage = candidate.calories - remainingDay.calories;
    score += (overage / 100) * 6.0;
  }

  if (remainingDay.fat > 0 && candidate.fatGrams > remainingDay.fat + 8) {
    const fatOverage = candidate.fatGrams - remainingDay.fat;
    score += (fatOverage / 10) * 5.0;
  }

  // Protein deficit reward: if user has high protein remaining, reward recipes that provide >= 35g protein
  if (remainingDay.protein >= 35 && candidate.proteinGrams >= 35) {
    score -= 0.6;
  }

  // Workout recovery reward
  if (workoutStatus === 'COMPLETED' && (candidate.isRecoveryOriented || candidate.proteinGrams >= 35)) {
    score -= 0.8;
  }

  // User food preference bonus
  const userPreferences = (context.foodPreferences || []).map((p: string) => p.toLowerCase());
  for (const pref of userPreferences) {
    if (candidate.name.toLowerCase().includes(pref) || candidate.ingredients.some((i: string) => i.toLowerCase().includes(pref))) {
      score -= 0.5;
    }
  }

  let rationale = `Calibrated for remaining target (${Math.round(remainingDay.calories)} kcal, ${Math.round(remainingDay.protein)}g protein). Provides ${candidate.proteinGrams}g protein, ${candidate.carbsGrams}g carbs, and ${candidate.fatGrams}g fat`;
  if (workoutStatus === 'COMPLETED') {
    rationale += ' • Post-workout recovery bonus applied';
  }
  if (context.dietPreference && context.dietPreference !== 'STANDARD') {
    rationale += ` • Filtered for ${context.dietPreference} guidelines`;
  }

  return { score: Number(score.toFixed(4)), rationale };
}

/**
 * Deterministically generates an adaptive meal recommendation.
 * Supports:
 * - (context, targets, consumedMacros, loggedMealTypes, options)
 * - (profile, targets, meals: Meal[], options)
 */
export function generateAdaptiveMealRecommendation(
  context: UserNutritionContext,
  targetsInput: any,
  consumedInput: any,
  arg4?: any,
  arg5?: any
): AdaptiveMealRecommendation {
  const targetCalories = targetsInput.targetCalories ?? targetsInput.calories ?? 2000;
  const targetProtein = targetsInput.proteinGrams ?? targetsInput.protein ?? 140;
  const targetCarbs = targetsInput.carbsGrams ?? targetsInput.carbs ?? 200;
  const targetFat = targetsInput.fatGrams ?? targetsInput.fat ?? 60;

  const targets: MacroSplit = {
    calories: targetCalories,
    protein: targetProtein,
    carbs: targetCarbs,
    fat: targetFat
  };

  let consumed: MacroSplit = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  let loggedMealTypes: MealType[] = [];

  if (Array.isArray(consumedInput)) {
    for (const m of consumedInput) {
      consumed.calories += m.totalCalories || 0;
      consumed.protein += m.totalProtein || 0;
      consumed.carbs += m.totalCarbs || 0;
      consumed.fat += m.totalFat || 0;
      if ((m.items && m.items.length > 0) || (m.totalCalories > 0)) {
        loggedMealTypes.push(m.type);
      }
    }
  } else if (consumedInput && typeof consumedInput === 'object') {
    consumed = {
      calories: consumedInput.calories || 0,
      protein: consumedInput.protein || 0,
      carbs: consumedInput.carbs || 0,
      fat: consumedInput.fat || 0
    };
  }

  let options: {
    mealType?: MealType | 'NEXT';
    forceMealType?: MealType;
    workoutStatus?: WorkoutStatus;
    preferenceFilter?: 'HIGH_PROTEIN' | 'VEGETARIAN' | 'VEGAN' | 'KETO' | 'LOW_CALORIE';
  } = {};

  if (Array.isArray(arg4)) {
    loggedMealTypes = arg4;
    options = arg5 || {};
  } else if (arg4 && typeof arg4 === 'object') {
    options = arg4;
  }

  const requestedMealType = options.forceMealType || options.mealType;
  const workoutStatus = options.workoutStatus || 'NOT_COMPLETED';

  const nextSlot = getNextMealType(loggedMealTypes);

  // If user has completed dinner and didn't force a slot, signal DAILY_COMPLETE
  if ((!requestedMealType || requestedMealType === 'NEXT') && nextSlot === 'DAILY_COMPLETE') {
    return {
      mealType: 'DINNER',
      recipe: null,
      score: 0,
      rationale: 'Daily nutrition target reached / All main meals logged for today.',
      status: 'DAILY_COMPLETE',
      remainingCaloriesBeforeMeal: Math.max(0, targets.calories - consumed.calories),
      remainingProteinBeforeMeal: Math.max(0, targets.protein - consumed.protein),
      remainingCarbsBeforeMeal: Math.max(0, targets.carbs - consumed.carbs),
      remainingFatBeforeMeal: Math.max(0, targets.fat - consumed.fat),
      isRecoveryOriented: workoutStatus === 'COMPLETED'
    };
  }

  const targetSlot: MealType = requestedMealType && requestedMealType !== 'NEXT'
    ? requestedMealType
    : (nextSlot === 'DAILY_COMPLETE' ? 'SNACK' : nextSlot);

  const remainingCalories = Math.max(0, targets.calories - consumed.calories);
  const remainingProtein = Math.max(0, targets.protein - consumed.protein);
  const remainingCarbs = Math.max(0, targets.carbs - consumed.carbs);
  const remainingFat = Math.max(0, targets.fat - consumed.fat);

  const remainingDay: MacroSplit = {
    calories: remainingCalories,
    protein: remainingProtein,
    carbs: remainingCarbs,
    fat: remainingFat
  };

  const unloggedCount = (['BREAKFAST', 'LUNCH', 'SNACK', 'DINNER'] as MealType[])
    .filter((t: MealType) => !loggedMealTypes.includes(t) || t === targetSlot).length;

  const targetSlotMacros: MacroSplit = unloggedCount <= 1
    ? { ...remainingDay }
    : {
        calories: Math.max(150, Math.round(remainingDay.calories / Math.max(1, unloggedCount))),
        protein: Math.max(15, Math.round(remainingDay.protein / Math.max(1, unloggedCount))),
        carbs: Math.max(10, Math.round(remainingDay.carbs / Math.max(1, unloggedCount))),
        fat: Math.max(5, Math.round(remainingDay.fat / Math.max(1, unloggedCount)))
      };

  let candidates = MEAL_RECIPES.filter((r: MealRecipe) => r.mealType === targetSlot);

  const effectiveDiet = options.preferenceFilter === 'VEGAN' ? 'VEGAN'
    : options.preferenceFilter === 'VEGETARIAN' ? 'VEGETARIAN'
    : options.preferenceFilter === 'KETO' ? 'KETO'
    : context.dietPreference || 'STANDARD';

  candidates = candidates.filter((r: MealRecipe) => isMealSuitable(
    r,
    effectiveDiet,
    context.allergies || [],
    context.intolerances || []
  ));

  if (options.preferenceFilter === 'HIGH_PROTEIN') {
    candidates = candidates.filter((r: MealRecipe) => r.proteinGrams >= 30);
  } else if (options.preferenceFilter === 'LOW_CALORIE') {
    candidates = candidates.filter((r: MealRecipe) => r.calories <= 450);
  }

  if (candidates.length === 0) {
    candidates = MEAL_RECIPES.filter((r: MealRecipe) => r.mealType === targetSlot && isMealSuitable(
      r,
      context.dietPreference || 'STANDARD',
      context.allergies || [],
      context.intolerances || []
    ));
  }

  if (candidates.length === 0) {
    return {
      mealType: targetSlot,
      recipe: null,
      score: 999,
      rationale: 'No compatible recipes found matching your dietary restrictions for this slot.',
      status: 'NO_RECIPE_MATCH',
      remainingCaloriesBeforeMeal: remainingCalories,
      remainingProteinBeforeMeal: remainingProtein,
      remainingCarbsBeforeMeal: remainingCarbs,
      remainingFatBeforeMeal: remainingFat,
      isRecoveryOriented: false
    };
  }

  const scored = candidates.map((recipe: MealRecipe) => {
    const { score, rationale } = scoreMealCandidate(recipe, targetSlotMacros, remainingDay, context, workoutStatus);
    return {
      recipe,
      score,
      rationale
    };
  });

  scored.sort((a: any, b: any) => {
    if (Math.abs(a.score - b.score) > 0.0001) {
      return a.score - b.score;
    }
    return a.recipe.id.localeCompare(b.recipe.id);
  });

  const best = scored[0];
  const remainingAfterMeal: MacroSplit = {
    calories: Math.max(0, remainingDay.calories - best.recipe.calories),
    protein: Math.max(0, remainingDay.protein - best.recipe.proteinGrams),
    carbs: Math.max(0, remainingDay.carbs - best.recipe.carbsGrams),
    fat: Math.max(0, remainingDay.fat - best.recipe.fatGrams)
  };

  return {
    mealType: targetSlot,
    recipe: best.recipe,
    score: best.score,
    macroFitScore: Number((100 - Math.min(100, best.score * 20)).toFixed(1)),
    rationale: best.rationale,
    targetMacrosForSlot: targetSlotMacros,
    remainingAfterMeal,
    remainingCaloriesBeforeMeal: remainingCalories,
    remainingProteinBeforeMeal: remainingProtein,
    remainingCarbsBeforeMeal: remainingCarbs,
    remainingFatBeforeMeal: remainingFat,
    isRecoveryOriented: workoutStatus === 'COMPLETED',
    status: 'RECOMMENDED'
  };
}

/**
 * Deterministically generates the full 4-meal daily plan.
 */
export function generateAdaptiveDailyMealPlan(
  context: UserNutritionContext,
  targetsInput: any,
  consumedInput: any = [],
  arg4?: any,
  arg5?: any
): AdaptiveDailyMealPlan {
  const targetCalories = targetsInput.targetCalories ?? targetsInput.calories ?? 2000;
  const targetProtein = targetsInput.proteinGrams ?? targetsInput.protein ?? 140;
  const targetCarbs = targetsInput.carbsGrams ?? targetsInput.carbs ?? 200;
  const targetFat = targetsInput.fatGrams ?? targetsInput.fat ?? 60;

  const targets: MacroSplit = {
    calories: targetCalories,
    protein: targetProtein,
    carbs: targetCarbs,
    fat: targetFat
  };

  let consumed: MacroSplit = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  let loggedMealTypes: MealType[] = [];

  if (Array.isArray(consumedInput)) {
    for (const m of consumedInput) {
      consumed.calories += m.totalCalories || 0;
      consumed.protein += m.totalProtein || 0;
      consumed.carbs += m.totalCarbs || 0;
      consumed.fat += m.totalFat || 0;
      if ((m.items && m.items.length > 0) || (m.totalCalories > 0)) {
        loggedMealTypes.push(m.type);
      }
    }
  } else if (consumedInput && typeof consumedInput === 'object') {
    consumed = {
      calories: consumedInput.calories || 0,
      protein: consumedInput.protein || 0,
      carbs: consumedInput.carbs || 0,
      fat: consumedInput.fat || 0
    };
  }

  let workoutStatus: WorkoutStatus = 'NOT_COMPLETED';
  if (typeof arg4 === 'string') {
    workoutStatus = arg4 as WorkoutStatus;
  } else if (Array.isArray(arg4)) {
    loggedMealTypes = arg4;
    workoutStatus = (arg5 as WorkoutStatus) || 'NOT_COMPLETED';
  }

  const getSlotRecipe = (slot: MealType): MealRecipe => {
    const rec = generateAdaptiveMealRecommendation(context, targets, consumed, loggedMealTypes, {
      mealType: slot,
      workoutStatus
    });
    if (rec && rec.recipe) return rec.recipe;

    const matches = MEAL_RECIPES.filter((r: MealRecipe) => r.mealType === slot);
    return matches[0];
  };

  const breakfast = getSlotRecipe('BREAKFAST');
  const lunch = getSlotRecipe('LUNCH');
  const snack = getSlotRecipe('SNACK');
  const dinner = getSlotRecipe('DINNER');

  const totalCalories = breakfast.calories + lunch.calories + snack.calories + dinner.calories;
  const totalProtein = breakfast.proteinGrams + lunch.proteinGrams + snack.proteinGrams + dinner.proteinGrams;
  const totalCarbs = breakfast.carbsGrams + lunch.carbsGrams + snack.carbsGrams + dinner.carbsGrams;
  const totalFat = breakfast.fatGrams + lunch.fatGrams + snack.fatGrams + dinner.fatGrams;

  const nextMeal = generateAdaptiveMealRecommendation(context, targets, consumed, loggedMealTypes, {
    mealType: 'NEXT',
    workoutStatus
  });

  return {
    breakfast,
    lunch,
    snack,
    dinner,
    totalCalories,
    totalProtein,
    totalCarbs,
    totalFat,
    targets,
    nextRecommendedMeal: nextMeal
  };
}
