import { describe, it, expect } from 'vitest';
import {
  analyzeWeightTrend,
  analyzeWorkoutProgress,
  analyzeNutritionAdherence,
  analyzeHydration,
  analyzeBodyMeasurements,
  analyzeCheckins,
  analyzePhotoTimeline,
  analyzeProgressIntelligence,
  buildProgressTimeline,
  evaluateDataQuality,
  deriveOverallProgressStatus
} from '../src/features/progress/intelligence';
import { ExerciseHistoryItem } from '../src/features/workouts/adaptive/types';

describe('Phase 8: Progress Intelligence Unit Tests', () => {
  // 1. No history -> INSUFFICIENT_DATA
  it('1. No history: user with no records returns INSUFFICIENT_DATA', () => {
    const weight = analyzeWeightTrend([], 70);
    const workouts = analyzeWorkoutProgress([], [], 0);
    const nutrition = analyzeNutritionAdherence([], 2000, 140, 7);
    const hydration = analyzeHydration([], 2500, 7);
    const measurements = analyzeBodyMeasurements([]);
    const checkins = analyzeCheckins([]);
    const photos = analyzePhotoTimeline([], 7);

    const dataQuality = evaluateDataQuality(weight, workouts, nutrition, hydration, measurements);
    expect(dataQuality.status).toBe('INSUFFICIENT');

    const overall = deriveOverallProgressStatus('GENERAL_FITNESS', dataQuality, weight, workouts, nutrition);
    expect(overall.status).toBe('INSUFFICIENT_DATA');

    const snapshot = analyzeProgressIntelligence({
      userId: 'user-empty',
      goal: 'GENERAL_FITNESS',
      periodDays: 7,
      weight,
      workouts,
      nutrition,
      hydration,
      measurements,
      checkins,
      photos
    });

    expect(snapshot.dataQuality.status).toBe('INSUFFICIENT');
    expect(snapshot.overallStatus).toBe('INSUFFICIENT_DATA');
    expect(snapshot.weightTrend.trend).toBe('INSUFFICIENT_DATA');
    expect(snapshot.workoutProgress.overallWorkoutTrend).toBe('NO_HISTORY');
  });

  // 2. One weight measurement -> INSUFFICIENT_DATA, change = null/0, no false trend
  it('2. One weight measurement: returns INSUFFICIENT_DATA, no false trend', () => {
    const singleRecord = [{ date: '2026-03-01', weightKg: 80.0 }];
    const weight = analyzeWeightTrend(singleRecord, 75);

    expect(weight.measurementCount).toBe(1);
    expect(weight.startingWeightKg).toBe(80.0);
    expect(weight.currentWeightKg).toBe(80.0);
    expect(weight.absoluteChangeKg).toBe(0);
    expect(weight.percentageChange).toBe(0);
    expect(weight.trend).toBe('INSUFFICIENT_DATA');
  });

  // 3. Multiple weight measurements -> calculates change, average, delta
  it('3. Multiple weight measurements: calculates change, average, and delta', () => {
    const records = [
      { date: '2026-03-01', weightKg: 80.0 },
      { date: '2026-03-03', weightKg: 79.5 },
      { date: '2026-03-07', weightKg: 79.0 }
    ];
    const weight = analyzeWeightTrend(records, 75);

    expect(weight.measurementCount).toBe(3);
    expect(weight.startingWeightKg).toBe(80.0);
    expect(weight.currentWeightKg).toBe(79.0);
    expect(weight.absoluteChangeKg).toBe(-1.0);
    expect(weight.percentageChange).toBe(-1.25);
    expect(weight.recentAverageKg).toBe(79.0);
    expect(weight.trend).toBe('DECREASING');
  });

  // 4. Increasing weight -> correctly detects INCREASING
  it('4. Increasing weight: correctly detects INCREASING', () => {
    const records = [
      { date: '2026-03-01', weightKg: 70.0 },
      { date: '2026-03-04', weightKg: 71.0 },
      { date: '2026-03-08', weightKg: 72.0 }
    ];
    const weight = analyzeWeightTrend(records, 75);

    expect(weight.trend).toBe('INCREASING');
    expect(weight.absoluteChangeKg).toBe(2.0);
    expect(weight.percentageChange).toBeGreaterThan(0);
  });

  // 5. Decreasing weight -> correctly detects DECREASING
  it('5. Decreasing weight: correctly detects DECREASING', () => {
    const records = [
      { date: '2026-03-01', weightKg: 85.0 },
      { date: '2026-03-04', weightKg: 84.0 },
      { date: '2026-03-08', weightKg: 83.2 }
    ];
    const weight = analyzeWeightTrend(records, 80);

    expect(weight.trend).toBe('DECREASING');
    expect(weight.absoluteChangeKg).toBe(-1.8);
    expect(weight.percentageChange).toBeLessThan(0);
  });

  // 6. Stable weight -> correctly detects STABLE
  it('6. Stable weight: within noise threshold detects STABLE', () => {
    const records = [
      { date: '2026-03-01', weightKg: 75.0 },
      { date: '2026-03-03', weightKg: 75.2 },
      { date: '2026-03-05', weightKg: 74.9 },
      { date: '2026-03-08', weightKg: 75.1 }
    ];
    const weight = analyzeWeightTrend(records, 75);

    expect(weight.trend).toBe('STABLE');
    expect(Math.abs(weight.absoluteChangeKg || 0)).toBeLessThan(0.4);
  });

  // Helper for workout history
  function createWorkoutSet(
    sessionId: string,
    exerciseId: string,
    date: string,
    setNumber: number,
    targetReps: number | string,
    actualReps: number,
    completed: boolean = true,
    verification: 'VERIFIED' | 'SELF_REPORTED' = 'VERIFIED',
    weightKg: number = 0
  ): ExerciseHistoryItem {
    return {
      exerciseId,
      exerciseName: exerciseId,
      date,
      sessionId,
      setNumber,
      targetReps: String(targetReps),
      actualReps,
      weightKg,
      completed,
      completionMethod: 'CAMERA',
      verification
    };
  }

  // 7. Improving workout performance -> correctly detects IMPROVING
  it('7. Improving workout performance: progressive overload detected as IMPROVING', () => {
    const sessions = [
      { id: 's1', date: '2026-03-01', completed: true },
      { id: 's2', date: '2026-03-03', completed: true },
      { id: 's3', date: '2026-03-05', completed: true },
      { id: 's4', date: '2026-03-07', completed: true }
    ];
    const history: ExerciseHistoryItem[] = [
      // Session 1: Pushups hitting target
      createWorkoutSet('s1', 'standard_push_up', '2026-03-01', 1, 10, 10),
      createWorkoutSet('s1', 'standard_push_up', '2026-03-01', 2, 10, 10),
      createWorkoutSet('s1', 'standard_push_up', '2026-03-01', 3, 10, 10),
      // Session 2: Exceeding
      createWorkoutSet('s2', 'standard_push_up', '2026-03-03', 1, 10, 12),
      createWorkoutSet('s2', 'standard_push_up', '2026-03-03', 2, 10, 12),
      createWorkoutSet('s2', 'standard_push_up', '2026-03-03', 3, 10, 12),
      // Session 3: Exceeding further
      createWorkoutSet('s3', 'standard_push_up', '2026-03-05', 1, 10, 15),
      createWorkoutSet('s3', 'standard_push_up', '2026-03-05', 2, 10, 14),
      createWorkoutSet('s3', 'standard_push_up', '2026-03-05', 3, 10, 15),
      // Session 4: Crushing target
      createWorkoutSet('s4', 'standard_push_up', '2026-03-07', 1, 10, 16),
      createWorkoutSet('s4', 'standard_push_up', '2026-03-07', 2, 10, 15),
      createWorkoutSet('s4', 'standard_push_up', '2026-03-07', 3, 10, 16)
    ];

    const workouts = analyzeWorkoutProgress(sessions, history, 4);
    expect(workouts.sessionsCompleted).toBe(4);
    expect(workouts.completionRate).toBe(100);
    expect(workouts.verifiedSetsCount).toBe(12);
    expect(workouts.overallWorkoutTrend).toBe('IMPROVING');

    const pushup = workouts.exercises.find(e => e.exerciseId === 'standard_push_up');
    expect(pushup).toBeDefined();
    expect(pushup?.trend).toBe('IMPROVING');
    expect(pushup?.progressionState).toBe('READY_TO_PROGRESS');
  });

  // 8. Declining workout performance -> correctly detects REGRESSING
  it('8. Declining workout performance: failing target reps detected as REGRESSING', () => {
    const sessions = [
      { id: 's1', date: '2026-03-01', completed: true },
      { id: 's2', date: '2026-03-03', completed: true },
      { id: 's3', date: '2026-03-05', completed: true },
      { id: 's4', date: '2026-03-07', completed: true }
    ];
    const history: ExerciseHistoryItem[] = [
      // Session 1: Starting at 10
      createWorkoutSet('s1', 'standard_push_up', '2026-03-01', 1, 10, 10),
      createWorkoutSet('s1', 'standard_push_up', '2026-03-01', 2, 10, 10),
      createWorkoutSet('s1', 'standard_push_up', '2026-03-01', 3, 10, 10),
      // Session 2: Dropping
      createWorkoutSet('s2', 'standard_push_up', '2026-03-03', 1, 10, 7),
      createWorkoutSet('s2', 'standard_push_up', '2026-03-03', 2, 10, 6),
      createWorkoutSet('s2', 'standard_push_up', '2026-03-03', 3, 10, 5),
      // Session 3: Failing hard
      createWorkoutSet('s3', 'standard_push_up', '2026-03-05', 1, 10, 5),
      createWorkoutSet('s3', 'standard_push_up', '2026-03-05', 2, 10, 4),
      createWorkoutSet('s3', 'standard_push_up', '2026-03-05', 3, 10, 4),
      // Session 4: Failing hard again
      createWorkoutSet('s4', 'standard_push_up', '2026-03-07', 1, 10, 4),
      createWorkoutSet('s4', 'standard_push_up', '2026-03-07', 2, 10, 4),
      createWorkoutSet('s4', 'standard_push_up', '2026-03-07', 3, 10, 3)
    ];

    const workouts = analyzeWorkoutProgress(sessions, history, 4);
    expect(workouts.overallWorkoutTrend).toBe('REGRESSING');

    const pushup = workouts.exercises.find(e => e.exerciseId === 'standard_push_up');
    expect(pushup?.trend).toBe('REGRESSING');
    expect(pushup?.progressionState).toBe('NEEDS_REGRESSION');
  });

  // 9. No workout history -> returns NO_HISTORY
  it('9. No workout history: returns NO_HISTORY and 0 counts', () => {
    const workouts = analyzeWorkoutProgress([], [], 0);
    expect(workouts.overallWorkoutTrend).toBe('NO_HISTORY');
    expect(workouts.sessionsCompleted).toBe(0);
    expect(workouts.totalSetsCompleted).toBe(0);
    expect(workouts.exercises.length).toBe(0);
  });

  // 10. Nutrition fully tracked -> returns FULLY_TRACKED with adherence %
  it('10. Nutrition fully tracked: returns FULLY_TRACKED with adherence percentages', () => {
    const days = [
      { date: '2026-03-01', totalCalories: 2100, totalProtein: 145, totalCarbs: 220, totalFat: 60, mealCount: 3 },
      { date: '2026-03-02', totalCalories: 2050, totalProtein: 140, totalCarbs: 210, totalFat: 65, mealCount: 3 },
      { date: '2026-03-03', totalCalories: 2000, totalProtein: 142, totalCarbs: 205, totalFat: 62, mealCount: 3 },
      { date: '2026-03-04', totalCalories: 1980, totalProtein: 138, totalCarbs: 200, totalFat: 60, mealCount: 3 },
      { date: '2026-03-05', totalCalories: 2020, totalProtein: 144, totalCarbs: 215, totalFat: 64, mealCount: 3 },
      { date: '2026-03-06', totalCalories: 2000, totalProtein: 140, totalCarbs: 210, totalFat: 63, mealCount: 3 },
      { date: '2026-03-07', totalCalories: 1950, totalProtein: 139, totalCarbs: 205, totalFat: 61, mealCount: 3 }
    ];

    const nutrition = analyzeNutritionAdherence(days, 2000, 140, 7);
    expect(nutrition.daysTracked).toBe(7);
    expect(nutrition.trackingConsistencyRate).toBe(100);
    expect(nutrition.loggingStatus).toBe('FULLY_TRACKED');
    expect(nutrition.calorieAdherencePercent).toBeGreaterThanOrEqual(95);
    expect(nutrition.proteinAdherencePercent).toBeGreaterThanOrEqual(95);
  });

  // 11. Nutrition partially tracked -> calculated across tracked days
  it('11. Nutrition partially tracked: calculates average across tracked days only', () => {
    const days = [
      { date: '2026-03-01', totalCalories: 2000, totalProtein: 150, totalCarbs: 200, totalFat: 60, mealCount: 3 },
      { date: '2026-03-03', totalCalories: 2200, totalProtein: 130, totalCarbs: 220, totalFat: 70, mealCount: 3 }
    ];

    const nutrition = analyzeNutritionAdherence(days, 2000, 140, 7);
    expect(nutrition.daysTracked).toBe(2);
    expect(nutrition.trackingConsistencyRate).toBe(28.6); // 2/7
    expect(nutrition.loggingStatus).toBe('PARTIALLY_TRACKED');
    expect(nutrition.averageCalories).toBe(2100); // (2000+2200)/2
    expect(nutrition.averageProtein).toBe(140);
  });

  // 12. Nutrition untracked -> distinguishes UNTRACKED from 0 calories
  it('12. Nutrition untracked: distinguishes UNTRACKED without incorrectly setting average to 0', () => {
    const nutrition = analyzeNutritionAdherence([], 2200, 150, 7);
    expect(nutrition.daysTracked).toBe(0);
    expect(nutrition.loggingStatus).toBe('UNTRACKED');
    expect(nutrition.averageCalories).toBeNull();
    expect(nutrition.averageProtein).toBeNull();
    expect(nutrition.calorieAdherencePercent).toBeNull();
  });

  // 13. Hydration tracked -> returns GOOD with average ml
  it('13. Hydration tracked: returns GOOD with average ml and consistency rate', () => {
    const hydrationData = [
      { date: '2026-03-01', totalMl: 2600 },
      { date: '2026-03-02', totalMl: 2400 },
      { date: '2026-03-03', totalMl: 2500 },
      { date: '2026-03-04', totalMl: 2700 }
    ];

    const hydration = analyzeHydration(hydrationData, 2500, 7);
    expect(hydration.daysTracked).toBe(4);
    expect(hydration.averageIntakeMl).toBe(2550);
    expect(hydration.status).toBe('GOOD');
    expect(hydration.adherencePercent).toBeGreaterThanOrEqual(100);
  });

  // 14. Hydration untracked -> returns INSUFFICIENT_DATA
  it('14. Hydration untracked: returns INSUFFICIENT_DATA and null averages', () => {
    const hydration = analyzeHydration([], 2500, 7);
    expect(hydration.daysTracked).toBe(0);
    expect(hydration.averageIntakeMl).toBeNull();
    expect(hydration.status).toBe('INSUFFICIENT_DATA');
  });

  // 15. Measurement changes -> circumferences calculated only for recorded sites
  it('15. Measurement changes: calculates deltas only for recorded sites, ignoring unrecorded', () => {
    const records = [
      { date: '2026-02-01', chestCm: 100, waistCm: 85 },
      { date: '2026-03-01', chestCm: 102, waistCm: 83 }
    ];

    const measurements = analyzeBodyMeasurements(records);
    expect(measurements.measurementsTracked).toBe(2);
    expect(measurements.changes.length).toBe(2);

    const chest = measurements.changes.find(c => c.site === 'chest');
    expect(chest).toBeDefined();
    expect(chest?.firstRecordedCm).toBe(100);
    expect(chest?.latestCm).toBe(102);
    expect(chest?.absoluteChangeCm).toBe(2);
    expect(chest?.trend).toBe('INCREASING');

    const waist = measurements.changes.find(c => c.site === 'waist');
    expect(waist).toBeDefined();
    expect(waist?.firstRecordedCm).toBe(85);
    expect(waist?.latestCm).toBe(83);
    expect(waist?.absoluteChangeCm).toBe(-2);
    expect(waist?.trend).toBe('DECREASING');

    const hips = measurements.changes.find(c => c.site === 'hips');
    expect(hips).toBeUndefined(); // hips were never recorded, must NOT be fabricated
  });

  // 16. Monthly check-in history -> counts and latest summary
  it('16. Monthly check-in history: aggregates completed checkins and extracts latest summary', () => {
    const checkins = [
      {
        id: 'c1',
        checkinDate: '2026-02-01',
        weightKg: 82,
        adherenceScore: 8.5,
        summary: 'Solid initial month',
        nextMonthFocus: 'Increase daily step count'
      },
      {
        id: 'c2',
        checkinDate: '2026-03-01',
        weightKg: 80,
        adherenceScore: 9.0,
        summary: 'Excellent adherence, strength gains visible',
        nextMonthFocus: 'Push progression ladders'
      }
    ];

    const analysis = analyzeCheckins(checkins);
    expect(analysis.completedCheckinsCount).toBe(2);
    expect(analysis.latestCheckinDate).toBe('2026-03-01');
    expect(analysis.averageAdherenceScore).toBe(8.8);
    expect(analysis.recentSummaries[0].summary).toBe('Excellent adherence, strength gains visible');
    expect(analysis.recentSummaries[0].nextMonthFocus).toBe('Push progression ladders');
  });

  // 17. Missing photos -> disclaimer and 0 photos without errors
  it('17. Missing photos: provides disclaimer and 0 photos without throwing error', () => {
    const photos = analyzePhotoTimeline([], 30);
    expect(photos.photoCount).toBe(0);
    expect(photos.hasComparisonPair).toBe(false);
    expect(photos.disclaimer).toContain('Photos are qualitative records only');
    expect(photos.entries).toEqual([]);
  });

  // 18. Mixed progress -> flags MIXED_PROGRESS when weight & workouts diverge
  it('18. Mixed progress: flags MIXED_PROGRESS when weight increases during fat loss but workouts improve', () => {
    const weight = analyzeWeightTrend([
      { date: '2026-03-01', weightKg: 80.0 },
      { date: '2026-03-07', weightKg: 82.0 }
    ]);
    const workouts = analyzeWorkoutProgress(
      [
        { id: 's1', date: '2026-03-01', completed: true },
        { id: 's2', date: '2026-03-05', completed: true }
      ],
      [
        createWorkoutSet('s1', 'standard_push_up', '2026-03-01', 1, 10, 12),
        createWorkoutSet('s2', 'standard_push_up', '2026-03-05', 1, 10, 15)
      ],
      2
    );
    const nutrition = analyzeNutritionAdherence([], 2000, 140, 7);
    const hydration = analyzeHydration([], 2500, 7);
    const measurements = analyzeBodyMeasurements([]);

    const dataQuality = evaluateDataQuality(weight, workouts, nutrition, hydration, measurements);
    const overall = deriveOverallProgressStatus('LOSE_WEIGHT', dataQuality, weight, workouts, nutrition);

    expect(overall.status).toBe('MIXED_PROGRESS');
    expect(overall.rationale).toContain('trending upward');
  });

  // 19. Insufficient data -> flags INSUFFICIENT_DATA and DataQuality: INSUFFICIENT
  it('19. Insufficient data: flags INSUFFICIENT_DATA and low score when records are sparse', () => {
    const weight = analyzeWeightTrend([]);
    const workouts = analyzeWorkoutProgress([], [], 0);
    const nutrition = analyzeNutritionAdherence([], 2000, 140, 7);
    const hydration = analyzeHydration([], 2500, 7);
    const measurements = analyzeBodyMeasurements([]);

    const dataQuality = evaluateDataQuality(weight, workouts, nutrition, hydration, measurements);
    expect(dataQuality.status).toBe('INSUFFICIENT');
    expect(dataQuality.score).toBeLessThan(30);

    const overall = deriveOverallProgressStatus('GAIN_MUSCLE', dataQuality, weight, workouts, nutrition);
    expect(overall.status).toBe('INSUFFICIENT_DATA');
  });

  // 20. User isolation -> User A vs User B data isolation
  it('20. User isolation: User A and User B snapshots remain completely distinct', () => {
    const snapshotA = analyzeProgressIntelligence({
      userId: 'user-a',
      goal: 'LOSE_WEIGHT',
      periodDays: 14,
      weight: analyzeWeightTrend([
        { date: '2026-03-01', weightKg: 95.0 },
        { date: '2026-03-10', weightKg: 92.0 }
      ]),
      workouts: analyzeWorkoutProgress([], [], 0),
      nutrition: analyzeNutritionAdherence([], 2000, 140, 14),
      hydration: analyzeHydration([], 2500, 14),
      measurements: analyzeBodyMeasurements([]),
      checkins: analyzeCheckins([]),
      photos: analyzePhotoTimeline([], 14)
    });

    const snapshotB = analyzeProgressIntelligence({
      userId: 'user-b',
      goal: 'GAIN_MUSCLE',
      periodDays: 14,
      weight: analyzeWeightTrend([
        { date: '2026-03-01', weightKg: 65.0 },
        { date: '2026-03-10', weightKg: 67.5 }
      ]),
      workouts: analyzeWorkoutProgress([], [], 0),
      nutrition: analyzeNutritionAdherence([], 3000, 180, 14),
      hydration: analyzeHydration([], 3500, 14),
      measurements: analyzeBodyMeasurements([]),
      checkins: analyzeCheckins([]),
      photos: analyzePhotoTimeline([], 14)
    });

    expect(snapshotA.userId).toBe('user-a');
    expect(snapshotA.weightTrend.startingWeightKg).toBe(95.0);
    expect(snapshotA.weightTrend.trend).toBe('DECREASING');

    expect(snapshotB.userId).toBe('user-b');
    expect(snapshotB.weightTrend.startingWeightKg).toBe(65.0);
    expect(snapshotB.weightTrend.trend).toBe('INCREASING');
  });

  // 21. FRIDAY tool returns deterministic progress
  it('21. FRIDAY tool contracts: Progress snapshot produces valid deterministic structure', () => {
    const weight = analyzeWeightTrend([
      { date: '2026-03-01', weightKg: 78.0 },
      { date: '2026-03-07', weightKg: 77.0 }
    ]);
    const workouts = analyzeWorkoutProgress(
      [{ id: 's1', date: '2026-03-05', completed: true }],
      [createWorkoutSet('s1', 'standard_push_up', '2026-03-05', 1, 10, 10)],
      1
    );
    const nutrition = analyzeNutritionAdherence(
      [{ date: '2026-03-05', totalCalories: 2000, totalProtein: 140, totalCarbs: 200, totalFat: 60, mealCount: 3 }],
      2000,
      140,
      7
    );
    const hydration = analyzeHydration([{ date: '2026-03-05', totalMl: 2500 }], 2500, 7);
    const measurements = analyzeBodyMeasurements([]);
    const checkins = analyzeCheckins([]);
    const photos = analyzePhotoTimeline([], 7);

    const snapshot = analyzeProgressIntelligence({
      userId: 'user-tool-test',
      goal: 'GENERAL_FITNESS',
      periodDays: 7,
      weight,
      workouts,
      nutrition,
      hydration,
      measurements,
      checkins,
      photos
    });

    expect(snapshot).toHaveProperty('dataQuality');
    expect(snapshot).toHaveProperty('overallStatus');
    expect(snapshot).toHaveProperty('statusRationale');
    expect(snapshot).toHaveProperty('weightTrend');
    expect(snapshot).toHaveProperty('workoutProgress');
    expect(snapshot).toHaveProperty('nutritionAdherence');
    expect(snapshot).toHaveProperty('hydration');
    expect(snapshot).toHaveProperty('bodyMeasurements');
    expect(snapshot).toHaveProperty('disclaimers');
    expect(Array.isArray(snapshot.disclaimers)).toBe(true);
  });

  // 22. Gemini receives progress facts, not raw DB access
  it('22. Timeline & Facts: Events are strictly categorized as MEASURED_FACT or DETERMINISTIC_TREND', () => {
    const weight = analyzeWeightTrend([
      { date: '2026-03-01', weightKg: 78.0 },
      { date: '2026-03-07', weightKg: 77.0 }
    ]);
    const workouts = analyzeWorkoutProgress(
      [
        { id: 's1', date: '2026-03-01', completed: true },
        { id: 's2', date: '2026-03-05', completed: true },
        { id: 's3', date: '2026-03-07', completed: true },
        { id: 's4', date: '2026-03-08', completed: true }
      ],
      [
        createWorkoutSet('s1', 'standard_push_up', '2026-03-01', 1, 10, 12),
        createWorkoutSet('s2', 'standard_push_up', '2026-03-05', 1, 10, 14),
        createWorkoutSet('s3', 'standard_push_up', '2026-03-07', 1, 10, 15),
        createWorkoutSet('s4', 'standard_push_up', '2026-03-08', 1, 10, 16)
      ],
      4
    );
    const nutrition = analyzeNutritionAdherence(
      [{ date: '2026-03-05', totalCalories: 2000, totalProtein: 140, totalCarbs: 200, totalFat: 60, mealCount: 3 }],
      2000,
      140,
      7
    );
    const hydration = analyzeHydration([{ date: '2026-03-05', totalMl: 2500 }], 2500, 7);
    const measurements = analyzeBodyMeasurements([
      { date: '2026-03-01', waistCm: 85 },
      { date: '2026-03-07', waistCm: 83 }
    ]);
    const checkins = analyzeCheckins([]);

    const timeline = buildProgressTimeline(weight, workouts, nutrition, hydration, measurements, checkins);

    expect(timeline.length).toBeGreaterThan(0);
    for (const evt of timeline) {
      expect(['MEASURED_FACT', 'DETERMINISTIC_TREND', 'AI_OBSERVATION', 'ESTIMATE']).toContain(evt.type);
      expect(evt.id).toBeDefined();
      expect(evt.date).toBeDefined();
      expect(evt.title).toBeDefined();
      expect(evt.description).toBeDefined();
    }

    // Weight should be MEASURED_FACT
    const weightEvts = timeline.filter(e => e.category === 'WEIGHT');
    expect(weightEvts.every(e => e.type === 'MEASURED_FACT')).toBe(true);

    // Measurement change should be DETERMINISTIC_TREND
    const measEvts = timeline.filter(e => e.category === 'MEASUREMENT');
    expect(measEvts.every(e => e.type === 'DETERMINISTIC_TREND')).toBe(true);
  });
});
