import { ExerciseAnalyzer, calculateAngle, calculateDistance, hasRequiredLandmarks } from './ExerciseAnalyzer';
import { PoseLandmark, AnalyzerOutput, RepPhase, FormFeedback, POSE_LANDMARKS } from '../types';

export class BicepCurlAnalyzer implements ExerciseAnalyzer {
  readonly exerciseId: string;
  readonly exerciseName: string;

  private repCount = 0;
  private phase: RepPhase = 'IDLE';
  private feedbackHistory: string[] = [];
  private lastRepTimestamp = 0;
  private minRepDurationMs = 800; // Debounce minimum time for a curl

  // Joint angle thresholds (Shoulder - Elbow - Wrist)
  private readonly EXTENDED_ANGLE = 145; // Arm down at bottom
  private readonly ASCENDING_ANGLE = 120; // Curling upward
  private readonly TOP_ANGLE = 60;        // Full peak contraction (elbow <= 60 deg)
  private readonly DESCENDING_ANGLE = 80; // Lowering weight

  constructor(exerciseId = 'dumbbell-curl', exerciseName = 'Dumbbell Curl') {
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
    // 1. Validate required landmarks
    const leftIndices = [
      POSE_LANDMARKS.LEFT_SHOULDER,
      POSE_LANDMARKS.LEFT_ELBOW,
      POSE_LANDMARKS.LEFT_WRIST,
      POSE_LANDMARKS.LEFT_HIP
    ];
    const rightIndices = [
      POSE_LANDMARKS.RIGHT_SHOULDER,
      POSE_LANDMARKS.RIGHT_ELBOW,
      POSE_LANDMARKS.RIGHT_WRIST,
      POSE_LANDMARKS.RIGHT_HIP
    ];

    const leftVisible = hasRequiredLandmarks(landmarks, leftIndices, 0.5);
    const rightVisible = hasRequiredLandmarks(landmarks, rightIndices, 0.5);

    if (confidence < 0.55 || (!leftVisible && !rightVisible)) {
      return {
        exerciseId: this.exerciseId,
        exerciseName: this.exerciseName,
        repCount: this.repCount,
        phase: this.phase,
        confidence,
        form: {
          quality: 'POOR',
          cue: 'Position your upper body and arms clearly in view.'
        },
        feedbackHistory: this.feedbackHistory
      };
    }

    // 2. Select primary visible arm
    const side = leftVisible ? 'left' : 'right';
    const shoulder = side === 'left' ? landmarks[POSE_LANDMARKS.LEFT_SHOULDER] : landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
    const elbow = side === 'left' ? landmarks[POSE_LANDMARKS.LEFT_ELBOW] : landmarks[POSE_LANDMARKS.RIGHT_ELBOW];
    const wrist = side === 'left' ? landmarks[POSE_LANDMARKS.LEFT_WRIST] : landmarks[POSE_LANDMARKS.RIGHT_WRIST];
    const hip = side === 'left' ? landmarks[POSE_LANDMARKS.LEFT_HIP] : landmarks[POSE_LANDMARKS.RIGHT_HIP];

    // 3. Compute joint angles
    const elbowFlexionAngle = calculateAngle(shoulder, elbow, wrist);

    // Form check: Elbow sway relative to torso (distance between elbow and hip on x-axis)
    const elbowSwayDistance = Math.abs(elbow.x - hip.x);

    let form: FormFeedback = {
      quality: 'GOOD',
      cue: 'Good rep. Controlled tempo on the way down.'
    };

    if (elbowSwayDistance > 0.18) {
      form = {
        quality: 'NEEDS_ADJUSTMENT',
        cue: 'Keep your elbows pinned to your sides. Avoid swinging.'
      };
    }

    let isRepCompleted = false;
    const now = Date.now();

    // 4. State Machine for Curl: IDLE -> BOTTOM (extended) -> ASCENDING -> TOP (curled) -> DESCENDING -> BOTTOM -> REP!
    switch (this.phase) {
      case 'IDLE':
        if (elbowFlexionAngle >= this.EXTENDED_ANGLE) {
          this.phase = 'BOTTOM';
        }
        break;

      case 'BOTTOM':
        if (elbowFlexionAngle <= this.ASCENDING_ANGLE) {
          this.phase = 'ASCENDING';
        }
        break;

      case 'ASCENDING':
        if (elbowFlexionAngle <= this.TOP_ANGLE) {
          this.phase = 'TOP';
        } else if (elbowFlexionAngle >= this.EXTENDED_ANGLE) {
          form = {
            quality: 'NEEDS_ADJUSTMENT',
            cue: 'Curl the weight higher to full contraction.'
          };
          this.phase = 'BOTTOM';
        }
        break;

      case 'TOP':
        if (elbowFlexionAngle >= this.DESCENDING_ANGLE) {
          this.phase = 'DESCENDING';
        }
        break;

      case 'DESCENDING':
        if (elbowFlexionAngle >= this.EXTENDED_ANGLE) {
          // Full rep completed
          if (now - this.lastRepTimestamp > this.minRepDurationMs) {
            this.repCount += 1;
            this.lastRepTimestamp = now;
            isRepCompleted = true;
            this.feedbackHistory.push(form.cue);
          }
          this.phase = 'BOTTOM';
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
        elbowFlexionAngle
      },
      isRepCompleted
    };
  }
}
