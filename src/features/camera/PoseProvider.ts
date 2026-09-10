import { PoseDetectionResult, PoseLandmark } from './types';

export interface PoseProviderOptions {
  width?: number;
  height?: number;
  minDetectionConfidence?: number;
  minTrackingConfidence?: number;
}

export interface PoseProvider {
  /**
   * Initializes camera stream and starts pose detection on the given video element.
   */
  start(
    videoElement: HTMLVideoElement,
    onPose: (result: PoseDetectionResult) => void,
    onError?: (error: Error) => void,
    options?: PoseProviderOptions
  ): Promise<void>;

  /**
   * Stops video stream, releases tracks, and halts animation frame loop.
   */
  stop(): void;

  /**
   * Checks whether camera and pose detection are actively streaming.
   */
  isActive(): boolean;

  /**
   * Renders skeletal bones and landmark joints over a canvas.
   */
  drawSkeleton(
    canvas: HTMLCanvasElement,
    landmarks: PoseLandmark[],
    quality?: 'GOOD' | 'NEEDS_ADJUSTMENT' | 'POOR'
  ): void;
}
