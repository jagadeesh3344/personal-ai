export type Goal =
  | "FAT_LOSS"
  | "GAIN_MUSCLE"
  | "BODY_RECOMPOSITION"
  | "STRENGTH"
  | "GENERAL_FITNESS"
  | "ENDURANCE";

export type Sex = "MALE" | "FEMALE" | "OTHER";

export type ActivityLevel =
  | "SEDENTARY"
  | "LIGHTLY_ACTIVE"
  | "MODERATELY_ACTIVE"
  | "VERY_ACTIVE";

export type TrainingExperience = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export type TrainingEnvironment = "HOME" | "GYM" | "OUTDOOR";

export type DietPreference = "STANDARD" | "VEGETARIAN" | "VEGAN" | "KETO" | "PALEO";

export type Equipment =
  | "NONE"
  | "DUMBBELLS"
  | "BARBELL"
  | "BENCH"
  | "RESISTANCE_BANDS"
  | "KETTLEBELL"
  | "PULLUP_BAR"
  | "CABLE_MACHINE"
  | "GYM_MACHINE";

export interface UserProfile {
  name: string;
  age: number;
  sex: Sex;
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg: number;
  goal: Goal;
  activityLevel: ActivityLevel;
  trainingExperience: TrainingExperience;
  trainingEnvironment: TrainingEnvironment;
  equipment: Equipment[];
  availableWorkoutDays: string[];
  preferredWorkoutDuration: number;
  dietPreference: DietPreference;
  foodPreferences: string[];
  allergies: string[];
  intolerances: string[];
  createdAt?: string;
  updatedAt?: string;
}
