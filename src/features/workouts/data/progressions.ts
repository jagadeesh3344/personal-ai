import { TrainingExperience } from '../../../types/profile';

export interface ExerciseProgressionStep {
  exerciseId: string;
  level: TrainingExperience;
  tier: number; // 1 = entry regression, 2 = standard, 3 = advanced
  name: string;
}

export interface ExerciseProgressionLadder {
  patternId: string;
  name: string;
  primaryMuscle: string;
  steps: ExerciseProgressionStep[];
}

export const PROGRESSION_LADDERS: Record<string, ExerciseProgressionLadder> = {
  push: {
    patternId: 'push',
    name: 'Horizontal Push Progression',
    primaryMuscle: 'CHEST',
    steps: [
      { exerciseId: 'wall-push-up', level: 'BEGINNER', tier: 1, name: 'Wall Push-up' },
      { exerciseId: 'incline-push-up', level: 'BEGINNER', tier: 2, name: 'Incline Push-up' },
      { exerciseId: 'knee-push-up', level: 'BEGINNER', tier: 3, name: 'Knee Push-up' },
      { exerciseId: 'push-up', level: 'INTERMEDIATE', tier: 4, name: 'Standard Push-up' },
      { exerciseId: 'diamond-push-up', level: 'ADVANCED', tier: 5, name: 'Diamond Push-up' },
      { exerciseId: 'pike-push-up', level: 'ADVANCED', tier: 6, name: 'Pike Push-up' }
    ]
  },
  squat: {
    patternId: 'squat',
    name: 'Squat & Lower Body Progression',
    primaryMuscle: 'LEGS',
    steps: [
      { exerciseId: 'box-squat', level: 'BEGINNER', tier: 1, name: 'Box Squat' },
      { exerciseId: 'bodyweight-squat', level: 'BEGINNER', tier: 2, name: 'Bodyweight Squat' },
      { exerciseId: 'dumbbell-goblet-squat', level: 'INTERMEDIATE', tier: 3, name: 'Dumbbell Goblet Squat' },
      { exerciseId: 'walking-lunge', level: 'INTERMEDIATE', tier: 4, name: 'Walking Lunge' },
      { exerciseId: 'jump-squats', level: 'ADVANCED', tier: 5, name: 'Jump Squat' }
    ]
  },
  pull: {
    patternId: 'pull',
    name: 'Vertical & Horizontal Pull Progression',
    primaryMuscle: 'BACK',
    steps: [
      { exerciseId: 'doorframe-inverted-row', level: 'BEGINNER', tier: 1, name: 'Doorframe Inverted Row' },
      { exerciseId: 'dumbbell-row', level: 'BEGINNER', tier: 2, name: 'Dumbbell Row' },
      { exerciseId: 'pullup', level: 'ADVANCED', tier: 3, name: 'Pull-up' }
    ]
  },
  core: {
    patternId: 'core',
    name: 'Core Stability & Anti-Extension Progression',
    primaryMuscle: 'CORE',
    steps: [
      { exerciseId: 'knee-plank', level: 'BEGINNER', tier: 1, name: 'Knee Plank' },
      { exerciseId: 'plank', level: 'INTERMEDIATE', tier: 2, name: 'Forearm Plank' },
      { exerciseId: 'mountain-climbers', level: 'INTERMEDIATE', tier: 3, name: 'Mountain Climbers' }
    ]
  }
};

export const PROGRESSION_TREES = PROGRESSION_LADDERS;

export interface ProgressionResult {
  id: string;
  exerciseId: string;
  name: string;
  level: TrainingExperience;
  tier: number;
}

/**
 * Resolves the appropriate exercise from a movement pattern based on user's training experience.
 */
export function getAppropriateProgression(
  patternId: string,
  userLevel: TrainingExperience = 'BEGINNER'
): ProgressionResult {
  const norm = patternId.toLowerCase();
  const key = norm.includes('push') ? 'push'
    : norm.includes('squat') ? 'squat'
    : norm.includes('pull') ? 'pull'
    : norm.includes('core') ? 'core'
    : norm;

  const ladder = PROGRESSION_LADDERS[key] || PROGRESSION_LADDERS['push'];
  const matches = ladder.steps.filter(s => s.level === userLevel);
  const chosen = matches.length > 0 ? matches[0] : ladder.steps[0];

  return {
    id: chosen.exerciseId,
    exerciseId: chosen.exerciseId,
    name: chosen.name,
    level: chosen.level,
    tier: chosen.tier
  };
}

/**
 * Finds regression and progression exercise IDs for a given exercise.
 */
export function getProgressionNeighbors(exerciseId: string): {
  regressionId?: string;
  progressionId?: string;
  regressions: string[];
  progressions: string[];
} {
  for (const ladder of Object.values(PROGRESSION_LADDERS)) {
    const idx = ladder.steps.findIndex(s => s.exerciseId === exerciseId);
    if (idx !== -1) {
      return {
        regressionId: idx > 0 ? ladder.steps[idx - 1].exerciseId : undefined,
        progressionId: idx < ladder.steps.length - 1 ? ladder.steps[idx + 1].exerciseId : undefined,
        regressions: ladder.steps.slice(0, idx).map(s => s.exerciseId),
        progressions: ladder.steps.slice(idx + 1).map(s => s.exerciseId)
      };
    }
  }
  return { regressions: [], progressions: [] };
}
