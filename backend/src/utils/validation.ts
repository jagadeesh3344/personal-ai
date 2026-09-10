import { z } from 'zod';

export const EquipmentEnum = z.enum([
  'NONE',
  'DUMBBELLS',
  'BARBELL',
  'BENCH',
  'RESISTANCE_BANDS',
  'KETTLEBELL',
  'PULLUP_BAR',
  'CABLE_MACHINE',
  'GYM_MACHINE'
]);

export const GoalEnum = z.enum([
  'FAT_LOSS',
  'GAIN_MUSCLE',
  'BODY_RECOMPOSITION',
  'STRENGTH',
  'GENERAL_FITNESS',
  'ENDURANCE'
]);

export const SexEnum = z.enum(['MALE', 'FEMALE', 'OTHER']);

export const ActivityLevelEnum = z.enum([
  'SEDENTARY',
  'LIGHTLY_ACTIVE',
  'MODERATELY_ACTIVE',
  'VERY_ACTIVE'
]);

export const TrainingExperienceEnum = z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']);

export const TrainingEnvironmentEnum = z.enum(['HOME', 'GYM', 'OUTDOOR']);

export const DietPreferenceEnum = z.enum([
  'STANDARD',
  'VEGETARIAN',
  'VEGAN',
  'KETO',
  'PALEO'
]);

export const ProfileUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  age: z.number().int().min(10).max(120).optional(),
  sex: SexEnum.optional(),
  heightCm: z.number().positive().max(300).optional(),
  currentWeightKg: z.number().positive().max(500).optional(),
  targetWeightKg: z.number().positive().max(500).optional(),
  goal: GoalEnum.optional(),
  activityLevel: ActivityLevelEnum.optional(),
  trainingExperience: TrainingExperienceEnum.optional(),
  trainingEnvironment: TrainingEnvironmentEnum.optional(),
  equipment: z.array(EquipmentEnum).min(1).optional(),
  availableWorkoutDays: z.array(z.string()).min(1).optional(),
  preferredWorkoutDuration: z.number().int().min(15).max(180).optional(),
  dietPreference: DietPreferenceEnum.optional(),
  foodPreferences: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  intolerances: z.array(z.string()).optional()
});

export const WorkoutSessionCreateSchema = z.object({
  dayId: z.string().uuid().optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notes: z.string().max(1000).optional()
});

export const WorkoutSetCreateSchema = z.object({
  exerciseId: z.string().min(1),
  setNumber: z.number().int().min(1),
  weightKg: z.number().min(0),
  reps: z.number().int().min(0),
  durationSeconds: z.number().int().min(0).optional(),
  resistanceLevel: z.string().optional(),
  completed: z.boolean().default(false),
  rpe: z.number().min(1).max(10).optional(),
  completionMethod: z.enum(['CAMERA', 'VOICE', 'MANUAL']).default('MANUAL').optional(),
  verification: z.enum(['VERIFIED', 'SELF_REPORTED']).default('SELF_REPORTED').optional()
});

export const MealItemSchema = z.object({
  name: z.string().min(1),
  quantity: z.string().min(1),
  calories: z.number().int().min(0),
  protein: z.number().min(0),
  carbs: z.number().min(0),
  fat: z.number().min(0)
});

export const MealCreateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  type: z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']),
  name: z.string().min(1).max(100),
  time: z.string().min(1),
  totalCalories: z.number().int().min(0),
  totalProtein: z.number().min(0),
  totalCarbs: z.number().min(0),
  totalFat: z.number().min(0),
  items: z.array(MealItemSchema).default([])
});

export const MealUpdateSchema = MealCreateSchema.partial();

export const HydrationCreateSchema = z.object({
  amountMl: z.number().int().positive().max(5000),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});

export const MeasurementCreateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  weightKg: z.number().positive().max(500),
  chestCm: z.number().positive().optional(),
  waistCm: z.number().positive().optional(),
  hipsCm: z.number().positive().optional(),
  armsCm: z.number().positive().optional(),
  thighsCm: z.number().positive().optional(),
  notes: z.string().max(1000).optional()
});

export const CheckinCreateSchema = z.object({
  checkinDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  weightKg: z.number().positive().max(500),
  adherenceScore: z.number().min(0).max(10).optional(),
  summary: z.string().max(2000).optional(),
  nextMonthFocus: z.string().max(1000).optional()
});

export const PhotoUploadUrlSchema = z.object({
  pose: z.enum(['FRONT', 'SIDE', 'BACK']),
  fileExtension: z.string().regex(/^(jpg|jpeg|png|webp)$/i),
  checkinId: z.string().uuid().optional()
});
