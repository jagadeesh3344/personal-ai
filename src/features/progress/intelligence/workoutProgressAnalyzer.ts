import {
  WorkoutProgressAnalysis,
  TrackedExerciseProgress,
  ExercisePerformanceTrend
} from './types';
import {
  deriveProgressionState,
  evaluateExerciseProgression,
  ADAPTIVE_PROGRESSION_LADDERS
} from '../../workouts/adaptive/progressionEngine';
import { aggregateExerciseSessions } from '../../workouts/adaptive/performanceAnalyzer';
import { ExerciseHistoryItem } from '../../workouts/adaptive/types';

export interface WorkoutSessionSummary {
  id: string;
  date: string;
  completed: boolean;
  dayName?: string;
}

export function analyzeWorkoutProgress(
  sessions: WorkoutSessionSummary[],
  historyItems: ExerciseHistoryItem[],
  plannedSessionsInPeriod: number = 0
): WorkoutProgressAnalysis {
  const completedSessions = (sessions || []).filter(s => s.completed);
  const sessionsCompleted = completedSessions.length;
  const sessionsPlanned = Math.max(plannedSessionsInPeriod, sessionsCompleted, (sessions || []).length);
  const completionRate = sessionsPlanned > 0
    ? Number(((sessionsCompleted / sessionsPlanned) * 100).toFixed(1))
    : 0;

  if (!historyItems || historyItems.length === 0) {
    return {
      sessionsCompleted,
      sessionsPlanned,
      completionRate,
      totalSetsCompleted: 0,
      totalRepsCompleted: 0,
      verifiedSetsCount: 0,
      selfReportedSetsCount: 0,
      exercises: [],
      overallWorkoutTrend: sessionsCompleted > 0 ? 'INSUFFICIENT_DATA' : 'NO_HISTORY'
    };
  }

  let totalSetsCompleted = 0;
  let totalRepsCompleted = 0;
  let verifiedSetsCount = 0;
  let selfReportedSetsCount = 0;

  const exerciseMap = new Map<string, ExerciseHistoryItem[]>();

  for (const item of historyItems) {
    if (item.completed) {
      totalSetsCompleted++;
      totalRepsCompleted += (item.actualReps || 0);
      if (item.verification === 'VERIFIED') {
        verifiedSetsCount++;
      } else {
        selfReportedSetsCount++;
      }
    }

    const list = exerciseMap.get(item.exerciseId) || [];
    list.push(item);
    exerciseMap.set(item.exerciseId, list);
  }

  const trackedExercises: TrackedExerciseProgress[] = [];
  let improvingCount = 0;
  let regressingCount = 0;
  let maintainingCount = 0;

  for (const [exerciseId, items] of exerciseMap.entries()) {
    const sorted = [...items].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const distinctSessions = new Set(sorted.map(i => i.sessionId || i.date));
    const sessionsPerformed = distinctSessions.size;

    const completedSets = sorted.filter(s => s.completed);
    const totalSets = completedSets.length;
    const totalReps = completedSets.reduce((acc, curr) => acc + (curr.actualReps || 0), 0);
    const averageReps = totalSets > 0 ? Number((totalReps / totalSets).toFixed(1)) : 0;
    const bestReps = completedSets.reduce((acc, curr) => Math.max(acc, curr.actualReps || 0), 0);
    const lastWeightKg = completedSets.length > 0 ? completedSets[completedSets.length - 1].weightKg : undefined;
    const exerciseName = sorted[0].exerciseName || exerciseId;

    const aggregatedSessions = aggregateExerciseSessions(sorted);
    let progressionState: 'NEW' | 'DEVELOPING' | 'STABLE' | 'READY_TO_PROGRESS' | 'NEEDS_REGRESSION' = 'NEW';
    let performanceTrend: ExercisePerformanceTrend = 'INSUFFICIENT_DATA';
    let recentPerformance = 'No sets recorded';
    let previousPerformance: string | undefined = undefined;

    if (aggregatedSessions.length === 0) {
      performanceTrend = 'NO_HISTORY';
    } else if (aggregatedSessions.length === 1) {
      progressionState = 'NEW';
      performanceTrend = 'INSUFFICIENT_DATA';
      recentPerformance = `${aggregatedSessions[0].classification} (${aggregatedSessions[0].completedSets} sets, max ${Math.max(...aggregatedSessions[0].actualReps, 0)} reps)`;
    } else {
      // aggregatedSessions is sorted descending (index 0 is most recent)
      const latest = aggregatedSessions[0];
      const previous = aggregatedSessions[1];

      const avgLatest = latest.actualReps.reduce((a, b) => a + b, 0) / Math.max(1, latest.actualReps.length);
      const avgPrev = previous.actualReps.reduce((a, b) => a + b, 0) / Math.max(1, previous.actualReps.length);

      recentPerformance = `${latest.classification} (${latest.completedSets} sets, avg ${avgLatest.toFixed(0)} reps)`;
      previousPerformance = `${previous.classification} (${previous.completedSets} sets, avg ${avgPrev.toFixed(0)} reps)`;

      const normId = exerciseId.replace(/_/g, '-');
      const family = Object.keys(ADAPTIVE_PROGRESSION_LADDERS).find(k =>
        ADAPTIVE_PROGRESSION_LADDERS[k].steps.some(s => 
          s.exerciseId === exerciseId || 
          s.exerciseId === normId ||
          (exerciseId === 'standard_push_up' && s.exerciseId === 'push-up')
        )
      );

      const defaultUserContext = {
        trainingExperience: 'INTERMEDIATE' as const,
        equipment: ['NONE', 'DUMBBELLS']
      };

      if (family) {
        const ladderStep = ADAPTIVE_PROGRESSION_LADDERS[family].steps.find(s => 
          s.exerciseId === exerciseId || s.exerciseId === normId || (exerciseId === 'standard_push_up' && s.exerciseId === 'push-up')
        );
        const resolvedId = ladderStep ? ladderStep.exerciseId : exerciseId;

        const progState = deriveProgressionState(family, defaultUserContext, aggregatedSessions);
        progressionState = progState.status;
        const evalRec = evaluateExerciseProgression(resolvedId, exerciseName, defaultUserContext, aggregatedSessions);
        
        if (evalRec.action === 'PROGRESS' || evalRec.status === 'READY_TO_PROGRESS' || avgLatest >= avgPrev + 1) {
          performanceTrend = 'IMPROVING';
        } else if (evalRec.action === 'REGRESS' || evalRec.status === 'NEEDS_REGRESSION' || avgLatest <= avgPrev - 1) {
          performanceTrend = 'REGRESSING';
        } else {
          performanceTrend = 'MAINTAINING';
        }

        if (evalRec.status === 'READY_TO_PROGRESS' || evalRec.action === 'PROGRESS') {
          progressionState = 'READY_TO_PROGRESS';
        } else if (evalRec.status === 'NEEDS_REGRESSION' || evalRec.action === 'REGRESS') {
          progressionState = 'NEEDS_REGRESSION';
        }
      } else {
        if (avgLatest >= avgPrev + 1 || (latest.classification === 'TOO_EASY' && previous.classification !== 'TOO_EASY')) {
          performanceTrend = 'IMPROVING';
          progressionState = 'READY_TO_PROGRESS';
        } else if (avgLatest <= avgPrev - 1 || (latest.classification === 'FAILED' && previous.classification !== 'FAILED')) {
          performanceTrend = 'REGRESSING';
          progressionState = 'NEEDS_REGRESSION';
        } else {
          performanceTrend = 'MAINTAINING';
          progressionState = 'STABLE';
        }
      }
    }

    if (performanceTrend === 'IMPROVING') improvingCount++;
    else if (performanceTrend === 'REGRESSING') regressingCount++;
    else if (performanceTrend === 'MAINTAINING') maintainingCount++;

    trackedExercises.push({
      exerciseId,
      exerciseName,
      sessionsPerformed,
      totalSets,
      totalReps,
      averageReps,
      bestReps,
      lastWeightKg,
      progressionState,
      performanceTrend,
      trend: performanceTrend,
      recentPerformance,
      previousPerformance
    });
  }

  let overallWorkoutTrend: ExercisePerformanceTrend = 'MAINTAINING';
  if (sessionsCompleted === 0) {
    overallWorkoutTrend = 'NO_HISTORY';
  } else if (sessionsCompleted === 1 || trackedExercises.length === 0) {
    overallWorkoutTrend = 'INSUFFICIENT_DATA';
  } else if (improvingCount > regressingCount && improvingCount >= 1) {
    overallWorkoutTrend = 'IMPROVING';
  } else if (regressingCount > improvingCount && regressingCount >= 1) {
    overallWorkoutTrend = 'REGRESSING';
  } else {
    overallWorkoutTrend = 'MAINTAINING';
  }

  return {
    sessionsCompleted,
    sessionsPlanned,
    completionRate,
    totalSetsCompleted,
    totalRepsCompleted,
    verifiedSetsCount,
    selfReportedSetsCount,
    exercises: trackedExercises,
    overallWorkoutTrend
  };
}
