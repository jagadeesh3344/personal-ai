export type Goal = 
  | 'FAT_LOSS' 
  | 'GAIN_MUSCLE' 
  | 'BODY_RECOMPOSITION' 
  | 'STRENGTH' 
  | 'GENERAL_FITNESS' 
  | 'ENDURANCE';

export type Sex = 'MALE' | 'FEMALE' | 'OTHER';

export type ActivityLevel = 
  | 'SEDENTARY' 
  | 'LIGHTLY_ACTIVE' 
  | 'MODERATELY_ACTIVE' 
  | 'VERY_ACTIVE';

export type TrainingExperience = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export type TrainingEnvironment = 'HOME' | 'GYM' | 'OUTDOOR';

export type DietPreference = 'STANDARD' | 'VEGETARIAN' | 'VEGAN' | 'KETO' | 'PALEO';

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  sex: Sex;
  height: number; // in cm
  currentWeight: number; // in kg
  targetWeight: number; // in kg
  goal: Goal;
  activityLevel: ActivityLevel;
  trainingExperience: TrainingExperience;
  trainingEnvironment: TrainingEnvironment;
  equipment: string[]; // e.g. [] for Home + No Equipment
  availableWorkoutDays: string[]; // e.g. ['MON', 'WED', 'FRI']
  preferredWorkoutDuration: number; // in minutes (e.g. 45)
  dietPreference: DietPreference;
  foodPreferences: string[];
  allergies: string[];
  intolerances: string[];
  createdAt: string;
  updatedAt: string;
}

export type MuscleGroup = 
  | 'CHEST' 
  | 'BACK' 
  | 'SHOULDERS' 
  | 'BICEPS' 
  | 'TRICEPS' 
  | 'LEGS' 
  | 'CORE' 
  | 'CARDIO';

export type EquipmentType = 
  | 'DUMBBELL' 
  | 'BARBELL' 
  | 'BENCH' 
  | 'CABLE_MACHINE' 
  | 'PULL_UP_BAR' 
  | 'RESISTANCE_BANDS' 
  | 'KETTLEBELL' 
  | 'GYM_MACHINE' 
  | 'SQUAT_RACK';

export interface ExerciseDefinition {
  id: string;
  name: string;
  muscleGroups: MuscleGroup[];
  equipmentRequired: EquipmentType[]; // empty means purely bodyweight
  environments: TrainingEnvironment[];
  difficulty: TrainingExperience;
  instructions: string;
  defaultReps: string;
  defaultSets: number;
  restSeconds: number;
}

export interface WorkoutSet {
  id: string;
  setNumber: number;
  weightKg: number;
  reps: number;
  completed: boolean;
  completedAt?: string;
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
  sets: WorkoutSet[];
}

export interface WorkoutDay {
  id: string;
  dayName: string; // e.g. "Day 1 - Push"
  focus: string;
  exercises: WorkoutExercise[];
}

export interface WorkoutPlan {
  id: string;
  userId: string;
  name: string;
  goal: Goal;
  environment: TrainingEnvironment;
  equipment: string[];
  createdAt: string;
  days: WorkoutDay[];
}

export interface WorkoutSession {
  id: string;
  userId: string;
  planId: string;
  dayId: string;
  dayName: string;
  startedAt: string;
  completedAt?: string;
  completed: boolean;
  exercises: WorkoutExercise[];
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
  timestamp: string; // ISO string
}

export interface DailyHydration {
  date: string; // YYYY-MM-DD
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
  weeklyHistory: { [key: string]: boolean }; // Mon - Sun
  currentCompleted: boolean;
}

export interface WeightRecord {
  id: string;
  date: string; // YYYY-MM-DD or formatted display
  weightKg: number;
}

export interface MeasurementRecord {
  id: string;
  date: string;
  chestCm?: number;
  waistCm?: number;
  armsCm?: number;
  thighsCm?: number;
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
