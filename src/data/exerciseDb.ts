import { Exercise, Workout, WorkoutSet } from '../types';

export interface DbExercise {
  id: string;
  name: string;
  category: 'push' | 'pull' | 'legs' | 'core';
  equipmentRequired: string[];
  homeCompatible: boolean;
  gymCompatible: boolean;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  movementPattern: string;
  notes: string;
  targetReps: string;
}

export const exerciseDatabase: DbExercise[] = [
  // --- BODYWEIGHT ONLY (Home & Gym Compatible, No Equipment Required) ---
  {
    id: 'db-e-pushup',
    name: "Bodyweight Push-up",
    category: 'push',
    equipmentRequired: [],
    homeCompatible: true,
    gymCompatible: true,
    difficulty: 'Beginner',
    movementPattern: 'Horizontal Press',
    notes: "Keep spine neutral, lock out elbows at top, control the descent",
    targetReps: "3 sets of 12-15 reps"
  },
  {
    id: 'db-e-pikepushup',
    name: "Pike Push-up",
    category: 'push',
    equipmentRequired: [],
    homeCompatible: true,
    gymCompatible: true,
    difficulty: 'Intermediate',
    movementPattern: 'Vertical Press',
    notes: "Elevate hips high, press at an angle to focus on anterior deltoids",
    targetReps: "3 sets of 8-12 reps"
  },
  {
    id: 'db-e-bodyweightsquat',
    name: "Bodyweight Squat",
    category: 'legs',
    equipmentRequired: [],
    homeCompatible: true,
    gymCompatible: true,
    difficulty: 'Beginner',
    movementPattern: 'Squat',
    notes: "Drive hips back, keep heels flat on floor, lower to parallel",
    targetReps: "3 sets of 15-20 reps"
  },
  {
    id: 'db-e-lunge',
    name: "Walking Lunge",
    category: 'legs',
    equipmentRequired: [],
    homeCompatible: true,
    gymCompatible: true,
    difficulty: 'Beginner',
    movementPattern: 'Lunge',
    notes: "Keep torso tall, stop back knee just above the floor",
    targetReps: "3 sets of 12 reps per leg"
  },
  {
    id: 'db-e-glutebridge',
    name: "Single-Leg Glute Bridge",
    category: 'legs',
    equipmentRequired: [],
    homeCompatible: true,
    gymCompatible: true,
    difficulty: 'Beginner',
    movementPattern: 'Hinge',
    notes: "Drive through heel, squeeze glute at peak contraction",
    targetReps: "3 sets of 15 reps"
  },
  {
    id: 'db-e-plank',
    name: "Abdominal Plank",
    category: 'core',
    equipmentRequired: [],
    homeCompatible: true,
    gymCompatible: true,
    difficulty: 'Beginner',
    movementPattern: 'Anti-Extension',
    notes: "Brace abs, squeeze glutes, do not let lower back sag",
    targetReps: "3 sets of 45-60 seconds"
  },
  {
    id: 'db-e-mountainclimber',
    name: "Mountain Climbers",
    category: 'core',
    equipmentRequired: [],
    homeCompatible: true,
    gymCompatible: true,
    difficulty: 'Beginner',
    movementPattern: 'Core Stability',
    notes: "Keep back flat, drive knees aggressively toward chest",
    targetReps: "3 sets of 30 seconds"
  },
  {
    id: 'db-e-benchesdips',
    name: "Bench / Chair Dips",
    category: 'push',
    equipmentRequired: ['Bench'],
    homeCompatible: true,
    gymCompatible: true,
    difficulty: 'Beginner',
    movementPattern: 'Vertical Press',
    notes: "Keep hips close to the bench or chair, do not over-stretch shoulders",
    targetReps: "3 sets of 10-12 reps"
  },
  {
    id: 'db-e-doorframerow',
    name: "Doorframe Inverted Row",
    category: 'pull',
    equipmentRequired: [],
    homeCompatible: true,
    gymCompatible: true,
    difficulty: 'Beginner',
    movementPattern: 'Horizontal Pull',
    notes: "Grip a sturdy doorframe, place feet close to base, pull chest to frame",
    targetReps: "3 sets of 12-15 reps"
  },
  {
    id: 'db-e-ytwextension',
    name: "Prone Y-T-W Raises",
    category: 'pull',
    equipmentRequired: [],
    homeCompatible: true,
    gymCompatible: true,
    difficulty: 'Beginner',
    movementPattern: 'Extension',
    notes: "Lie face down, raise arms in Y, T, and W positions to contract upper back",
    targetReps: "3 sets of 10 reps each"
  },
  {
    id: 'db-e-superman',
    name: "Superman Arch Hold",
    category: 'pull',
    equipmentRequired: [],
    homeCompatible: true,
    gymCompatible: true,
    difficulty: 'Beginner',
    movementPattern: 'Extension',
    notes: "Raise chest and thighs off floor simultaneously, squeeze lower back and glutes",
    targetReps: "3 sets of 30 seconds"
  },

  // --- DUMBBELL EXERCISES (Requires Dumbbells/Adjustable Dumbbells) ---
  {
    id: 'db-e-dbrow',
    name: "Dumbbell Row",
    category: 'pull',
    equipmentRequired: ['Dumbbells'],
    homeCompatible: true,
    gymCompatible: true,
    difficulty: 'Intermediate',
    movementPattern: 'Horizontal Pull',
    notes: "Pull elbow back toward hip, squeeze lat at peak",
    targetReps: "3 sets of 10-12 reps"
  },
  {
    id: 'db-e-dbpressfloor',
    name: "Dumbbell Floor Press",
    category: 'push',
    equipmentRequired: ['Dumbbells'],
    homeCompatible: true,
    gymCompatible: true,
    difficulty: 'Beginner',
    movementPattern: 'Horizontal Press',
    notes: "Perform on floor, touch triceps lightly, press strictly upward",
    targetReps: "3 sets of 12 reps"
  },
  {
    id: 'db-e-dbpressbench',
    name: "Dumbbell Bench Press",
    category: 'push',
    equipmentRequired: ['Dumbbells', 'Bench'],
    homeCompatible: true,
    gymCompatible: true,
    difficulty: 'Intermediate',
    movementPattern: 'Horizontal Press',
    notes: "Control the dumbbells down to chest level, press to full lockout",
    targetReps: "3 sets of 8-10 reps"
  },
  {
    id: 'db-e-dbshoulderpress',
    name: "Dumbbell Shoulder Press",
    category: 'push',
    equipmentRequired: ['Dumbbells'],
    homeCompatible: true,
    gymCompatible: true,
    difficulty: 'Intermediate',
    movementPattern: 'Vertical Press',
    notes: "Press straight up, avoid hyperextending lower back",
    targetReps: "3 sets of 10 reps"
  },
  {
    id: 'db-e-dbcurl',
    name: "Dumbbell Bicep Curl",
    category: 'pull',
    equipmentRequired: ['Dumbbells'],
    homeCompatible: true,
    gymCompatible: true,
    difficulty: 'Beginner',
    movementPattern: 'Flexion',
    notes: "Keep elbows pinned to sides, rotate palms up at top",
    targetReps: "3 sets of 12 reps"
  },
  {
    id: 'db-e-dbsquat',
    name: "Goblet Squat (Dumbbell)",
    category: 'legs',
    equipmentRequired: ['Dumbbells'],
    homeCompatible: true,
    gymCompatible: true,
    difficulty: 'Intermediate',
    movementPattern: 'Squat',
    notes: "Hold dumbbell vertically under chin, sit deep between hips",
    targetReps: "3 sets of 10-12 reps"
  },

  // --- RESISTANCE BAND EXERCISES ---
  {
    id: 'db-e-bandrow',
    name: "Resistance Band Row",
    category: 'pull',
    equipmentRequired: ['Resistance Bands'],
    homeCompatible: true,
    gymCompatible: true,
    difficulty: 'Beginner',
    movementPattern: 'Horizontal Pull',
    notes: "Step on band or anchor, pull hands back toward lower ribs",
    targetReps: "3 sets of 12-15 reps"
  },
  {
    id: 'db-e-bandfly',
    name: "Band Chest Fly",
    category: 'push',
    equipmentRequired: ['Resistance Bands'],
    homeCompatible: true,
    gymCompatible: true,
    difficulty: 'Beginner',
    movementPattern: 'Adduction',
    notes: "Anchor behind back, bring hands together keeping elbows soft",
    targetReps: "3 sets of 15 reps"
  },
  {
    id: 'db-e-bandcurl',
    name: "Band Bicep Curl",
    category: 'pull',
    equipmentRequired: ['Resistance Bands'],
    homeCompatible: true,
    gymCompatible: true,
    difficulty: 'Beginner',
    movementPattern: 'Flexion',
    notes: "Step on band, curl hands up toward shoulders against tension",
    targetReps: "3 sets of 15 reps"
  },

  // --- GYM SPECIFIC HEAVY EXERCISES (Requires Barbell, Cables, or Gym Machines) ---
  {
    id: 'db-e-barbellpress',
    name: "Barbell Bench Press",
    category: 'push',
    equipmentRequired: ['Barbell', 'Bench'],
    homeCompatible: false,
    gymCompatible: true,
    difficulty: 'Intermediate',
    movementPattern: 'Horizontal Press',
    notes: "Drive through heels, keep shoulder blades retracted",
    targetReps: "3 sets of 8-10 reps"
  },
  {
    id: 'db-e-barbellsquat',
    name: "Barbell Back Squat",
    category: 'legs',
    equipmentRequired: ['Barbell', 'Squat Rack'],
    homeCompatible: false,
    gymCompatible: true,
    difficulty: 'Advanced',
    movementPattern: 'Squat',
    notes: "Keep spine tall, squat past parallel, drive through mid-foot",
    targetReps: "3 sets of 8 reps"
  },
  {
    id: 'db-e-latpulldown',
    name: "Cable Lat Pulldown",
    category: 'pull',
    equipmentRequired: ['Lat Pulldown'],
    homeCompatible: false,
    gymCompatible: true,
    difficulty: 'Intermediate',
    movementPattern: 'Vertical Pull',
    notes: "Squeeze shoulder blades down and back, pull bar to collarbone",
    targetReps: "3 sets of 10-12 reps"
  },
  {
    id: 'db-e-cablerow',
    name: "Seated Cable Row",
    category: 'pull',
    equipmentRequired: ['Cable Machine'],
    homeCompatible: false,
    gymCompatible: true,
    difficulty: 'Intermediate',
    movementPattern: 'Horizontal Pull',
    notes: "Keep chest tall, stretch lats fully, pull grip toward waist",
    targetReps: "3 sets of 10 reps"
  },
  {
    id: 'db-e-cablepushdown',
    name: "Cable Tricep Pushdown",
    category: 'push',
    equipmentRequired: ['Cable Machine'],
    homeCompatible: false,
    gymCompatible: true,
    difficulty: 'Beginner',
    movementPattern: 'Extension',
    notes: "Keep elbows locked to torso, flare forearms at contraction",
    targetReps: "3 sets of 12 reps"
  },
  {
    id: 'db-e-legpress',
    name: "Incline Leg Press",
    category: 'legs',
    equipmentRequired: ['Leg Press'],
    homeCompatible: false,
    gymCompatible: true,
    difficulty: 'Beginner',
    movementPattern: 'Squat',
    notes: "Do not lock knees at peak, lower platform slowly to ninety degrees",
    targetReps: "3 sets of 10-12 reps"
  }
];

export const generateFilteredWorkouts = (
  environment: 'Gym' | 'Home',
  userEquipment: string[] = [],
  goal: string = ''
): Workout[] => {
  // Translate "No Equipment" and "None" from home mode and sanitize all items
  const cleanEquipment = (userEquipment || [])
    .map(e => e.trim().toLowerCase())
    .filter(e => e !== 'no equipment' && e !== 'none' && e !== '');

  // Filter based on location & physical equipment intersection
  const allowedExercises = exerciseDatabase.filter(ex => {
    // 1. Check training environment compatibility
    if (environment === 'Home' && !ex.homeCompatible) return false;
    if (environment === 'Gym' && !ex.gymCompatible) return false;

    // 2. Check physical equipment intersection
    if (ex.equipmentRequired.length > 0) {
      if (cleanEquipment.length === 0) return false; // Requires equipment but operator has none
      
      // Every single piece of equipment required by this exercise must be held by the user
      return ex.equipmentRequired.every(reqItem => {
        const itemLower = reqItem.toLowerCase();
        // Handle adjustable dumbbells vs dumbbells naming aliases
        if (itemLower === 'dumbbells') {
          return cleanEquipment.includes('dumbbells') || cleanEquipment.includes('adjustable dumbbells');
        }
        return cleanEquipment.includes(itemLower);
      });
    }

    // Bodyweight only exercises (equipmentRequired is empty) are always compatible!
    return true;
  });

  // Divide into core categories to assemble a comprehensive 4-to-5 exercise layout
  const pushPool = allowedExercises.filter(ex => ex.category === 'push');
  const pullPool = allowedExercises.filter(ex => ex.category === 'pull');
  const legsPool = allowedExercises.filter(ex => ex.category === 'legs');
  const corePool = allowedExercises.filter(ex => ex.category === 'core');

  const selectedList: DbExercise[] = [];

  // Structure workout based on Goal
  // If "Gain Muscle" / "Build Muscle" / "Strength", prioritize compound presses, rows, and heavy legs
  if (pushPool.length > 0) selectedList.push(pushPool[0]);
  if (pullPool.length > 0) selectedList.push(pullPool[0]);
  if (legsPool.length > 0) selectedList.push(legsPool[0]);
  
  // Add another Push or Pull if available to total 4 exercises
  if (pushPool.length > 1) {
    selectedList.push(pushPool[1]);
  } else if (pullPool.length > 1) {
    selectedList.push(pullPool[1]);
  } else if (corePool.length > 0) {
    selectedList.push(corePool[0]);
  }

  // Ensure we have at least 3 exercises (fallback on core/planks if extremely limited)
  if (selectedList.length < 3) {
    allowedExercises.forEach(ex => {
      if (!selectedList.some(s => s.id === ex.id) && selectedList.length < 4) {
        selectedList.push(ex);
      }
    });
  }

  // Map to the required Workout structure
  const exercises: Exercise[] = selectedList.map((dbEx, idx) => {
    const isBodyweight = dbEx.equipmentRequired.length === 0;
    const baseWeight = isBodyweight ? 0 : (dbEx.equipmentRequired.includes('Dumbbells') ? 14 : 40);
    const setsCount = 3;

    const sets: WorkoutSet[] = Array.from({ length: setsCount }).map((_, setIdx) => ({
      id: `set-${dbEx.id}-${idx}-${setIdx}`,
      weight: baseWeight,
      reps: 10,
      completed: false
    }));

    return {
      id: `ex-${dbEx.id}-${idx}`,
      name: dbEx.name,
      targetReps: dbEx.targetReps,
      notes: dbEx.notes,
      sets
    };
  });

  // Format title depending on Goal
  let workoutTitle = "Push Day Protocol";
  if (goal.toUpperCase().includes("LOSE") || goal.toUpperCase().includes("FAT")) {
    workoutTitle = "Metabolic Conditioning Circuit";
  } else if (goal.toUpperCase().includes("MUSCLE") || goal.toUpperCase().includes("BULK") || goal.toUpperCase().includes("GAIN")) {
    workoutTitle = "Hypertrophy System";
  } else if (goal.toUpperCase().includes("STRENGTH")) {
    workoutTitle = "CNS Strength Protocol";
  }

  return [
    {
      id: `w-custom-${Date.now()}`,
      name: workoutTitle,
      durationMinutes: environment === 'Gym' ? 50 : 35,
      completed: false,
      date: new Date().toISOString().split('T')[0],
      exercises
    }
  ];
};
