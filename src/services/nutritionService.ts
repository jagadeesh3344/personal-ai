import { UserProfile } from '../types';

export const nutritionService = {
  /**
   * Calculates Basal Metabolic Rate (BMR) using the Mifflin-St Jeor equation.
   */
  calculateBMR(weight: number, height: number, age: number, sex: 'Male' | 'Female' | 'Other'): number {
    if (sex === 'Male') {
      return 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      // Default to standard female calculation for Other/Female
      return 10 * weight + 6.25 * height - 5 * age - 161;
    }
  },

  /**
   * Estimates Total Daily Energy Expenditure (TDEE) based on activity multiplier.
   */
  calculateTDEE(bmr: number, activityLevel: 'Sedentary' | 'Lightly Active' | 'Moderately Active' | 'Very Active'): number {
    const multipliers = {
      'Sedentary': 1.2,
      'Lightly Active': 1.375,
      'Moderately Active': 1.55,
      'Very Active': 1.725
    };
    return bmr * (multipliers[activityLevel] || 1.2);
  },

  /**
   * Calculates goal-adjusted daily calories, macronutrient grams, and hydration liters.
   */
  calculateTargets(profile: UserProfile) {
    const weight = profile.weight || 70;
    const height = profile.height || 170;
    const age = profile.age || 25;
    const sex = profile.sex || 'Male';
    
    const bmr = Math.round(this.calculateBMR(weight, height, age, sex));
    const maintenance = Math.round(this.calculateTDEE(bmr, profile.activityLevel || 'Moderately Active'));
    
    let calories = maintenance;
    let proteinPerKg = 1.8;

    switch (profile.goal) {
      case 'Fat Loss':
        calories = Math.round(maintenance * 0.80); // 20% safe deficit
        proteinPerKg = 2.2; // Keep muscle on deficit
        break;
      case 'Muscle Gain':
        calories = Math.round(maintenance * 1.10); // 10% controlled surplus
        proteinPerKg = 2.0;
        break;
      case 'Body Recomposition':
        calories = Math.round(maintenance * 0.95); // 5% slight deficit to recomp
        proteinPerKg = 2.1;
        break;
      case 'Strength':
        calories = Math.round(maintenance * 1.05); // 5% strength building surplus
        proteinPerKg = 2.0;
        break;
      case 'Endurance':
        calories = Math.round(maintenance * 1.05);
        proteinPerKg = 1.6; // High carbs preference, moderate protein
        break;
      case 'General Fitness':
      default:
        calories = maintenance;
        proteinPerKg = 1.8;
        break;
    }

    // Minimum safe calorie barriers
    const minSafeCalories = sex === 'Male' ? 1500 : 1200;
    if (calories < minSafeCalories) {
      calories = minSafeCalories;
    }

    // Protein Target: (1.6 - 2.2g per kg of bodyweight)
    let protein = Math.round(weight * proteinPerKg);
    if (sex === 'Male' && protein < 120) protein = 120;
    if (sex !== 'Male' && protein < 90) protein = 90;

    // Fat Target: 25% of total calorie target (9 kcal per gram of fat)
    let fat = Math.round((calories * 0.25) / 9);
    if (fat < 40) fat = 40; // minimum safe fat threshold

    // Carbohydrate Target: Remaining calories (4 kcal per gram of carbs)
    const fatCalories = fat * 9;
    const proteinCalories = protein * 4;
    let carbs = Math.round((calories - fatCalories - proteinCalories) / 4);
    if (carbs < 50) {
      carbs = 50;
    }

    // Hydration Target (Personalized):
    // Base formula of 35ml per kg of weight + activity modifier + workout duration factor
    let waterMl = weight * 35;
    if (profile.activityLevel !== 'Sedentary') {
      waterMl += 500;
    }
    // Add water based on daily workout duration (e.g. 250ml per 30 minutes of workout)
    const duration = profile.workoutDuration || 45;
    waterMl += (duration / 30) * 250;

    const waterLiters = parseFloat((waterMl / 1000).toFixed(1));

    return {
      bmr,
      maintenance,
      calories,
      protein,
      carbs,
      fat,
      waterLiters
    };
  }
};
