import { describe, it, expect } from 'vitest';
import { EXERCISES, Exercise } from '../src/features/workouts/data/exercises';
import { getAvailableExercises } from '../src/features/workouts/utils/equipmentFilter';
import { generateWorkout } from '../src/features/workouts/utils/workoutGenerator';
import { calculateBMR, calculateMaintenanceCalories, calculateNutritionTargets } from '../src/utils/nutritionCalculator';
import { calculateHydrationTarget } from '../src/utils/hydrationCalculator';
import { UserProfile } from '../src/types/profile';

describe('FRIDAY Foundation Engine Tests', () => {

  // TEST: Centralized Exercise Database integrity
  it('should not contain any duplicate exercise definitions or IDs in EXERCISES', () => {
    const ids = EXERCISES.map(e => e.id);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);

    const names = EXERCISES.map(e => e.name.toLowerCase().trim());
    const uniqueNames = new Set(names);
    expect(names.length).toBe(uniqueNames.size);
  });

  // TEST: Equipment Filtering
  describe('Equipment Filtering', () => {
    it('should strictly exclude equipment exercises when environment is HOME and equipment is ["NONE"]', () => {
      const homeZeroEquipmentProfile: Pick<UserProfile, 'trainingEnvironment' | 'equipment'> = {
        trainingEnvironment: 'HOME',
        equipment: ['NONE']
      };

      const available = getAvailableExercises(homeZeroEquipmentProfile, EXERCISES);

      expect(available.length).toBeGreaterThan(0);

      // Prohibited when equipment is NONE
      const forbiddenExercises = [
        'Dumbbell Row',
        'Dumbbell Curl',
        'Bench Press',
        'Barbell Squat',
        'Cable Row',
        'Leg Press'
      ];

      available.forEach(ex => {
        expect(ex.equipmentRequired).toEqual(['NONE']);
        expect(ex.environment).toContain('HOME');
        expect(forbiddenExercises).not.toContain(ex.name);
      });
    });

    it('should allow dumbbell exercises only if user owns DUMBBELLS', () => {
      const homeDumbbellProfile: Pick<UserProfile, 'trainingEnvironment' | 'equipment'> = {
        trainingEnvironment: 'HOME',
        equipment: ['DUMBBELLS']
      };

      const available = getAvailableExercises(homeDumbbellProfile, EXERCISES);
      const dumbbellOnly = available.filter(e => e.equipmentRequired.includes('DUMBBELLS'));
      expect(dumbbellOnly.length).toBeGreaterThan(0);

      // Must NOT contain barbell bench press if user does not own BARBELL and BENCH
      const benchPress = available.find(e => e.name === 'Bench Press');
      expect(benchPress).toBeUndefined();
    });
  });

  // TEST: User Demanded CRITICAL TEST
  describe('CRITICAL TEST — Equipment Constraint & Generator Verification', () => {
    it('verifies HOME + equipment: ["NONE"] generated workout strictly excludes Dumbbell Row, Dumbbell Curl, Bench Press, Barbell Squat, Cable Row, Leg Press', () => {
      const profile: UserProfile = {
        name: 'Critical Tester',
        age: 25,
        sex: 'MALE',
        heightCm: 175,
        currentWeightKg: 70,
        targetWeightKg: 75,
        goal: 'GAIN_MUSCLE',
        activityLevel: 'MODERATELY_ACTIVE',
        trainingExperience: 'BEGINNER',
        trainingEnvironment: 'HOME',
        equipment: ['NONE'],
        availableWorkoutDays: ['MON', 'WED', 'FRI'],
        preferredWorkoutDuration: 45,
        dietPreference: 'STANDARD',
        foodPreferences: [],
        allergies: [],
        intolerances: []
      };

      // Generate the workout
      const workout = generateWorkout(profile);
      expect(workout).toBeDefined();
      expect(workout.days.length).toBe(3);

      const allWorkoutExerciseNames: string[] = [];
      workout.days.forEach(day => {
        day.exercises.forEach(ex => {
          allWorkoutExerciseNames.push(ex.name);
        });
      });

      // The workout MUST NOT contain:
      // - Dumbbell Row
      // - Dumbbell Curl
      // - Bench Press
      // - Barbell Squat
      // - Cable Row
      // - Leg Press
      const forbiddenNames = [
        'Dumbbell Row',
        'Dumbbell Curl',
        'Bench Press',
        'Barbell Squat',
        'Cable Row',
        'Leg Press'
      ];

      for (const forbidden of forbiddenNames) {
        expect(allWorkoutExerciseNames).not.toContain(forbidden);
      }

      // It should contain only exercises compatible with the user's equipment
      const availablePool = getAvailableExercises(profile, EXERCISES);
      const availableIds = new Set(availablePool.map(e => e.id));

      workout.days.forEach(day => {
        day.exercises.forEach(ex => {
          expect(availableIds.has(ex.exerciseId)).toBe(true);
        });
      });
    });
  });

  // TEST: Nutrition Engine (Mifflin-St Jeor)
  describe('Nutrition Engine', () => {
    it('should calculate accurate BMR according to Mifflin-St Jeor equation', () => {
      // Male: 10*80 + 6.25*180 - 5*25 + 5 = 800 + 1125 - 125 + 5 = 1805
      const maleBmr = calculateBMR(80, 180, 25, 'MALE');
      expect(maleBmr).toBe(1805);

      // Female: 10*60 + 6.25*165 - 5*30 - 161 = 600 + 1031.25 - 150 - 161 = 1320
      const femaleBmr = calculateBMR(60, 165, 30, 'FEMALE');
      expect(femaleBmr).toBe(1320);
    });

    it('should calculate TDEE and adjust targets based on Goal without hardcoded numbers', () => {
      const profile: UserProfile = {
        name: 'Alex',
        age: 28,
        sex: 'MALE',
        heightCm: 178,
        currentWeightKg: 75,
        targetWeightKg: 70,
        goal: 'FAT_LOSS',
        activityLevel: 'MODERATELY_ACTIVE',
        trainingExperience: 'INTERMEDIATE',
        trainingEnvironment: 'HOME',
        equipment: ['NONE'],
        availableWorkoutDays: ['MON', 'WED', 'FRI'],
        preferredWorkoutDuration: 45,
        dietPreference: 'STANDARD',
        foodPreferences: [],
        allergies: [],
        intolerances: []
      };

      const targets = calculateNutritionTargets(profile);

      // Fat loss must be 20% deficit under maintenance
      expect(targets.targetCalories).toBeLessThan(targets.maintenanceCalories);
      expect(targets.targetCalories).toBe(Math.round(targets.maintenanceCalories * 0.80));

      // Protein must be around 2.2g/kg for fat loss
      expect(targets.proteinGrams).toBe(Math.round(75 * 2.2));
      expect(targets.fatGrams).toBeGreaterThan(0);
      expect(targets.carbsGrams).toBeGreaterThan(0);
    });
  });

  // TEST: Hydration Engine
  describe('Hydration Engine', () => {
    it('should calculate personalized hydration target based on weight, activity, and workout duration', () => {
      const sedentaryProfile: UserProfile = {
        name: 'Sam',
        age: 30,
        sex: 'FEMALE',
        heightCm: 165,
        currentWeightKg: 60,
        targetWeightKg: 60,
        goal: 'GENERAL_FITNESS',
        activityLevel: 'SEDENTARY',
        trainingExperience: 'BEGINNER',
        trainingEnvironment: 'HOME',
        equipment: ['NONE'],
        availableWorkoutDays: ['TUE', 'THU'],
        preferredWorkoutDuration: 30,
        dietPreference: 'STANDARD',
        foodPreferences: [],
        allergies: [],
        intolerances: []
      };

      // 60kg * 35 = 2100 ml + (30/30)*250 = 2350 ml
      const targetSedentary = calculateHydrationTarget(sedentaryProfile);
      expect(targetSedentary).toBe(2350);

      // When active, should add 500 ml baseline modifier
      const activeProfile: UserProfile = { ...sedentaryProfile, activityLevel: 'VERY_ACTIVE' };
      const targetActive = calculateHydrationTarget(activeProfile);
      expect(targetActive).toBe(2850);
    });
  });

  // TEST: Dynamic Biometrics
  it('should dynamically reflect changes in user biometrics rather than returning hardcoded constants', () => {
    const baseProfile: UserProfile = {
      name: 'Dynamic Test',
      age: 25,
      sex: 'MALE',
      heightCm: 170,
      currentWeightKg: 70,
      targetWeightKg: 65,
      goal: 'FAT_LOSS',
      activityLevel: 'SEDENTARY',
      trainingExperience: 'BEGINNER',
      trainingEnvironment: 'HOME',
      equipment: ['NONE'],
      availableWorkoutDays: ['MON'],
      preferredWorkoutDuration: 30,
      dietPreference: 'STANDARD',
      foodPreferences: [],
      allergies: [],
      intolerances: []
    };

    const target1 = calculateNutritionTargets(baseProfile);
    const heavierProfile: UserProfile = { ...baseProfile, currentWeightKg: 90 };
    const target2 = calculateNutritionTargets(heavierProfile);

    // Heavier profile must have higher BMR, maintenance, and protein targets
    expect(target2.bmr).toBeGreaterThan(target1.bmr);
    expect(target2.targetCalories).toBeGreaterThan(target1.targetCalories);
    expect(target2.proteinGrams).toBeGreaterThan(target1.proteinGrams);
  });
});
