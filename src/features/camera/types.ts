/**
 * Standard MediaPipe 33 Pose Landmark definitions & Vision Types
 */

export interface PoseLandmark {
  x: number;          // [0.0, 1.0] normalized horizontal
  y: number;          // [0.0, 1.0] normalized vertical
  z: number;          // depth relative to midpoint of hips
  visibility?: number;// confidence that landmark is visible [0.0, 1.0]
}

export interface PoseDetectionResult {
  landmarks: PoseLandmark[];
  confidence: number;
  timestampMs: number;
}

export type RepPhase = 
  | 'IDLE' 
  | 'TOP' 
  | 'DESCENDING' 
  | 'BOTTOM' 
  | 'ASCENDING';

export type FormQuality = 'GOOD' | 'NEEDS_ADJUSTMENT' | 'POOR';

export interface FormFeedback {
  quality: FormQuality;
  cue: string;
  metricDetails?: Record<string, any>;
}

export interface AnalyzerOutput {
  exerciseId: string;
  exerciseName: string;
  repCount: number;
  phase: RepPhase;
  confidence: number;
  form: FormFeedback;
  feedbackHistory: string[];
  keyJointAngles?: Record<string, number>;
  isRepCompleted?: boolean;
}

export type WorkoutVisionEventType = 
  | 'REP_COMPLETED' 
  | 'SET_COMPLETED' 
  | 'FORM_WARNING' 
  | 'POSE_LOST' 
  | 'EXERCISE_STARTED';

export interface WorkoutVisionEvent {
  type: WorkoutVisionEventType;
  exerciseId: string;
  timestamp: string;
  payload: {
    rep?: number;
    phase?: RepPhase;
    confidence?: number;
    cue?: string;
    formQuality?: FormQuality;
  };
}

// MediaPipe 33 Landmark Indices
export const POSE_LANDMARKS = {
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32
} as const;

// Landmark skeleton connections for canvas overlay
export const POSE_CONNECTIONS: [number, number][] = [
  // Torso
  [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.RIGHT_SHOULDER],
  [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_HIP],
  [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_HIP],
  [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.RIGHT_HIP],

  // Left Arm
  [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_ELBOW],
  [POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.LEFT_WRIST],

  // Right Arm
  [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_ELBOW],
  [POSE_LANDMARKS.RIGHT_ELBOW, POSE_LANDMARKS.RIGHT_WRIST],

  // Left Leg
  [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.LEFT_KNEE],
  [POSE_LANDMARKS.LEFT_KNEE, POSE_LANDMARKS.LEFT_ANKLE],

  // Right Leg
  [POSE_LANDMARKS.RIGHT_HIP, POSE_LANDMARKS.RIGHT_KNEE],
  [POSE_LANDMARKS.RIGHT_KNEE, POSE_LANDMARKS.RIGHT_ANKLE]
];
