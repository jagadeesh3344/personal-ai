import { PoseFrame } from './PoseProvider';

export interface FormMetric {
  name: string;
  angleDegrees: number;
  isAcceptable: boolean;
  feedbackText?: string;
}

export interface RepAnalysisResult {
  currentReps: number;
  phase: 'ECCENTRIC' | 'CONCENTRIC' | 'REST' | 'UNKNOWN';
  metrics: FormMetric[];
  feedbackCue: string;
}

export interface IExerciseAnalyzer {
  exerciseId: string;
  processFrame(frame: PoseFrame): RepAnalysisResult;
  reset(): void;
}

/**
 * Foundation analyzer for kinematic joint angle calculation.
 * Ready for angle measurement (e.g. angle between shoulder, elbow, wrist for pushups).
 */
export class GeneralExerciseAnalyzer implements IExerciseAnalyzer {
  exerciseId: string;
  private repCount = 0;

  constructor(exerciseId: string) {
    this.exerciseId = exerciseId;
  }

  processFrame(frame: PoseFrame): RepAnalysisResult {
    return {
      currentReps: this.repCount,
      phase: 'REST',
      metrics: [],
      feedbackCue: 'Pose estimation pipeline initializing...'
    };
  }

  reset(): void {
    this.repCount = 0;
  }
}
