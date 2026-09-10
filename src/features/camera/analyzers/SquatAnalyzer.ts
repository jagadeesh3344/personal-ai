import { ExerciseAnalyzer, calculateAngle, hasRequiredLandmarks } from './ExerciseAnalyzer';
import { PoseLandmark, AnalyzerOutput, RepPhase, FormFeedback, POSE_LANDMARKS } from '../types';

export class SquatAnalyzer implements ExerciseAnalyzer {
  readonly exerciseId: string;
  readonly exerciseName: string;

  private repCount = 0;
  private phase: RepPhase = 'IDLE';
  private feedbackHistory: string[] = [];
  private lastRepTimestamp = 0;
  private minRepDurationMs = 900; // Debounce minimum time for a full squat

  // Joint angle thresholds (Hip - Knee - Ankle)
  private readonly STANDING_ANGLE = 160;  // Standing upright
  private readonly DESCENDING_ANGLE = 145;// Descending
  private readonly BOTTOM_ANGLE = 95;     // Thighs parallel to ground (knee <= 95 deg)
  private readonly ASCENDING_ANGLE = 115; // Standing back up

  // Torso alignment (Shoulder - Hip - Knee: straight upright is 180 deg)
  private readonly MIN_TORSO_ANGLE = 140; // Excessive forward pitch when under 140 deg

  constructor(exerciseId = 'bodyweight-squat', exerciseName = 'Bodyweight Squat') {
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
      POSE_LANDMARKS.LEFT_HIP,
      POSE_LANDMARKS.LEFT_KNEE,
      POSE_LANDMARKS.LEFT_ANKLE
    ];
    const rightIndices = [
      POSE_LANDMARKS.RIGHT_SHOULDER,
      POSE_LANDMARKS.RIGHT_HIP,
      POSE_LANDMARKS.RIGHT_KNEE,
      POSE_LANDMARKS.RIGHT_ANKLE
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
          cue: 'Step back so your hips, knees, and feet are visible in frame.'
        },
        feedbackHistory: this.feedbackHistory
      };
    }

    // 2. Select primary visible side
    const side = leftVisible ? 'left' : 'right';
    const shoulder = side === 'left' ? landmarks[POSE_LANDMARKS.LEFT_SHOULDER] : landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
    const hip = side === 'left' ? landmarks[POSE_LANDMARKS.LEFT_HIP] : landmarks[POSE_LANDMARKS.RIGHT_HIP];
    const knee = side === 'left' ? landmarks[POSE_LANDMARKS.LEFT_KNEE] : landmarks[POSE_LANDMARKS.RIGHT_KNEE];
    const ankle = side === 'left' ? landmarks[POSE_LANDMARKS.LEFT_ANKLE] : landmarks[POSE_LANDMARKS.RIGHT_ANKLE];

    // 3. Compute joint angles
    const kneeAngle = calculateAngle(hip, knee, ankle);
    const torsoAngle = calculateAngle(shoulder, hip, knee);

    // 4. Form Evaluation
    let form: FormFeedback = {
      quality: 'GOOD',
      cue: 'Good rep. Strong drive from the feet.'
    };

    if (torsoAngle < this.MIN_TORSO_ANGLE) {
      form = {
        quality: 'NEEDS_ADJUSTMENT',
        cue: 'Keep your chest up. Avoid leaning too far forward.'
      };
    }

    let isRepCompleted = false;
    const now = Date.now();

    // 5. State Machine: IDLE -> TOP -> DESCENDING -> BOTTOM -> ASCENDING -> TOP -> REP!
    switch (this.phase) {
      case 'IDLE':
        if (kneeAngle >= this.STANDING_ANGLE) {
          this.phase = 'TOP';
        }
        break;

      case 'TOP':
        if (kneeAngle <= this.DESCENDING_ANGLE) {
          this.phase = 'DESCENDING';
        }
        break;

      case 'DESCENDING':
        if (kneeAngle <= this.BOTTOM_ANGLE) {
          this.phase = 'BOTTOM';
        } else if (kneeAngle >= this.STANDING_ANGLE) {
          // Half rep abort
          form = {
            quality: 'NEEDS_ADJUSTMENT',
            cue: 'Go a little deeper into your squat.'
          };
          this.phase = 'TOP';
        }
        break;

      case 'BOTTOM':
        if (kneeAngle >= this.ASCENDING_ANGLE) {
          this.phase = 'ASCENDING';
        }
        break;

      case 'ASCENDING':
        if (kneeAngle >= this.STANDING_ANGLE) {
          // Rep completion with debounce
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
        kneeAngle,
        torsoAngle
      },
      isRepCompleted
    };
  }
}
