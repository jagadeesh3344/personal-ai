import {
  ProgressSnapshot,
  DataQuality,
  DataQualityStatus,
  OverallProgressStatus,
  ProgressTimelineEvent,
  WeightTrendAnalysis,
  WorkoutProgressAnalysis,
  NutritionAdherenceAnalysis,
  HydrationAnalysis,
  BodyMeasurementAnalysis,
  CheckinAnalysis,
  PhotoTimelineAnalysis
} from './types';

export interface ProgressAnalyzerInput {
  userId: string;
  goal: string;
  periodDays: number;
  weight: WeightTrendAnalysis;
  workouts: WorkoutProgressAnalysis;
  nutrition: NutritionAdherenceAnalysis;
  hydration: HydrationAnalysis;
  measurements: BodyMeasurementAnalysis;
  checkins: CheckinAnalysis;
  photos: PhotoTimelineAnalysis;
}

export function evaluateDataQuality(
  weight: WeightTrendAnalysis,
  workouts: WorkoutProgressAnalysis,
  nutrition: NutritionAdherenceAnalysis,
  hydration: HydrationAnalysis,
  measurements: BodyMeasurementAnalysis
): DataQuality {
  const reasons: string[] = [];
  let score = 0;

  const hasWeightData = weight.measurementCount >= 2;
  const hasWorkoutData = workouts.sessionsCompleted >= 2;
  const hasNutritionData = nutrition.daysTracked >= 2;
  const hasHydrationData = hydration.daysTracked >= 2;
  const hasMeasurementData = measurements.measurementsTracked >= 1;

  if (hasWeightData) {
    score += 25;
    reasons.push(`${weight.measurementCount} bodyweight entries logged`);
  } else if (weight.measurementCount === 1) {
    score += 10;
    reasons.push('Only 1 weight entry logged (at least 2 required for trend)');
  } else {
    reasons.push('No bodyweight measurements recorded yet');
  }

  if (hasWorkoutData) {
    score += 30;
    reasons.push(`${workouts.sessionsCompleted} workout sessions completed (${workouts.completionRate}% completion rate)`);
  } else if (workouts.sessionsCompleted === 1) {
    score += 15;
    reasons.push('1 workout session completed (more sessions needed for consistency analysis)');
  } else {
    reasons.push('No workout sessions recorded yet');
  }

  if (hasNutritionData) {
    score += 25;
    reasons.push(`${nutrition.daysTracked} days of nutrition tracked (${nutrition.trackingConsistencyRate}% consistency)`);
  } else {
    reasons.push('Nutrition tracking not started or fewer than 2 days logged');
  }

  if (hasHydrationData) {
    score += 10;
    reasons.push(`${hydration.daysTracked} days of hydration logged`);
  }

  if (hasMeasurementData) {
    score += 10;
    reasons.push(`${measurements.measurementsTracked} circumference sites measured`);
  }

  let status: DataQualityStatus = 'INSUFFICIENT';
  if (score >= 65) {
    status = 'GOOD';
  } else if (score >= 30) {
    status = 'LIMITED';
  } else {
    status = 'INSUFFICIENT';
  }

  return {
    status,
    score: Math.min(100, score),
    reasons,
    hasWeightData,
    hasWorkoutData,
    hasNutritionData,
    hasHydrationData,
    hasMeasurementData
  };
}

export function deriveOverallProgressStatus(
  goal: string,
  dataQuality: DataQuality,
  weight: WeightTrendAnalysis,
  workouts: WorkoutProgressAnalysis,
  nutrition: NutritionAdherenceAnalysis
): { status: OverallProgressStatus; rationale: string } {
  if (dataQuality.status === 'INSUFFICIENT') {
    return {
      status: 'INSUFFICIENT_DATA',
      rationale: 'Insufficient historical data to form an objective progress assessment. Log consistent workouts, meals, and weight over multiple days to unlock full progress intelligence.'
    };
  }

  const normGoal = (goal || 'GENERAL_FITNESS').toUpperCase();
  const workoutTrend = workouts.overallWorkoutTrend;
  const weightTrend = weight.trend;
  const highWorkoutAdherence = workouts.completionRate >= 75;
  const lowWorkoutAdherence = workouts.completionRate < 50;

  // FAT LOSS / LOSE WEIGHT
  if (normGoal === 'LOSE_WEIGHT' || normGoal === 'FAT_LOSS') {
    if (weightTrend === 'DECREASING' && (highWorkoutAdherence || workoutTrend === 'IMPROVING' || workoutTrend === 'MAINTAINING')) {
      return {
        status: 'IMPROVING',
        rationale: `Downward weight trend (${weight.absoluteChangeKg} kg) aligns with fat loss goal, supported by ${workouts.completionRate}% workout completion rate.`
      };
    }
    if (weightTrend === 'STABLE' && (workoutTrend === 'IMPROVING' || highWorkoutAdherence)) {
      return {
        status: 'ON_TRACK',
        rationale: `Body weight is stable while workout performance is improving, indicating positive body recomposition and athletic adaptation.`
      };
    }
    if (weightTrend === 'INCREASING' && workoutTrend === 'REGRESSING') {
      return {
        status: 'NEEDS_ATTENTION',
        rationale: `Weight trend is upward (${weight.absoluteChangeKg} kg) while workout performance is regressing. Caloric intake or training consistency may need adjustment.`
      };
    }
    if (weightTrend === 'INCREASING' && workoutTrend === 'IMPROVING') {
      return {
        status: 'MIXED_PROGRESS',
        rationale: `Workout strength is progressing well, but bodyweight is trending upward. Verify whether nutrition intake matches fat loss deficit targets.`
      };
    }
  }

  // MUSCLE GAIN / STRENGTH
  if (normGoal === 'GAIN_MUSCLE' || normGoal === 'STRENGTH') {
    if (workoutTrend === 'IMPROVING' && (weightTrend === 'INCREASING' || weightTrend === 'STABLE')) {
      return {
        status: 'IMPROVING',
        rationale: `Consistent strength progression across exercises supported by healthy caloric surplus/maintenance (${weight.trend.toLowerCase()} weight trend).`
      };
    }
    if (workoutTrend === 'IMPROVING' && weightTrend === 'DECREASING') {
      return {
        status: 'MIXED_PROGRESS',
        rationale: `Strength metrics are progressing, but body weight is decreasing. Ensure adequate daily protein and calories to support lean hypertrophy.`
      };
    }
    if (workoutTrend === 'REGRESSING') {
      return {
        status: 'NEEDS_ATTENTION',
        rationale: `Exercise performance is regressing. Prioritize recovery, sleep, and progressive overload adherence.`
      };
    }
  }

  // GENERAL FITNESS / MAINTAIN
  if (highWorkoutAdherence && (workoutTrend === 'IMPROVING' || workoutTrend === 'MAINTAINING')) {
    return {
      status: 'ON_TRACK',
      rationale: `Strong training consistency (${workouts.completionRate}% completion) and stable performance indicators across all sessions.`
    };
  }

  if (lowWorkoutAdherence && workouts.sessionsPlanned > 0) {
    return {
      status: 'NEEDS_ATTENTION',
      rationale: `Workout completion rate is low (${workouts.completionRate}%). Focus on establishing routine consistency before advancing progression volume.`
    };
  }

  if (workouts.sessionsCompleted >= 2 && weight.measurementCount >= 2) {
    return {
      status: 'ON_TRACK',
      rationale: `Baseline metrics are established and performing steadily across workouts and nutrition.`
    };
  }

  return {
    status: 'MIXED_PROGRESS',
    rationale: `Mixed indicators across training and nutrition. Maintain regular logging to sharpen trend clarity.`
  };
}

export function buildProgressTimeline(
  weight: WeightTrendAnalysis,
  workouts: WorkoutProgressAnalysis,
  nutrition: NutritionAdherenceAnalysis,
  hydration: HydrationAnalysis,
  measurements: BodyMeasurementAnalysis,
  checkins: CheckinAnalysis
): ProgressTimelineEvent[] {
  const events: ProgressTimelineEvent[] = [];

  for (const w of weight.history) {
    events.push({
      id: `evt-w-${w.date}`,
      date: w.date,
      timestamp: new Date(w.date).toISOString(),
      category: 'WEIGHT',
      title: 'Weight Recorded',
      description: `Bodyweight recorded at ${w.weightKg} kg`,
      type: 'MEASURED_FACT',
      metricValue: `${w.weightKg} kg`
    });
  }

  for (const ex of workouts.exercises) {
    if (ex.progressionState === 'READY_TO_PROGRESS') {
      events.push({
        id: `evt-prog-${ex.exerciseId}`,
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString(),
        category: 'EXERCISE_PROGRESSION',
        title: `Progression Ready: ${ex.exerciseName}`,
        description: `Consistently mastered target rep ranges (${ex.bestReps} reps best). Ready for difficulty advancement.`,
        type: 'DETERMINISTIC_TREND',
        metricValue: `${ex.bestReps} reps`
      });
    }
  }

  for (const log of nutrition.recentDailyLogs) {
    if (log.status === 'TRACKED_NEAR_TARGET') {
      events.push({
        id: `evt-nut-${log.date}`,
        date: log.date,
        timestamp: new Date(log.date).toISOString(),
        category: 'NUTRITION',
        title: 'Nutrition Target Met',
        description: `Tracked ${log.calories} kcal (${log.protein}g protein), aligned to daily target.`,
        type: 'MEASURED_FACT',
        metricValue: `${log.calories} kcal`
      });
    }
  }

  for (const chk of checkins.recentSummaries) {
    events.push({
      id: `evt-chk-${chk.date}`,
      date: chk.date,
      timestamp: new Date(chk.date).toISOString(),
      category: 'CHECKIN',
      title: 'Monthly Check-in Logged',
      description: chk.summary || `Monthly review completed at ${chk.weightKg} kg`,
      type: 'MEASURED_FACT',
      metricValue: `${chk.weightKg} kg`
    });
  }

  for (const change of measurements.changes) {
    if (change.trend !== 'INSUFFICIENT_DATA') {
      events.push({
        id: `evt-meas-${change.site}`,
        date: measurements.latestRecordedDate || new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString(),
        category: 'MEASUREMENT',
        title: `${change.site.toUpperCase()} Circumference ${change.trend}`,
        description: `Changed from ${change.firstRecordedCm} cm to ${change.latestCm} cm (${change.absoluteChangeCm > 0 ? '+' : ''}${change.absoluteChangeCm} cm)`,
        type: 'DETERMINISTIC_TREND',
        metricValue: `${change.latestCm} cm`
      });
    }
  }

  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return events;
}

export function buildProgressSnapshot(input: ProgressAnalyzerInput): ProgressSnapshot {
  const periodEnd = new Date().toISOString().split('T')[0];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (input.periodDays || 30));
  const periodStart = startDate.toISOString().split('T')[0];

  const dataQuality = evaluateDataQuality(
    input.weight,
    input.workouts,
    input.nutrition,
    input.hydration,
    input.measurements
  );

  const { status: overallStatus, rationale: statusRationale } = deriveOverallProgressStatus(
    input.goal,
    dataQuality,
    input.weight,
    input.workouts,
    input.nutrition
  );

  const timeline = buildProgressTimeline(
    input.weight,
    input.workouts,
    input.nutrition,
    input.hydration,
    input.measurements,
    input.checkins
  );

  return {
    userId: input.userId,
    periodStart,
    periodEnd,
    periodDays: input.periodDays || 30,
    goal: input.goal,
    overallStatus,
    statusRationale,
    dataQuality,
    weightTrend: input.weight,
    workoutProgress: input.workouts,
    nutritionAdherence: input.nutrition,
    hydration: input.hydration,
    bodyMeasurements: input.measurements,
    checkinAnalysis: input.checkins,
    photoTimeline: input.photos,
    timeline,
    disclaimers: [
      'Weight fluctuation within +/- 0.4kg is typical day-to-day fluid and digestive variance.',
      'Progress photos are visual documentation only. Computer vision is not used for body fat % estimation.',
      'All progression and regression decisions are calculated deterministically from verified set performance.',
      'Nutrition adherence reflects self-reported and logged food entries compared against calculated targets.'
    ],
    weight: input.weight,
    workouts: input.workouts,
    nutrition: input.nutrition,
    measurements: input.measurements,
    checkins: input.checkins,
    photos: input.photos
  };
}

export const analyzeProgressIntelligence = buildProgressSnapshot;
