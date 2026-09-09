import { UserProfile, NutritionTargets } from '../types';

/**
 * Calculates Basal Metabolic Rate (BMR) using the Mifflin-St Jeor Equation:
 * - Men: BMR = (10 * weight in kg) + (6.25 * height in cm) - (5 * age) + 5
 * - Women: BMR = (10 * weight in kg) + (6.25 * height in cm) - (5 * age) - 161
 * - Other/Neutral: Average or standard baseline
 */
export function calculateBMR(
  weightKg: number, 
  heightCm: number, 
  age: number, 
  sex: UserProfile['sex']
): number {
  const base = (10 * weightKg) + (6.25 * heightCm) - (5 * age);
  if (sex === 'MALE') {
    return Math.round(base + 5);
  } else if (sex === 'FEMALE') {
    return Math.round(base - 161);
  } else {
    // Balanced midpoint
    return Math.round(base - 78);
  }
}

/**
 * Calculates Total Daily Energy Expenditure (TDEE) using physical activity multipliers.
 */
export function calculateMaintenanceCalories(
  bmr: number, 
  activityLevel: UserProfile['activityLevel']
): number {
  const multipliers: Record<UserProfile['activityLevel'], number> = {
    SEDENTARY: 1.2,
    LIGHTLY_ACTIVE: 1.375,
    MODERATELY_ACTIVE: 1.55,
    VERY_ACTIVE: 1.725
  };

  const mult = multipliers[activityLevel] || 1.2;
  return Math.round(bmr * mult);
}

/**
 * Calculates goal-adjusted calories and balanced macronutrients:
 * - Protein: 1.6 - 2.2 g per kg of bodyweight
 * - Fat: 20-30% of total daily calories (9 kcal/g)
 * - Carbs: Remaining calories (4 kcal/g)
 */
export function calculateNutritionTargets(profile: UserProfile): NutritionTargets {
  const weight = profile.currentWeightKg > 0 ? profile.currentWeightKg : 70;
  const height = profile.heightCm > 0 ? profile.heightCm : 170;
  const age = profile.age > 0 ? profile.age : 25;
  const sex = profile.sex || 'OTHER';
  const activity = profile.activityLevel || 'MODERATELY_ACTIVE';
  const goal = profile.goal || 'GENERAL_FITNESS';

  const bmr = calculateBMR(weight, height, age, sex);
  const maintenance = calculateMaintenanceCalories(bmr, activity);

  let targetCalories = maintenance;
  let proteinMultiplier = 1.8; // grams per kg

  switch (goal) {
    case 'FAT_LOSS':
      targetCalories = Math.round(maintenance * 0.80); // 20% deficit
      proteinMultiplier = 2.2; // higher protein preserves lean muscle tissue
      break;
    case 'GAIN_MUSCLE':
      targetCalories = Math.round(maintenance * 1.10); // 10% controlled surplus
      proteinMultiplier = 2.0;
      break;
    case 'BODY_RECOMPOSITION':
      targetCalories = Math.round(maintenance * 0.95); // 5% slight deficit
      proteinMultiplier = 2.1;
      break;
    case 'STRENGTH':
      targetCalories = Math.round(maintenance * 1.05); // 5% strength surplus
      proteinMultiplier = 2.0;
      break;
    case 'ENDURANCE':
      targetCalories = Math.round(maintenance * 1.05);
      proteinMultiplier = 1.5; // endurance runners need higher carb allocation
      break;
    case 'GENERAL_FITNESS':
    default:
      targetCalories = maintenance;
      proteinMultiplier = 1.8;
      break;
  }

  // Safety floor barriers
  const minCalories = sex === 'MALE' ? 1500 : 1200;
  if (targetCalories < minCalories) {
    targetCalories = minCalories;
  }

  // Protein grams
  const proteinGrams = Math.round(weight * proteinMultiplier);
  const proteinCalories = proteinGrams * 4;

  // Fat grams: 25% of total target calories
  const fatCalories = targetCalories * 0.25;
  const fatGrams = Math.round(fatCalories / 9);

  // Carbs grams: remaining calories
  const remainingCalories = Math.max(0, targetCalories - proteinCalories - fatCalories);
  const carbsGrams = Math.round(remainingCalories / 4);

  return {
    bmr,
    maintenanceCalories: maintenance,
    targetCalories,
    proteinGrams,
    carbsGrams,
    fatGrams
  };
}
