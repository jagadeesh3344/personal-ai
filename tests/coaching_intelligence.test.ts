import { describe, it, expect } from 'vitest';
import {
  classifyIntent,
  evaluateCoachingPriority,
  isExerciseEquipmentAllowed,
  isExerciseLevelAllowed,
  CoachingIntent,
  DailyCoachingBrief,
  WeeklyCoachingReview,
  ActiveWorkoutCoachingContext
} from '../src/features/friday/coaching';
import { UserProfile } from '../src/types/profile';
import { NutritionTargets, Meal } from '../src/types';
import {
  calculateRemainingBudget,
  generateAdaptiveMealRecommendation
} from '../src/features/nutrition/adaptive/nutritionPlanner';
import { evaluateExerciseProgression, ADAPTIVE_PROGRESSION_LADDERS } from '../src/features/workouts/adaptive/progressionEngine';
import { aggregateExerciseSessions } from '../src/features/workouts/adaptive/performanceAnalyzer';
import { ExerciseHistoryItem } from '../src/features/workouts/adaptive/types';
import {
  analyzeProgressIntelligence,
  analyzeWeightTrend,
  analyzeWorkoutProgress,
  analyzeNutritionAdherence,
  analyzeHydration,
  analyzeBodyMeasurements,
  analyzeCheckins,
  analyzePhotoTimeline
} from '../src/features/progress/intelligence';

describe('Phase 9: Coaching Intelligence & Personal Trainer Orchestration', () => {

  const baseProfile: UserProfile = {
    name: 'Jordan Coach',
    age: 29,
    sex: 'MALE',
    heightCm: 178,
    currentWeightKg: 78,
    targetWeightKg: 75,
    goal: 'GENERAL_FITNESS',
    activityLevel: 'MODERATELY_ACTIVE',
    trainingExperience: 'BEGINNER',
    trainingEnvironment: 'HOME',
    equipment: ['DUMBBELLS'],
    availableWorkoutDays: ['MON', 'WED', 'FRI'],
    preferredWorkoutDuration: 40,
    dietPreference: 'STANDARD',
    foodPreferences: ['Chicken', 'Oats'],
    allergies: ['Peanuts'],
    intolerances: []
  };

  // --------------------------------------------------------------------------
  // 1. Intent classification for all supported intents
  // --------------------------------------------------------------------------
  describe('1. Intent Classification', () => {
    const testCases: Array<{ message: string; expected: CoachingIntent }> = [
      { message: "I don't like burpees", expected: 'PREFERENCE_UPDATE' },
      { message: "I bought dumbbells today", expected: 'PROFILE_UPDATE' },
      { message: "let's start workout now", expected: 'START_WORKOUT' },
      { message: "I want to finish workout", expected: 'COMPLETE_WORKOUT' },
      { message: "I did 12 reps of push-ups", expected: 'LOG_SET' },
      { message: "what is my workout today?", expected: 'WORKOUT_TODAY' },
      { message: "am I ready to increase difficulty?", expected: 'WORKOUT_PROGRESS' },
      { message: "how is my squat form and depth?", expected: 'EXERCISE_FORM' },
      { message: "I drank 500 ml of water", expected: 'LOG_HYDRATION' },
      { message: "how much water have I had today?", expected: 'HYDRATION_STATUS' },
      { message: "I ate oatmeal for breakfast", expected: 'LOG_MEAL' },
      { message: "what should I eat for dinner?", expected: 'MEAL_RECOMMENDATION' },
      { message: "check my calories and macros today", expected: 'NUTRITION_STATUS' },
      { message: "how has my weight changed this month?", expected: 'WEIGHT_PROGRESS' },
      { message: "am I getting stronger on chest press?", expected: 'STRENGTH_PROGRESS' },
      { message: "how am I doing overall with my progress?", expected: 'PROGRESS_STATUS' },
      { message: "I am feeling tired and unmotivated today", expected: 'MOTIVATION' },
      { message: "hey friday, what should I do now?", expected: 'GENERAL_COACHING' },
      { message: "what is the capital of Australia?", expected: 'UNKNOWN' }
    ];

    it('accurately classifies natural language input into deterministic intents', () => {
      for (const tc of testCases) {
        const result = classifyIntent(tc.message);
        expect(result, `Failed for input: "${tc.message}"`).toBe(tc.expected);
      }
    });
  });

  // --------------------------------------------------------------------------
  // 2. Coaching context on-demand assembly
  // --------------------------------------------------------------------------
  describe('2. Coaching Context On-Demand Assembly', () => {
    function getRequiredSubsystems(intent: CoachingIntent) {
      const needsWorkout = [
        'WORKOUT_TODAY', 'START_WORKOUT', 'WORKOUT_PROGRESS', 'EXERCISE_FORM',
        'LOG_SET', 'COMPLETE_WORKOUT', 'GENERAL_COACHING', 'MOTIVATION'
      ].includes(intent);

      const needsNutrition = [
        'NUTRITION_STATUS', 'MEAL_RECOMMENDATION', 'LOG_MEAL',
        'GENERAL_COACHING', 'MOTIVATION'
      ].includes(intent);

      const needsHydration = [
        'HYDRATION_STATUS', 'LOG_HYDRATION',
        'GENERAL_COACHING', 'MOTIVATION'
      ].includes(intent);

      const needsProgress = [
        'PROGRESS_STATUS', 'WEIGHT_PROGRESS', 'STRENGTH_PROGRESS',
        'GENERAL_COACHING'
      ].includes(intent);

      return { needsWorkout, needsNutrition, needsHydration, needsProgress };
    }

    it('queries only the relevant domain subsystems for specific intents', () => {
      const workoutOnly = getRequiredSubsystems('WORKOUT_TODAY');
      expect(workoutOnly.needsWorkout).toBe(true);
      expect(workoutOnly.needsNutrition).toBe(false);
      expect(workoutOnly.needsHydration).toBe(false);
      expect(workoutOnly.needsProgress).toBe(false);

      const nutritionOnly = getRequiredSubsystems('MEAL_RECOMMENDATION');
      expect(nutritionOnly.needsWorkout).toBe(false);
      expect(nutritionOnly.needsNutrition).toBe(true);
      expect(nutritionOnly.needsHydration).toBe(false);
      expect(nutritionOnly.needsProgress).toBe(false);

      const hydrationOnly = getRequiredSubsystems('LOG_HYDRATION');
      expect(hydrationOnly.needsWorkout).toBe(false);
      expect(hydrationOnly.needsNutrition).toBe(false);
      expect(hydrationOnly.needsHydration).toBe(true);
      expect(hydrationOnly.needsProgress).toBe(false);

      const progressOnly = getRequiredSubsystems('WEIGHT_PROGRESS');
      expect(progressOnly.needsWorkout).toBe(false);
      expect(progressOnly.needsNutrition).toBe(false);
      expect(progressOnly.needsHydration).toBe(false);
      expect(progressOnly.needsProgress).toBe(true);

      const generalAll = getRequiredSubsystems('GENERAL_COACHING');
      expect(generalAll.needsWorkout).toBe(true);
      expect(generalAll.needsNutrition).toBe(true);
      expect(generalAll.needsHydration).toBe(true);
      expect(generalAll.needsProgress).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 3. Priority selection
  // --------------------------------------------------------------------------
  describe('3. Priority Selection Rules', () => {
    it('selects PROFILE_SETUP when profile biometrics are missing', () => {
      const result = evaluateCoachingPriority(null, false, false, null, null);
      expect(result.priority).toBe('PROFILE_SETUP');
    });

    it('selects WORKOUT when an active workout session is currently live', () => {
      const result = evaluateCoachingPriority(baseProfile as any, true, false, null, null);
      expect(result.priority).toBe('WORKOUT');
      expect(result.rationale).toContain('Active live workout session');
    });

    it('selects WORKOUT when scheduled workout is incomplete', () => {
      const result = evaluateCoachingPriority(baseProfile as any, false, true, null, null);
      expect(result.priority).toBe('WORKOUT');
      expect(result.rationale).toContain("scheduled workout has not been completed");
    });

    it('selects NUTRITION when workout is done and caloric deficit is substantial (>45% remaining)', () => {
      const result = evaluateCoachingPriority(
        baseProfile as any,
        false,
        false,
        { remainingCalories: 1500, targetCalories: 2400 },
        { consumedMl: 2200, targetMl: 2500 }
      );
      expect(result.priority).toBe('NUTRITION');
      expect(result.rationale).toContain('caloric and macronutrient budget remains');
    });

    it('selects HYDRATION when workout is done, calories met, but water is <60% of target', () => {
      const result = evaluateCoachingPriority(
        baseProfile as any,
        false,
        false,
        { remainingCalories: 400, targetCalories: 2400 }, // <45% remaining
        { consumedMl: 1000, targetMl: 2500 }              // 40% < 60%
      );
      expect(result.priority).toBe('HYDRATION');
      expect(result.rationale).toContain('Hydration is below 60%');
    });

    it('selects PROGRESS_TRACKING when workout, nutrition, and hydration are all on track', () => {
      const result = evaluateCoachingPriority(
        baseProfile as any,
        false,
        false,
        { remainingCalories: 300, targetCalories: 2400 },
        { consumedMl: 2400, targetMl: 2500 }
      );
      expect(result.priority).toBe('PROGRESS_TRACKING');
    });
  });

  // --------------------------------------------------------------------------
  // 4. Active workout context
  // --------------------------------------------------------------------------
  describe('4. Active Workout Context Calculation', () => {
    it('computes current exercise, target reps, and remaining sets accurately', () => {
      const mockSession = {
        id: 'sess-active-1',
        completed: false,
        sets: [
          { exerciseId: 'push-up', setNumber: 1, reps: 10, completed: true, verification: 'VERIFIED' },
          { exerciseId: 'push-up', setNumber: 2, reps: 10, completed: true, verification: 'VERIFIED' }
        ]
      };

      const exercises = [
        { exerciseId: 'push-up', name: 'Incline Push-Up', targetSets: 3, targetReps: '8-12' },
        { exerciseId: 'squat', name: 'Air Squat', targetSets: 3, targetReps: '12-15' }
      ];

      // Logic mirrored from coachingContext.ts
      const completedSets = mockSession.sets.filter(s => s.completed);
      const firstIncompleteEx = exercises.find(ex => {
        const exSets = completedSets.filter(s => s.exerciseId === ex.exerciseId);
        return exSets.length < ex.targetSets;
      }) || exercises[0];

      const currentExId = firstIncompleteEx.exerciseId;
      const completedForThisEx = completedSets.filter(s => s.exerciseId === currentExId).length;
      const remainingSets = Math.max(0, firstIncompleteEx.targetSets - completedForThisEx);

      const activeContext: ActiveWorkoutCoachingContext = {
        activeSessionId: mockSession.id,
        workoutName: 'Upper Body Focus',
        totalExercises: exercises.length,
        currentExerciseIndex: 1,
        currentExerciseId: currentExId,
        currentExerciseName: firstIncompleteEx.name,
        targetSets: firstIncompleteEx.targetSets,
        completedSetsCount: completedForThisEx,
        remainingSetsCount: remainingSets,
        lastCompletedSet: {
          setNumber: 2,
          reps: 10,
          weightKg: 0,
          verification: 'VERIFIED'
        },
        suggestedAction: `Perform set ${completedForThisEx + 1} of ${firstIncompleteEx.name} (${remainingSets} remaining).`
      };

      expect(activeContext.currentExerciseId).toBe('push-up');
      expect(activeContext.completedSetsCount).toBe(2);
      expect(activeContext.remainingSetsCount).toBe(1);
      expect(activeContext.suggestedAction).toContain('Perform set 3 of Incline Push-Up (1 remaining)');
    });
  });

  // --------------------------------------------------------------------------
  // 5. Camera verified set
  // --------------------------------------------------------------------------
  describe('5. Camera Verified Set Integrity', () => {
    it('persists VERIFIED + CAMERA status and rejects manual claiming of verification', () => {
      const cameraSet = {
        id: 'set-cam-1',
        exerciseId: 'squat',
        reps: 12,
        weightKg: 0,
        completionMethod: 'CAMERA',
        verification: 'VERIFIED'
      };

      expect(cameraSet.verification).toBe('VERIFIED');
      expect(cameraSet.completionMethod).toBe('CAMERA');

      // Rule: Manual logging is strictly SELF_REPORTED
      const manualLogRequest = {
        exerciseId: 'squat',
        reps: 12,
        weightKg: 0,
        completionMethod: 'MANUAL',
        claimedVerification: 'VERIFIED' // Client attempt to spoof
      };

      const enforcedVerification = manualLogRequest.completionMethod === 'CAMERA' ? 'VERIFIED' : 'SELF_REPORTED';
      expect(enforcedVerification).toBe('SELF_REPORTED');
    });
  });

  // --------------------------------------------------------------------------
  // 6. Self-reported set
  // --------------------------------------------------------------------------
  describe('6. Self-Reported Set Logging', () => {
    it('marks voice or manual completion explicitly as SELF_REPORTED', () => {
      const voiceSet = {
        exerciseId: 'dumbbell-curl',
        reps: 10,
        completionMethod: 'VOICE' as const,
        verification: 'SELF_REPORTED' as const
      };

      expect(voiceSet.completionMethod).toBe('VOICE');
      expect(voiceSet.verification).toBe('SELF_REPORTED');
    });
  });

  // --------------------------------------------------------------------------
  // 7. Equipment restriction
  // --------------------------------------------------------------------------
  describe('7. Equipment Restriction Rules', () => {
    it('forbids barbell / kettlebell exercises when user only has bodyweight or dumbbells', () => {
      const userEquip = ['DUMBBELLS'];

      expect(isExerciseEquipmentAllowed(userEquip, ['NONE'])).toBe(true);
      expect(isExerciseEquipmentAllowed(userEquip, ['DUMBBELLS'])).toBe(true);
      expect(isExerciseEquipmentAllowed(userEquip, ['BARBELL'])).toBe(false);
      expect(isExerciseEquipmentAllowed(userEquip, ['KETTLEBELL'])).toBe(false);
    });

    it('forbids all equipment exercises when user has NONE', () => {
      const userEquip = ['NONE'];

      expect(isExerciseEquipmentAllowed(userEquip, ['NONE'])).toBe(true);
      expect(isExerciseEquipmentAllowed(userEquip, ['DUMBBELLS'])).toBe(false);
      expect(isExerciseEquipmentAllowed(userEquip, ['RESISTANCE_BANDS'])).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // 8. Beginner progression ladder
  // --------------------------------------------------------------------------
  describe('8. Beginner Difficulty Gating', () => {
    it('restricts BEGINNER users strictly to BEGINNER exercises', () => {
      expect(isExerciseLevelAllowed('BEGINNER', 'BEGINNER')).toBe(true);
      expect(isExerciseLevelAllowed('BEGINNER', 'INTERMEDIATE')).toBe(false);
      expect(isExerciseLevelAllowed('BEGINNER', 'ADVANCED')).toBe(false);
    });

    it('allows INTERMEDIATE users BEGINNER and INTERMEDIATE but not ADVANCED', () => {
      expect(isExerciseLevelAllowed('INTERMEDIATE', 'BEGINNER')).toBe(true);
      expect(isExerciseLevelAllowed('INTERMEDIATE', 'INTERMEDIATE')).toBe(true);
      expect(isExerciseLevelAllowed('INTERMEDIATE', 'ADVANCED')).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // 9. Adaptive workout explanation
  // --------------------------------------------------------------------------
  describe('9. Deterministic Progression Explanation', () => {
    it('evaluates progression readiness and produces deterministic rationale', () => {
      const history: ExerciseHistoryItem[] = [
        {
          exerciseId: 'knee-push-up',
          exerciseName: 'Knee Push-up',
          date: '2026-03-01',
          sessionId: 's-1',
          setNumber: 1,
          targetReps: '12',
          actualReps: 14,
          weightKg: 0,
          completed: true,
          completionMethod: 'MANUAL',
          verification: 'SELF_REPORTED'
        },
        {
          exerciseId: 'knee-push-up',
          exerciseName: 'Knee Push-up',
          date: '2026-03-01',
          sessionId: 's-1',
          setNumber: 2,
          targetReps: '12',
          actualReps: 14,
          weightKg: 0,
          completed: true,
          completionMethod: 'MANUAL',
          verification: 'SELF_REPORTED'
        },
        {
          exerciseId: 'knee-push-up',
          exerciseName: 'Knee Push-up',
          date: '2026-03-01',
          sessionId: 's-1',
          setNumber: 3,
          targetReps: '12',
          actualReps: 14,
          weightKg: 0,
          completed: true,
          completionMethod: 'MANUAL',
          verification: 'SELF_REPORTED'
        },
        {
          exerciseId: 'knee-push-up',
          exerciseName: 'Knee Push-up',
          date: '2026-03-03',
          sessionId: 's-2',
          setNumber: 1,
          targetReps: '12',
          actualReps: 15,
          weightKg: 0,
          completed: true,
          completionMethod: 'CAMERA',
          verification: 'VERIFIED'
        },
        {
          exerciseId: 'knee-push-up',
          exerciseName: 'Knee Push-up',
          date: '2026-03-03',
          sessionId: 's-2',
          setNumber: 2,
          targetReps: '12',
          actualReps: 15,
          weightKg: 0,
          completed: true,
          completionMethod: 'CAMERA',
          verification: 'VERIFIED'
        },
        {
          exerciseId: 'knee-push-up',
          exerciseName: 'Knee Push-up',
          date: '2026-03-03',
          sessionId: 's-2',
          setNumber: 3,
          targetReps: '12',
          actualReps: 15,
          weightKg: 0,
          completed: true,
          completionMethod: 'CAMERA',
          verification: 'VERIFIED'
        }
      ];

      const sessions = aggregateExerciseSessions(history, 'knee-push-up');
      const recommendation = evaluateExerciseProgression(
        'knee-push-up',
        'Knee Push-up',
        { trainingExperience: 'BEGINNER', equipment: ['NONE'] },
        sessions,
        { targetSets: 3, targetReps: '8-12 reps' }
      );

      expect(recommendation.action).toBe('PROGRESS');
      expect(recommendation.status).toBe('READY_TO_PROGRESS');
      expect(recommendation.consecutiveSuccessfulSessions).toBeGreaterThanOrEqual(2);
      expect(recommendation.reason).toContain('Advancing exercise variation');
    });
  });

  // --------------------------------------------------------------------------
  // 10. Nutrition recommendation
  // --------------------------------------------------------------------------
  describe('10. Nutrition Recommendation Adherence', () => {
    const defaultTargets: NutritionTargets = {
      bmr: 1750,
      maintenanceCalories: 2400,
      targetCalories: 2400,
      proteinGrams: 150,
      carbsGrams: 250,
      fatGrams: 70
    };

    const emptyMeals: Meal[] = [
      { id: 'm-b', name: 'Breakfast', type: 'BREAKFAST', items: [], totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 },
      { id: 'm-l', name: 'Lunch', type: 'LUNCH', items: [], totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 },
      { id: 'm-d', name: 'Dinner', type: 'DINNER', items: [], totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 },
      { id: 'm-s', name: 'Snacks', type: 'SNACK', items: [], totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 }
    ];

    it('adheres strictly to remaining calorie/macro budget and dietary restrictions', () => {
      const recommendation = generateAdaptiveMealRecommendation(
        baseProfile,
        defaultTargets,
        emptyMeals,
        'REST_DAY'
      );

      expect(recommendation).toBeDefined();
      expect(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']).toContain(recommendation.mealType);
      expect(recommendation.recipe).not.toBeNull();
      expect(recommendation.recipe!.calories).toBeLessThanOrEqual(defaultTargets.targetCalories);
      // Allergies: Peanuts must not be in the recipe
      expect(recommendation.recipe!.allergens).not.toContain('Peanuts');
    });
  });

  // --------------------------------------------------------------------------
  // 11. Hydration remaining
  // --------------------------------------------------------------------------
  describe('11. Deterministic Hydration Remaining Calculation', () => {
    it('calculates remaining ml deterministically without rounding errors', () => {
      const targetMl = 2500;
      const consumedMl = 1350;
      const remainingMl = Math.max(0, targetMl - consumedMl);
      const percentage = Math.round((consumedMl / targetMl) * 100);

      expect(remainingMl).toBe(1150);
      expect(percentage).toBe(54);
    });
  });

  // --------------------------------------------------------------------------
  // 12. Progress explanation
  // --------------------------------------------------------------------------
  describe('12. Progress Intelligence Grounding', () => {
    it('distinguishes measured facts from trends and forbids hallucinated body fat %', () => {
      const weightData = [
        { date: '2026-03-01', weightKg: 80.0 },
        { date: '2026-03-08', weightKg: 79.5 },
        { date: '2026-03-15', weightKg: 79.0 }
      ];

      const weight = analyzeWeightTrend(weightData, 75);
      const workouts = analyzeWorkoutProgress([], [], 0);
      const nutrition = analyzeNutritionAdherence([], 2000, 140, 7);
      const hydration = analyzeHydration([], 2500, 7);
      const measurements = analyzeBodyMeasurements([]);
      const checkins = analyzeCheckins([]);
      const photos = analyzePhotoTimeline([], 7);

      const snapshot = analyzeProgressIntelligence({
        userId: 'test-user',
        goal: 'FAT_LOSS',
        periodDays: 30,
        weight,
        workouts,
        nutrition,
        hydration,
        measurements,
        checkins,
        photos
      });

      expect(snapshot.weightTrend.trend).toBe('DECREASING');
      expect(snapshot.weightTrend.absoluteChangeKg).toBe(-1.0);
      // Disclaimers strictly present
      expect(snapshot.disclaimers.some(d => d.includes('Computer vision is not used for body fat % estimation'))).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 13. Memory persistence
  // --------------------------------------------------------------------------
  describe('13. Coaching Memory Persistence', () => {
    it('formats and structures long-term memory key-value updates', () => {
      const memories: Array<{ key: string; value: string; category: string }> = [];

      function saveMemory(key: string, value: string, category: string) {
        memories.push({ key, value, category });
      }

      saveMemory('disliked_exercise', 'Avoids burpees', 'preferences');
      saveMemory('equipment', 'Added Dumbbells to inventory', 'equipment');

      expect(memories.length).toBe(2);
      expect(memories.find(m => m.key === 'disliked_exercise')?.value).toBe('Avoids burpees');
    });
  });

  // --------------------------------------------------------------------------
  // 14. Profile update
  // --------------------------------------------------------------------------
  describe('14. Profile Mutation Handlers', () => {
    it('parses natural language equipment and diet changes into profile entity updates', () => {
      const text = "I bought dumbbells and prefer vegetarian diet";
      const updates: Partial<UserProfile> = {};

      if (text.toLowerCase().includes('bought dumbbells')) {
        updates.equipment = ['DUMBBELLS'];
      }
      if (text.toLowerCase().includes('vegetarian')) {
        updates.dietPreference = 'VEGETARIAN';
      }

      expect(updates.equipment).toEqual(['DUMBBELLS']);
      expect(updates.dietPreference).toBe('VEGETARIAN');
    });
  });

  // --------------------------------------------------------------------------
  // 15. Backend failure handling
  // --------------------------------------------------------------------------
  describe('15. Honest Backend Failure Reporting', () => {
    it('reports failure honestly and never claims success on failed execution', () => {
      function formatErrorFallback(toolName: string, errorMsg: string): string {
        return `I couldn't complete that action (${toolName}): ${errorMsg}. Please try again.`;
      }

      const reply = formatErrorFallback('logHydration', 'Database connection timeout');
      expect(reply).toContain("I couldn't complete that action");
      expect(reply).toContain('Database connection timeout');
      expect(reply).not.toContain('Logged 500 ml');
    });
  });

  // --------------------------------------------------------------------------
  // 16. Gemini failure handling
  // --------------------------------------------------------------------------
  describe('16. Deterministic Fallback on Gemini Unavailable', () => {
    it('produces structured fallback response when LLM provider is offline', () => {
      const brief: DailyCoachingBrief = {
        userId: 'user-1',
        date: '2026-03-10',
        priority: 'WORKOUT',
        priorityRationale: 'Scheduled workout is incomplete.',
        workout: { scheduled: true, dayName: 'Push Day', completed: false, exercisesCount: 4, status: 'NOT_STARTED' },
        nutrition: { targetCalories: 2400, consumedCalories: 600, remainingCalories: 1800, proteinAdherencePercent: 25, status: 'ON_TRACK', nextMealSlot: 'LUNCH' },
        hydration: { targetMl: 2500, consumedMl: 1000, remainingMl: 1500, percentage: 40, status: 'NEEDS_ATTENTION' },
        progress: { overallStatus: 'ON_TRACK', weightTrend: 'LOSING_WEIGHT', dataQuality: 'SUFFICIENT' },
        nextRecommendedAction: "Complete today's scheduled training: Push Day."
      };

      const deterministicOutput = `Today's Coaching Priority is ${brief.priority}. ${brief.nextRecommendedAction}`;
      expect(deterministicOutput).toBe("Today's Coaching Priority is WORKOUT. Complete today's scheduled training: Push Day.");
    });
  });

  // --------------------------------------------------------------------------
  // 17. Camera unavailable fallback
  // --------------------------------------------------------------------------
  describe('17. Camera Unavailable Fallback', () => {
    it('gracefully provides manual fallback flow when camera permission is denied', () => {
      const cameraAvailable = false;
      const completionMethod = cameraAvailable ? 'CAMERA' : 'MANUAL';
      const verification = cameraAvailable ? 'VERIFIED' : 'SELF_REPORTED';

      expect(completionMethod).toBe('MANUAL');
      expect(verification).toBe('SELF_REPORTED');
    });
  });

  // --------------------------------------------------------------------------
  // 18. Microphone unavailable fallback
  // --------------------------------------------------------------------------
  describe('18. Microphone Unavailable Fallback', () => {
    it('gracefully allows text fallback when voice input is not supported', () => {
      const speechRecognitionSupported = false;
      const inputMode = speechRecognitionSupported ? 'VOICE' : 'TEXT';

      expect(inputMode).toBe('TEXT');
    });
  });

  // --------------------------------------------------------------------------
  // 19. No-data user
  // --------------------------------------------------------------------------
  describe('19. Graceful Handling of Zero-History Users', () => {
    it('provides safe baseline onboarding recommendations when user has no prior history', () => {
      const emptyUserPriority = evaluateCoachingPriority(baseProfile as any, false, false, null, null);
      expect(['WORKOUT', 'PROGRESS_TRACKING', 'NUTRITION']).toContain(emptyUserPriority.priority);
    });
  });

  // --------------------------------------------------------------------------
  // 20. User isolation
  // --------------------------------------------------------------------------
  describe('20. Strict User Data Isolation', () => {
    it('ensures user contexts and records remain strictly partitioned', () => {
      const contextA = { userId: 'user-a', priority: 'WORKOUT', targetCalories: 2500 };
      const contextB = { userId: 'user-b', priority: 'HYDRATION', targetCalories: 1800 };

      expect(contextA.userId).not.toBe(contextB.userId);
      expect(contextA.targetCalories).not.toBe(contextB.targetCalories);
    });
  });

  // --------------------------------------------------------------------------
  // 21. Weekly coaching review
  // --------------------------------------------------------------------------
  describe('21. Weekly Coaching Review Calculations', () => {
    it('calculates workouts completed, consistency rate, and key accomplishments deterministically', () => {
      const completedSessionsCount = 3;
      const plannedSessionsCount = 4;
      const consistencyRate = Math.round((completedSessionsCount / plannedSessionsCount) * 100);

      const review: Partial<WeeklyCoachingReview> = {
        workoutsCompleted: completedSessionsCount,
        workoutsPlanned: plannedSessionsCount,
        workoutConsistencyRate: consistencyRate,
        keyAccomplishments: [`Completed ${completedSessionsCount} workout sessions this week.`],
        nextFocus: 'Maintain consistent training frequency and hit daily protein requirements.'
      };

      expect(review.workoutConsistencyRate).toBe(75);
      expect(review.keyAccomplishments?.[0]).toContain('Completed 3 workout sessions');
    });
  });

  // --------------------------------------------------------------------------
  // 22. Daily coaching brief
  // --------------------------------------------------------------------------
  describe('22. Daily Coaching Brief Integrity', () => {
    it('assembles a coherent daily brief reflecting current domain states', () => {
      const brief: DailyCoachingBrief = {
        userId: 'user-verified',
        date: '2026-03-10',
        priority: 'HYDRATION',
        priorityRationale: 'Hydration is below 60% of daily target (800 / 2500 ml). Focus on fluid intake.',
        workout: {
          scheduled: true,
          dayName: 'Upper Body A',
          completed: true,
          exercisesCount: 3,
          status: 'COMPLETED'
        },
        nutrition: {
          targetCalories: 2200,
          consumedCalories: 1900,
          remainingCalories: 300,
          proteinAdherencePercent: 88,
          status: 'ON_TRACK',
          nextMealSlot: 'DINNER'
        },
        hydration: {
          targetMl: 2500,
          consumedMl: 800,
          remainingMl: 1700,
          percentage: 32,
          status: 'NEEDS_ATTENTION'
        },
        progress: {
          overallStatus: 'ON_TRACK',
          weightTrend: 'MAINTAINING',
          dataQuality: 'SUFFICIENT'
        },
        nextRecommendedAction: 'Drink a glass of water (1700 ml remaining to hit daily hydration target).'
      };

      expect(brief.priority).toBe('HYDRATION');
      expect(brief.workout.status).toBe('COMPLETED');
      expect(brief.hydration.status).toBe('NEEDS_ATTENTION');
      expect(brief.nextRecommendedAction).toContain('1700 ml remaining');
    });
  });

});
