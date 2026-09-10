import {
  PerformanceClassification,
  ProgressionAction,
  ProgressionFamilyStatus,
  SessionExercisePerformance,
  ExerciseProgressionRecommendation,
  ExerciseProgressionState
} from './types';

export interface ProgressionLadderStep {
  exerciseId: string;
  name: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  tier: number;
  equipmentRequired: string[];
  environment: string[];
}

export interface ProgressionLadder {
  familyId: string;
  name: string;
  primaryMuscle: string;
  steps: ProgressionLadderStep[];
}

export const ADAPTIVE_PROGRESSION_LADDERS: Record<string, ProgressionLadder> = {
  horizontal_push: {
    familyId: 'horizontal_push',
    name: 'Horizontal Push Progression',
    primaryMuscle: 'CHEST',
    steps: [
      { exerciseId: 'wall-push-up', name: 'Wall Push-up', level: 'BEGINNER', tier: 1, equipmentRequired: ['NONE'], environment: ['HOME', 'GYM', 'OUTDOOR'] },
      { exerciseId: 'incline-push-up', name: 'Incline Push-up', level: 'BEGINNER', tier: 2, equipmentRequired: ['NONE'], environment: ['HOME', 'GYM', 'OUTDOOR'] },
      { exerciseId: 'knee-push-up', name: 'Knee Push-up', level: 'BEGINNER', tier: 3, equipmentRequired: ['NONE'], environment: ['HOME', 'GYM', 'OUTDOOR'] },
      { exerciseId: 'push-up', name: 'Standard Push-up', level: 'BEGINNER', tier: 4, equipmentRequired: ['NONE'], environment: ['HOME', 'GYM', 'OUTDOOR'] },
      { exerciseId: 'diamond-push-up', name: 'Diamond Push-up', level: 'ADVANCED', tier: 5, equipmentRequired: ['NONE'], environment: ['HOME', 'GYM', 'OUTDOOR'] }
    ]
  },
  squat: {
    familyId: 'squat',
    name: 'Squat & Lower Body Progression',
    primaryMuscle: 'LEGS',
    steps: [
      { exerciseId: 'box-squat', name: 'Box Squat', level: 'BEGINNER', tier: 1, equipmentRequired: ['NONE'], environment: ['HOME', 'GYM', 'OUTDOOR'] },
      { exerciseId: 'bodyweight-squat', name: 'Bodyweight Squat', level: 'BEGINNER', tier: 2, equipmentRequired: ['NONE'], environment: ['HOME', 'GYM', 'OUTDOOR'] },
      { exerciseId: 'walking-lunge', name: 'Walking Lunge', level: 'BEGINNER', tier: 3, equipmentRequired: ['NONE'], environment: ['HOME', 'GYM', 'OUTDOOR'] },
      { exerciseId: 'dumbbell-goblet-squat', name: 'Dumbbell Goblet Squat', level: 'INTERMEDIATE', tier: 4, equipmentRequired: ['DUMBBELLS'], environment: ['HOME', 'GYM'] },
      { exerciseId: 'barbell-squat', name: 'Barbell Squat', level: 'INTERMEDIATE', tier: 5, equipmentRequired: ['BARBELL'], environment: ['GYM'] }
    ]
  },
  pull: {
    familyId: 'pull',
    name: 'Pull & Upper Back Progression',
    primaryMuscle: 'BACK',
    steps: [
      { exerciseId: 'doorframe-inverted-row', name: 'Doorframe Inverted Row', level: 'BEGINNER', tier: 1, equipmentRequired: ['NONE'], environment: ['HOME', 'OUTDOOR'] },
      { exerciseId: 'dumbbell-row', name: 'Dumbbell Row', level: 'BEGINNER', tier: 2, equipmentRequired: ['DUMBBELLS'], environment: ['HOME', 'GYM'] },
      { exerciseId: 'cable-row', name: 'Cable Row', level: 'BEGINNER', tier: 3, equipmentRequired: ['CABLE_MACHINE'], environment: ['GYM'] }
    ]
  },
  core: {
    familyId: 'core',
    name: 'Core Stability Progression',
    primaryMuscle: 'CORE',
    steps: [
      { exerciseId: 'knee-plank', name: 'Knee Plank', level: 'BEGINNER', tier: 1, equipmentRequired: ['NONE'], environment: ['HOME', 'GYM', 'OUTDOOR'] },
      { exerciseId: 'plank', name: 'Standard Plank', level: 'BEGINNER', tier: 2, equipmentRequired: ['NONE'], environment: ['HOME', 'GYM', 'OUTDOOR'] }
    ]
  }
};

export interface UserContext {
  trainingExperience: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  equipment: string[];
  trainingEnvironment?: string;
}

export interface ProgressionEngineOptions {
  progressionWindow?: number; // default 2 consecutive sessions
  regressionWindow?: number;  // default 2 consecutive sessions
}

/**
 * Finds which progression family an exercise belongs to.
 */
export function findProgressionFamily(exerciseId: string): { ladder: ProgressionLadder; step: ProgressionLadderStep; index: number } | null {
  for (const ladder of Object.values(ADAPTIVE_PROGRESSION_LADDERS)) {
    const idx = ladder.steps.findIndex(s => s.exerciseId === exerciseId);
    if (idx !== -1) {
      return { ladder, step: ladder.steps[idx], index: idx };
    }
  }
  return null;
}

/**
 * Checks if a candidate step satisfies user hard constraints (experience, equipment, environment).
 */
export function isStepCompatible(step: ProgressionLadderStep, context: UserContext): boolean {
  // 1. Training experience hard constraint
  // Hard rule: Beginner or Intermediate must NEVER be prescribed an ADVANCED exercise under any circumstance
  if (context.trainingExperience === 'BEGINNER') {
    if (step.level === 'ADVANCED') {
      return false;
    }
  } else if (context.trainingExperience === 'INTERMEDIATE') {
    if (step.level === 'ADVANCED') {
      return false;
    }
  }

  // 2. Equipment hard constraint
  const userEquip = (context.equipment && context.equipment.length > 0) ? context.equipment : ['NONE'];
  const hasZeroEquip = userEquip.includes('NONE') && userEquip.length === 1;

  const requiresOnlyBodyweight = step.equipmentRequired.length === 0 || 
    (step.equipmentRequired.length === 1 && step.equipmentRequired[0] === 'NONE');

  if (requiresOnlyBodyweight) {
    // Bodyweight is always compatible equipment-wise
  } else {
    if (hasZeroEquip) return false;
    const ownsAll = step.equipmentRequired.every(req => req === 'NONE' || userEquip.includes(req));
    if (!ownsAll) return false;
  }

  // 3. Environment constraint
  if (context.trainingEnvironment) {
    if (!step.environment.includes(context.trainingEnvironment)) {
      return false;
    }
  }

  return true;
}

/**
 * Deterministically increases rep prescription within an exercise (progressive volume overload).
 */
export function incrementRepRange(currentReps: string = '8-12 reps'): string {
  const match = currentReps.match(/(\d+)\s*-\s*(\d+)/);
  if (match) {
    const low = parseInt(match[1], 10);
    const high = parseInt(match[2], 10);
    return `${low + 2}-${high + 2} reps`;
  }
  const single = currentReps.match(/(\d+)/);
  if (single) {
    const val = parseInt(single[1], 10);
    return `${val + 2} reps`;
  }
  return '10-14 reps';
}

/**
 * Deterministically decreases rep prescription within an exercise (volume regression).
 */
export function decrementRepRange(currentReps: string = '8-12 reps'): string {
  const match = currentReps.match(/(\d+)\s*-\s*(\d+)/);
  if (match) {
    const low = Math.max(4, parseInt(match[1], 10) - 2);
    const high = Math.max(6, parseInt(match[2], 10) - 2);
    return `${low}-${high} reps`;
  }
  const single = currentReps.match(/(\d+)/);
  if (single) {
    const val = Math.max(4, parseInt(single[1], 10) - 2);
    return `${val} reps`;
  }
  return '6-8 reps';
}

/**
 * Evaluates the user's historical performance on an exercise and deterministically
 * recommends progression, maintenance, or regression.
 */
export function evaluateExerciseProgression(
  exerciseId: string,
  exerciseName: string,
  context: UserContext,
  historySessions: SessionExercisePerformance[],
  currentPrescription: { targetSets?: number; targetReps?: string; weightKg?: number } = {},
  options: ProgressionEngineOptions = {}
): ExerciseProgressionRecommendation {
  const progressionWindow = options.progressionWindow ?? 2;
  const regressionWindow = options.regressionWindow ?? 2;

  const defaultSets = currentPrescription.targetSets ?? 3;
  const defaultReps = currentPrescription.targetReps ?? '8-12 reps';
  const defaultWeight = currentPrescription.weightKg ?? 0;

  const familyInfo = findProgressionFamily(exerciseId);
  const currentTier = familyInfo?.step.tier ?? 1;

  // 1. NO HISTORY
  if (!historySessions || historySessions.length === 0) {
    return {
      exerciseId,
      exerciseName,
      action: 'INSUFFICIENT_DATA',
      status: 'NEW',
      recommendedExerciseId: exerciseId,
      recommendedExerciseName: exerciseName,
      suggestedExerciseId: exerciseId,
      suggestedExerciseName: exerciseName,
      targetSets: defaultSets,
      targetReps: defaultReps,
      suggestedSets: defaultSets,
      suggestedReps: defaultReps,
      weightKg: defaultWeight,
      reason: 'No historical workout performance found for this exercise. Maintaining baseline prescription.',
      currentLevel: currentTier,
      consecutiveSuccessfulSessions: 0,
      consecutiveFailedSessions: 0
    };
  }

  // Count consecutive successful (TOO_EASY) and consecutive failed (FAILED / INCOMPLETE) sessions from newest backwards
  const sessions = [...historySessions];
  sessions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let consecutiveSuccessfulSessions = 0;
  let consecutiveFailedSessions = 0;

  for (let i = sessions.length - 1; i >= 0; i--) {
    const s = sessions[i];
    if (s.classification === 'TOO_EASY') {
      if (consecutiveFailedSessions === 0) {
        consecutiveSuccessfulSessions++;
      }
    } else {
      break;
    }
  }

  for (let i = sessions.length - 1; i >= 0; i--) {
    const s = sessions[i];
    if (s.classification === 'FAILED' || s.classification === 'INCOMPLETE') {
      if (consecutiveSuccessfulSessions === 0) {
        consecutiveFailedSessions++;
      }
    } else {
      break;
    }
  }

  const latestSession = sessions[sessions.length - 1];

  // 2. PROGRESS CANDIDATE: >= progressionWindow consecutive TOO_EASY sessions
  if (consecutiveSuccessfulSessions >= progressionWindow) {
    // Attempt ladder progression
    if (familyInfo) {
      const nextStepIndex = familyInfo.index + 1;
      if (nextStepIndex < familyInfo.ladder.steps.length) {
        const candidateStep = familyInfo.ladder.steps[nextStepIndex];
        const isAllowed = isStepCompatible(candidateStep, context);

        if (isAllowed) {
          return {
            exerciseId,
            exerciseName,
            action: 'PROGRESS',
            status: 'READY_TO_PROGRESS',
            recommendedExerciseId: candidateStep.exerciseId,
            recommendedExerciseName: candidateStep.name,
            suggestedExerciseId: candidateStep.exerciseId,
            suggestedExerciseName: candidateStep.name,
            targetSets: defaultSets,
            targetReps: '8-10 reps',
            suggestedSets: defaultSets,
            suggestedReps: '8-10 reps',
            weightKg: 0,
            reason: `Achieved upper performance threshold across ${consecutiveSuccessfulSessions} consecutive sessions. Advancing exercise variation from ${exerciseName} to ${candidateStep.name}.`,
            currentLevel: candidateStep.tier,
            consecutiveSuccessfulSessions,
            consecutiveFailedSessions: 0
          };
        } else {
          // Hard constraint prevents exercise jump (e.g. Beginner cannot do Advanced, or lacks equipment).
          // Deterministically progress volume (reps/sets) instead!
          const newReps = incrementRepRange(defaultReps);
          return {
            exerciseId,
            exerciseName,
            action: 'PROGRESS',
            status: 'READY_TO_PROGRESS',
            recommendedExerciseId: exerciseId,
            recommendedExerciseName: exerciseName,
            suggestedExerciseId: exerciseId,
            suggestedExerciseName: exerciseName,
            targetSets: defaultSets,
            targetReps: newReps,
            suggestedSets: defaultSets,
            suggestedReps: newReps,
            weightKg: defaultWeight,
            reason: `Achieved upper performance threshold across ${consecutiveSuccessfulSessions} consecutive sessions. Next ladder progression (${candidateStep.name}) is restricted by experience or equipment constraints, so increasing rep volume from ${defaultReps} to ${newReps}.`,
            currentLevel: currentTier,
            consecutiveSuccessfulSessions,
            consecutiveFailedSessions: 0
          };
        }
      } else {
        // Already at top of ladder: progress volume
        const newReps = incrementRepRange(defaultReps);
        return {
          exerciseId,
          exerciseName,
          action: 'PROGRESS',
          status: 'READY_TO_PROGRESS',
          recommendedExerciseId: exerciseId,
          recommendedExerciseName: exerciseName,
          suggestedExerciseId: exerciseId,
          suggestedExerciseName: exerciseName,
          targetSets: defaultSets,
          targetReps: newReps,
          suggestedSets: defaultSets,
          suggestedReps: newReps,
          weightKg: defaultWeight,
          reason: `At the highest ladder step with ${consecutiveSuccessfulSessions} consecutive high-performance sessions. Progressing volume target to ${newReps}.`,
          currentLevel: currentTier,
          consecutiveSuccessfulSessions,
          consecutiveFailedSessions: 0
        };
      }
    } else {
      // Non-ladder exercise: progress volume or weight
      const newReps = incrementRepRange(defaultReps);
      return {
        exerciseId,
        exerciseName,
        action: 'PROGRESS',
        status: 'READY_TO_PROGRESS',
        recommendedExerciseId: exerciseId,
        recommendedExerciseName: exerciseName,
        suggestedExerciseId: exerciseId,
        suggestedExerciseName: exerciseName,
        targetSets: defaultSets,
        targetReps: newReps,
        suggestedSets: defaultSets,
        suggestedReps: newReps,
        weightKg: defaultWeight > 0 ? defaultWeight + 2 : defaultWeight,
        reason: `Exceeded target performance across ${consecutiveSuccessfulSessions} sessions. Progressing volume to ${newReps}.`,
        currentLevel: currentTier,
        consecutiveSuccessfulSessions,
        consecutiveFailedSessions: 0
      };
    }
  }

  // 3. REGRESS CANDIDATE: >= regressionWindow consecutive FAILED sessions
  if (consecutiveFailedSessions >= regressionWindow) {
    if (familyInfo) {
      const prevStepIndex = familyInfo.index - 1;
      if (prevStepIndex >= 0) {
        const regressedStep = familyInfo.ladder.steps[prevStepIndex];
        return {
          exerciseId,
          exerciseName,
          action: 'REGRESS',
          status: 'NEEDS_REGRESSION',
          recommendedExerciseId: regressedStep.exerciseId,
          recommendedExerciseName: regressedStep.name,
          suggestedExerciseId: regressedStep.exerciseId,
          suggestedExerciseName: regressedStep.name,
          targetSets: defaultSets,
          targetReps: '8-12 reps',
          suggestedSets: defaultSets,
          suggestedReps: '8-12 reps',
          weightKg: 0,
          reason: `Repeated performance shortfall across ${consecutiveFailedSessions} consecutive sessions. Regressing to ${regressedStep.name} to rebuild baseline strength safely.`,
          currentLevel: regressedStep.tier,
          consecutiveSuccessfulSessions: 0,
          consecutiveFailedSessions
        };
      } else {
        // Already at entry regression step (e.g. wall push-up): reduce volume
        const reducedReps = decrementRepRange(defaultReps);
        const reducedSets = Math.max(2, defaultSets - 1);
        return {
          exerciseId,
          exerciseName,
          action: 'REGRESS',
          status: 'NEEDS_REGRESSION',
          recommendedExerciseId: exerciseId,
          recommendedExerciseName: exerciseName,
          suggestedExerciseId: exerciseId,
          suggestedExerciseName: exerciseName,
          targetSets: reducedSets,
          targetReps: reducedReps,
          suggestedSets: reducedSets,
          suggestedReps: reducedReps,
          weightKg: defaultWeight,
          reason: `Repeated shortfall on entry-level exercise across ${consecutiveFailedSessions} sessions. Reducing volume to ${reducedSets} sets of ${reducedReps} for recovery.`,
          currentLevel: currentTier,
          consecutiveSuccessfulSessions: 0,
          consecutiveFailedSessions
        };
      }
    } else {
      const reducedReps = decrementRepRange(defaultReps);
      return {
        exerciseId,
        exerciseName,
        action: 'REGRESS',
        status: 'NEEDS_REGRESSION',
        recommendedExerciseId: exerciseId,
        recommendedExerciseName: exerciseName,
        suggestedExerciseId: exerciseId,
        suggestedExerciseName: exerciseName,
        targetSets: defaultSets,
        targetReps: reducedReps,
        suggestedSets: defaultSets,
        suggestedReps: reducedReps,
        weightKg: defaultWeight > 0 ? Math.max(0, defaultWeight - 2) : 0,
        reason: `Repeated shortfall across ${consecutiveFailedSessions} sessions. Decreasing volume to ${reducedReps} to support recovery.`,
        currentLevel: currentTier,
        consecutiveSuccessfulSessions: 0,
        consecutiveFailedSessions
      };
    }
  }

  // 4. MAINTAIN CANDIDATE: performance is GOOD or CHALLENGING
  if (latestSession.classification === 'GOOD' || latestSession.classification === 'CHALLENGING') {
    return {
      exerciseId,
      exerciseName,
      action: 'MAINTAIN',
      status: 'STABLE',
      recommendedExerciseId: exerciseId,
      recommendedExerciseName: exerciseName,
      suggestedExerciseId: exerciseId,
      suggestedExerciseName: exerciseName,
      targetSets: defaultSets,
      targetReps: defaultReps,
      suggestedSets: defaultSets,
      suggestedReps: defaultReps,
      weightKg: defaultWeight,
      reason: `Performance is well-calibrated within target adaptation range (${latestSession.classification}). Maintaining current prescription.`,
      currentLevel: currentTier,
      consecutiveSuccessfulSessions,
      consecutiveFailedSessions: 0
    };
  }

  // 5. REPEAT CANDIDATE: single successful session, or single failed session, or developing
  return {
    exerciseId,
    exerciseName,
    action: 'REPEAT',
    status: 'DEVELOPING',
    recommendedExerciseId: exerciseId,
    recommendedExerciseName: exerciseName,
    suggestedExerciseId: exerciseId,
    suggestedExerciseName: exerciseName,
    targetSets: defaultSets,
    targetReps: defaultReps,
    suggestedSets: defaultSets,
    suggestedReps: defaultReps,
    weightKg: defaultWeight,
    reason: consecutiveSuccessfulSessions === 1 
      ? 'One successful session completed. Progression requires repeated consistency across 2 consecutive sessions.'
      : 'Session performance developing. Repeating current prescription to solidify movement mastery.',
    currentLevel: currentTier,
    consecutiveSuccessfulSessions,
    consecutiveFailedSessions
  };
}

/**
 * Derives the current progression state for a family deterministically from history.
 */
export function deriveProgressionState(
  familyId: string,
  context: UserContext,
  historySessions: SessionExercisePerformance[]
): ExerciseProgressionState {
  const ladder = ADAPTIVE_PROGRESSION_LADDERS[familyId];
  if (!ladder) {
    return {
      exerciseFamily: familyId,
      currentExercise: 'unknown',
      currentLevel: 1,
      status: 'NEW',
      consecutiveSuccessfulSessions: 0
    };
  }

  // Filter history relevant to exercises in this family
  const familyExerciseIds = new Set(ladder.steps.map(s => s.exerciseId));
  const relevantSessions = historySessions.filter(s => familyExerciseIds.has(s.exerciseId));

  if (relevantSessions.length === 0) {
    // Determine the default starting exercise for user level
    const defaultStep = ladder.steps.find(s => isStepCompatible(s, context)) || ladder.steps[0];
    return {
      exerciseFamily: familyId,
      currentExercise: defaultStep.exerciseId,
      currentLevel: defaultStep.tier,
      status: 'NEW',
      consecutiveSuccessfulSessions: 0,
      recentSessions: []
    };
  }

  // Find the most recently performed exercise in this family
  relevantSessions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const lastSession = relevantSessions[relevantSessions.length - 1];
  const lastExerciseId = lastSession.exerciseId;
  const currentStep = ladder.steps.find(s => s.exerciseId === lastExerciseId) || ladder.steps[0];

  const exerciseSessions = relevantSessions.filter(s => s.exerciseId === lastExerciseId);
  const recommendation = evaluateExerciseProgression(
    currentStep.exerciseId,
    currentStep.name,
    context,
    exerciseSessions
  );

  return {
    exerciseFamily: familyId,
    currentExercise: currentStep.exerciseId,
    currentLevel: currentStep.tier,
    status: recommendation.status,
    consecutiveSuccessfulSessions: recommendation.consecutiveSuccessfulSessions,
    recentSessions: exerciseSessions.slice(-5),
    recommendation
  };
}
