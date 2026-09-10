import { describe, it, expect } from 'vitest';
import {
  classifySessionPerformance,
  aggregateExerciseSessions,
  parseTargetReps
} from '../src/features/workouts/adaptive/performanceAnalyzer';
import {
  evaluateExerciseProgression,
  deriveProgressionState,
  isStepCompatible,
  ADAPTIVE_PROGRESSION_LADDERS
} from '../src/features/workouts/adaptive/progressionEngine';
import { generateAdaptiveWorkout } from '../src/features/workouts/utils/workoutGenerator';
import { ExerciseHistoryItem } from '../src/features/workouts/adaptive/types';
import { UserProfile } from '../src/types/profile';

describe('Deterministic Adaptive Workout & Progression Engine', () => {
  const beginnerNoEquipProfile: UserProfile = {
    name: 'Beginner Athlete',
    age: 25,
    gender: 'MALE',
    weightKg: 70,
    heightCm: 175,
    goal: 'GENERAL_FITNESS',
    activityLevel: 'SEDENTARY',
    trainingExperience: 'BEGINNER',
    equipment: ['NONE'],
    trainingEnvironment: 'HOME',
    workoutFrequency: 3,
    targetWeightKg: 70,
    availableWorkoutDays: ['MON', 'WED', 'FRI']
  };

  const intermediateEquipProfile: UserProfile = {
    name: 'Intermediate Lifter',
    age: 28,
    gender: 'FEMALE',
    weightKg: 65,
    heightCm: 168,
    goal: 'GAIN_MUSCLE',
    activityLevel: 'MODERATE',
    trainingExperience: 'INTERMEDIATE',
    equipment: ['DUMBBELLS', 'BENCH'],
    trainingEnvironment: 'HOME',
    workoutFrequency: 3,
    targetWeightKg: 65,
    availableWorkoutDays: ['MON', 'WED', 'FRI']
  };

  // Helper to create mock set items
  function createSet(
    sessionId: string,
    date: string,
    exerciseId: string,
    setNumber: number,
    reps: number,
    completed: boolean = true,
    method: 'CAMERA' | 'VOICE' | 'MANUAL' = 'CAMERA',
    verification: 'VERIFIED' | 'SELF_REPORTED' = 'VERIFIED',
    rpe?: number
  ): ExerciseHistoryItem {
    return {
      sessionId,
      date,
      exerciseId,
      exerciseName: exerciseId,
      setNumber,
      targetReps: '8-12 reps',
      actualReps: reps,
      weightKg: 0,
      completed,
      completionMethod: method,
      verification,
      rpe
    };
  }

  // 1. No history -> current beginner-safe exercise
  it('Scenario 1: No history -> maintains current beginner-safe exercise prescription', () => {
    const recommendation = evaluateExerciseProgression(
      'knee-push-up',
      'Knee Push-up',
      { trainingExperience: 'BEGINNER', equipment: ['NONE'] },
      []
    );

    expect(recommendation.action).toBe('INSUFFICIENT_DATA');
    expect(recommendation.status).toBe('NEW');
    expect(recommendation.recommendedExerciseId).toBe('knee-push-up');
    expect(recommendation.targetSets).toBe(3);
    expect(recommendation.consecutiveSuccessfulSessions).toBe(0);

    const workout = generateAdaptiveWorkout(beginnerNoEquipProfile, []);
    const pushExercise = workout.days[0].exercises.find(e => e.muscleGroups.includes('CHEST'));
    expect(pushExercise).toBeDefined();
    // Beginner gets beginner-level pushup (e.g. wall, incline, or knee)
    expect(['wall-push-up', 'incline-push-up', 'knee-push-up']).toContain(pushExercise!.exerciseId);
  });

  // 2. One successful session -> does NOT immediately cause aggressive progression
  it('Scenario 2: One successful session -> does NOT immediately cause aggressive progression (action REPEAT, not PROGRESS)', () => {
    const singleSessionSets = [
      createSet('s1', '2026-09-01', 'knee-push-up', 1, 12, true),
      createSet('s1', '2026-09-01', 'knee-push-up', 2, 12, true),
      createSet('s1', '2026-09-01', 'knee-push-up', 3, 12, true)
    ];
    const sessions = aggregateExerciseSessions(singleSessionSets, 'knee-push-up');
    expect(sessions.length).toBe(1);
    expect(sessions[0].classification).toBe('TOO_EASY');

    const recommendation = evaluateExerciseProgression(
      'knee-push-up',
      'Knee Push-up',
      { trainingExperience: 'BEGINNER', equipment: ['NONE'] },
      sessions,
      { targetSets: 3, targetReps: '8-12 reps' }
    );

    expect(recommendation.action).toBe('REPEAT');
    expect(recommendation.status).toBe('DEVELOPING');
    expect(recommendation.recommendedExerciseId).toBe('knee-push-up'); // Stays on knee push-up
    expect(recommendation.consecutiveSuccessfulSessions).toBe(1);
    expect(recommendation.reason).toContain('Progression requires repeated consistency across 2 consecutive sessions');
  });

  // 3. Repeated successful sessions -> progression occurs
  it('Scenario 3: Repeated successful sessions (>= 2 consecutive) -> progression occurs', () => {
    const multiSessionSets = [
      createSet('s1', '2026-09-01', 'knee-push-up', 1, 12),
      createSet('s1', '2026-09-01', 'knee-push-up', 2, 12),
      createSet('s1', '2026-09-01', 'knee-push-up', 3, 12),
      createSet('s2', '2026-09-03', 'knee-push-up', 1, 12),
      createSet('s2', '2026-09-03', 'knee-push-up', 2, 12),
      createSet('s2', '2026-09-03', 'knee-push-up', 3, 12)
    ];
    const sessions = aggregateExerciseSessions(multiSessionSets, 'knee-push-up');
    expect(sessions.length).toBe(2);
    expect(sessions[0].classification).toBe('TOO_EASY');
    expect(sessions[1].classification).toBe('TOO_EASY');

    const recommendation = evaluateExerciseProgression(
      'knee-push-up',
      'Knee Push-up',
      { trainingExperience: 'BEGINNER', equipment: ['NONE'] },
      sessions,
      { targetSets: 3, targetReps: '8-12 reps' }
    );

    expect(recommendation.action).toBe('PROGRESS');
    expect(recommendation.status).toBe('READY_TO_PROGRESS');
    expect(recommendation.consecutiveSuccessfulSessions).toBe(2);
    // Knee push-up progresses to Standard push-up
    expect(recommendation.recommendedExerciseId).toBe('push-up');
    expect(recommendation.recommendedExerciseName).toBe('Standard Push-up');
  });

  // 4. Repeated poor performance -> regression / volume reduction
  it('Scenario 4: Repeated poor performance (>= 2 consecutive failed) -> regression occurs', () => {
    const failedSessionsSets = [
      createSet('s1', '2026-09-01', 'knee-push-up', 1, 4), // Well below min of 8
      createSet('s1', '2026-09-01', 'knee-push-up', 2, 3),
      createSet('s1', '2026-09-01', 'knee-push-up', 3, 2),
      createSet('s2', '2026-09-03', 'knee-push-up', 1, 4),
      createSet('s2', '2026-09-03', 'knee-push-up', 2, 3),
      createSet('s2', '2026-09-03', 'knee-push-up', 3, 3)
    ];
    const sessions = aggregateExerciseSessions(failedSessionsSets, 'knee-push-up');
    expect(sessions.length).toBe(2);
    expect(sessions[0].classification).toBe('FAILED');
    expect(sessions[1].classification).toBe('FAILED');

    const recommendation = evaluateExerciseProgression(
      'knee-push-up',
      'Knee Push-up',
      { trainingExperience: 'BEGINNER', equipment: ['NONE'] },
      sessions
    );

    expect(recommendation.action).toBe('REGRESS');
    expect(recommendation.status).toBe('NEEDS_REGRESSION');
    expect(recommendation.consecutiveFailedSessions).toBe(2);
    // Knee push-up regresses to Incline Push-up
    expect(recommendation.recommendedExerciseId).toBe('incline-push-up');
    expect(recommendation.recommendedExerciseName).toBe('Incline Push-up');
  });

  // 5. Performance within target -> maintain
  it('Scenario 5: Performance within target range -> MAINTAIN prescription', () => {
    const goodSessionsSets = [
      createSet('s1', '2026-09-01', 'knee-push-up', 1, 9),
      createSet('s1', '2026-09-01', 'knee-push-up', 2, 9),
      createSet('s1', '2026-09-01', 'knee-push-up', 3, 8),
      createSet('s2', '2026-09-03', 'knee-push-up', 1, 10),
      createSet('s2', '2026-09-03', 'knee-push-up', 2, 9),
      createSet('s2', '2026-09-03', 'knee-push-up', 3, 9)
    ];
    const sessions = aggregateExerciseSessions(goodSessionsSets, 'knee-push-up');
    expect(sessions[0].classification).toBe('GOOD');

    const recommendation = evaluateExerciseProgression(
      'knee-push-up',
      'Knee Push-up',
      { trainingExperience: 'BEGINNER', equipment: ['NONE'] },
      sessions
    );

    expect(recommendation.action).toBe('MAINTAIN');
    expect(recommendation.status).toBe('STABLE');
    expect(recommendation.recommendedExerciseId).toBe('knee-push-up');
  });

  // 6. Incomplete workout -> does not count as a successful progression session
  it('Scenario 6: Incomplete workout -> classified as INCOMPLETE and does not count as successful progression', () => {
    // Only 1 set completed out of 3 prescribed
    const incompleteSets = [
      createSet('s1', '2026-09-01', 'knee-push-up', 1, 12, true)
    ];
    const sessions = aggregateExerciseSessions(incompleteSets, 'knee-push-up', 3);
    expect(sessions[0].classification).toBe('INCOMPLETE');

    const recommendation = evaluateExerciseProgression(
      'knee-push-up',
      'Knee Push-up',
      { trainingExperience: 'BEGINNER', equipment: ['NONE'] },
      sessions
    );

    expect(recommendation.action).not.toBe('PROGRESS');
    expect(recommendation.consecutiveSuccessfulSessions).toBe(0);
  });

  // 7. Manual/voice SELF_REPORTED data -> accepted as historical performance but remains SELF_REPORTED
  it('Scenario 7: Manual/voice SELF_REPORTED data is accepted as historical performance with SELF_REPORTED verification', () => {
    const voiceSets = [
      createSet('s1', '2026-09-01', 'knee-push-up', 1, 10, true, 'VOICE', 'SELF_REPORTED'),
      createSet('s1', '2026-09-01', 'knee-push-up', 2, 10, true, 'VOICE', 'SELF_REPORTED'),
      createSet('s1', '2026-09-01', 'knee-push-up', 3, 10, true, 'VOICE', 'SELF_REPORTED')
    ];
    const sessions = aggregateExerciseSessions(voiceSets, 'knee-push-up');
    expect(sessions[0].hasVerifiedSets).toBe(false);
    expect(sessions[0].classification).toBe('GOOD');
  });

  // 8. CAMERA + VERIFIED -> recognized as verified historical performance
  it('Scenario 8: CAMERA + VERIFIED sets are recognized as verified historical performance', () => {
    const cameraSets = [
      createSet('s1', '2026-09-01', 'knee-push-up', 1, 12, true, 'CAMERA', 'VERIFIED'),
      createSet('s1', '2026-09-01', 'knee-push-up', 2, 12, true, 'CAMERA', 'VERIFIED'),
      createSet('s1', '2026-09-01', 'knee-push-up', 3, 12, true, 'CAMERA', 'VERIFIED')
    ];
    const sessions = aggregateExerciseSessions(cameraSets, 'knee-push-up');
    expect(sessions[0].hasVerifiedSets).toBe(true);
    expect(sessions[0].classification).toBe('TOO_EASY');
  });

  // 9. Beginner -> never progresses to advanced exercise
  it('Scenario 9: Beginner -> NEVER progresses to an ADVANCED exercise (e.g. Diamond Push-up), progresses volume instead', () => {
    // User is performing standard push-up (tier 4). Next tier in ladder is Diamond Push-up (ADVANCED).
    const pushupSuccessSets = [
      createSet('s1', '2026-09-01', 'push-up', 1, 12),
      createSet('s1', '2026-09-01', 'push-up', 2, 12),
      createSet('s1', '2026-09-01', 'push-up', 3, 12),
      createSet('s2', '2026-09-03', 'push-up', 1, 12),
      createSet('s2', '2026-09-03', 'push-up', 2, 12),
      createSet('s2', '2026-09-03', 'push-up', 3, 12)
    ];
    const sessions = aggregateExerciseSessions(pushupSuccessSets, 'push-up');

    const recommendation = evaluateExerciseProgression(
      'push-up',
      'Standard Push-up',
      { trainingExperience: 'BEGINNER', equipment: ['NONE'] },
      sessions,
      { targetSets: 3, targetReps: '10-12 reps' }
    );

    // Hard constraint check: must NOT give diamond-push-up
    expect(recommendation.recommendedExerciseId).not.toBe('diamond-push-up');
    // Must progress volume/reps safely
    expect(recommendation.action).toBe('PROGRESS');
    expect(recommendation.recommendedExerciseId).toBe('push-up');
    expect(recommendation.targetReps).toBe('12-14 reps');
    expect(recommendation.reason).toContain('restricted by experience or equipment constraints');
  });

  // 10. No equipment -> never progresses to equipment-dependent exercise
  it('Scenario 10: No equipment -> never progresses to equipment-dependent exercise (e.g. Dumbbell Goblet Squat)', () => {
    // Walking lunge is tier 3. Next tier is dumbbell-goblet-squat (requires DUMBBELLS).
    const lungeSuccessSets = [
      createSet('s1', '2026-09-01', 'walking-lunge', 1, 12),
      createSet('s1', '2026-09-01', 'walking-lunge', 2, 12),
      createSet('s1', '2026-09-01', 'walking-lunge', 3, 12),
      createSet('s2', '2026-09-03', 'walking-lunge', 1, 12),
      createSet('s2', '2026-09-03', 'walking-lunge', 2, 12),
      createSet('s2', '2026-09-03', 'walking-lunge', 3, 12)
    ];
    const sessions = aggregateExerciseSessions(lungeSuccessSets, 'walking-lunge');

    const recommendation = evaluateExerciseProgression(
      'walking-lunge',
      'Walking Lunge',
      { trainingExperience: 'INTERMEDIATE', equipment: ['NONE'] }, // No equipment
      sessions,
      { targetSets: 3, targetReps: '10-12 reps' }
    );

    expect(recommendation.recommendedExerciseId).not.toBe('dumbbell-goblet-squat');
    expect(recommendation.recommendedExerciseId).not.toBe('barbell-squat');
    // Overloads reps/volume instead
    expect(recommendation.targetReps).toBe('12-14 reps');
  });

  // 11. Equipment available -> equipment-dependent progression can be considered
  it('Scenario 11: Equipment available -> equipment-dependent progression CAN be considered', () => {
    const lungeSuccessSets = [
      createSet('s1', '2026-09-01', 'walking-lunge', 1, 12),
      createSet('s1', '2026-09-01', 'walking-lunge', 2, 12),
      createSet('s1', '2026-09-01', 'walking-lunge', 3, 12),
      createSet('s2', '2026-09-03', 'walking-lunge', 1, 12),
      createSet('s2', '2026-09-03', 'walking-lunge', 2, 12),
      createSet('s2', '2026-09-03', 'walking-lunge', 3, 12)
    ];
    const sessions = aggregateExerciseSessions(lungeSuccessSets, 'walking-lunge');

    const recommendation = evaluateExerciseProgression(
      'walking-lunge',
      'Walking Lunge',
      { trainingExperience: 'INTERMEDIATE', equipment: ['DUMBBELLS'] }, // Owns dumbbells
      sessions
    );

    expect(recommendation.action).toBe('PROGRESS');
    expect(recommendation.recommendedExerciseId).toBe('dumbbell-goblet-squat');
  });

  // 12. Different users -> history is isolated
  it('Scenario 12: Different users -> history is isolated (tested through data segregation)', () => {
    const userASets = [
      createSet('s1', '2026-09-01', 'knee-push-up', 1, 12),
      createSet('s1', '2026-09-01', 'knee-push-up', 2, 12),
      createSet('s1', '2026-09-01', 'knee-push-up', 3, 12),
      createSet('s2', '2026-09-03', 'knee-push-up', 1, 12),
      createSet('s2', '2026-09-03', 'knee-push-up', 2, 12),
      createSet('s2', '2026-09-03', 'knee-push-up', 3, 12)
    ];
    const userBSets: ExerciseHistoryItem[] = []; // User B has no history

    const recUserA = evaluateExerciseProgression(
      'knee-push-up',
      'Knee Push-up',
      { trainingExperience: 'BEGINNER', equipment: ['NONE'] },
      aggregateExerciseSessions(userASets, 'knee-push-up')
    );
    const recUserB = evaluateExerciseProgression(
      'knee-push-up',
      'Knee Push-up',
      { trainingExperience: 'BEGINNER', equipment: ['NONE'] },
      aggregateExerciseSessions(userBSets, 'knee-push-up')
    );

    expect(recUserA.action).toBe('PROGRESS');
    expect(recUserA.recommendedExerciseId).toBe('push-up');

    expect(recUserB.action).toBe('INSUFFICIENT_DATA');
    expect(recUserB.recommendedExerciseId).toBe('knee-push-up');
  });

  // 13. Same profile + same history -> deterministic identical output
  it('Scenario 13: Same profile + same history -> deterministic identical output across multiple runs', () => {
    const history = [
      createSet('s1', '2026-09-01', 'box-squat', 1, 12),
      createSet('s1', '2026-09-01', 'box-squat', 2, 12),
      createSet('s1', '2026-09-01', 'box-squat', 3, 12),
      createSet('s2', '2026-09-03', 'box-squat', 1, 12),
      createSet('s2', '2026-09-03', 'box-squat', 2, 12),
      createSet('s2', '2026-09-03', 'box-squat', 3, 12)
    ];

    const run1 = generateAdaptiveWorkout(beginnerNoEquipProfile, history);
    const run2 = generateAdaptiveWorkout(beginnerNoEquipProfile, history);

    // Deep equality of generated workout structure
    expect(run1.days.length).toEqual(run2.days.length);
    run1.days.forEach((day, idx) => {
      expect(day.exercises.map(e => e.exerciseId)).toEqual(run2.days[idx].exercises.map(e => e.exerciseId));
      expect(day.exercises.map(e => e.targetReps)).toEqual(run2.days[idx].exercises.map(e => e.targetReps));
      expect(day.exercises.map(e => e.targetSets)).toEqual(run2.days[idx].exercises.map(e => e.targetSets));
    });
  });

  // 14. Zero / invalid sets -> never contribute toward successful progression
  it('Scenario 14: Zero/invalid sets -> never contribute toward successful progression', () => {
    const zeroSets = [
      createSet('s1', '2026-09-01', 'knee-push-up', 1, 0, false),
      createSet('s1', '2026-09-01', 'knee-push-up', 2, 0, false),
      createSet('s1', '2026-09-01', 'knee-push-up', 3, 0, false),
      createSet('s2', '2026-09-03', 'knee-push-up', 1, 0, false),
      createSet('s2', '2026-09-03', 'knee-push-up', 2, 0, false),
      createSet('s2', '2026-09-03', 'knee-push-up', 3, 0, false)
    ];
    const sessions = aggregateExerciseSessions(zeroSets, 'knee-push-up');
    expect(sessions.every(s => s.classification === 'INCOMPLETE')).toBe(true);

    const recommendation = evaluateExerciseProgression(
      'knee-push-up',
      'Knee Push-up',
      { trainingExperience: 'BEGINNER', equipment: ['NONE'] },
      sessions
    );

    expect(recommendation.action).not.toBe('PROGRESS');
    expect(recommendation.consecutiveSuccessfulSessions).toBe(0);
  });

  // 15. Exercise progression ladder -> moves only to the valid next progression step
  it('Scenario 15: Exercise progression ladder moves only to the valid next step (Wall -> Incline -> Knee -> Standard)', () => {
    // Wall Push-up moves to Incline Push-up
    const wallSets = [
      createSet('s1', '2026-09-01', 'wall-push-up', 1, 15),
      createSet('s1', '2026-09-01', 'wall-push-up', 2, 15),
      createSet('s1', '2026-09-01', 'wall-push-up', 3, 15),
      createSet('s2', '2026-09-03', 'wall-push-up', 1, 15),
      createSet('s2', '2026-09-03', 'wall-push-up', 2, 15),
      createSet('s2', '2026-09-03', 'wall-push-up', 3, 15)
    ];
    const recWall = evaluateExerciseProgression(
      'wall-push-up',
      'Wall Push-up',
      { trainingExperience: 'BEGINNER', equipment: ['NONE'] },
      aggregateExerciseSessions(wallSets, 'wall-push-up')
    );
    expect(recWall.recommendedExerciseId).toBe('incline-push-up');

    // Incline Push-up moves to Knee Push-up
    const inclineSets = [
      createSet('s1', '2026-09-01', 'incline-push-up', 1, 12),
      createSet('s1', '2026-09-01', 'incline-push-up', 2, 12),
      createSet('s1', '2026-09-01', 'incline-push-up', 3, 12),
      createSet('s2', '2026-09-03', 'incline-push-up', 1, 12),
      createSet('s2', '2026-09-03', 'incline-push-up', 2, 12),
      createSet('s2', '2026-09-03', 'incline-push-up', 3, 12)
    ];
    const recIncline = evaluateExerciseProgression(
      'incline-push-up',
      'Incline Push-up',
      { trainingExperience: 'BEGINNER', equipment: ['NONE'] },
      aggregateExerciseSessions(inclineSets, 'incline-push-up')
    );
    expect(recIncline.recommendedExerciseId).toBe('knee-push-up');

    // Progression Family State check
    const state = deriveProgressionState(
      'horizontal_push',
      { trainingExperience: 'BEGINNER', equipment: ['NONE'] },
      aggregateExerciseSessions(inclineSets, 'incline-push-up')
    );
    expect(state.exerciseFamily).toBe('horizontal_push');
    expect(state.currentExercise).toBe('incline-push-up');
    expect(state.currentLevel).toBe(2);
    expect(state.status).toBe('READY_TO_PROGRESS');
    expect(state.consecutiveSuccessfulSessions).toBe(2);
  });
});
