import { ExerciseAnalyzer, calculateAngle, hasRequiredLandmarks } from './ExerciseAnalyzer';
import { PoseLandmark, AnalyzerOutput, RepPhase, FormFeedback, POSE_LANDMARKS } from '../types';

export class PushUpAnalyzer implements ExerciseAnalyzer {
  readonly exerciseId: string;
  readonly exerciseName: string;

  private repCount = 0;
  private phase: RepPhase = 'IDLE';
  private feedbackHistory: string[] = [];
  private lastRepTimestamp = 0;
  private minRepDurationMs = 800; // Debounce minimum time for a full rep

  // Joint angle thresholds
  private readonly TOP_ANGLE = 150;      // Fully extended arms
  private readonly DESCENDING_ANGLE = 135;// Starting to bend
  private readonly BOTTOM_ANGLE = 95;    // Elbow at or under ~90-95 degrees
  private readonly ASCENDING_ANGLE = 115; // Pushing back up

  // Body alignment thresholds (Shoulder - Hip - Ankle)
  private readonly MIN_BODY_LINE_ANGLE = 150; // Under this means sagging hips or piking

  constructor(exerciseId = 'push-up', exerciseName = 'Push-up') {
    this.exerciseId = exerciseId;
    this.exerciseName = exerciseName;
  }

  reset(): void {
    this.repCount = 0;
    this.phase = 'IDLE';
    this.feedbackHistory = [];
    this.lastRepTimestamp = 0;
  }

  process(landmarks: PoseLandmark[], confidence: number): AnalyzerOutput {
    // 1. Confidence check & Full body visibility
    const requiredIndices = [
      POSE_LANDMARKS.LEFT_SHOULDER,
      POSE_LANDMARKS.LEFT_ELBOW,
      POSE_LANDMARKS.LEFT_WRIST,
      POSE_LANDMARKS.LEFT_HIP,
      POSE_LANDMARKS.LEFT_ANKLE
    ];

    const requiredRightIndices = [
      POSE_LANDMARKS.RIGHT_SHOULDER,
      POSE_LANDMARKS.RIGHT_ELBOW,
      POSE_LANDMARKS.RIGHT_WRIST,
      POSE_LANDMARKS.RIGHT_HIP,
      POSE_LANDMARKS.RIGHT_ANKLE
    ];

    const leftVisible = hasRequiredLandmarks(landmarks, requiredIndices, 0.5);
    const rightVisible = hasRequiredLandmarks(landmarks, requiredRightIndices, 0.5);

    if (confidence < 0.55 || (!leftVisible && !rightVisible)) {
      return {
        exerciseId: this.exerciseId,
        exerciseName: this.exerciseName,
        repCount: this.repCount,
        phase: this.phase,
        confidence,
        form: {
          quality: 'POOR',
          cue: 'Position your full body clearly in frame so I can track your push-ups.'
        },
        feedbackHistory: this.feedbackHistory
      };
    }

    // 2. Select primary visible side
    const side = leftVisible ? 'left' : 'right';
    const shoulder = side === 'left' ? landmarks[POSE_LANDMARKS.LEFT_SHOULDER] : landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
    const elbow = side === 'left' ? landmarks[POSE_LANDMARKS.LEFT_ELBOW] : landmarks[POSE_LANDMARKS.RIGHT_ELBOW];
    const wrist = side === 'left' ? landmarks[POSE_LANDMARKS.LEFT_WRIST] : landmarks[POSE_LANDMARKS.RIGHT_WRIST];
    const hip = side === 'left' ? landmarks[POSE_LANDMARKS.LEFT_HIP] : landmarks[POSE_LANDMARKS.RIGHT_HIP];
    const ankle = side === 'left' ? landmarks[POSE_LANDMARKS.LEFT_ANKLE] : landmarks[POSE_LANDMARKS.RIGHT_ANKLE];

    // 3. Compute joint angles
    const elbowAngle = calculateAngle(shoulder, elbow, wrist);
    const bodyLineAngle = calculateAngle(shoulder, hip, ankle);

    // 4. Form Evaluation
    let form: FormFeedback = {
      quality: 'GOOD',
      cue: 'Good rep. Keep your core tight.'
    };

    if (bodyLineAngle < this.MIN_BODY_LINE_ANGLE) {
      form = {
        quality: 'NEEDS_ADJUSTMENT',
        cue: 'Keep your body straight. Avoid sagging or piking your hips.'
      };
    }

    let isRepCompleted = false;
    const now = Date.now();

    // 5. State Machine: IDLE -> TOP -> DESCENDING -> BOTTOM -> ASCENDING -> TOP -> REP!
    switch (this.phase) {
      case 'IDLE':
        if (elbowAngle >= this.TOP_ANGLE) {
          this.phase = 'TOP';
        }
        break;

      case 'TOP':
        if (elbowAngle <= this.DESCENDING_ANGLE) {
          this.phase = 'DESCENDING';
        }
        break;

      case 'DESCENDING':
        if (elbowAngle <= this.BOTTOM_ANGLE) {
          this.phase = 'BOTTOM';
        } else if (elbowAngle >= this.TOP_ANGLE) {
          // Aborted repetition without reaching depth
          form = {
            quality: 'NEEDS_ADJUSTMENT',
            cue: 'Go a little deeper before pressing up.'
          };
          this.phase = 'TOP';
        }
        break;

      case 'BOTTOM':
        if (elbowAngle >= this.ASCENDING_ANGLE) {
          this.phase = 'ASCENDING';
        }
        break;

      case 'ASCENDING':
        if (elbowAngle >= this.TOP_ANGLE) {
          // Valid rep completed with debounce check
          if (now - this.lastRepTimestamp > this.minRepDurationMs) {
            this.repCount += 1;
            this.lastRepTimestamp = now;
            isRepCompleted = true;
            this.feedbackHistory.push(form.cue);
          }
          this.phase = 'TOP';
        }
        break;
    }

    return {
      exerciseId: this.exerciseId,
      exerciseName: this.exerciseName,
      repCount: this.repCount,
      phase: this.phase,
      confidence,
      form,
      feedbackHistory: this.feedbackHistory,
      keyJointAngles: {
        elbowAngle,
        bodyLineAngle
      },
      isRepCompleted
    };
  }
}
