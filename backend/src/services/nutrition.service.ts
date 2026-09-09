import { NutritionRepository, MealEntity, NutritionTargetsEntity } from '../repositories/nutrition.repo.js';
import { ProfileRepository } from '../repositories/profile.repo.js';

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
}
