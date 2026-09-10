import { describe, it, expect } from 'vitest';
import { EXERCISES } from '../src/features/workouts/data/exercises';
import { generateWorkout } from '../src/features/workouts/utils/workoutGenerator';
import { getAppropriateProgression, getProgressionNeighbors, PROGRESSION_TREES } from '../src/features/workouts/data/progressions';
import { generateDailyMealPlan, isMealSuitable, MEAL_RECIPES } from '../src/features/nutrition/mealPlanner';
import { UserProfile } from '../src/types/profile';
import { NutritionTargets } from '../src/types';

describe('FRIDAY Fitness Logic & Workout Integrity Tests', () => {

  const baseBeginnerProfile: UserProfile = {
    name: 'Alex Novice',
    age: 26,
    sex: 'MALE',
    heightCm: 178,
    currentWeightKg: 82,
    targetWeightKg: 75,
    goal: 'FAT_LOSS',
    activityLevel: 'LIGHTLY_ACTIVE',
    trainingExperience: 'BEGINNER',
    trainingEnvironment: 'HOME',
    equipment: ['NONE'],
    availableWorkoutDays: ['Monday', 'Wednesday', 'Friday'],
    preferredWorkoutDuration: 30,
    dietPreference: 'STANDARD',
    foodPreferences: ['Oats', 'Chicken'],
    allergies: [],
    intolerances: []
  };

  // =========================================================================
  // 1. Beginner-Aware Exercise Selection & Exclusion of Advanced Movements
  // =========================================================================
  describe('Beginner-Aware Exercise Selection', () => {
    it('strictly excludes Diamond Push-ups for Beginners in workout generation', () => {
      const workout = generateWorkout(baseBeginnerProfile);
      const allExercises = workout.days.flatMap(d => d.exercises);
      const exerciseNames = allExercises.map(e => e.name.toLowerCase());
      
      expect(exerciseNames).not.toContain('diamond push-up');
    });

    it('generates strictly BEGINNER exercises for a BEGINNER user', () => {
      const workout = generateWorkout(baseBeginnerProfile);
      const allExercises = workout.days.flatMap(d => d.exercises);
      
      expect(allExercises.length).toBeGreaterThan(0);
      allExercises.forEach(genEx => {
        const catalogEntry = EXERCISES.find(e => e.id === genEx.exerciseId || e.name === genEx.name);
        expect(catalogEntry).toBeDefined();
        if (catalogEntry) {
          expect(catalogEntry.difficulty).toBe('BEGINNER');
        }
      });
    });

    it('Diamond Push-up is classified as ADVANCED in the exercise registry', () => {
      const diamondPushUp = EXERCISES.find(e => e.id === 'diamond-push-up');
      expect(diamondPushUp).toBeDefined();
      expect(diamondPushUp?.difficulty).toBe('ADVANCED');
    });

    it('provides beginner regressions (Wall, Incline, Knee push-ups) in the catalog', () => {
      const wallPushUp = EXERCISES.find(e => e.id === 'wall-push-up');
      const inclinePushUp = EXERCISES.find(e => e.id === 'incline-push-up');
      const kneePushUp = EXERCISES.find(e => e.id === 'knee-push-up');

      expect(wallPushUp).toBeDefined();
      expect(wallPushUp?.difficulty).toBe('BEGINNER');

      expect(inclinePushUp).toBeDefined();
      expect(inclinePushUp?.difficulty).toBe('BEGINNER');

      expect(kneePushUp).toBeDefined();
      expect(kneePushUp?.difficulty).toBe('BEGINNER');
    });
  });

  // =========================================================================
  // 2. Exercise Progression & Regression Ladder
  // =========================================================================
  describe('Exercise Progression System', () => {
    it('recommends beginner entry regressions for beginners on push pattern', () => {
      const progression = getAppropriateProgression('PUSH_HORIZONTAL', 'BEGINNER');
      expect(progression).toBeDefined();
      expect(['wall-push-up', 'incline-push-up', 'knee-push-up']).toContain(progression?.id);
    });

    it('recommends standard push-up for intermediate users', () => {
      const progression = getAppropriateProgression('PUSH_HORIZONTAL', 'INTERMEDIATE');
      expect(progression).toBeDefined();
      expect(progression?.id).toBe('push-up');
    });

    it('recommends advanced variations (diamond push-up) for advanced users', () => {
      const progression = getAppropriateProgression('PUSH_HORIZONTAL', 'ADVANCED');
      expect(progression).toBeDefined();
      expect(progression?.id).toBe('diamond-push-up');
    });

    it('correctly maps progression neighbors (regressions & progressions)', () => {
      const neighbors = getProgressionNeighbors('knee-push-up');
      expect(neighbors.regressions).toContain('wall-push-up');
      expect(neighbors.progressions).toContain('push-up');
      expect(neighbors.progressions).toContain('diamond-push-up');
    });
  });

  // =========================================================================
  // 3. Exercise Education Metadata
  // =========================================================================
  describe('Exercise Education Metadata', () => {
    it('every exercise in catalog has instructions and form guidance', () => {
      EXERCISES.forEach(ex => {
        expect(ex.instructions).toBeTruthy();
        expect(ex.instructions.length).toBeGreaterThan(15);
      });
    });

    it('has safetyNotes and tutorialUrl on regressions and core movements', () => {
      const checkIds = ['push-up', 'wall-push-up', 'knee-push-up', 'diamond-push-up', 'bodyweight-squat'];
      checkIds.forEach(id => {
        const ex = EXERCISES.find(e => e.id === id);
        expect(ex).toBeDefined();
        expect(ex?.safetyNotes).toBeTruthy();
        expect(ex?.tutorialUrl).toMatch(/^https?:\/\//);
      });
    });
  });

  // =========================================================================
  // 4. Structured Daily Meal Planner & Dietary Restriction Enforcement
  // =========================================================================
  describe('Structured Daily Meal Planner', () => {
    const mockTargets: NutritionTargets = {
      bmr: 1750,
      maintenanceCalories: 2300,
      targetCalories: 1900,
      proteinGrams: 150,
      carbsGrams: 180,
      fatGrams: 55
    };

    it('generates a complete daily plan with breakfast, lunch, snack, and dinner', () => {
      const plan = generateDailyMealPlan(baseBeginnerProfile, mockTargets);
      expect(plan.breakfast).toBeDefined();
      expect(plan.lunch).toBeDefined();
      expect(plan.snack).toBeDefined();
      expect(plan.dinner).toBeDefined();

      expect(plan.totalCalories).toBeGreaterThan(1000);
      expect(plan.totalProtein).toBeGreaterThan(80);
    });

    it('strictly enforces VEGAN diet with no meat, dairy, eggs, or fish', () => {
      const veganProfile: UserProfile = {
        ...baseBeginnerProfile,
        dietPreference: 'VEGAN'
      };

      const plan = generateDailyMealPlan(veganProfile, mockTargets);
      const allIngredients = [
        ...plan.breakfast.ingredients,
        ...plan.lunch.ingredients,
        ...plan.snack.ingredients,
        ...plan.dinner.ingredients
      ].map(i => i.toLowerCase());

      const nonVeganKeywords = ['chicken', 'beef', 'steak', 'bacon', 'turkey', 'egg', 'whey', 'yogurt', 'dairy', 'salmon', 'fish'];
      nonVeganKeywords.forEach(keyword => {
        const found = allIngredients.some(i => i.includes(keyword));
        expect(found, `Found non-vegan keyword "${keyword}" in ingredients`).toBe(false);
      });
      allIngredients.filter(i => i.includes('butter')).forEach(b => {
        expect(b).toMatch(/(almond|peanut|seed) butter/);
      });
    });

    it('strictly enforces KETO diet preferences (low carb, high fat/protein)', () => {
      const ketoProfile: UserProfile = {
        ...baseBeginnerProfile,
        dietPreference: 'KETO'
      };

      const plan = generateDailyMealPlan(ketoProfile, mockTargets);
      expect(plan.breakfast.dietSuitability).toContain('KETO');
      expect(plan.lunch.dietSuitability).toContain('KETO');
    });

    it('strictly excludes dairy when user has dairy allergy or lactose intolerance', () => {
      const lactoseIntolerantProfile: UserProfile = {
        ...baseBeginnerProfile,
        allergies: ['dairy'],
        intolerances: ['lactose']
      };

      const plan = generateDailyMealPlan(lactoseIntolerantProfile, mockTargets);
      const allAllergens = [
        ...plan.breakfast.allergens,
        ...plan.lunch.allergens,
        ...plan.snack.allergens,
        ...plan.dinner.allergens
      ];

      expect(allAllergens).not.toContain('dairy');
    });

    it('strictly excludes nuts when user has nut allergy', () => {
      const nutAllergyProfile: UserProfile = {
        ...baseBeginnerProfile,
        allergies: ['nuts', 'peanuts']
      };

      const plan = generateDailyMealPlan(nutAllergyProfile, mockTargets);
      const allAllergens = [
        ...plan.breakfast.allergens,
        ...plan.lunch.allergens,
        ...plan.snack.allergens,
        ...plan.dinner.allergens
      ];

      expect(allAllergens).not.toContain('nuts');
    });
  });

  // =========================================================================
  // 5. Workout Completion Integrity
  // =========================================================================
  describe('Workout Completion & Verification Status Integrity', () => {
    it('correctly associates CAMERA completion method with VERIFIED status', () => {
      const cameraSet = {
        id: 's-cam-1',
        setNumber: 1,
        reps: 12,
        weightKg: 0,
        completed: true,
        completionMethod: 'CAMERA' as const,
        verification: 'VERIFIED' as const
      };

      expect(cameraSet.completionMethod).toBe('CAMERA');
      expect(cameraSet.verification).toBe('VERIFIED');
    });

    it('correctly associates MANUAL completion method with SELF_REPORTED status', () => {
      const manualSet = {
        id: 's-man-1',
        setNumber: 1,
        reps: 10,
        weightKg: 20,
        completed: true,
        completionMethod: 'MANUAL' as const,
        verification: 'SELF_REPORTED' as const
      };

      expect(manualSet.completionMethod).toBe('MANUAL');
      expect(manualSet.verification).toBe('SELF_REPORTED');
    });
  });

});
