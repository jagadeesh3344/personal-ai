import { describe, it, expect } from 'vitest';
import { EXERCISE_DATABASE } from '../src/constants/exercises';
import { getAvailableExercises, normalizeUserEquipment } from '../src/utils/equipmentFilter';
import { calculateBMR, calculateMaintenanceCalories, calculateNutritionTargets } from '../src/utils/nutritionCalculator';
import { calculateHydrationTarget } from '../src/utils/hydrationCalculator';
import { generateWorkoutPlan } from '../src/utils/workoutGenerator';
import { UserProfile } from '../src/types';

describe('FRIDAY Foundation Engine Tests', () => {

  // TEST 7: No duplicate exercise definitions
  it('should not contain any duplicate exercise definitions or IDs', () => {
    const ids = EXERCISE_DATABASE.map(e => e.id);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);

    const names = EXERCISE_DATABASE.map(e => e.name.toLowerCase().trim());
    const uniqueNames = new Set(names);
    expect(names.length).toBe(uniqueNames.size);
  });

  // TEST 1 & 2: Equipment Filtering (Home + No Equipment)
  describe('Equipment Filtering', () => {
    it('should strictly exclude equipment exercises when environment is HOME and equipment is empty []', () => {
      const homeZeroEquipmentProfile: Pick<UserProfile, 'trainingEnvironment' | 'equipment'> = {
        trainingEnvironment: 'HOME',
        equipment: []
      };

      const available = getAvailableExercises(homeZeroEquipmentProfile, EXERCISE_DATABASE);

      // Must have valid exercises
      expect(available.length).toBeGreaterThan(0);

      // Zero exercises requiring dumbbells, barbells, benches, cables, or gym machines may appear
      available.forEach(ex => {
        expect(ex.equipmentRequired).toEqual([]);
        expect(ex.environments).toContain('HOME');
        expect(ex.name).not.toMatch(/dumbbell/i);
        expect(ex.name).not.toMatch(/barbell/i);
        expect(ex.name).not.toMatch(/bench press/i);
        expect(ex.name).not.toMatch(/cable/i);
        expect(ex.name).not.toMatch(/machine/i);
      });
    });

    it('should allow dumbbell exercises only if user owns DUMBBELL', () => {
      const homeDumbbellProfile: Pick<UserProfile, 'trainingEnvironment' | 'equipment'> = {
        trainingEnvironment: 'HOME',
        equipment: ['Dumbbells']
      };

      const available = getAvailableExercises(homeDumbbellProfile, EXERCISE_DATABASE);
      const dumbbellOnly = available.filter(e => e.equipmentRequired.includes('DUMBBELL'));
      expect(dumbbellOnly.length).toBeGreaterThan(0);

      // Must NOT contain barbell or bench press if user does not own bench
      const benchPress = available.find(e => e.name.toLowerCase().includes('barbell bench press'));
      expect(benchPress).toBeUndefined();
    });

    it('should normalize equipment naming aliases cleanly', () => {
      const normalized = normalizeUserEquipment(['dumbbells', 'Bench', 'no equipment']);
      expect(normalized).toContain('DUMBBELL');
      expect(normalized).toContain('BENCH');
      expect(normalized).not.toContain('NONE');
    });
  });

  // TEST 3: Nutrition Calculation (Mifflin-St Jeor)
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
        id: 'u1',
        name: 'Alex',
        age: 28,
        sex: 'MALE',
        height: 178,
        currentWeight: 75,
        targetWeight: 70,
        goal: 'FAT_LOSS',
        activityLevel: 'MODERATELY_ACTIVE',
        trainingExperience: 'INTERMEDIATE',
        trainingEnvironment: 'HOME',
        equipment: [],
        availableWorkoutDays: ['MON', 'WED', 'FRI'],
        preferredWorkoutDuration: 45,
        dietPreference: 'STANDARD',
        foodPreferences: [],
        allergies: [],
        intolerances: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
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

  // TEST 4: Hydration Calculation
  describe('Hydration Engine', () => {
    it('should calculate personalized hydration target based on weight, activity, and workout duration', () => {
      const sedentaryProfile: UserProfile = {
        id: 'u2',
        name: 'Sam',
        age: 30,
        sex: 'FEMALE',
        height: 165,
        currentWeight: 60,
        targetWeight: 60,
        goal: 'GENERAL_FITNESS',
        activityLevel: 'SEDENTARY',
        trainingExperience: 'BEGINNER',
        trainingEnvironment: 'HOME',
        equipment: [],
        availableWorkoutDays: ['TUE', 'THU'],
        preferredWorkoutDuration: 30,
        dietPreference: 'STANDARD',
        foodPreferences: [],
        allergies: [],
        intolerances: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // 60kg * 35 = 2100 ml + (30/30)*250 = 2350 ml
      const targetSedentary = calculateHydrationTarget(sedentaryProfile);
      expect(targetSedentary).toBe(2350);

      // When active, should add 500 ml baseline modifier
      const activeProfile = { ...sedentaryProfile, activityLevel: 'VERY_ACTIVE' as const };
      const targetActive = calculateHydrationTarget(activeProfile);
      expect(targetActive).toBe(2850);
    });
  });

  // TEST 5 & 6: Profile & Workout Generation
  describe('Workout Generator Foundation', () => {
    it('should generate a valid WorkoutPlan with exercises strictly respecting environment & equipment', () => {
      const profile: UserProfile = {
        id: 'u3',
        name: 'Jordan',
        age: 24,
        sex: 'OTHER',
        height: 172,
        currentWeight: 68,
        targetWeight: 72,
        goal: 'GAIN_MUSCLE',
        trainingExperience: 'BEGINNER',
        trainingEnvironment: 'HOME',
        equipment: [], // Zero equipment
        availableWorkoutDays: ['MON', 'WED', 'FRI'],
        preferredWorkoutDuration: 45,
        activityLevel: 'MODERATELY_ACTIVE',
        dietPreference: 'STANDARD',
        foodPreferences: [],
        allergies: [],
        intolerances: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const plan = generateWorkoutPlan(profile);
      expect(plan).toBeDefined();
      expect(plan.days.length).toBe(3);

      // Verify each day's exercises are 100% bodyweight compatible
      plan.days.forEach(day => {
        expect(day.exercises.length).toBeGreaterThan(0);
        day.exercises.forEach(ex => {
          expect(ex.sets.length).toBeGreaterThanOrEqual(3);
          expect(ex.name).not.toMatch(/dumbbell/i);
          expect(ex.name).not.toMatch(/barbell/i);
          expect(ex.name).not.toMatch(/cable/i);
          expect(ex.name).not.toMatch(/machine/i);
        });
      });
    });

    it('should generate 4-day Upper/Lower split when user selects 4 available days', () => {
      const profile4Day: UserProfile = {
        id: 'u4',
        name: 'Casey',
        age: 29,
        sex: 'MALE',
        height: 182,
        currentWeight: 82,
        targetWeight: 85,
        goal: 'STRENGTH',
        trainingExperience: 'INTERMEDIATE',
        trainingEnvironment: 'GYM',
        equipment: ['Barbell', 'Dumbbell', 'Bench', 'Squat Rack', 'Cable Machine'],
        availableWorkoutDays: ['MON', 'TUE', 'THU', 'FRI'],
        preferredWorkoutDuration: 60,
        activityLevel: 'VERY_ACTIVE',
        dietPreference: 'STANDARD',
        foodPreferences: [],
        allergies: [],
        intolerances: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const plan = generateWorkoutPlan(profile4Day);
      expect(plan.days.length).toBe(4);
      expect(plan.days[0].dayName).toContain('Upper');
      expect(plan.days[1].dayName).toContain('Lower');
    });
  });

  // TEST 8: Verify no hardcoded values in calculations
  it('should dynamically reflect changes in user biometrics rather than returning hardcoded constants', () => {
    const baseProfile: UserProfile = {
      id: 'dyn',
      name: 'Dynamic Test',
      age: 25,
      sex: 'MALE',
      height: 170,
      currentWeight: 70,
      targetWeight: 65,
      goal: 'FAT_LOSS',
      activityLevel: 'SEDENTARY',
      trainingExperience: 'BEGINNER',
      trainingEnvironment: 'HOME',
      equipment: [],
      availableWorkoutDays: ['MON'],
      preferredWorkoutDuration: 30,
      dietPreference: 'STANDARD',
      foodPreferences: [],
      allergies: [],
      intolerances: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const target1 = calculateNutritionTargets(baseProfile);
    const heavierProfile = { ...baseProfile, currentWeight: 90 };
    const target2 = calculateNutritionTargets(heavierProfile);

    // Heavier profile must have higher BMR, maintenance, and protein targets
    expect(target2.bmr).toBeGreaterThan(target1.bmr);
    expect(target2.targetCalories).toBeGreaterThan(target1.targetCalories);
    expect(target2.proteinGrams).toBeGreaterThan(target1.proteinGrams);
  });
});
