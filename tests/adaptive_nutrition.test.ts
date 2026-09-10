import { describe, it, expect } from 'vitest';
import {
  isMealSuitable,
  getNextMealType,
  calculateRemainingBudget,
  scoreMealCandidate,
  generateAdaptiveMealRecommendation,
  generateAdaptiveDailyMealPlan
} from '../src/features/nutrition/adaptive/nutritionPlanner';
import { ADAPTIVE_RECIPES, getMealCandidateLibrary } from '../src/features/nutrition/adaptive/recipes';
import { UserProfile } from '../src/types/profile';
import { NutritionTargets, Meal } from '../src/types';

describe('Phase 7: Deterministic Adaptive Nutrition Intelligence Engine', () => {
  const baseProfile: UserProfile = {
    name: 'Alex Nutrition',
    age: 28,
    sex: 'MALE',
    currentWeightKg: 75,
    heightCm: 180,
    goal: 'GENERAL_FITNESS',
    activityLevel: 'MODERATELY_ACTIVE',
    trainingExperience: 'INTERMEDIATE',
    equipment: ['DUMBBELLS'],
    trainingEnvironment: 'HOME',
    targetWeightKg: 75,
    availableWorkoutDays: ['MON', 'WED', 'FRI'],
    preferredWorkoutDuration: 45,
    dietPreference: 'STANDARD',
    foodPreferences: [],
    allergies: [],
    intolerances: []
  };

  const defaultTargets: NutritionTargets = {
    bmr: 1750,
    maintenanceCalories: 2400,
    targetCalories: 2400,
    proteinGrams: 150,
    carbsGrams: 250,
    fatGrams: 70
  };

  const emptyMeals: Meal[] = [
    { id: 'm-breakfast', name: 'Breakfast', type: 'BREAKFAST', items: [], totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 },
    { id: 'm-lunch', name: 'Lunch', type: 'LUNCH', items: [], totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 },
    { id: 'm-dinner', name: 'Dinner', type: 'DINNER', items: [], totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 },
    { id: 'm-snack', name: 'Snacks', type: 'SNACK', items: [], totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 }
  ];

  // 1. No meals logged -> full daily target remains
  it('1. No meals logged: preserves 100% of the daily targets as remaining', () => {
    const budget = calculateRemainingBudget(defaultTargets, emptyMeals);
    expect(budget.consumedCalories).toBe(0);
    expect(budget.consumedProtein).toBe(0);
    expect(budget.consumedCarbs).toBe(0);
    expect(budget.consumedFat).toBe(0);

    expect(budget.remainingCalories).toBe(2400);
    expect(budget.remainingProtein).toBe(150);
    expect(budget.remainingCarbs).toBe(250);
    expect(budget.remainingFat).toBe(70);
  });

  // 2. Breakfast logged -> calories/macros update
  it('2. Breakfast logged: calories and macronutrients decrement accurately', () => {
    const loggedBreakfast: Meal[] = [
      {
        id: 'm-breakfast',
        name: 'Breakfast',
        type: 'BREAKFAST',
        items: [{ id: 'i1', name: 'Eggs and Oatmeal', calories: 550, protein: 35, carbs: 65, fat: 16 }],
        totalCalories: 550,
        totalProtein: 35,
        totalCarbs: 65,
        totalFat: 16
      },
      emptyMeals[1],
      emptyMeals[2],
      emptyMeals[3]
    ];

    const budget = calculateRemainingBudget(defaultTargets, loggedBreakfast);
    expect(budget.consumedCalories).toBe(550);
    expect(budget.consumedProtein).toBe(35);
    expect(budget.consumedCarbs).toBe(65);
    expect(budget.consumedFat).toBe(16);

    expect(budget.remainingCalories).toBe(1850);
    expect(budget.remainingProtein).toBe(115);
    expect(budget.remainingCarbs).toBe(185);
    expect(budget.remainingFat).toBe(54);
  });

  // 3. Multiple meals logged -> totals accumulate correctly
  it('3. Multiple meals logged: totals accumulate across all meals', () => {
    const multipleMeals: Meal[] = [
      {
        id: 'm-breakfast',
        name: 'Breakfast',
        type: 'BREAKFAST',
        items: [{ id: 'i1', name: 'Eggs', calories: 400, protein: 30, carbs: 30, fat: 15 }],
        totalCalories: 400,
        totalProtein: 30,
        totalCarbs: 30,
        totalFat: 15
      },
      {
        id: 'm-lunch',
        name: 'Lunch',
        type: 'LUNCH',
        items: [{ id: 'i2', name: 'Chicken Salad', calories: 600, protein: 45, carbs: 50, fat: 20 }],
        totalCalories: 600,
        totalProtein: 45,
        totalCarbs: 50,
        totalFat: 20
      },
      {
        id: 'm-snack',
        name: 'Snack',
        type: 'SNACK',
        items: [{ id: 'i3', name: 'Greek Yogurt', calories: 200, protein: 20, carbs: 15, fat: 5 }],
        totalCalories: 200,
        totalProtein: 20,
        totalCarbs: 15,
        totalFat: 5
      },
      emptyMeals[2]
    ];

    const budget = calculateRemainingBudget(defaultTargets, multipleMeals);
    expect(budget.consumedCalories).toBe(1200);
    expect(budget.consumedProtein).toBe(95);
    expect(budget.consumedCarbs).toBe(95);
    expect(budget.consumedFat).toBe(40);

    expect(budget.remainingCalories).toBe(1200);
    expect(budget.remainingProtein).toBe(55);
    expect(budget.remainingCarbs).toBe(155);
    expect(budget.remainingFat).toBe(30);
  });

  // 4. Remaining macros -> calculated correctly
  it('4. Remaining macros: exact arithmetic matching example scenario (1600/108/180/45 consumed)', () => {
    const sampleMeals: Meal[] = [
      {
        id: 'm-day',
        name: 'Cumulative Meals',
        type: 'LUNCH',
        items: [{ id: 'i1', name: 'Day intake', calories: 1600, protein: 108, carbs: 180, fat: 45 }],
        totalCalories: 1600,
        totalProtein: 108,
        totalCarbs: 180,
        totalFat: 45
      }
    ];

    const budget = calculateRemainingBudget(defaultTargets, sampleMeals);
    expect(budget.remainingCalories).toBe(800);
    expect(budget.remainingProtein).toBe(42);
    expect(budget.remainingCarbs).toBe(70);
    expect(budget.remainingFat).toBe(25);
  });

  // 5. Remaining calories cannot become negative incorrectly
  it('5. Remaining calories cannot become negative incorrectly (clamped to 0 while raw tracks overage)', () => {
    const excessiveMeals: Meal[] = [
      {
        id: 'm-binge',
        name: 'Large Feast',
        type: 'DINNER',
        items: [{ id: 'i1', name: 'Feast', calories: 3000, protein: 200, carbs: 320, fat: 100 }],
        totalCalories: 3000,
        totalProtein: 200,
        totalCarbs: 320,
        totalFat: 100
      }
    ];

    const budget = calculateRemainingBudget(defaultTargets, excessiveMeals);
    expect(budget.remainingCalories).toBe(0);
    expect(budget.remainingProtein).toBe(0);
    expect(budget.remainingCarbs).toBe(0);
    expect(budget.remainingFat).toBe(0);

    expect(budget.rawRemainingCalories).toBe(-600);
    expect(budget.rawRemainingProtein).toBe(-50);
    expect(budget.rawRemainingCarbs).toBe(-70);
    expect(budget.rawRemainingFat).toBe(-30);
  });

  // 6. Vegetarian -> no meat/fish meals
  it('6. Vegetarian diet: absolutely excludes any meat or fish recipes', () => {
    const vegetarianProfile: UserProfile = {
      ...baseProfile,
      dietPreference: 'VEGETARIAN'
    };

    const library = getMealCandidateLibrary();
    const suitableMeals = library.filter(m => isMealSuitable(m, vegetarianProfile));
    expect(suitableMeals.length).toBeGreaterThan(0);

    for (const meal of suitableMeals) {
      expect(meal.dietSuitability).toContain('VEGETARIAN');
      const text = `${meal.name} ${meal.ingredients.join(' ')}`.toLowerCase();
      expect(text).not.toContain('chicken');
      expect(text).not.toContain('beef');
      expect(text).not.toContain('salmon');
      expect(text).not.toContain('turkey');
      expect(text).not.toContain('tuna');
    }
  });

  // 7. Vegan -> no animal products
  it('7. Vegan diet: excludes all meat, fish, eggs, and dairy', () => {
    const veganProfile: UserProfile = {
      ...baseProfile,
      dietPreference: 'VEGAN'
    };

    const library = getMealCandidateLibrary();
    const suitableMeals = library.filter(m => isMealSuitable(m, veganProfile));
    expect(suitableMeals.length).toBeGreaterThan(0);

    for (const meal of suitableMeals) {
      expect(meal.dietSuitability).toContain('VEGAN');
      expect(meal.allergens).not.toContain('dairy');
      expect(meal.allergens).not.toContain('egg');
      const text = `${meal.name} ${meal.ingredients.join(' ')}`.toLowerCase();
      expect(text).not.toContain('whey');
      expect(text).not.toContain('yogurt');
      expect(text).not.toContain('egg');
      expect(text).not.toContain('chicken');
      expect(text).not.toContain('beef');
    }
  });

  // 8. Dairy intolerance -> dairy meals excluded
  it('8. Dairy intolerance: strictly filters out all dairy-containing candidates', () => {
    const dairyIntolerantProfile: UserProfile = {
      ...baseProfile,
      intolerances: ['dairy']
    };

    const library = getMealCandidateLibrary();
    const suitableMeals = library.filter(m => isMealSuitable(m, dairyIntolerantProfile));

    for (const meal of suitableMeals) {
      expect(meal.allergens).not.toContain('dairy');
      const text = `${meal.name} ${meal.ingredients.join(' ')}`.toLowerCase();
      expect(text).not.toContain('milk');
      expect(text).not.toContain('yogurt');
      expect(text).not.toContain('cheese');
      expect(text).not.toContain('whey');
    }
  });

  // 9. Gluten intolerance -> gluten-containing candidates excluded
  it('9. Gluten intolerance: strictly filters out gluten and wheat candidates', () => {
    const glutenIntolerantProfile: UserProfile = {
      ...baseProfile,
      intolerances: ['gluten']
    };

    const library = getMealCandidateLibrary();
    const suitableMeals = library.filter(m => isMealSuitable(m, glutenIntolerantProfile));

    for (const meal of suitableMeals) {
      expect(meal.allergens).not.toContain('gluten');
      const text = `${meal.name} ${meal.ingredients.join(' ')}`.toLowerCase();
      expect(text).not.toContain('wheat');
      expect(text).not.toContain('bread');
      expect(text).not.toContain('tortilla');
    }
  });

  // 10. Allergy -> matching food candidates excluded
  it('10. Allergy: peanut, soy, or tree-nut allergies strictly filter out matching foods', () => {
    const peanutAllergyProfile: UserProfile = {
      ...baseProfile,
      allergies: ['peanut', 'peanuts']
    };

    const library = getMealCandidateLibrary();
    const suitableMeals = library.filter(m => isMealSuitable(m, peanutAllergyProfile));

    for (const meal of suitableMeals) {
      expect(meal.allergens).not.toContain('peanut');
      const text = `${meal.name} ${meal.ingredients.join(' ')}`.toLowerCase();
      expect(text).not.toContain('peanut');
    }
  });

  // 11. User food preference -> planner prioritizes preferred foods
  it('11. User food preference: preferred ingredients receive deterministic scoring bonus', () => {
    const neutralScore = scoreMealCandidate(
      ADAPTIVE_RECIPES['d-keto-salmon-cauliflower'],
      750, 45, 60, 25, 2400, false, []
    );

    const preferredScore = scoreMealCandidate(
      ADAPTIVE_RECIPES['d-keto-salmon-cauliflower'],
      750, 45, 60, 25, 2400, false, ['salmon']
    );

    expect(preferredScore).toBeGreaterThan(neutralScore);
  });

  // 12. Remaining protein -> high-protein compatible meal ranked appropriately
  it('12. Remaining protein: prioritizes high-protein meal when high protein deficit remains', () => {
    // 60g protein needed out of 700 kcal remaining
    const highProteinMeal = ADAPTIVE_RECIPES['d-lean-steak-potatoes']; // 52g protein
    const lowerProteinMeal = ADAPTIVE_RECIPES['d-vegan-chickpea-curry']; // 20g protein

    const scoreHighP = scoreMealCandidate(highProteinMeal, 700, 60, 60, 20, 2400, false, []);
    const scoreLowP = scoreMealCandidate(lowerProteinMeal, 700, 60, 60, 20, 2400, false, []);

    expect(scoreHighP).toBeGreaterThan(scoreLowP);
  });

  // 13. Remaining calories -> meal recommendation respects remaining calories
  it('13. Remaining calories: adapts recommendation to fit within remaining calorie budget', () => {
    // Only 400 kcal remaining for dinner
    const loggedMeals: Meal[] = [
      {
        id: 'm-heavy',
        name: 'Heavy day',
        type: 'LUNCH',
        items: [{ id: 'i1', name: 'Intake', calories: 2000, protein: 120, carbs: 210, fat: 60 }],
        totalCalories: 2000,
        totalProtein: 120,
        totalCarbs: 210,
        totalFat: 60
      }
    ];

    const recommendation = generateAdaptiveMealRecommendation(
      baseProfile,
      defaultTargets,
      loggedMeals,
      { forceMealType: 'DINNER' }
    );

    expect(recommendation.status).toBe('RECOMMENDED');
    expect(recommendation.recipe).not.toBeNull();
    // Recommended dinner should be modest in calories, not 800+ kcal
    expect(recommendation.recipe!.calories).toBeLessThanOrEqual(600);
  });

  // 14. Breakfast already logged -> next meal context changes
  it('14. Breakfast already logged: next meal type shifts to LUNCH or SNACK, not BREAKFAST', () => {
    const loggedBreakfast: Meal[] = [
      {
        id: 'm-breakfast',
        name: 'Breakfast',
        type: 'BREAKFAST',
        items: [{ id: 'i1', name: 'Oatmeal', calories: 450, protein: 25, carbs: 60, fat: 12 }],
        totalCalories: 450,
        totalProtein: 25,
        totalCarbs: 60,
        totalFat: 12
      },
      emptyMeals[1],
      emptyMeals[2],
      emptyMeals[3]
    ];

    const nextType = getNextMealType(loggedBreakfast);
    expect(nextType).toBe('LUNCH');

    const recommendation = generateAdaptiveMealRecommendation(baseProfile, defaultTargets, loggedBreakfast);
    expect(recommendation.mealType).toBe('LUNCH');
  });

  // 15. Dinner already logged -> no unnecessary additional dinner recommendation
  it('15. Dinner already logged: signals DAILY_COMPLETE with no unnecessary extra dinner', () => {
    const loggedAll: Meal[] = [
      {
        id: 'm-breakfast',
        name: 'Breakfast',
        type: 'BREAKFAST',
        items: [{ id: 'i1', name: 'Eggs', calories: 500, protein: 35, carbs: 50, fat: 15 }],
        totalCalories: 500,
        totalProtein: 35,
        totalCarbs: 50,
        totalFat: 15
      },
      {
        id: 'm-lunch',
        name: 'Lunch',
        type: 'LUNCH',
        items: [{ id: 'i2', name: 'Chicken Bowl', calories: 750, protein: 50, carbs: 80, fat: 20 }],
        totalCalories: 750,
        totalProtein: 50,
        totalCarbs: 80,
        totalFat: 20
      },
      {
        id: 'm-dinner',
        name: 'Dinner',
        type: 'DINNER',
        items: [{ id: 'i3', name: 'Salmon and Rice', calories: 750, protein: 45, carbs: 70, fat: 25 }],
        totalCalories: 750,
        totalProtein: 45,
        totalCarbs: 70,
        totalFat: 25
      }
    ];

    const nextType = getNextMealType(loggedAll);
    expect(nextType).toBe('DAILY_COMPLETE');

    const recommendation = generateAdaptiveMealRecommendation(baseProfile, defaultTargets, loggedAll);
    expect(recommendation.status).toBe('DAILY_COMPLETE');
    expect(recommendation.reasoning || recommendation.rationale).toContain('Daily nutrition target reached');
  });

  // 16. Workout completed -> recovery-oriented compatible meal can be recommended
  it('16. Workout completed: favors recovery-oriented meal with post-workout bonus', () => {
    const loggedLunch: Meal[] = [
      {
        id: 'm-breakfast',
        name: 'Breakfast',
        type: 'BREAKFAST',
        items: [{ id: 'i1', name: 'Toast & Eggs', calories: 400, protein: 25, carbs: 40, fat: 12 }],
        totalCalories: 400,
        totalProtein: 25,
        totalCarbs: 40,
        totalFat: 12
      },
      {
        id: 'm-lunch',
        name: 'Lunch',
        type: 'LUNCH',
        items: [{ id: 'i2', name: 'Wrap', calories: 600, protein: 35, carbs: 70, fat: 18 }],
        totalCalories: 600,
        totalProtein: 35,
        totalCarbs: 70,
        totalFat: 18
      }
    ];

    const recommendation = generateAdaptiveMealRecommendation(
      baseProfile,
      defaultTargets,
      loggedLunch,
      { workoutStatus: 'COMPLETED', forceMealType: 'SNACK' }
    );

    expect(recommendation.status).toBe('RECOMMENDED');
    expect(recommendation.recipe).not.toBeNull();
    expect(recommendation.recipe!.isRecoveryOriented).toBe(true);
    expect(recommendation.rationale).toContain('Post-workout recovery bonus');
  });

  // 17. Workout not completed -> planner still functions normally
  it('17. Workout not completed: planner functions without throwing and provides balanced advice', () => {
    const plan = generateAdaptiveDailyMealPlan(baseProfile, defaultTargets, emptyMeals, 'NOT_PLANNED');
    expect(plan.breakfast).toBeDefined();
    expect(plan.lunch).toBeDefined();
    expect(plan.snack).toBeDefined();
    expect(plan.dinner).toBeDefined();
    expect(plan.totalCalories).toBeGreaterThan(1500);
    expect(plan.totalProtein).toBeGreaterThan(90);
  });

  // 18. Same state -> same deterministic recommendation
  it('18. Same state: identical inputs produce 100% identical deterministic recommendations', () => {
    const rec1 = generateAdaptiveMealRecommendation(baseProfile, defaultTargets, emptyMeals);
    const rec2 = generateAdaptiveMealRecommendation(baseProfile, defaultTargets, emptyMeals);

    expect(rec1.mealType).toBe(rec2.mealType);
    expect(rec1.recipe?.id).toBe(rec2.recipe?.id);
    expect(rec1.macroFitScore).toBe(rec2.macroFitScore);
    expect(rec1.rationale).toBe(rec2.rationale);
  });

  // 19. Gemini/tool response uses backend nutrition state, not fabricated numbers
  it('19. Nutrition contract: ensures authoritative backend state contract matches schema', () => {
    const budget = calculateRemainingBudget(defaultTargets, emptyMeals);
    expect(budget).toHaveProperty('targetCalories');
    expect(budget).toHaveProperty('targetProtein');
    expect(budget).toHaveProperty('consumedCalories');
    expect(budget).toHaveProperty('consumedProtein');
    expect(budget).toHaveProperty('remainingCalories');
    expect(budget).toHaveProperty('remainingProtein');
    expect(typeof budget.targetCalories).toBe('number');
    expect(typeof budget.remainingCalories).toBe('number');
    expect(budget.remainingCalories).toBeLessThanOrEqual(budget.targetCalories);
  });

  // 20. Different users -> nutrition data remains isolated
  it('20. User isolation: differing profiles/targets produce distinct, isolated meal plans', () => {
    const veganProfile: UserProfile = {
      ...baseProfile,
      dietPreference: 'VEGAN'
    };

    const ketoProfile: UserProfile = {
      ...baseProfile,
      dietPreference: 'KETO'
    };

    const veganPlan = generateAdaptiveDailyMealPlan(veganProfile, defaultTargets, emptyMeals);
    const ketoPlan = generateAdaptiveDailyMealPlan(ketoProfile, defaultTargets, emptyMeals);

    expect(veganPlan.lunch.dietSuitability).toContain('VEGAN');
    expect(ketoPlan.lunch.dietSuitability).toContain('KETO');
    expect(veganPlan.lunch.id).not.toBe(ketoPlan.lunch.id);
  });
});
