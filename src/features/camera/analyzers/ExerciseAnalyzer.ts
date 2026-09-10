import { PoseLandmark, AnalyzerOutput } from '../types';

/**
 * Common interface for modular, exercise-specific computer vision analyzers.
 */
export interface ExerciseAnalyzer {
  readonly exerciseId: string;
  readonly exerciseName: string;

  /**
   * Resets rep count, phase states, and history for a fresh exercise set.
   */
  reset(): void;

  /**
   * Processes a single video frame containing 33 MediaPipe pose landmarks.
   */
  process(landmarks: PoseLandmark[], confidence: number): AnalyzerOutput;
}

/**
 * Calculates angle between three points (A -> B -> C) where B is the vertex.
 * Returns angle in degrees [0, 180].
 */
export function calculateAngle(
  a: PoseLandmark,
  b: PoseLandmark,
  c: PoseLandmark
): number {
  // Vector BA:
  const v1x = a.x - b.x;
  const v1y = a.y - b.y;
  // Vector BC:
  const v2x = c.x - b.x;
  const v2y = c.y - b.y;

  const dot = v1x * v2x + v1y * v2y;
  const mag1 = Math.sqrt(v1x * v1x + v1y * v1y);
  const mag2 = Math.sqrt(v2x * v2x + v2y * v2y);

  if (mag1 === 0 || mag2 === 0) return 0;
  const cos = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
  return Math.round((Math.acos(cos) * 180.0) / Math.PI);
}

/**
 * Euclidean distance between two normalized 2D points.
 */
export function calculateDistance(a: PoseLandmark, b: PoseLandmark): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Checks whether landmark array has adequate confidence and contains required indices.
 */
export function hasRequiredLandmarks(
  landmarks: PoseLandmark[],
  indices: number[],
  minVisibility = 0.5
): boolean {
  if (!landmarks || landmarks.length < 33) return false;
  return indices.every(idx => {
    const p = landmarks[idx];
    return p && (p.visibility ?? 1) >= minVisibility;
  });
}
