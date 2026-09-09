export interface UserPreferences {
  coachingStyle: 'Supportive' | 'Balanced' | 'Direct' | 'Strict';
  workoutDaysPerWeek: number;
  preferredWorkoutTime: string;
  targetWeight: number;
}

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  sex: 'Male' | 'Female' | 'Other';
  height: number; // in cm
  weight: number; // in kg (current weight)
  currentWeight: number; // in kg (alias for consistency)
  targetWeight: number; // in kg
  goal: 'Fat Loss' | 'Muscle Gain' | 'Body Recomposition' | 'Strength' | 'General Fitness' | 'Endurance';
  activityLevel: 'Sedentary' | 'Lightly Active' | 'Moderately Active' | 'Very Active';
  trainingExperience: 'Beginner' | 'Intermediate' | 'Advanced';
  trainingEnvironment: 'Gym' | 'Home';
  equipment: string[];
  dietPreference: 'Standard' | 'Vegetarian' | 'Vegan' | 'Keto' | 'Paleo';
  foodPreferences: string[];
  allergies: string[];
  exercisePreferences: {
    liked: string[];
    disliked: string[];
  };
  availableWorkoutDays: string[]; // e.g. ["Mon", "Wed", "Fri"]
  workoutDuration: number; // in minutes
  bodyPhoto: string | null;
  preferences: UserPreferences;
  // Backward compatibility fields
  fitnessGoal: string;
  workoutDaysPerWeek: number;
  preferredWorkoutTime: string;
  coachingStyle: 'Supportive' | 'Balanced' | 'Direct' | 'Strict';
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  category: 'hydration' | 'workout' | 'nutrition' | 'steps' | 'sleep' | 'other';
  value?: string;
}

export interface DailyStats {
  score: number;
  scoreBreakdown: {
    workout: number; // out of 20
    nutrition: number; // out of 30
    hydration: number; // out of 15
    steps: number; // out of 20
    sleep: number; // out of 15
  };
  weight: number;
  targetWeight: number;
  streakDays: number;
  weightChange: string; // e.g., "-1.8 kg"
}

export interface WorkoutSet {
  id: string;
  weight: number; // in kg
  reps: number;
  completed: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  sets: WorkoutSet[];
  targetReps: string; // e.g. "3x8-10"
  notes?: string;
}

export interface Workout {
  id: string;
  name: string; // e.g., "Push Day"
  durationMinutes: number;
  exercises: Exercise[];
  completed: boolean;
  date: string; // YYYY-MM-DD
}

export interface MealItem {
  name: string;
  calories: number;
  protein: number; // in grams
  carbs: number; // in grams
  fat: number; // in grams
}

export interface Meal {
  id: string;
  name: string; // e.g., "Breakfast"
  time: string; // e.g., "08:30"
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

export interface HydrationData {
  targetMl: number;
  consumedMl: number;
  entries: HydrationEntry[];
}

export interface Nutrition {
  calories: {
    current: number;
    target: number;
  };
  protein: {
    current: number;
    target: number;
  };
  carbs: {
    current: number;
    target: number;
  };
  fat: {
    current: number;
    target: number;
  };
  waterIntakeLiters: number;
  waterTargetLiters: number;
}

export interface Habit {
  id: string;
  name: string;
  icon: string;
  streak: number;
  weeklyHistory: { [key: string]: boolean }; // keys: "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"
  currentCompleted: boolean;
}

export interface MeasurementHistory {
  date: string;
  value: number;
}

export interface ProgressMeasurement {
  weightHistory: { date: string; value: number }[];
  chest: MeasurementHistory[];
  waist: MeasurementHistory[];
  arms: MeasurementHistory[];
  thighs: MeasurementHistory[];
  strengthProgression: {
    exerciseName: string;
    history: { date: string; oneRepMax: number }[];
  }[];
}

export interface FridayMessage {
  id: string;
  sender: 'friday' | 'user';
  text: string;
  timestamp: string;
  category?: 'alert' | 'info' | 'success' | 'workout' | 'nutrition';
}
