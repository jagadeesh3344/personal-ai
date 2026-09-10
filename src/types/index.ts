export * from './profile';
import { Goal, TrainingEnvironment, Equipment } from './profile';

export type MuscleGroup = 
  | 'CHEST' 
  | 'BACK' 
  | 'SHOULDERS' 
  | 'BICEPS' 
  | 'TRICEPS' 
  | 'LEGS' 
  | 'CORE' 
  | 'CARDIO';

export type EquipmentType = Equipment;

export type TrackingType = 'REPS_ONLY' | 'WEIGHT_AND_REPS' | 'TIME_SECONDS' | 'REPS_RESISTANCE';

export interface ExerciseDefinition {
  id: string;
  name: string;
  equipmentRequired: Equipment[];
  environments: TrainingEnvironment[];
  muscleGroups: MuscleGroup[];
  difficulty: string;
  instructions: string;
  trackingType?: TrackingType;
}

export type CompletionMethod = 'CAMERA' | 'VOICE' | 'MANUAL';
export type VerificationStatus = 'VERIFIED' | 'SELF_REPORTED';

export interface WorkoutSet {
  id: string;
  setNumber: number;
  weightKg: number;
  reps: number;
  durationSeconds?: number;
  resistanceLevel?: string;
  completed: boolean;
  completedAt?: string;
  completionMethod?: CompletionMethod;
  verification?: VerificationStatus;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  name: string;
  muscleGroups: MuscleGroup[];
  targetSets: number;
  targetReps: string;
  restSeconds: number;
  notes: string;
  trackingType?: TrackingType;
  progression?: {
    action: string;
    status: string;
    reason: string;
    currentLevel?: number;
    consecutiveSuccessfulSessions?: number;
    consecutiveFailedSessions?: number;
  };
  sets: WorkoutSet[];
}

export interface WorkoutDay {
  id: string;
  dayName: string;
  focus: string;
  exercises: WorkoutExercise[];
}

export interface WorkoutPlan {
  id: string;
  userId: string;
  name: string;
  goal: Goal;
  environment: TrainingEnvironment;
  equipment: Equipment[];
  createdAt: string;
  days: WorkoutDay[];
}

export interface WorkoutSession {
  id: string;
  userId?: string;
  planId?: string;
  dayId?: string | null;
  dayName?: string;
  date?: string;
  startedAt?: string;
  completedAt?: string;
  completed: boolean;
  durationSeconds?: number;
  exercises?: WorkoutExercise[];
  notes?: string;
}

export interface NutritionTargets {
  bmr: number;
  maintenanceCalories: number;
  targetCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
}

export interface MealItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';

export interface Meal {
  id: string;
  name: string;
  type: MealType;
  items: MealItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

export interface HydrationEntry {
  id: string;
  amountMl: number;
  timestamp: string;
}

export interface DailyHydration {
  date: string;
  targetMl: number;
  consumedMl: number;
  entries: HydrationEntry[];
}

export interface DailyTask {
  id: string;
  title: string;
  category: 'workout' | 'nutrition' | 'hydration' | 'steps' | 'sleep' | 'other';
  completed: boolean;
  value?: string;
}

export interface Habit {
  id: string;
  name: string;
  icon: string;
  streak: number;
  weeklyHistory: { [key: string]: boolean };
  currentCompleted: boolean;
}

export interface WeightRecord {
  id: string;
  date: string;
  weightKg: number;
}

export interface MeasurementRecord {
  id: string;
  date: string;
  weightKg?: number;
  chestCm?: number;
  waistCm?: number;
  hipsCm?: number;
  armsCm?: number;
  thighsCm?: number;
  notes?: string;
}

export type BodyMeasurement = MeasurementRecord;

export interface MonthlyCheckin {
  id: string;
  checkinDate: string;
  weightKg: number;
  adherenceScore?: number;
  summary?: string;
  nextMonthFocus?: string;
}

export interface ProgressState {
  weights: WeightRecord[];
  measurements: MeasurementRecord[];
  photoUrls: { id: string; date: string; url: string }[];
}

export interface FridayMessage {
  id: string;
  sender: 'friday' | 'user';
  text: string;
  timestamp: string;
  category?: 'info' | 'workout' | 'nutrition' | 'alert' | 'system';
}

export interface FridayTool {
  name: string;
  description: string;
  execute: (input: Record<string, unknown>) => Promise<unknown>;
}
