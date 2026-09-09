export interface NormalizedLandmark {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

export interface PoseFrame {
  landmarks: NormalizedLandmark[];
  timestampMs: number;
}

export type PoseStatus = 'IDLE' | 'INITIALIZING' | 'TRACKING' | 'ERROR';

export interface IPoseProvider {
  status: PoseStatus;
  initialize(videoElement: HTMLVideoElement): Promise<void>;
  startTracking(onPoseFrame: (frame: PoseFrame) => void): void;
  stopTracking(): void;
}

/**
 * Clean abstraction for MediaPipe / MoveNet pose detection pipeline
 */
export class MediaPipePoseProvider implements IPoseProvider {
  status: PoseStatus = 'INITIALIZING';

  async initialize(videoElement: HTMLVideoElement): Promise<void> {
    // Ready for MediaPipe @mediapipe/pose or TensorFlow MoveNet model weights
    this.status = 'IDLE';
  }

  startTracking(onPoseFrame: (frame: PoseFrame) => void): void {
    this.status = 'TRACKING';
  }

  stopTracking(): void {
    this.status = 'IDLE';
  }
}
