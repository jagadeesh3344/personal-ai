export type CoachingIntent =
  | 'WORKOUT_TODAY'
  | 'START_WORKOUT'
  | 'WORKOUT_PROGRESS'
  | 'EXERCISE_FORM'
  | 'LOG_SET'
  | 'COMPLETE_WORKOUT'
  | 'NUTRITION_STATUS'
  | 'MEAL_RECOMMENDATION'
  | 'LOG_MEAL'
  | 'HYDRATION_STATUS'
  | 'LOG_HYDRATION'
  | 'PROGRESS_STATUS'
  | 'WEIGHT_PROGRESS'
  | 'STRENGTH_PROGRESS'
  | 'MOTIVATION'
  | 'GENERAL_COACHING'
  | 'PROFILE_UPDATE'
  | 'PREFERENCE_UPDATE'
  | 'UNKNOWN';

export type CoachingPriority =
  | 'PROFILE_SETUP'
  | 'WORKOUT'
  | 'NUTRITION'
  | 'HYDRATION'
  | 'RECOVERY'
  | 'PROGRESS_TRACKING';

export interface DailyCoachingBrief {
  userId: string;
  date: string;
  priority: CoachingPriority;
  priorityRationale: string;
  workout: {
    scheduled: boolean;
    dayName?: string;
    completed: boolean;
    exercisesCount: number;
    activeSessionId?: string;
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'REST_DAY';
  };
  nutrition: {
    targetCalories: number;
    consumedCalories: number;
    remainingCalories: number;
    proteinAdherencePercent: number;
    status: 'ON_TRACK' | 'UNDER_CALORIES' | 'OVER_CALORIES' | 'PROTEIN_DEFICIT' | 'UNTRACKED';
    nextMealSlot: string;
  };
  hydration: {
    targetMl: number;
    consumedMl: number;
    remainingMl: number;
    percentage: number;
    status: 'GOOD' | 'NEEDS_ATTENTION';
  };
  progress: {
    overallStatus: string;
    weightTrend: string;
    dataQuality: string;
  };
  nextRecommendedAction: string;
}

export interface WeeklyCoachingReview {
  userId: string;
  startDate: string;
  endDate: string;
  workoutsCompleted: number;
  workoutsPlanned: number;
  workoutConsistencyRate: number;
  exerciseImprovements: Array<{
    exerciseName: string;
    change: string;
    status: string;
  }>;
  nutritionDaysTracked: number;
  averageDailyCalories: number | null;
  calorieAdherenceRate: number | null;
  averageDailyProteinGrams: number | null;
  hydrationAverageMl: number | null;
  hydrationConsistencyRate: number;
  weightTrend: {
    startingWeightKg: number | null;
    currentWeightKg: number | null;
    changeKg: number | null;
    direction: string;
  };
  circumferenceChanges: Array<{
    site: string;
    changeCm: number;
  }>;
  keyAccomplishments: string[];
  areasNeedingAttention: string[];
  nextFocus: string;
}

export interface ActiveWorkoutCoachingContext {
  activeSessionId: string;
  workoutName: string;
  totalExercises: number;
  currentExerciseIndex: number;
  currentExerciseId: string;
  currentExerciseName: string;
  targetSets: number;
  completedSetsCount: number;
  remainingSetsCount: number;
  lastCompletedSet?: {
    setNumber: number;
    reps: number;
    weightKg: number;
    verification: 'VERIFIED' | 'SELF_REPORTED';
  };
  progressionState?: string;
  suggestedAction: string;
}
