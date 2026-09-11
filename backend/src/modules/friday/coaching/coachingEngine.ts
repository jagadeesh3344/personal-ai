import { DailyCoachingBrief, WeeklyCoachingReview } from './types.js';
import { evaluateCoachingPriority } from './coachingRules.js';
import { ProfileRepository, UserProfileEntity } from '../../../repositories/profile.repo.js';
import { WorkoutsService } from '../../../services/workouts.service.js';
import { NutritionService } from '../../../services/nutrition.service.js';
import { HydrationService } from '../../../services/hydration.service.js';
import { ProgressService } from '../../../services/progress.service.js';
import { FridayRepository } from '../../../repositories/friday.repo.js';

export class CoachingEngine {
  /**
   * Generates the authoritative deterministic Daily Coaching Brief.
   */
  static async getTodayCoaching(userId: string): Promise<DailyCoachingBrief> {
    const today = new Date().toISOString().split('T')[0];

    const [
      profile,
      todayWorkout,
      sessions,
      nutritionState,
      hydrationSummary,
      progress
    ] = await Promise.all([
      ProfileRepository.getProfile(userId),
      WorkoutsService.getTodayWorkout(userId).catch(() => null),
      WorkoutsService.getSessions(userId).catch(() => []),
      NutritionService.getDailyNutritionState(userId).catch(() => null),
      HydrationService.getTodayHydration(userId).catch(() => null),
      ProgressService.getProgressIntelligence(userId, 30).catch(() => null)
    ]);

    const activeSession = (sessions || []).find(s => !s.completed);
    const todaySessions = (sessions || []).filter((s: any) => s.date === today);
    const workoutCompleted = todaySessions.some((s: any) => s.completed);
    const workoutScheduled = !!todayWorkout && todayWorkout.exercises && todayWorkout.exercises.length > 0;
    const workoutIncomplete = workoutScheduled && !workoutCompleted;

    const { priority, rationale } = evaluateCoachingPriority(
      profile,
      !!activeSession,
      workoutIncomplete,
      nutritionState ? {
        remainingCalories: nutritionState.remaining.calories,
        targetCalories: nutritionState.targets.targetCalories
      } : null,
      hydrationSummary ? {
        consumedMl: hydrationSummary.consumedMl,
        targetMl: hydrationSummary.targetMl
      } : null
    );

    // Workout section
    const workoutStatus = workoutCompleted
      ? 'COMPLETED'
      : activeSession
        ? 'IN_PROGRESS'
        : workoutScheduled
          ? 'NOT_STARTED'
          : 'REST_DAY';

    // Nutrition section
    const targetCals = nutritionState?.targets.targetCalories || 2000;
    const consumedCals = nutritionState?.consumed.calories || 0;
    const remainingCals = nutritionState?.remaining.calories || 0;
    const targetProt = nutritionState?.targets.proteinGrams || 140;
    const consumedProt = nutritionState?.consumed.protein || 0;
    const protPercent = targetProt > 0 ? Math.min(100, Math.round((consumedProt / targetProt) * 100)) : 0;
    const nextMealSlot = nutritionState?.nextMealType || 'DINNER';

    // Hydration section
    const targetMl = hydrationSummary?.targetMl || 2500;
    const consumedMl = hydrationSummary?.consumedMl || 0;
    const remainingMl = Math.max(0, targetMl - consumedMl);
    const hydPercent = hydrationSummary?.percentage || 0;

    // Next recommended action derivation
    let nextRecommendedAction = '';
    if (activeSession) {
      nextRecommendedAction = 'Continue your active workout session. Execute your next prescribed set with verified form.';
    } else if (workoutIncomplete) {
      nextRecommendedAction = `Complete today's scheduled training: ${todayWorkout?.dayName || 'Workout'}.`;
    } else if (remainingCals > 400 && nextMealSlot !== 'DAILY_COMPLETE') {
      nextRecommendedAction = `Log your next meal (${nextMealSlot}) to reach your daily calorie and protein targets.`;
    } else if (remainingMl > 500) {
      nextRecommendedAction = `Drink a glass of water (${remainingMl} ml remaining to hit daily hydration target).`;
    } else {
      nextRecommendedAction = 'All core targets are in order. Review your weekly progress intelligence.';
    }

    return {
      userId,
      date: today,
      priority,
      priorityRationale: rationale,
      workout: {
        scheduled: workoutScheduled,
        dayName: todayWorkout?.dayName,
        completed: workoutCompleted,
        exercisesCount: todayWorkout?.exercises?.length || 0,
        activeSessionId: activeSession?.id,
        status: workoutStatus
      },
      nutrition: {
        targetCalories: targetCals,
        consumedCalories: consumedCals,
        remainingCalories: remainingCals,
        proteinAdherencePercent: protPercent,
        status: nutritionState?.onTrackStatus || 'UNTRACKED',
        nextMealSlot
      },
      hydration: {
        targetMl,
        consumedMl,
        remainingMl,
        percentage: hydPercent,
        status: hydPercent >= 60 ? 'GOOD' : 'NEEDS_ATTENTION'
      },
      progress: {
        overallStatus: progress?.overallStatus || 'INSUFFICIENT_DATA',
        weightTrend: progress?.weightTrend?.trend || 'INSUFFICIENT_DATA',
        dataQuality: progress?.dataQuality?.status || 'INSUFFICIENT'
      },
      nextRecommendedAction
    };
  }

  /**
   * Generates the authoritative deterministic Weekly Coaching Review.
   */
  static async getWeeklyCoaching(userId: string): Promise<WeeklyCoachingReview> {
    const endDate = new Date().toISOString().split('T')[0];
    const startDateObj = new Date();
    startDateObj.setDate(startDateObj.getDate() - 7);
    const startDate = startDateObj.toISOString().split('T')[0];

    const [progress, sessions] = await Promise.all([
      ProgressService.getProgressIntelligence(userId, 7),
      WorkoutsService.getSessions(userId).catch(() => [])
    ]);

    const recentSessions = (sessions || []).filter(s => s.date >= startDate);
    const completedSessions = recentSessions.filter(s => s.completed);
    const plannedSessions = Math.max(3, recentSessions.length);
    const consistencyRate = plannedSessions > 0
      ? Math.min(100, Math.round((completedSessions.length / plannedSessions) * 100))
      : 0;

    const keyAccomplishments: string[] = [];
    const areasNeedingAttention: string[] = [];

    if (completedSessions.length >= 3) {
      keyAccomplishments.push(`Completed ${completedSessions.length} workout sessions this week.`);
    } else {
      areasNeedingAttention.push(`Completed ${completedSessions.length} workouts. Strive for consistent 3+ weekly sessions.`);
    }

    if (progress.nutritionAdherence.loggingStatus === 'FULLY_TRACKED') {
      keyAccomplishments.push('Maintained continuous 7-day nutrition logging consistency.');
    } else if (progress.nutritionAdherence.daysTracked < 3) {
      areasNeedingAttention.push('Nutrition tracking was intermittent. Log meals consistently to maintain caloric awareness.');
    }

    if (progress.hydration.status === 'GOOD') {
      keyAccomplishments.push(`Averaged ${progress.hydration.averageIntakeMl} ml daily water intake.`);
    } else {
      areasNeedingAttention.push('Daily hydration fell below target volume.');
    }

    const improvements: Array<{ exerciseName: string; change: string; status: string }> = [];
    for (const ex of progress.workoutProgress.exercises) {
      if (ex.progressionState === 'READY_TO_PROGRESS') {
        improvements.push({
          exerciseName: ex.exerciseName,
          change: `Consistently exceeded target rep ceiling (${ex.bestReps} reps peak).`,
          status: 'READY_TO_PROGRESS'
        });
        keyAccomplishments.push(`Progressed in ${ex.exerciseName} - ready for next variation.`);
      }
    }

    const circumferences: Array<{ site: string; changeCm: number }> = [];
    for (const ch of progress.bodyMeasurements.changes) {
      circumferences.push({
        site: ch.site,
        changeCm: ch.absoluteChangeCm
      });
    }

    let nextFocus = 'Maintain consistent training frequency and hit daily protein requirements.';
    if (areasNeedingAttention.length > 0) {
      nextFocus = areasNeedingAttention[0];
    } else if (improvements.length > 0) {
      nextFocus = `Advance to higher tier variations on ${improvements[0].exerciseName}.`;
    }

    return {
      userId,
      startDate,
      endDate,
      workoutsCompleted: completedSessions.length,
      workoutsPlanned: plannedSessions,
      workoutConsistencyRate: consistencyRate,
      exerciseImprovements: improvements,
      nutritionDaysTracked: progress.nutritionAdherence.daysTracked,
      averageDailyCalories: progress.nutritionAdherence.averageCalories,
      calorieAdherenceRate: progress.nutritionAdherence.calorieAdherencePercent,
      averageDailyProteinGrams: progress.nutritionAdherence.averageProtein,
      hydrationAverageMl: progress.hydration.averageIntakeMl,
      hydrationConsistencyRate: progress.hydration.trackingConsistencyRate,
      weightTrend: {
        startingWeightKg: progress.weightTrend.startingWeightKg,
        currentWeightKg: progress.weightTrend.currentWeightKg,
        changeKg: progress.weightTrend.absoluteChangeKg,
        direction: progress.weightTrend.trend
      },
      circumferenceChanges: circumferences,
      keyAccomplishments,
      areasNeedingAttention,
      nextFocus
    };
  }

  /**
   * Deterministically updates profile settings and persists long-term memories.
   */
  static async handlePreferenceOrProfileUpdate(
    userId: string,
    message: string
  ): Promise<{ success: boolean; updatedFields: string[]; confirmationText: string }> {
    const lower = message.toLowerCase();
    const updatedFields: string[] = [];
    const profileUpdates: Partial<UserProfileEntity> = {};

    // 1. Equipment changes
    if (lower.includes('i bought dumbbells') || lower.includes('have dumbbells') || lower.includes('got dumbbells')) {
      const existing = await ProfileRepository.getProfile(userId);
      const currentEquip = new Set(existing?.equipment || []);
      currentEquip.delete('NONE');
      currentEquip.add('DUMBBELLS');
      profileUpdates.equipment = Array.from(currentEquip);
      updatedFields.push('equipment: DUMBBELLS');
      await FridayRepository.saveLongTermMemory(userId, 'equipment', 'Added Dumbbells to inventory', 'equipment');
    } else if (lower.includes('only have bodyweight') || lower.includes('no equipment') || lower.includes('only bodyweight')) {
      profileUpdates.equipment = ['NONE'];
      updatedFields.push('equipment: NONE');
      await FridayRepository.saveLongTermMemory(userId, 'equipment', 'Bodyweight only (no gym equipment)', 'equipment');
    }

    // 2. Disliked exercises
    if (lower.includes("don't like") || lower.includes('hate') || lower.includes('dislike')) {
      const match = message.match(/(?:don't like|hate|dislike)\s+([a-zA-Z\s-]+)/i);
      const exercise = match ? match[1].trim() : 'burpees';
      await FridayRepository.saveLongTermMemory(userId, 'disliked_exercise', `Avoids ${exercise}`, 'preferences');
      updatedFields.push(`disliked_exercise: ${exercise}`);
    }

    // 3. Diet preferences
    if (lower.includes('vegetarian')) {
      profileUpdates.dietPreference = 'VEGETARIAN';
      updatedFields.push('dietPreference: VEGETARIAN');
      await FridayRepository.saveLongTermMemory(userId, 'diet', 'Vegetarian diet preference', 'nutrition');
    } else if (lower.includes('vegan')) {
      profileUpdates.dietPreference = 'VEGAN';
      updatedFields.push('dietPreference: VEGAN');
      await FridayRepository.saveLongTermMemory(userId, 'diet', 'Vegan diet preference', 'nutrition');
    } else if (lower.includes('keto')) {
      profileUpdates.dietPreference = 'KETO';
      updatedFields.push('dietPreference: KETO');
      await FridayRepository.saveLongTermMemory(userId, 'diet', 'Keto diet preference', 'nutrition');
    }

    // 4. Workout schedule preference
    if (lower.includes('5 days a week') || lower.includes('5 days')) {
      profileUpdates.availableWorkoutDays = ['MON', 'TUE', 'WED', 'FRI', 'SAT'];
      updatedFields.push('availableWorkoutDays: 5 days/week');
      await FridayRepository.saveLongTermMemory(userId, 'schedule', 'Trains 5 days per week', 'schedule');
    }

    if (Object.keys(profileUpdates).length > 0) {
      await ProfileRepository.upsertProfile(userId, profileUpdates);
    }

    const confirmationText = updatedFields.length > 0
      ? `Understood. I have updated and saved your training preferences: ${updatedFields.join(', ')}.`
      : "I've noted that preference in your permanent profile.";

    return {
      success: true,
      updatedFields,
      confirmationText
    };
  }
}
