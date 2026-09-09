import { UserProfile } from '../../../types/profile';
import { EXERCISES, Exercise } from '../data/exercises';
import { getAvailableExercises } from './equipmentFilter';
import { WorkoutPlan, WorkoutDay, WorkoutExercise, WorkoutSet } from '../../../types';

export function generateWorkout(profile: UserProfile): WorkoutPlan {
  const availablePool = getAvailableExercises(profile, EXERCISES);

  const goal = profile.goal || 'GENERAL_FITNESS';
  const experience = profile.trainingExperience || 'BEGINNER';
  const availableDays = (profile.availableWorkoutDays && profile.availableWorkoutDays.length > 0)
    ? profile.availableWorkoutDays
    : ['MON', 'WED', 'FRI'];

  let targetReps = '10-12 reps';
  let restSeconds = 60;
  let targetSets = experience === 'BEGINNER' ? 3 : 4;

  switch (goal) {
    case 'STRENGTH':
      targetReps = '5-6 reps';
      restSeconds = 120;
      targetSets = 4;
      break;
    case 'GAIN_MUSCLE':
      targetReps = '8-12 reps';
      restSeconds = 90;
      targetSets = 3;
      break;
    case 'FAT_LOSS':
      targetReps = '12-15 reps';
      restSeconds = 60;
      targetSets = 3;
      break;
    case 'BODY_RECOMPOSITION':
      targetReps = '8-12 reps';
      restSeconds = 75;
      targetSets = 3;
      break;
    case 'ENDURANCE':
    case 'GENERAL_FITNESS':
    default:
      targetReps = '12-15 reps';
      restSeconds = 60;
      targetSets = 3;
      break;
  }

  const helperBuildExercise = (
    exDef: Exercise, 
    dayIndex: number, 
    orderIndex: number
  ): WorkoutExercise => {
    const isBodyweight = exDef.equipmentRequired.length === 0 || 
      (exDef.equipmentRequired.length === 1 && exDef.equipmentRequired[0] === 'NONE');
    const initialWeight = isBodyweight ? 0 : (exDef.equipmentRequired.includes('DUMBBELLS') ? 12 : 30);

    const sets: WorkoutSet[] = Array.from({ length: targetSets }).map((_, setIdx) => ({
      id: `set-${exDef.id}-d${dayIndex}-s${setIdx + 1}`,
      setNumber: setIdx + 1,
      weightKg: initialWeight,
      reps: parseInt(targetReps, 10) || 10,
      completed: false
    }));

    return {
      id: `ex-${exDef.id}-d${dayIndex}-${orderIndex}`,
      exerciseId: exDef.id,
      name: exDef.name,
      muscleGroups: exDef.muscleGroups,
      targetSets,
      targetReps,
      restSeconds,
      notes: exDef.instructions,
      sets
    };
  };

  const pushExercises = availablePool.filter(e => (e.muscleGroups || []).some(m => ['CHEST', 'SHOULDERS', 'TRICEPS'].includes(m)));
  const pullExercises = availablePool.filter(e => (e.muscleGroups || []).some(m => ['BACK', 'BICEPS'].includes(m)));
  const legExercises = availablePool.filter(e => (e.muscleGroups || []).includes('LEGS'));
  const coreExercises = availablePool.filter(e => (e.muscleGroups || []).includes('CORE') || (e.muscleGroups || []).includes('CARDIO'));

  const days: WorkoutDay[] = [];

  if (availableDays.length <= 3) {
    // Full Body routines
    availableDays.forEach((dayName, idx) => {
      const dayExercises: WorkoutExercise[] = [];
      let order = 1;

      const push = pushExercises[idx % Math.max(1, pushExercises.length)] || availablePool[0];
      const pull = pullExercises[idx % Math.max(1, pullExercises.length)] || availablePool[1 % availablePool.length];
      const leg = legExercises[idx % Math.max(1, legExercises.length)] || availablePool[2 % availablePool.length];
      const core = coreExercises[idx % Math.max(1, coreExercises.length)] || availablePool[3 % availablePool.length];

      const chosen = [push, pull, leg, core].filter(Boolean);
      const uniqueChosen = Array.from(new Set(chosen));

      uniqueChosen.forEach(ex => {
        dayExercises.push(helperBuildExercise(ex, idx + 1, order++));
      });

      days.push({
        id: `plan-day-${idx + 1}`,
        dayName: `${dayName} - Full Body Circuit`,
        focus: 'Full Body Compound Protocol',
        exercises: dayExercises
      });
    });
  } else {
    // Upper / Lower split
    availableDays.forEach((dayName, idx) => {
      const isUpper = idx % 2 === 0;
      const dayExercises: WorkoutExercise[] = [];
      let order = 1;

      if (isUpper) {
        const u1 = pushExercises[0] || availablePool[0];
        const u2 = pullExercises[0] || availablePool[1 % availablePool.length];
        const u3 = pushExercises[1] || coreExercises[0] || availablePool[2 % availablePool.length];
        const u4 = pullExercises[1] || availablePool[3 % availablePool.length];

        [u1, u2, u3, u4].filter(Boolean).forEach(ex => {
          if (!dayExercises.some(d => d.exerciseId === ex.id)) {
            dayExercises.push(helperBuildExercise(ex, idx + 1, order++));
          }
        });

        days.push({
          id: `plan-day-${idx + 1}`,
          dayName: `${dayName} - Upper Body`,
          focus: 'Chest, Back, Shoulders & Arms',
          exercises: dayExercises
        });
      } else {
        const l1 = legExercises[0] || availablePool[0];
        const l2 = legExercises[1] || availablePool[1 % availablePool.length];
        const l3 = coreExercises[0] || availablePool[2 % availablePool.length];
        const l4 = coreExercises[1] || availablePool[3 % availablePool.length];

        [l1, l2, l3, l4].filter(Boolean).forEach(ex => {
          if (!dayExercises.some(d => d.exerciseId === ex.id)) {
            dayExercises.push(helperBuildExercise(ex, idx + 1, order++));
          }
        });

        days.push({
          id: `plan-day-${idx + 1}`,
          dayName: `${dayName} - Lower Body & Core`,
          focus: 'Quads, Hamstrings, Glutes & Core Stability',
          exercises: dayExercises
        });
      }
    });
  }

  return {
    id: `plan-${Date.now()}`,
    userId: 'user',
    name: `${profile.trainingEnvironment} ${goal.replace('_', ' ')} Routine`,
    goal,
    environment: profile.trainingEnvironment,
    equipment: profile.equipment,
    createdAt: new Date().toISOString(),
    days
  };
}
