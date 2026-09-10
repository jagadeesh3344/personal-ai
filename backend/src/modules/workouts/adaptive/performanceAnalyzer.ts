import { 
  ExerciseHistoryItem, 
  PerformanceClassification, 
  SessionExercisePerformance 
} from './types.js';

export interface TargetRepRange {
  min: number;
  max: number;
  isTimed: boolean;
}

/**
 * Deterministically parses target reps string into min/max thresholds.
 * Examples:
 * - "8-12 reps" -> { min: 8, max: 12, isTimed: false }
 * - "10-15 reps" -> { min: 10, max: 15, isTimed: false }
 * - "10 reps" -> { min: 10, max: 10, isTimed: false }
 * - "45 sec" -> { min: 45, max: 45, isTimed: true }
 * - "30-45 sec" -> { min: 30, max: 45, isTimed: true }
 */
export function parseTargetReps(targetStr: string = '10-12 reps'): TargetRepRange {
  const clean = targetStr.toLowerCase().trim();
  const isTimed = (/\bsec(onds?)?\b/.test(clean) || /\bmin(utes?)?\b/.test(clean) || /\d+\s*s\b/.test(clean)) && !clean.includes('rep');

  const numbers = clean.match(/\d+/g);
  if (!numbers || numbers.length === 0) {
    return { min: 10, max: 12, isTimed: false };
  }

  if (numbers.length === 1) {
    const val = parseInt(numbers[0], 10);
    return { min: val, max: val, isTimed };
  }

  const n1 = parseInt(numbers[0], 10);
  const n2 = parseInt(numbers[1], 10);
  return {
    min: Math.min(n1, n2),
    max: Math.max(n1, n2),
    isTimed
  };
}

/**
 * Deterministically classifies the performance of a single exercise session.
 */
export function classifySessionPerformance(
  sets: ExerciseHistoryItem[],
  prescribedSets: number = 3,
  targetRepsStr: string = '8-12 reps',
  isSessionCompleted: boolean = true
): PerformanceClassification {
  if (!sets || sets.length === 0) {
    return 'NO_HISTORY';
  }

  const range = parseTargetReps(targetRepsStr);
  const completedSets = sets.filter(s => s.completed && (s.actualReps > 0 || (s.durationSeconds && s.durationSeconds > 0)));

  // If zero valid completed sets exist:
  if (completedSets.length === 0) {
    return 'FAILED';
  }

  // If user completed fewer sets than prescribed or abandoned session early:
  if (completedSets.length < prescribedSets || !isSessionCompleted) {
    return 'INCOMPLETE';
  }

  // Analyze performance numbers across completed sets:
  if (range.isTimed) {
    // Timed exercise (e.g. plank)
    const actualDurations = completedSets.map(s => s.durationSeconds || s.actualReps || 0);
    const allHitMax = actualDurations.every(d => d >= range.max);
    if (allHitMax) return 'TOO_EASY';

    const allHitMin = actualDurations.every(d => d >= range.min);
    if (allHitMin) return 'GOOD';

    const avgDuration = actualDurations.reduce((a, b) => a + b, 0) / actualDurations.length;
    if (avgDuration < range.min * 0.7) return 'FAILED';
    return 'CHALLENGING';
  }

  // Rep-based exercise
  const actualReps = completedSets.map(s => s.actualReps);
  const avgReps = actualReps.reduce((a, b) => a + b, 0) / actualReps.length;
  const rpeValues = completedSets.filter(s => typeof s.rpe === 'number').map(s => s.rpe!);
  const avgRpe = rpeValues.length > 0 ? rpeValues.reduce((a, b) => a + b, 0) / rpeValues.length : undefined;

  // 1. TOO_EASY: Maxed out top of target range on all prescribed sets, or very low RPE
  const allAtOrAboveMax = actualReps.every(r => r >= range.max);
  if (allAtOrAboveMax && (avgRpe === undefined || avgRpe <= 7)) {
    return 'TOO_EASY';
  }

  // 2. FAILED: Repeatedly and substantially below target range (< 70% of min, or severe shortfall)
  const failedSetsCount = actualReps.filter(r => r < range.min).length;
  if (avgReps < range.min * 0.75 || failedSetsCount >= 2 && avgReps < range.min) {
    return 'FAILED';
  }

  // 3. CHALLENGING: High perceived exertion (RPE >= 9) or struggling near the bottom of range
  if ((avgRpe !== undefined && avgRpe >= 9) || failedSetsCount === 1) {
    return 'CHALLENGING';
  }

  // 4. GOOD: Consistently within target range with solid form
  if (actualReps.every(r => r >= range.min)) {
    return 'GOOD';
  }

  return 'CHALLENGING';
}

/**
 * Aggregates raw chronological history items into discrete session performance evaluations.
 */
export function aggregateExerciseSessions(
  historyItems: ExerciseHistoryItem[],
  exerciseId?: string,
  prescribedSets: number = 3,
  targetRepsStr: string = '8-12 reps'
): SessionExercisePerformance[] {
  // Filter for specific exercise if provided
  const filteredSets = exerciseId ? historyItems.filter(h => h.exerciseId === exerciseId) : historyItems;
  if (filteredSets.length === 0) return [];

  // Group by sessionId + exerciseId
  const sessionMap = new Map<string, ExerciseHistoryItem[]>();
  for (const set of filteredSets) {
    const key = `${set.sessionId}:::${set.exerciseId}`;
    const existing = sessionMap.get(key) || [];
    existing.push(set);
    sessionMap.set(key, existing);
  }

  const range = parseTargetReps(targetRepsStr);
  const sessions: SessionExercisePerformance[] = [];

  for (const sets of sessionMap.values()) {
    // Sort sets by setNumber
    sets.sort((a, b) => a.setNumber - b.setNumber);

    const first = sets[0];
    const currentExId = first.exerciseId;
    const completedSets = sets.filter(s => s.completed && (s.actualReps > 0 || (s.durationSeconds && s.durationSeconds > 0)));
    const hasVerifiedSets = sets.some(s => s.verification === 'VERIFIED' || s.completionMethod === 'CAMERA');

    // Classification
    const classification = classifySessionPerformance(sets, prescribedSets, targetRepsStr, true);

    const actualReps = sets.map(s => s.actualReps);
    const actualDurations = sets.map(s => s.durationSeconds || 0);
    const rpes = sets.filter(s => typeof s.rpe === 'number').map(s => s.rpe!);
    const avgRpe = rpes.length > 0 ? Number((rpes.reduce((a, b) => a + b, 0) / rpes.length).toFixed(1)) : undefined;

    sessions.push({
      sessionId: first.sessionId,
      date: first.date,
      exerciseId: currentExId,
      exerciseName: first.exerciseName || currentExId,
      prescribedSets,
      completedSets: completedSets.length,
      targetReps: targetRepsStr,
      targetMinReps: range.min,
      targetMaxReps: range.max,
      targetDurationSeconds: range.isTimed ? range.max : undefined,
      actualReps,
      actualDurationSeconds: range.isTimed ? actualDurations : undefined,
      weightKg: first.weightKg || 0,
      avgRpe,
      classification,
      isSessionCompleted: true,
      hasVerifiedSets
    });
  }

  // Sort descending by date (most recent first)
  return sessions.sort((a, b) => b.date.localeCompare(a.date));
}
