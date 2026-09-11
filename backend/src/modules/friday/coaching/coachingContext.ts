import { CoachingContext, CoachingIntent, ActiveWorkoutCoachingContext } from './types.js';
import { evaluateCoachingPriority } from './coachingRules.js';
import { ProfileRepository } from '../../../repositories/profile.repo.js';
import { WorkoutsService } from '../../../services/workouts.service.js';
import { NutritionService } from '../../../services/nutrition.service.js';
import { HydrationService } from '../../../services/hydration.service.js';
import { ProgressService } from '../../../services/progress.service.js';
import { FridayRepository } from '../../../repositories/friday.repo.js';

/**
 * Builds selective, structured CoachingContext for the user based on intent.
 * Queries only necessary subsystems to maintain low latency.
 */
export async function buildCoachingContext(
  userId: string,
  intent: CoachingIntent = 'GENERAL_COACHING'
): Promise<CoachingContext> {
  const profile = await ProfileRepository.getProfile(userId);

  // Intent classification flags
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

  // Parallel asynchronous fetching of required domains
  const [
    todayWorkoutResult,
    sessionsResult,
    nutritionResult,
    hydrationResult,
    progressResult,
    memoriesResult
  ] = await Promise.all([
    needsWorkout ? WorkoutsService.getTodayWorkout(userId).catch(() => null) : Promise.resolve(null),
    needsWorkout ? WorkoutsService.getSessions(userId).catch(() => []) : Promise.resolve([]),
    needsNutrition ? NutritionService.getDailyNutritionState(userId).catch(() => null) : Promise.resolve(null),
    needsHydration ? HydrationService.getTodayHydration(userId).catch(() => null) : Promise.resolve(null),
    needsProgress ? ProgressService.getProgressIntelligence(userId, 30).catch(() => null) : Promise.resolve(null),
    FridayRepository.getLongTermMemories(userId).catch(() => [])
  ]);

  // Active workout context if session is running
  const activeSession = (sessionsResult || []).find(s => !s.completed) || null;
  let activeWorkoutContext: ActiveWorkoutCoachingContext | null = null;

  if (activeSession && todayWorkoutResult) {
    const exercises = todayWorkoutResult.exercises || [];
    const sets = activeSession.sets || [];
    const completedSets = sets.filter(s => s.completed);

    const firstIncompleteEx = exercises.find((ex: any) => {
      const exSets = completedSets.filter((s: any) => s.exerciseId === ex.exerciseId || s.exerciseId === ex.id);
      return exSets.length < (ex.targetSets || 3);
    }) || exercises[0];

    const currentExId = firstIncompleteEx?.exerciseId || (firstIncompleteEx as any)?.id || 'push-up';
    const currentExName = firstIncompleteEx?.name || 'Current Exercise';
    const targetSets = firstIncompleteEx?.targetSets || 3;
    const completedForThisEx = completedSets.filter((s: any) => s.exerciseId === currentExId).length;
    const remainingSets = Math.max(0, targetSets - completedForThisEx);

    const lastSet = completedSets[completedSets.length - 1];

    activeWorkoutContext = {
      activeSessionId: activeSession.id,
      workoutName: todayWorkoutResult.dayName || 'Daily Workout',
      totalExercises: exercises.length,
      currentExerciseIndex: exercises.findIndex((e: any) => (e.id || e.exerciseId) === currentExId) + 1,
      currentExerciseId: currentExId,
      currentExerciseName: currentExName,
      targetSets,
      completedSetsCount: completedForThisEx,
      remainingSetsCount: remainingSets,
      lastCompletedSet: lastSet ? {
        setNumber: lastSet.setNumber,
        reps: lastSet.reps || 0,
        weightKg: lastSet.weightKg || 0,
        verification: lastSet.verification || 'SELF_REPORTED'
      } : undefined,
      suggestedAction: remainingSets > 0
        ? `Perform set ${completedForThisEx + 1} of ${currentExName} (${remainingSets} remaining).`
        : 'All sets complete for this exercise. Ready to advance to the next movement.'
    };
  }

  // Evaluate deterministic priority
  const workoutScheduled = !!todayWorkoutResult && todayWorkoutResult.exercises && todayWorkoutResult.exercises.length > 0;
  const todaySessions = (sessionsResult || []).filter((s: any) => s.date === new Date().toISOString().split('T')[0]);
  const workoutCompleted = todaySessions.some((s: any) => s.completed);
  const workoutScheduledAndIncomplete = workoutScheduled && !workoutCompleted;

  const { priority } = evaluateCoachingPriority(
    profile,
    !!activeSession,
    workoutScheduledAndIncomplete,
    nutritionResult ? {
      remainingCalories: nutritionResult.remaining.calories,
      targetCalories: nutritionResult.targets.targetCalories
    } : null,
    hydrationResult ? {
      consumedMl: hydrationResult.consumedMl,
      targetMl: hydrationResult.targetMl
    } : null
  );

  return {
    userId,
    intent,
    priority,
    profile,
    todayWorkout: todayWorkoutResult,
    activeSession,
    activeWorkoutContext,
    dailyNutritionState: nutritionResult,
    hydrationSummary: hydrationResult,
    progressIntelligence: progressResult,
    recentMemories: memoriesResult.map(m => ({ key: m.key, value: m.value }))
  };
}
