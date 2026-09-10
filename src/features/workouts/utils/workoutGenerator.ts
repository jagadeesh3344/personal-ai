import { UserProfile } from '../../../types/profile';
import { EXERCISES, Exercise } from '../data/exercises';
import { getAvailableExercises } from './equipmentFilter';
import { WorkoutPlan, WorkoutDay, WorkoutExercise, WorkoutSet } from '../../../types';
import { evaluateExerciseProgression } from '../adaptive/progressionEngine';
import { aggregateExerciseSessions } from '../adaptive/performanceAnalyzer';
import { ExerciseHistoryItem } from '../adaptive/types';

export function generateWorkout(profile: UserProfile): WorkoutPlan {
  const rawPool = getAvailableExercises(profile, EXERCISES);
  const experience = profile.trainingExperience || 'BEGINNER';

  // Strict experience gating:
  // - BEGINNER: Only BEGINNER difficulty exercises. No intermediate/advanced variations (no Diamond Push-up).
  // - INTERMEDIATE: BEGINNER and INTERMEDIATE difficulty exercises.
  // - ADVANCED: All difficulties unlocked.
  const availablePool = rawPool.filter(ex => {
    if (experience === 'BEGINNER') {
      return ex.difficulty === 'BEGINNER';
    }
    if (experience === 'INTERMEDIATE') {
      return ex.difficulty === 'BEGINNER' || ex.difficulty === 'INTERMEDIATE';
    }
    return true;
  });
  const availableDays = (profile.availableWorkoutDays && profile.availableWorkoutDays.length > 0)
    ? profile.availableWorkoutDays
    : ['MON', 'WED', 'FRI'];

  let targetReps = '10-12 reps';
  let restSeconds = 60;
  let targetSets = experience === 'BEGINNER' ? 3 : 4;
  const goal = profile.goal;

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

    const isPlankOrCardio = exDef.name.toLowerCase().includes('plank') || 
      exDef.name.toLowerCase().includes('climber') || 
      targetReps.toLowerCase().includes('sec');
    const isBand = exDef.equipmentRequired.includes('RESISTANCE_BANDS') || exDef.name.toLowerCase().includes('band');

    const trackingType = exDef.trackingType || (
      isPlankOrCardio ? 'TIME_SECONDS' :
      isBand ? 'REPS_RESISTANCE' :
      isBodyweight ? 'REPS_ONLY' : 'WEIGHT_AND_REPS'
    );

    const sets: WorkoutSet[] = Array.from({ length: targetSets }).map((_, setIdx) => ({
      id: `set-${exDef.id}-d${dayIndex}-s${setIdx + 1}`,
      setNumber: setIdx + 1,
      weightKg: isBodyweight || isPlankOrCardio ? 0 : initialWeight,
      reps: isPlankOrCardio ? 0 : (parseInt(targetReps, 10) || 10),
      durationSeconds: isPlankOrCardio ? (parseInt(targetReps, 10) || 45) : undefined,
      resistanceLevel: isBand ? 'Medium' : undefined,
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
      trackingType,
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

/**
 * Deterministically generates an adaptive workout plan considering user profile + historical performance.
 */
export function generateAdaptiveWorkout(
  profile: UserProfile,
  historyItems: ExerciseHistoryItem[] = []
): WorkoutPlan {
  const basePlan = generateWorkout(profile);
  if (!historyItems || historyItems.length === 0) {
    return basePlan;
  }

  const sessionPerformances = aggregateExerciseSessions(historyItems);
  const userContext = {
    trainingExperience: profile.trainingExperience || 'BEGINNER',
    equipment: profile.equipment || ['NONE'],
    trainingEnvironment: profile.trainingEnvironment || 'HOME'
  };

  const adaptedDays: WorkoutDay[] = basePlan.days.map((day, dayIdx) => {
    const adaptedExercises: WorkoutExercise[] = day.exercises.map((ex, exIdx) => {
      const exHistory = sessionPerformances.filter(sp => sp.exerciseId === ex.exerciseId);
      const recommendation = evaluateExerciseProgression(
        ex.exerciseId,
        ex.name,
        userContext,
        exHistory,
        { targetSets: ex.targetSets, targetReps: ex.targetReps }
      );

      let chosenDef = EXERCISES.find(e => e.id === recommendation.recommendedExerciseId);
      if (!chosenDef) {
        chosenDef = EXERCISES.find(e => e.id === ex.exerciseId);
      }

      const targetSets = recommendation.targetSets;
      const targetReps = recommendation.targetReps;
      const isBodyweight = chosenDef ? (chosenDef.equipmentRequired.length === 0 || 
        (chosenDef.equipmentRequired.length === 1 && chosenDef.equipmentRequired[0] === 'NONE')) : true;

      const updatedSets: WorkoutSet[] = Array.from({ length: targetSets }).map((_, setIdx) => ({
        id: `set-${chosenDef?.id || ex.exerciseId}-d${dayIdx + 1}-s${setIdx + 1}`,
        setNumber: setIdx + 1,
        weightKg: isBodyweight ? 0 : 12,
        reps: parseInt(targetReps, 10) || 10,
        completed: false
      }));

      return {
        ...ex,
        exerciseId: chosenDef ? chosenDef.id : ex.exerciseId,
        name: chosenDef ? chosenDef.name : ex.name,
        targetSets,
        targetReps,
        notes: recommendation.reason,
        progression: {
          action: recommendation.action,
          status: recommendation.status,
          reason: recommendation.reason,
          currentLevel: recommendation.currentLevel,
          consecutiveSuccessfulSessions: recommendation.consecutiveSuccessfulSessions,
          consecutiveFailedSessions: recommendation.consecutiveFailedSessions
        },
        sets: updatedSets
      };
    });

    return {
      ...day,
      exercises: adaptedExercises
    };
  });

  return {
    ...basePlan,
    name: `Adaptive ${basePlan.name}`,
    days: adaptedDays
  };
}

