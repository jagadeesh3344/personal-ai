export type TrendDirection = 'INSUFFICIENT_DATA' | 'STABLE' | 'INCREASING' | 'DECREASING';

export type OverallProgressStatus =
  | 'INSUFFICIENT_DATA'
  | 'ON_TRACK'
  | 'IMPROVING'
  | 'STALLED'
  | 'NEEDS_ATTENTION'
  | 'MIXED_PROGRESS';

export type DataQualityStatus = 'GOOD' | 'LIMITED' | 'INSUFFICIENT';

export type ExercisePerformanceTrend =
  | 'NO_HISTORY'
  | 'INSUFFICIENT_DATA'
  | 'MAINTAINING'
  | 'IMPROVING'
  | 'REGRESSING';

export interface WeightTrendAnalysis {
  startingWeightKg: number | null;
  currentWeightKg: number | null;
  targetWeightKg: number | null;
  absoluteChangeKg: number | null;
  percentageChange: number | null;
  recentAverageKg: number | null;
  previousAverageKg: number | null;
  trend: TrendDirection;
  measurementCount: number;
  history: Array<{ date: string; weightKg: number }>;
}

export interface TrackedExerciseProgress {
  exerciseId: string;
  exerciseName: string;
  sessionsPerformed: number;
  totalSets: number;
  totalReps: number;
  averageReps: number;
  bestReps: number;
  lastWeightKg?: number;
  progressionState: 'NEW' | 'DEVELOPING' | 'STABLE' | 'READY_TO_PROGRESS' | 'NEEDS_REGRESSION';
  performanceTrend: ExercisePerformanceTrend;
  trend?: ExercisePerformanceTrend;
  recentPerformance: string;
  previousPerformance?: string;
}

export interface WorkoutProgressAnalysis {
  sessionsCompleted: number;
  sessionsPlanned: number;
  completionRate: number; // 0 to 100
  totalSetsCompleted: number;
  totalRepsCompleted: number;
  verifiedSetsCount: number;
  selfReportedSetsCount: number;
  exercises: TrackedExerciseProgress[];
  overallWorkoutTrend: ExercisePerformanceTrend;
}

export type NutritionAdherenceStatus =
  | 'UNTRACKED'
  | 'TRACKED_BELOW_TARGET'
  | 'TRACKED_NEAR_TARGET'
  | 'TRACKED_ABOVE_TARGET';

export interface DailyNutritionLogAnalysis {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  targetCalories: number;
  targetProtein: number;
  status: NutritionAdherenceStatus;
}

export interface NutritionAdherenceAnalysis {
  daysTracked: number;
  totalDaysInPeriod: number;
  trackingConsistencyRate: number; // 0 to 100
  averageCalories: number | null;
  averageProtein: number | null;
  targetCalories: number | null;
  targetProtein: number | null;
  calorieAdherencePercent: number | null; // e.g. 95%
  proteinAdherencePercent: number | null;
  loggingStatus: 'UNTRACKED' | 'PARTIALLY_TRACKED' | 'FULLY_TRACKED';
  recentDailyLogs: DailyNutritionLogAnalysis[];
}

export interface HydrationAnalysis {
  daysTracked: number;
  totalDaysInPeriod: number;
  trackingConsistencyRate: number;
  averageIntakeMl: number | null;
  targetIntakeMl: number | null;
  adherencePercent: number | null;
  status: 'INSUFFICIENT_DATA' | 'GOOD' | 'LOW';
}

export interface BodyMeasurementChange {
  site: 'chest' | 'waist' | 'hips' | 'arms' | 'thighs';
  firstRecordedCm: number;
  latestCm: number;
  firstValueCm?: number;
  latestValueCm?: number;
  absoluteChangeCm: number;
  percentageChange: number;
  trend: TrendDirection;
}

export interface BodyMeasurementAnalysis {
  measurementsTracked: number;
  changes: BodyMeasurementChange[];
  latestRecordedDate: string | null;
}

export interface CheckinSummary {
  date: string;
  weightKg: number;
  adherenceScore?: number;
  summary?: string;
  nextFocus?: string;
  nextMonthFocus?: string;
}

export interface CheckinAnalysis {
  completedCheckinsCount: number;
  latestCheckinDate: string | null;
  daysSinceLastCheckin: number | null;
  averageAdherenceScore: number | null;
  recentSummaries: CheckinSummary[];
}

export interface ProgressPhotoEntry {
  date: string;
  pose: 'FRONT' | 'SIDE' | 'BACK';
  storagePath: string;
}

export interface PhotoTimelineAnalysis {
  photoCount?: number;
  totalPhotos: number;
  hasComparisonPair?: boolean;
  entries?: ProgressPhotoEntry[];
  photos: ProgressPhotoEntry[];
  disclaimer: string;
}

export interface DataQuality {
  status: DataQualityStatus;
  score: number; // 0 to 100
  reasons: string[];
  hasWeightData: boolean;
  hasWorkoutData: boolean;
  hasNutritionData: boolean;
  hasHydrationData: boolean;
  hasMeasurementData: boolean;
}

export interface ProgressTimelineEvent {
  id: string;
  date: string;
  timestamp: string;
  category: 'WEIGHT' | 'WORKOUT' | 'EXERCISE_PROGRESSION' | 'NUTRITION' | 'HYDRATION' | 'CHECKIN' | 'MEASUREMENT';
  title: string;
  description: string;
  type: 'MEASURED_FACT' | 'DETERMINISTIC_TREND' | 'AI_OBSERVATION' | 'ESTIMATE';
  metricValue?: string | number;
}

export interface ProgressSnapshot {
  userId: string;
  periodStart: string;
  periodEnd: string;
  periodDays: number;
  goal: string;
  overallStatus: OverallProgressStatus;
  statusRationale: string;
  dataQuality: DataQuality;
  weightTrend: WeightTrendAnalysis;
  workoutProgress: WorkoutProgressAnalysis;
  nutritionAdherence: NutritionAdherenceAnalysis;
  hydration: HydrationAnalysis;
  bodyMeasurements: BodyMeasurementAnalysis;
  checkinAnalysis: CheckinAnalysis;
  photoTimeline: PhotoTimelineAnalysis;
  timeline: ProgressTimelineEvent[];
  disclaimers: string[];
  // Backwards compatibility aliases
  weight: WeightTrendAnalysis;
  workouts: WorkoutProgressAnalysis;
  nutrition: NutritionAdherenceAnalysis;
  measurements: BodyMeasurementAnalysis;
  checkins: CheckinAnalysis;
  photos: PhotoTimelineAnalysis;
}
