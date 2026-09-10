export type PerformanceClassification = 
  | 'NO_HISTORY'
  | 'INCOMPLETE'
  | 'FAILED'
  | 'CHALLENGING'
  | 'GOOD'
  | 'TOO_EASY';

export type ProgressionAction = 
  | 'PROGRESS'
  | 'MAINTAIN'
  | 'REGRESS'
  | 'REPEAT'
  | 'INSUFFICIENT_DATA';

export type ProgressionFamilyStatus = 
  | 'NEW'
  | 'DEVELOPING'
  | 'STABLE'
  | 'READY_TO_PROGRESS'
  | 'NEEDS_REGRESSION';

export interface ExerciseHistoryItem {
  sessionId: string;
  date: string;
  exerciseId: string;
  exerciseName?: string;
  setNumber: number;
  targetReps?: string;
  actualReps: number;
  weightKg: number;
  durationSeconds?: number;
  resistanceLevel?: string;
  completed: boolean;
  completionMethod: 'CAMERA' | 'VOICE' | 'MANUAL';
  verification: 'VERIFIED' | 'SELF_REPORTED';
  rpe?: number;
}

export interface SessionExercisePerformance {
  sessionId: string;
  date: string;
  exerciseId: string;
  exerciseName: string;
  prescribedSets: number;
  completedSets: number;
  targetReps: string;
  targetMinReps: number;
  targetMaxReps: number;
  targetDurationSeconds?: number;
  actualReps: number[];
  actualDurationSeconds?: number[];
  weightKg: number;
  avgRpe?: number;
  classification: PerformanceClassification;
  isSessionCompleted: boolean;
  hasVerifiedSets: boolean;
}

export interface ExerciseProgressionRecommendation {
  exerciseId: string;
  exerciseName: string;
  action: ProgressionAction;
  status: ProgressionFamilyStatus;
  recommendedExerciseId: string;
  recommendedExerciseName: string;
  targetSets: number;
  targetReps: string;
  suggestedExerciseId?: string;
  suggestedExerciseName?: string;
  suggestedSets?: number;
  suggestedReps?: string;
  weightKg?: number;
  reason: string;
  currentLevel?: number;
  consecutiveSuccessfulSessions: number;
  consecutiveFailedSessions: number;
}

export interface ExerciseProgressionState {
  exerciseFamily: string;
  currentExercise: string;
  currentLevel: number;
  status: ProgressionFamilyStatus;
  consecutiveSuccessfulSessions: number;
  recentSessions?: SessionExercisePerformance[];
  recommendation?: ExerciseProgressionRecommendation;
}
