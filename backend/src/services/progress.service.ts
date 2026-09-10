import { ProgressRepository, MeasurementEntity, CheckinEntity } from '../repositories/progress.repo.js';
import { ProfileRepository } from '../repositories/profile.repo.js';
import { WorkoutsRepository } from '../repositories/workouts.repo.js';
import { NutritionRepository } from '../repositories/nutrition.repo.js';
import { HydrationRepository } from '../repositories/hydration.repo.js';
import { analyzeWeightTrend } from '../modules/progress/intelligence/weightTrendAnalyzer.js';
import { analyzeWorkoutProgress } from '../modules/progress/intelligence/workoutProgressAnalyzer.js';
import { analyzeNutritionAdherence, DailyMealSummary } from '../modules/progress/intelligence/nutritionAdherenceAnalyzer.js';
import { analyzeHydration, DailyHydrationSummary } from '../modules/progress/intelligence/hydrationAnalyzer.js';
import { analyzeBodyMeasurements } from '../modules/progress/intelligence/measurementAnalyzer.js';
import { analyzeCheckins, analyzePhotos } from '../modules/progress/intelligence/checkinAnalyzer.js';
import { buildProgressSnapshot } from '../modules/progress/intelligence/progressAnalyzer.js';
import { ProgressSnapshot, ProgressTimelineEvent } from '../modules/progress/intelligence/types.js';
import { ExerciseHistoryItem } from '../modules/workouts/adaptive/types.js';

export class ProgressService {
  static async getProgress(userId: string) {
    const measurements = await ProgressRepository.getMeasurements(userId);
    const checkins = await ProgressRepository.getCheckins(userId);

    const weightHistory = measurements.map(m => ({
      date: m.date,
      weightKg: m.weightKg
    }));

    return {
      measurements,
      checkins,
      weightHistory,
      latestMeasurement: measurements[0] || null,
      latestCheckin: checkins[0] || null
    };
  }

  static async addMeasurement(userId: string, data: Omit<MeasurementEntity, 'id' | 'userId' | 'createdAt'>): Promise<MeasurementEntity> {
    return ProgressRepository.addMeasurement(userId, data);
  }

  static async getCheckins(userId: string): Promise<CheckinEntity[]> {
    return ProgressRepository.getCheckins(userId);
  }

  static async createCheckin(userId: string, data: Omit<CheckinEntity, 'id' | 'userId' | 'createdAt'>): Promise<CheckinEntity> {
    return ProgressRepository.createCheckin(userId, data);
  }

  static async createPhotoUploadUrl(userId: string, pose: 'FRONT' | 'SIDE' | 'BACK', fileExtension: string, checkinId?: string) {
    return ProgressRepository.createPhotoUploadUrl(userId, pose, fileExtension, checkinId);
  }

  static async getSignedPhotoUrl(userId: string, storagePath: string) {
    return ProgressRepository.getSignedPhotoUrl(userId, storagePath);
  }

  /**
   * Generates deterministic, real-data-backed Progress Intelligence for the authenticated user.
   */
  static async getProgressIntelligence(userId: string, periodDays: number = 30): Promise<ProgressSnapshot> {
    const [
      profile,
      measurements,
      checkins,
      photos,
      sessions,
      allMeals,
      nutritionTargets,
      hydrationEntries
    ] = await Promise.all([
      ProfileRepository.getProfile(userId),
      ProgressRepository.getMeasurements(userId),
      ProgressRepository.getCheckins(userId),
      ProgressRepository.getPhotos(userId),
      WorkoutsRepository.getSessions(userId),
      NutritionRepository.getAllMeals(userId),
      NutritionRepository.getTargets(userId),
      HydrationRepository.getAllEntries(userId)
    ]);

    const goal = profile?.goal || 'GENERAL_FITNESS';
    const targetWeightKg = profile?.targetWeightKg || null;

    // 1. Weight analysis
    const weightRecords = measurements.map(m => ({ date: m.date, weightKg: m.weightKg }));
    const weightAnalysis = analyzeWeightTrend(weightRecords, targetWeightKg);

    // 2. Workout analysis
    const sessionSummaries = sessions.map(s => ({
      id: s.id,
      date: s.date,
      completed: s.completed,
      dayName: s.notes || undefined
    }));

    const historyItems: ExerciseHistoryItem[] = [];
    for (const session of sessions) {
      for (const set of session.sets || []) {
        historyItems.push({
          sessionId: session.id,
          date: session.date,
          exerciseId: set.exerciseId,
          exerciseName: set.exerciseId,
          setNumber: set.setNumber,
          targetReps: undefined,
          actualReps: set.reps,
          weightKg: set.weightKg,
          durationSeconds: set.durationSeconds,
          resistanceLevel: set.resistanceLevel,
          completed: set.completed,
          completionMethod: set.completionMethod || 'MANUAL',
          verification: set.verification || 'SELF_REPORTED',
          rpe: set.rpe
        });
      }
    }

    const workoutAnalysis = analyzeWorkoutProgress(sessionSummaries, historyItems, periodDays > 7 ? Math.round((periodDays / 7) * 3) : 3);

    // 3. Nutrition adherence analysis
    const mealMap = new Map<string, { calories: number; protein: number; carbs: number; fat: number; count: number }>();
    for (const m of allMeals) {
      const existing = mealMap.get(m.date) || { calories: 0, protein: 0, carbs: 0, fat: 0, count: 0 };
      existing.calories += (m.totalCalories || 0);
      existing.protein += (m.totalProtein || 0);
      existing.carbs += (m.totalCarbs || 0);
      existing.fat += (m.totalFat || 0);
      existing.count += 1;
      mealMap.set(m.date, existing);
    }

    const dailyMealSummaries: DailyMealSummary[] = Array.from(mealMap.entries()).map(([date, d]) => ({
      date,
      totalCalories: d.calories,
      totalProtein: d.protein,
      totalCarbs: d.carbs,
      totalFat: d.fat,
      mealCount: d.count
    }));

    const targetCalories = nutritionTargets?.targetCalories || 2000;
    const targetProtein = nutritionTargets?.proteinGrams || 140;
    const nutritionAnalysis = analyzeNutritionAdherence(dailyMealSummaries, targetCalories, targetProtein, periodDays);

    // 4. Hydration analysis
    const hydrationMap = new Map<string, number>();
    for (const h of hydrationEntries) {
      hydrationMap.set(h.date, (hydrationMap.get(h.date) || 0) + (h.amountMl || 0));
    }
    const dailyHydrationSummaries: DailyHydrationSummary[] = Array.from(hydrationMap.entries()).map(([date, totalMl]) => ({
      date,
      totalMl
    }));
    const hydrationAnalysis = analyzeHydration(dailyHydrationSummaries, 2500, periodDays);

    // 5. Body measurements analysis
    const measurementAnalysis = analyzeBodyMeasurements(measurements);

    // 6. Checkins and photos analysis
    const checkinAnalysis = analyzeCheckins(checkins);
    const photoAnalysis = analyzePhotos(photos);

    // 7. Aggregate snapshot
    return buildProgressSnapshot({
      userId,
      goal,
      periodDays,
      weight: weightAnalysis,
      workouts: workoutAnalysis,
      nutrition: nutritionAnalysis,
      hydration: hydrationAnalysis,
      measurements: measurementAnalysis,
      checkins: checkinAnalysis,
      photos: photoAnalysis
    });
  }

  /**
   * Retrieves chronological real events timeline.
   */
  static async getProgressTimeline(userId: string, periodDays: number = 30): Promise<ProgressTimelineEvent[]> {
    const snapshot = await ProgressService.getProgressIntelligence(userId, periodDays);
    return snapshot.timeline;
  }
}
