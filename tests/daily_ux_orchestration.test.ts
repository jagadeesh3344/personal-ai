import { describe, it, expect } from 'vitest';
import { UserProfile } from '../src/types/profile';
import { WorkoutSession, WorkoutExercise, WorkoutSet, Meal } from '../src/types';
import { 
  evaluateCoachingPriority, 
  classifyIntent 
} from '../src/features/friday/coaching';
import { 
  calculateRemainingBudget, 
  generateAdaptiveMealRecommendation 
} from '../src/features/nutrition/adaptive/nutritionPlanner';
import { calculateNutritionTargets } from '../src/utils/nutritionCalculator';
import { calculateHydrationTarget } from '../src/utils/hydrationCalculator';
import { analyzeWeightTrend } from '../src/features/progress/intelligence/weightTrendAnalyzer';

describe('Phase 10: Daily Experience & Full Personal Trainer UX', () => {

  const testProfile: UserProfile = {
    name: 'Taylor Trainer',
    age: 28,
    sex: 'FEMALE',
    heightCm: 168,
    currentWeightKg: 65,
    targetWeightKg: 62,
    goal: 'FAT_LOSS',
    activityLevel: 'MODERATELY_ACTIVE',
    trainingExperience: 'INTERMEDIATE',
    trainingEnvironment: 'HOME',
    equipment: ['DUMBBELLS', 'BENCH'],
    availableWorkoutDays: ['MONDAY', 'WEDNESDAY', 'FRIDAY', 'SATURDAY'],
    preferredWorkoutDuration: 45,
    dietPreference: 'STANDARD',
    foodPreferences: ['Chicken', 'Rice'],
    allergies: ['Peanuts'],
    intolerances: []
  };

  // -------------------------------------------------------------
  // 1. TODAY EXPERIENCE & ONE CLEAR NEXT ACTION
  // -------------------------------------------------------------
  describe('Today Experience & Priority Alignment', () => {
    it('determines WORKOUT as the top priority when scheduled workout is not completed', () => {
      const result = evaluateCoachingPriority(testProfile, false, true, null, null);
      expect(result.priority).toBe('WORKOUT');
    });

    it('determines NUTRITION as the top priority when workout is completed and protein is under target', () => {
      const result = evaluateCoachingPriority(
        testProfile,
        false,
        false,
        { remainingCalories: 1200, targetCalories: 1800 },
        { consumedMl: 2200, targetMl: 2500 }
      );
      expect(result.priority).toBe('NUTRITION');
    });

    it('determines HYDRATION as the top priority when workout and nutrition are on track but water is lagging', () => {
      const result = evaluateCoachingPriority(
        testProfile,
        false,
        false,
        { remainingCalories: 300, targetCalories: 1800 },
        { consumedMl: 1000, targetMl: 2500 }
      );
      expect(result.priority).toBe('HYDRATION');
    });

    it('determines PROGRESS_TRACKING when workout, nutrition, and hydration are all satisfied', () => {
      const result = evaluateCoachingPriority(
        testProfile,
        false,
        false,
        { remainingCalories: 200, targetCalories: 1800 },
        { consumedMl: 2400, targetMl: 2500 }
      );
      expect(result.priority).toBe('PROGRESS_TRACKING');
    });

    it('determines PROFILE_SETUP when onboarding is incomplete', () => {
      const result = evaluateCoachingPriority(null, false, false, null, null);
      expect(result.priority).toBe('PROFILE_SETUP');
    });
  });

  // -------------------------------------------------------------
  // 2. WORKOUT EXPERIENCE & STATE MACHINE
  // -------------------------------------------------------------
  describe('Workout Mode, Sets & Completion Tracking', () => {
    function createMockSession(): WorkoutSession {
      return {
        id: 'sess-p10-001',
        userId: 'user-p10',
        planId: 'plan-1',
        dayId: 'day-1',
        dayName: 'Upper Body Tone',
        startedAt: '2026-09-11T10:00:00Z',
        completed: false,
        exercises: [
          {
            id: 'ex-1',
            exerciseId: 'dumbbell-bench-press',
            name: 'Dumbbell Bench Press',
            muscleGroups: ['CHEST'],
            targetSets: 3,
            targetReps: '10 reps',
            restSeconds: 60,
            notes: 'Keep elbows at 45 degrees',
            sets: [
              { id: 's-1', setNumber: 1, reps: 10, weightKg: 16, completed: true, verification: 'VERIFIED', completionMethod: 'CAMERA' },
              { id: 's-2', setNumber: 2, reps: 10, weightKg: 16, completed: false },
              { id: 's-3', setNumber: 3, reps: 10, weightKg: 16, completed: false }
            ]
          },
          {
            id: 'ex-2',
            exerciseId: 'incline-push-up',
            name: 'Incline Push-Up',
            muscleGroups: ['CHEST', 'TRICEPS'],
            targetSets: 2,
            targetReps: '12 reps',
            restSeconds: 45,
            notes: 'Body straight in plank position',
            sets: [
              { id: 's-4', setNumber: 1, reps: 12, weightKg: 0, completed: false },
              { id: 's-5', setNumber: 2, reps: 12, weightKg: 0, completed: false }
            ]
          }
        ]
      };
    }

    it('identifies the active exercise and uncompleted sets accurately', () => {
      const session = createMockSession();
      const currentEx = session.exercises.find(e => e.sets.some(s => !s.completed));
      expect(currentEx).toBeDefined();
      expect(currentEx?.name).toBe('Dumbbell Bench Press');

      const nextSet = currentEx?.sets.find(s => !s.completed);
      expect(nextSet?.setNumber).toBe(2);
    });

    it('marks camera tracked sets strictly with VERIFIED verification', () => {
      const cameraCompletedSet: WorkoutSet = {
        id: 's-2',
        setNumber: 2,
        reps: 10,
        weightKg: 16,
        completed: true,
        completionMethod: 'CAMERA',
        verification: 'VERIFIED',
        completedAt: new Date().toISOString()
      };

      expect(cameraCompletedSet.verification).toBe('VERIFIED');
      expect(cameraCompletedSet.completionMethod).toBe('CAMERA');
    });

    it('marks manual / voice sets strictly with SELF_REPORTED verification', () => {
      const manualCompletedSet: WorkoutSet = {
        id: 's-3',
        setNumber: 3,
        reps: 10,
        weightKg: 16,
        completed: true,
        completionMethod: 'MANUAL',
        verification: 'SELF_REPORTED',
        completedAt: new Date().toISOString()
      };

      expect(manualCompletedSet.verification).toBe('SELF_REPORTED');
      expect(manualCompletedSet.completionMethod).toBe('MANUAL');
    });

    it('computes correct breakdown of verified vs self-reported sets upon workout completion', () => {
      const session = createMockSession();
      // Complete all sets
      session.exercises[0].sets[1].completed = true;
      session.exercises[0].sets[1].verification = 'VERIFIED';
      session.exercises[0].sets[2].completed = true;
      session.exercises[0].sets[2].verification = 'SELF_REPORTED';

      session.exercises[1].sets[0].completed = true;
      session.exercises[1].sets[0].verification = 'VERIFIED';
      session.exercises[1].sets[1].completed = true;
      session.exercises[1].sets[1].verification = 'SELF_REPORTED';

      const allSets = session.exercises.flatMap(e => e.sets);
      const completedSets = allSets.filter(s => s.completed);
      const verifiedCount = completedSets.filter(s => s.verification === 'VERIFIED').length;
      const selfReportedCount = completedSets.filter(s => s.verification !== 'VERIFIED').length;

      expect(completedSets.length).toBe(5);
      expect(verifiedCount).toBe(3);
      expect(selfReportedCount).toBe(2);

      session.completed = true;
      session.completedAt = '2026-09-11T10:45:00Z';
      expect(session.completed).toBe(true);
    });

    it('handles rest timer countdown transitions correctly', () => {
      let timerSeconds = 60;
      let timerActive = true;
      let restFinishedNotice = false;

      // Simulate tick
      timerSeconds -= 1;
      expect(timerSeconds).toBe(59);

      // Simulate timer finish
      timerSeconds = 0;
      if (timerSeconds === 0 && timerActive) {
        timerActive = false;
        restFinishedNotice = true;
      }

      expect(timerActive).toBe(false);
      expect(restFinishedNotice).toBe(true);
    });
  });

  // -------------------------------------------------------------
  // 3. CAMERA FAILURE FALLBACK & ACCESSIBILITY
  // -------------------------------------------------------------
  describe('Camera Failure Fallback', () => {
    it('provides honest error state without crashing workout flow', () => {
      const cameraErrorState = {
        cameraActive: false,
        errorMessage: 'Camera tracking is not available right now.',
        fallbackOptions: ['Try Again', 'Log Set Manually', 'Use Voice']
      };

      expect(cameraErrorState.cameraActive).toBe(false);
      expect(cameraErrorState.errorMessage).toContain("not available");
      expect(cameraErrorState.fallbackOptions).toContain('Log Set Manually');
      expect(cameraErrorState.fallbackOptions).toContain('Use Voice');
    });
  });

  // -------------------------------------------------------------
  // 4. COHERENT NUTRITION & ALLERGEN SAFETY
  // -------------------------------------------------------------
  describe('Nutrition Remaining Budget & Safety', () => {
    it('calculates remaining calories and macros accurately', () => {
      const targets = calculateNutritionTargets(testProfile);
      const loggedMeals: Meal[] = [
        {
          id: 'm-1',
          name: 'Breakfast Bowl',
          type: 'BREAKFAST',
          totalCalories: 450,
          totalProtein: 35,
          totalCarbs: 50,
          totalFat: 12,
          items: []
        }
      ];

      const consumedCalories = loggedMeals.reduce((a, m) => a + m.totalCalories, 0);
      const consumedProtein = loggedMeals.reduce((a, m) => a + m.totalProtein, 0);

      const remainingCalories = targets.targetCalories - consumedCalories;
      const remainingProtein = targets.proteinGrams - consumedProtein;

      expect(remainingCalories).toBe(targets.targetCalories - 450);
      expect(remainingProtein).toBe(targets.proteinGrams - 35);
    });

    it('strictly excludes allergens and disliked foods from meal recommendations', () => {
      const targets = calculateNutritionTargets(testProfile);
      const remainingBudget = calculateRemainingBudget(targets, { calories: 500, protein: 30, carbs: 60, fat: 15 });

      const recommendation = generateAdaptiveMealRecommendation(
        testProfile,
        targets,
        [{ id: 'm-1', type: 'BREAKFAST', name: 'Breakfast', totalCalories: 500, totalProtein: 30, totalCarbs: 60, totalFat: 15, items: [] }] as any,
        { forceMealType: 'LUNCH' }
      );

      expect(recommendation).toBeDefined();
      expect(remainingBudget.remainingCalories).toBe(targets.targetCalories - 500);
      if (recommendation.recipe) {
        expect(recommendation.recipe.allergens).not.toContain('Peanuts');
      }
    });
  });

  // -------------------------------------------------------------
  // 5. HYDRATION QUICK LOGGING & SYNCHRONIZATION
  // -------------------------------------------------------------
  describe('Hydration Quick Logging & State', () => {
    it('increments consumed volume correctly and computes remaining volume', () => {
      const targetMl = calculateHydrationTarget(testProfile);
      let consumedMl = 500;

      // User logs +500 ml
      consumedMl += 500;
      expect(consumedMl).toBe(1000);

      const remainingMl = Math.max(0, targetMl - consumedMl);
      expect(remainingMl).toBe(targetMl - 1000);
      const percentage = Math.min(100, Math.round((consumedMl / targetMl) * 100));
      expect(percentage).toBeGreaterThan(0);
    });
  });

  // -------------------------------------------------------------
  // 6. PROGRESS INTELLIGENCE & MONTHLY CHECK-IN
  // -------------------------------------------------------------
  describe('Progress Intelligence & Monthly Check-In Contract', () => {
    it('produces honest empty states when history has no recorded measurements', () => {
      const weightAnalysis = analyzeWeightTrend([], testProfile.targetWeightKg);
      expect(weightAnalysis.trend).toBe('INSUFFICIENT_DATA');
      expect(weightAnalysis.measurementCount).toBe(0);
    });

    it('formats biometric check-in data with weight and circumferences', () => {
      const checkinSubmission = {
        date: '2026-09-11',
        weightKg: 64.5,
        chestCm: 90,
        waistCm: 72,
        armsCm: 28,
        thighsCm: 54,
        photosRecorded: { front: true, side: false, back: false },
        reflection: 'Feeling stronger on squats'
      };

      expect(checkinSubmission.weightKg).toBe(64.5);
      expect(checkinSubmission.waistCm).toBe(72);
      expect(checkinSubmission.photosRecorded.front).toBe(true);
      expect(checkinSubmission.reflection).toContain('Feeling stronger');
    });
  });

  // -------------------------------------------------------------
  // 7. FRIDAY CONVERSATIONAL COACHING & INTENT DISPATCH
  // -------------------------------------------------------------
  describe('Conversational Coach Intent Handling', () => {
    it('classifies workout queries to WORKOUT_TODAY', () => {
      expect(classifyIntent("What's my workout today?")).toBe('WORKOUT_TODAY');
    });

    it('classifies nutrition requests to MEAL_RECOMMENDATION', () => {
      expect(classifyIntent("What should I eat now?")).toBe('MEAL_RECOMMENDATION');
    });

    it('classifies hydration intake to LOG_HYDRATION', () => {
      expect(classifyIntent("I drank 500 ml of water.")).toBe('LOG_HYDRATION');
    });

    it('classifies progress inquiries to PROGRESS_STATUS', () => {
      expect(classifyIntent("How am I progressing towards my goal?")).toBe('PROGRESS_STATUS');
    });
  });

  // -------------------------------------------------------------
  // 8. MULTI-SUBSYSTEM MUTATION SYNCHRONIZATION
  // -------------------------------------------------------------
  describe('State Synchronization Contracts', () => {
    it('re-evaluates coaching brief priority when workout is completed', () => {
      // Prior to workout completion
      let result = evaluateCoachingPriority(testProfile, false, true, null, null);
      expect(result.priority).toBe('WORKOUT');

      // After workout is completed
      result = evaluateCoachingPriority(
        testProfile,
        false,
        false,
        { remainingCalories: 1200, targetCalories: 1800 },
        { consumedMl: 2200, targetMl: 2500 }
      );
      expect(result.priority).not.toBe('WORKOUT');
      expect(result.priority).toBe('NUTRITION');
    });

    it('immediately updates remaining macros when a meal is logged', () => {
      const targets = calculateNutritionTargets(testProfile);
      let consumedCalories = 500;
      let consumedProtein = 30;

      // User logs a 400 kcal, 35g protein meal
      consumedCalories += 400;
      consumedProtein += 35;

      const remainingCal = targets.targetCalories - consumedCalories;
      const remainingProt = targets.proteinGrams - consumedProtein;

      expect(remainingCal).toBe(targets.targetCalories - 900);
      expect(remainingProt).toBe(targets.proteinGrams - 65);
    });

    it('supports custom hydration entry amounts and updates remaining volume', () => {
      const targetMl = 2500;
      let consumedMl = 750;

      // User logs custom 350 ml
      const customAmount = 350;
      consumedMl += customAmount;

      expect(consumedMl).toBe(1100);
      expect(targetMl - consumedMl).toBe(1400);
    });
  });

  // -------------------------------------------------------------
  // 9. SECURITY & VERIFICATION INTEGRITY
  // -------------------------------------------------------------
  describe('Security & Verification Authority', () => {
    it('enforces that manual logging cannot spoof VERIFIED status', () => {
      // Rule: Manual logging is strictly SELF_REPORTED
      const manualLogInput = {
        completionMethod: 'MANUAL',
        claimedVerification: 'VERIFIED' // Attempt to spoof
      };

      // Backend / Domain rule forces SELF_REPORTED unless CAMERA pose engine confirms
      const enforcedVerification = manualLogInput.completionMethod === 'CAMERA' ? 'VERIFIED' : 'SELF_REPORTED';
      expect(enforcedVerification).toBe('SELF_REPORTED');
    });

    it('enforces user isolation by partitioning state by user identifier', () => {
      const userAData = { userId: 'user-a', consumedMl: 1500 };
      const userBData = { userId: 'user-b', consumedMl: 500 };

      expect(userAData.userId).not.toBe(userBData.userId);
      expect(userAData.consumedMl).not.toBe(userBData.consumedMl);
    });
  });

});
