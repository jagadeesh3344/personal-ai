import { Equipment, TrainingEnvironment, TrainingExperience } from '../../../types/profile';
import { TrackingType } from '../../../types';

export type MuscleGroup =
  | "CHEST"
  | "BACK"
  | "SHOULDERS"
  | "BICEPS"
  | "TRICEPS"
  | "LEGS"
  | "CORE"
  | "CARDIO";

export interface Exercise {
  id: string;
  name: string;
  equipmentRequired: Equipment[];
  environment: TrainingEnvironment[];
  muscleGroups: MuscleGroup[];
  difficulty: TrainingExperience;
  instructions: string;
  trackingType?: TrackingType;
  defaultReps?: string;
  defaultSets?: number;
  restSeconds?: number;
  tutorialUrl?: string;
  safetyNotes?: string;
  progressionId?: string;
  regressionId?: string;
}


export const EXERCISES: Exercise[] = [
  // --- BODYWEIGHT / NO EQUIPMENT (HOME, GYM, OUTDOOR) ---
  {
    id: "wall-push-up",
    name: "Wall Push-up",
    equipmentRequired: ["NONE"],
    environment: ["HOME", "GYM", "OUTDOOR"],
    muscleGroups: ["CHEST", "TRICEPS", "SHOULDERS"],
    difficulty: "BEGINNER",
    instructions: "Stand arms-length from a wall. Place palms flat, bend elbows to bring chest close to wall, then press back.",
    safetyNotes: "Keep body straight from head to heels. Do not arch your lower back.",
    tutorialUrl: "https://www.acefitness.org/resources/everyone/exercise-library/41/wall-push-up/",
    progressionId: "incline-push-up",
    defaultReps: "10-15 reps",
    defaultSets: 3,
    restSeconds: 45
  },
  {
    id: "incline-push-up",
    name: "Incline Push-up",
    equipmentRequired: ["NONE"],
    environment: ["HOME", "GYM", "OUTDOOR"],
    muscleGroups: ["CHEST", "TRICEPS", "SHOULDERS"],
    difficulty: "BEGINNER",
    instructions: "Place hands on an elevated sturdy surface (bench, table, or step). Lower chest to the edge and press away.",
    safetyNotes: "Ensure the surface is stable and will not slide.",
    tutorialUrl: "https://www.acefitness.org/resources/everyone/exercise-library/42/incline-push-up/",
    regressionId: "wall-push-up",
    progressionId: "knee-push-up",
    defaultReps: "10-12 reps",
    defaultSets: 3,
    restSeconds: 60
  },
  {
    id: "knee-push-up",
    name: "Knee Push-up",
    equipmentRequired: ["NONE"],
    environment: ["HOME", "GYM", "OUTDOOR"],
    muscleGroups: ["CHEST", "TRICEPS", "SHOULDERS"],
    difficulty: "BEGINNER",
    instructions: "Rest on knees and hands with hips extended. Lower chest to floor with elbows 45 degrees, then press up.",
    safetyNotes: "Keep core engaged to maintain a straight line from knees to shoulders.",
    tutorialUrl: "https://www.acefitness.org/resources/everyone/exercise-library/43/modified-push-up/",
    regressionId: "incline-push-up",
    progressionId: "push-up",
    defaultReps: "8-12 reps",
    defaultSets: 3,
    restSeconds: 60
  },
  {
    id: "box-squat",
    name: "Box Squat",
    equipmentRequired: ["NONE"],
    environment: ["HOME", "GYM", "OUTDOOR"],
    muscleGroups: ["LEGS"],
    difficulty: "BEGINNER",
    instructions: "Stand in front of a chair or box. Hinge at hips and sit down until glutes gently touch, then drive through heels to stand.",
    safetyNotes: "Do not collapse onto the seat; maintain core tension throughout the descent.",
    tutorialUrl: "https://www.acefitness.org/resources/everyone/exercise-library/134/box-squat/",
    progressionId: "bodyweight-squat",
    defaultReps: "10-12 reps",
    defaultSets: 3,
    restSeconds: 60
  },
  {
    id: "knee-plank",
    name: "Knee Plank",
    equipmentRequired: ["NONE"],
    environment: ["HOME", "GYM", "OUTDOOR"],
    muscleGroups: ["CORE"],
    difficulty: "BEGINNER",
    instructions: "Support body on forearms and knees. Keep hips aligned with shoulders and brace abdominal wall.",
    safetyNotes: "Breathe steadily. Do not let hips drop below shoulder level.",
    tutorialUrl: "https://www.acefitness.org/resources/everyone/exercise-library/33/modified-front-plank/",
    progressionId: "plank",
    defaultReps: "20-30 sec",
    defaultSets: 3,
    restSeconds: 45
  },
  {
    id: "push-up",
    name: "Push-up",
    equipmentRequired: ["NONE"],
    environment: ["HOME", "GYM", "OUTDOOR"],
    muscleGroups: ["CHEST", "TRICEPS", "SHOULDERS"],
    difficulty: "INTERMEDIATE",
    instructions: "Keep core tight, lower chest to floor with elbows 45 degrees, and push back up.",
    safetyNotes: "Keep neck neutral and maintain a rigid plank posture throughout.",
    tutorialUrl: "https://www.acefitness.org/resources/everyone/exercise-library/40/push-up/",
    regressionId: "knee-push-up",
    progressionId: "diamond-push-up",
    defaultReps: "10-15 reps",
    defaultSets: 3,
    restSeconds: 60
  },
  {
    id: "diamond-push-up",
    name: "Diamond Push-up",
    equipmentRequired: ["NONE"],
    environment: ["HOME", "GYM", "OUTDOOR"],
    muscleGroups: ["TRICEPS", "CHEST"],
    difficulty: "ADVANCED",
    instructions: "Place hands together under chest forming a diamond. Lower chest to hands and press.",
    safetyNotes: "Places high stress on wrists and elbows. Progress to this only after mastering standard push-ups.",
    tutorialUrl: "https://www.acefitness.org/resources/everyone/exercise-library/235/close-grip-push-up/",
    regressionId: "push-up",
    defaultReps: "8-12 reps",
    defaultSets: 3,
    restSeconds: 60
  },
  {
    id: "pike-push-up",
    name: "Pike Push-up",
    equipmentRequired: ["NONE"],
    environment: ["HOME", "GYM", "OUTDOOR"],
    muscleGroups: ["SHOULDERS", "TRICEPS"],
    difficulty: "INTERMEDIATE",
    instructions: "Elevate hips high into an inverted V. Press at an angle targeting front shoulders.",
    defaultReps: "8-10 reps",
    defaultSets: 3,
    restSeconds: 60
  },
  {
    id: "bodyweight-squat",
    name: "Bodyweight Squat",
    equipmentRequired: ["NONE"],
    environment: ["HOME", "GYM", "OUTDOOR"],
    muscleGroups: ["LEGS"],
    difficulty: "BEGINNER",
    instructions: "Feet shoulder-width apart. Sit hips back and down to parallel, keeping chest high.",
    safetyNotes: "Drive knees out in line with toes. Keep entire foot grounded on the floor.",
    tutorialUrl: "https://www.acefitness.org/resources/everyone/exercise-library/135/bodyweight-squat/",
    regressionId: "box-squat",
    progressionId: "dumbbell-goblet-squat",
    defaultReps: "15-20 reps",
    defaultSets: 3,
    restSeconds: 60
  },
  {
    id: "walking-lunge",
    name: "Walking Lunge",
    equipmentRequired: ["NONE"],
    environment: ["HOME", "GYM", "OUTDOOR"],
    muscleGroups: ["LEGS"],
    difficulty: "BEGINNER",
    instructions: "Step forward into a deep lunge, back knee just above the floor, and drive up through front heel.",
    defaultReps: "12 reps / leg",
    defaultSets: 3,
    restSeconds: 60
  },
  {
    id: "single-leg-glute-bridge",
    name: "Single-Leg Glute Bridge",
    equipmentRequired: ["NONE"],
    environment: ["HOME", "GYM", "OUTDOOR"],
    muscleGroups: ["LEGS", "CORE"],
    difficulty: "BEGINNER",
    instructions: "Lie on back, drive through one heel to raise hips and contract glute at peak.",
    defaultReps: "12-15 reps",
    defaultSets: 3,
    restSeconds: 45
  },
  {
    id: "plank",
    name: "Plank",
    equipmentRequired: ["NONE"],
    environment: ["HOME", "GYM", "OUTDOOR"],
    muscleGroups: ["CORE"],
    difficulty: "BEGINNER",
    instructions: "Hold rigid pushup or forearm position. Squeeze glutes and abs tight.",
    defaultReps: "45-60 sec",
    defaultSets: 3,
    restSeconds: 45
  },
  {
    id: "mountain-climbers",
    name: "Mountain Climbers",
    equipmentRequired: ["NONE"],
    environment: ["HOME", "GYM", "OUTDOOR"],
    muscleGroups: ["CORE", "CARDIO"],
    difficulty: "BEGINNER",
    instructions: "In high plank, rapidly drive knees alternately towards chest.",
    defaultReps: "30-45 sec",
    defaultSets: 3,
    restSeconds: 45
  },
  {
    id: "doorframe-inverted-row",
    name: "Doorframe Inverted Row",
    equipmentRequired: ["NONE"],
    environment: ["HOME", "OUTDOOR"],
    muscleGroups: ["BACK", "BICEPS"],
    difficulty: "BEGINNER",
    instructions: "Hold sturdy doorframe, lean back with arms extended, and row your chest in.",
    defaultReps: "12-15 reps",
    defaultSets: 3,
    restSeconds: 60
  },
  {
    id: "chair-dips",
    name: "Bodyweight Chair Dips",
    equipmentRequired: ["NONE"],
    environment: ["HOME", "GYM", "OUTDOOR"],
    muscleGroups: ["TRICEPS", "CHEST"],
    difficulty: "BEGINNER",
    instructions: "Hands on chair edge behind you. Lower hips with elbows bending back, then extend.",
    defaultReps: "10-12 reps",
    defaultSets: 3,
    restSeconds: 60
  },

  // --- DUMBBELL EXERCISES ---
  {
    id: "dumbbell-row",
    name: "Dumbbell Row",
    equipmentRequired: ["DUMBBELLS"],
    environment: ["HOME", "GYM"],
    muscleGroups: ["BACK", "BICEPS"],
    difficulty: "BEGINNER",
    instructions: "Hinge forward with flat back. Pull dumbbell back toward hip, leading with elbow.",
    defaultReps: "10-12 reps",
    defaultSets: 3,
    restSeconds: 75
  },
  {
    id: "dumbbell-curl",
    name: "Dumbbell Curl",
    equipmentRequired: ["DUMBBELLS"],
    environment: ["HOME", "GYM"],
    muscleGroups: ["BICEPS"],
    difficulty: "BEGINNER",
    instructions: "Keep elbows pinned to your sides. Curl dumbbells up, squeezing biceps at top.",
    defaultReps: "10-12 reps",
    defaultSets: 3,
    restSeconds: 60
  },
  {
    id: "dumbbell-shoulder-press",
    name: "Dumbbell Shoulder Press",
    equipmentRequired: ["DUMBBELLS"],
    environment: ["HOME", "GYM"],
    muscleGroups: ["SHOULDERS", "TRICEPS"],
    difficulty: "BEGINNER",
    instructions: "Press dumbbells vertically overhead without arching lower back.",
    defaultReps: "8-10 reps",
    defaultSets: 3,
    restSeconds: 75
  },
  {
    id: "dumbbell-lateral-raise",
    name: "Dumbbell Lateral Raise",
    equipmentRequired: ["DUMBBELLS"],
    environment: ["HOME", "GYM"],
    muscleGroups: ["SHOULDERS"],
    difficulty: "BEGINNER",
    instructions: "Raise dumbbells to sides up to shoulder level with slight forward elbow tilt.",
    defaultReps: "12-15 reps",
    defaultSets: 3,
    restSeconds: 60
  },
  {
    id: "dumbbell-goblet-squat",
    name: "Dumbbell Goblet Squat",
    equipmentRequired: ["DUMBBELLS"],
    environment: ["HOME", "GYM"],
    muscleGroups: ["LEGS"],
    difficulty: "BEGINNER",
    instructions: "Hold single dumbbell vertically at chest. Squat between knees keeping torso tall.",
    defaultReps: "10-12 reps",
    defaultSets: 3,
    restSeconds: 75
  },
  {
    id: "dumbbell-rdl",
    name: "Dumbbell Romanian Deadlift",
    equipmentRequired: ["DUMBBELLS"],
    environment: ["HOME", "GYM"],
    muscleGroups: ["LEGS"],
    difficulty: "INTERMEDIATE",
    instructions: "Hinge hips backward with slight knee bend. Lower dumbbells along shins and drive hips forward.",
    defaultReps: "10-12 reps",
    defaultSets: 3,
    restSeconds: 75
  },
  {
    id: "dumbbell-overhead-extension",
    name: "Overhead Dumbbell Tricep Extension",
    equipmentRequired: ["DUMBBELLS"],
    environment: ["HOME", "GYM"],
    muscleGroups: ["TRICEPS"],
    difficulty: "BEGINNER",
    instructions: "Hold dumbbell overhead with two hands. Lower behind neck and press upward.",
    defaultReps: "10-12 reps",
    defaultSets: 3,
    restSeconds: 60
  },

  // --- DUMBBELL + BENCH EXERCISES ---
  {
    id: "dumbbell-bench-press",
    name: "Dumbbell Bench Press",
    equipmentRequired: ["DUMBBELLS", "BENCH"],
    environment: ["HOME", "GYM"],
    muscleGroups: ["CHEST", "TRICEPS"],
    difficulty: "BEGINNER",
    instructions: "Lie back on bench. Press dumbbells upward over chest and lower with control.",
    defaultReps: "8-12 reps",
    defaultSets: 3,
    restSeconds: 90
  },
  {
    id: "incline-dumbbell-press",
    name: "Incline Dumbbell Press",
    equipmentRequired: ["DUMBBELLS", "BENCH"],
    environment: ["HOME", "GYM"],
    muscleGroups: ["CHEST", "SHOULDERS"],
    difficulty: "INTERMEDIATE",
    instructions: "Set bench at 30 degrees. Press dumbbells up targeting upper chest.",
    defaultReps: "8-10 reps",
    defaultSets: 3,
    restSeconds: 90
  },

  // --- BARBELL EXERCISES ---
  {
    id: "bench-press",
    name: "Bench Press",
    equipmentRequired: ["BARBELL", "BENCH"],
    environment: ["GYM"],
    muscleGroups: ["CHEST", "TRICEPS", "SHOULDERS"],
    difficulty: "INTERMEDIATE",
    instructions: "Unrack barbell, lower with control to sternum, and press forcefully upward.",
    defaultReps: "6-8 reps",
    defaultSets: 4,
    restSeconds: 120
  },
  {
    id: "barbell-squat",
    name: "Barbell Squat",
    equipmentRequired: ["BARBELL"],
    environment: ["GYM"],
    muscleGroups: ["LEGS"],
    difficulty: "INTERMEDIATE",
    instructions: "Barbell on upper traps. Squat down until thighs reach parallel, then drive up.",
    defaultReps: "6-8 reps",
    defaultSets: 4,
    restSeconds: 120
  },
  {
    id: "barbell-deadlift",
    name: "Barbell Deadlift",
    equipmentRequired: ["BARBELL"],
    environment: ["GYM"],
    muscleGroups: ["BACK", "LEGS"],
    difficulty: "ADVANCED",
    instructions: "Bar over midfoot. Grip bar, brace core, and drive through floor to lockout.",
    defaultReps: "5 reps",
    defaultSets: 3,
    restSeconds: 150
  },
  {
    id: "barbell-row",
    name: "Barbell Row",
    equipmentRequired: ["BARBELL"],
    environment: ["GYM"],
    muscleGroups: ["BACK", "BICEPS"],
    difficulty: "INTERMEDIATE",
    instructions: "Hinged at hips with flat back. Pull bar into lower chest pulling elbows high.",
    defaultReps: "8-10 reps",
    defaultSets: 3,
    restSeconds: 90
  },
  {
    id: "barbell-overhead-press",
    name: "Barbell Overhead Press",
    equipmentRequired: ["BARBELL"],
    environment: ["GYM"],
    muscleGroups: ["SHOULDERS", "TRICEPS"],
    difficulty: "INTERMEDIATE",
    instructions: "Bar on front deltoids. Squeeze glutes and press in a vertical path overhead.",
    defaultReps: "6-8 reps",
    defaultSets: 3,
    restSeconds: 90
  },

  // --- PULLUP BAR ---
  {
    id: "pull-up",
    name: "Pull-up",
    equipmentRequired: ["PULLUP_BAR"],
    environment: ["HOME", "GYM", "OUTDOOR"],
    muscleGroups: ["BACK", "BICEPS"],
    difficulty: "INTERMEDIATE",
    instructions: "Grip pull-up bar wide. Pull chest to bar while depressing shoulder blades.",
    defaultReps: "6-10 reps",
    defaultSets: 3,
    restSeconds: 90
  },
  {
    id: "chin-up",
    name: "Chin-up",
    equipmentRequired: ["PULLUP_BAR"],
    environment: ["HOME", "GYM", "OUTDOOR"],
    muscleGroups: ["BICEPS", "BACK"],
    difficulty: "INTERMEDIATE",
    instructions: "Underhand grip. Drive elbows downward to bring chin over bar.",
    defaultReps: "6-10 reps",
    defaultSets: 3,
    restSeconds: 90
  },

  // --- CABLE MACHINE ---
  {
    id: "cable-row",
    name: "Cable Row",
    equipmentRequired: ["CABLE_MACHINE"],
    environment: ["GYM"],
    muscleGroups: ["BACK", "BICEPS"],
    difficulty: "BEGINNER",
    instructions: "Sit upright at cable station. Row handle into abdomen squeezing shoulder blades.",
    defaultReps: "10-12 reps",
    defaultSets: 3,
    restSeconds: 75
  },
  {
    id: "lat-pulldown",
    name: "Lat Pulldown",
    equipmentRequired: ["CABLE_MACHINE"],
    environment: ["GYM"],
    muscleGroups: ["BACK", "BICEPS"],
    difficulty: "BEGINNER",
    instructions: "Wide grip on bar. Pull down to clavicle while arching upper back slightly.",
    defaultReps: "10-12 reps",
    defaultSets: 3,
    restSeconds: 75
  },
  {
    id: "cable-tricep-pushdown",
    name: "Cable Tricep Pushdown",
    equipmentRequired: ["CABLE_MACHINE"],
    environment: ["GYM"],
    muscleGroups: ["TRICEPS"],
    difficulty: "BEGINNER",
    instructions: "Pin elbows to ribs. Push bar or rope down until arms fully lock out.",
    defaultReps: "12-15 reps",
    defaultSets: 3,
    restSeconds: 60
  },

  // --- GYM MACHINE ---
  {
    id: "leg-press",
    name: "Leg Press",
    equipmentRequired: ["GYM_MACHINE"],
    environment: ["GYM"],
    muscleGroups: ["LEGS"],
    difficulty: "BEGINNER",
    instructions: "Feet shoulder-width on sled. Lower platform to 90 degrees and press smoothly.",
    defaultReps: "10-12 reps",
    defaultSets: 3,
    restSeconds: 90
  },
  {
    id: "leg-extension",
    name: "Leg Extension",
    equipmentRequired: ["GYM_MACHINE"],
    environment: ["GYM"],
    muscleGroups: ["LEGS"],
    difficulty: "BEGINNER",
    instructions: "Extend knees to lift pad, contracting quadriceps at the top for 1 second.",
    defaultReps: "12-15 reps",
    defaultSets: 3,
    restSeconds: 60
  },
  {
    id: "leg-curl",
    name: "Lying Leg Curl",
    equipmentRequired: ["GYM_MACHINE"],
    environment: ["GYM"],
    muscleGroups: ["LEGS"],
    difficulty: "BEGINNER",
    instructions: "Curl heels up toward glutes against pad, controlling the negative descent.",
    defaultReps: "10-12 reps",
    defaultSets: 3,
    restSeconds: 60
  },

  // --- RESISTANCE BANDS ---
  {
    id: "band-pull-apart",
    name: "Band Pull-Apart",
    equipmentRequired: ["RESISTANCE_BANDS"],
    environment: ["HOME", "GYM", "OUTDOOR"],
    muscleGroups: ["SHOULDERS", "BACK"],
    difficulty: "BEGINNER",
    instructions: "Hold band at chest level with arms straight. Pull outward until band touches chest.",
    defaultReps: "15-20 reps",
    defaultSets: 3,
    restSeconds: 45
  },

  // --- KETTLEBELL ---
  {
    id: "kettlebell-swing",
    name: "Kettlebell Swing",
    equipmentRequired: ["KETTLEBELL"],
    environment: ["HOME", "GYM", "OUTDOOR"],
    muscleGroups: ["LEGS", "CORE", "CARDIO"],
    difficulty: "INTERMEDIATE",
    instructions: "Hinge back at hips and explosively contract glutes to float bell to shoulder height.",
    defaultReps: "15-20 reps",
    defaultSets: 3,
    restSeconds: 60
  }
];
