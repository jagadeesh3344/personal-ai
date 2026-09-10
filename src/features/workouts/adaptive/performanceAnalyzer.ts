import {
  ExerciseHistoryItem,
  PerformanceClassification,
  SessionExercisePerformance
} from './types';

export interface TargetRepRange {
  min: number;
  max: number;
  isTimed: boolean;
}

/**
 * Deterministically parses target reps from strings like "8-12 reps", "10-15", "45 sec", "30-45s".
 */
export function parseTargetReps(targetReps: string = '8-12 reps'): TargetRepRange {
  const clean = targetReps.toLowerCase().trim();
  const isTimed = (/\bsec(onds?)?\b/.test(clean) || /\bmin(utes?)?\b/.test(clean) || /\d+\s*s\b/.test(clean)) && !clean.includes('rep');

  // Interval format "8-12" or "30-45"
  const rangeMatch = clean.match(/(\d+)\s*[-–—to]+\s*(\d+)/);
  if (rangeMatch) {
    const min = parseInt(rangeMatch[1], 10);
    const max = parseInt(rangeMatch[2], 10);
    return { min, max, isTimed };
  }

  // Single number format "10 reps" or "30s"
  const singleMatch = clean.match(/(\d+)/);
  if (singleMatch) {
    const val = parseInt(singleMatch[1], 10);
    return { min: val, max: val, isTimed };
  }

  // Default fallback
  return { min: 8, max: 12, isTimed: false };
}

/**
 * Deterministically classifies a single session's exercise performance against prescription.
 *
 * Classifications:
 * - NO_HISTORY: No sets recorded
 * - INCOMPLETE: Fewer completed sets than prescribed, or session abandoned
 * - FAILED: Prescribed sets attempted but completed reps substantially below target (<75% min)
 * - CHALLENGING: Target barely reached or achieved with near-failure RPE (>= 9)
 * - GOOD: Solid execution within target range
 * - TOO_EASY: Maxed out upper boundary across all sets with comfortable RPE (<= 7)
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

  const completedSets = sets.filter(s => s.completed && (s.actualReps > 0 || (s.durationSeconds && s.durationSeconds > 0)));

  // If incomplete session or insufficient completed sets
  if (!isSessionCompleted || completedSets.length < prescribedSets) {
    return 'INCOMPLETE';
  }

  const range = parseTargetReps(targetRepsStr);

  // Timed exercise (e.g. plank)
  if (range.isTimed) {
    const actualDurations = completedSets.map(s => s.durationSeconds || s.actualReps || 0);
    const allAtOrAboveMax = actualDurations.every(d => d >= range.max);
    if (allAtOrAboveMax) return 'TOO_EASY';

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

  // 2. FAILED: Repeatedly and substantially below target range (< 75% of min, or severe shortfall)
  const failedSetsCount = actualReps.filter(r => r < range.min).length;
  if (avgReps < range.min * 0.75 || (failedSetsCount >= 2 && avgReps < range.min)) {
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
