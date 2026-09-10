import { PoseProvider, PoseProviderOptions } from './PoseProvider';
import { PoseDetectionResult, PoseLandmark, POSE_CONNECTIONS, POSE_LANDMARKS } from './types';

declare global {
  interface Window {
    Pose?: any;
    Camera?: any;
  }
}

export class MediaPipePoseProvider implements PoseProvider {
  private active = false;
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private animFrameId: number | null = null;
  private poseInstance: any = null;
  private onPoseCallback: ((result: PoseDetectionResult) => void) | null = null;

  isActive(): boolean {
    return this.active;
  }

  async start(
    videoElement: HTMLVideoElement,
    onPose: (result: PoseDetectionResult) => void,
    onError?: (error: Error) => void,
    options?: PoseProviderOptions
  ): Promise<void> {
    this.videoElement = videoElement;
    this.onPoseCallback = onPose;

    // 1. Request hardware camera permissions
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: options?.width || 640 },
          height: { ideal: options?.height || 480 },
          facingMode: 'user'
        },
        audio: false
      });
      videoElement.srcObject = this.stream;
      await videoElement.play();
    } catch (err: any) {
      this.stop();
      const errorMsg = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
        ? 'Camera permission was denied. Please allow camera access to use real-time workout tracking.'
        : `Camera initialization failed: ${err.message || 'Device error'}`;
      onError?.(new Error(errorMsg));
      return;
    }

    this.active = true;

    // 2. Load MediaPipe Pose via CDN script if not already on window
    await this.ensureMediaPipeLoaded();

    if (window.Pose) {
      try {
        this.poseInstance = new window.Pose({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
        });

        this.poseInstance.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: false,
          minDetectionConfidence: options?.minDetectionConfidence ?? 0.65,
          minTrackingConfidence: options?.minTrackingConfidence ?? 0.65
        });

        this.poseInstance.onResults((results: any) => {
          if (!this.active) return;
          if (results.poseLandmarks && results.poseLandmarks.length === 33) {
            const raw = results.poseLandmarks;
            // Compute average visibility confidence
            const conf = raw.reduce((sum: number, l: any) => sum + (l.visibility ?? 1), 0) / 33;
            onPose({
              landmarks: raw,
              confidence: Number(conf.toFixed(3)),
              timestampMs: Date.now()
            });
          } else {
            // Pose lost or undetected in current frame
            onPose({
              landmarks: [],
              confidence: 0,
              timestampMs: Date.now()
            });
          }
        });
      } catch (e) {
        console.warn('[MediaPipePoseProvider] Native Pose initialization notice:', e);
      }
    }

    // 3. High-performance requestAnimationFrame loop
    const processFrame = async () => {
      if (!this.active || !this.videoElement) return;

      if (this.videoElement.readyState >= 2) {
        try {
          if (this.poseInstance) {
            await this.poseInstance.send({ image: this.videoElement });
          }
        } catch (err) {
          // Frame drop or busy, continue loop
        }
      }

      if (this.active) {
        this.animFrameId = requestAnimationFrame(processFrame);
      }
    };

    this.animFrameId = requestAnimationFrame(processFrame);
  }

  private async ensureMediaPipeLoaded(): Promise<void> {
    if (typeof window === 'undefined' || window.Pose) return;

    return new Promise<void>((resolve) => {
      // Check if already injected
      const existingScript = document.getElementById('mediapipe-pose-script');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve());
        setTimeout(resolve, 500);
        return;
      }

      const script = document.createElement('script');
      script.id = 'mediapipe-pose-script';
      script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js';
      script.crossOrigin = 'anonymous';
      script.onload = () => resolve();
      script.onerror = () => {
        console.warn('[MediaPipePoseProvider] MediaPipe Pose script CDN fallback triggered');
        resolve();
      };
      document.head.appendChild(script);
    });
  }

  stop(): void {
    this.active = false;

    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }

    if (this.poseInstance) {
      try {
        this.poseInstance.close();
      } catch {
        // Safe close
      }
      this.poseInstance = null;
    }

    this.onPoseCallback = null;
  }

  drawSkeleton(
    canvas: HTMLCanvasElement,
    landmarks: PoseLandmark[],
    quality: 'GOOD' | 'NEEDS_ADJUSTMENT' | 'POOR' = 'GOOD'
  ): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!landmarks || landmarks.length === 0) return;

    const boneColor = quality === 'GOOD' 
      ? '#10b981' // emerald-500
      : quality === 'NEEDS_ADJUSTMENT' 
        ? '#f59e0b' // amber-500
        : '#ef4444'; // rose-500

    const jointColor = '#22d3ee'; // cyan-400

    ctx.save();
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = boneColor;

    // Draw skeletal connections
    for (const [idxA, idxB] of POSE_CONNECTIONS) {
      const pA = landmarks[idxA];
      const pB = landmarks[idxB];
      if (!pA || !pB) continue;

      // Visibility filter
      if ((pA.visibility ?? 1) < 0.5 || (pB.visibility ?? 1) < 0.5) continue;

      ctx.beginPath();
      ctx.moveTo(pA.x * canvas.width, pA.y * canvas.height);
      ctx.lineTo(pB.x * canvas.width, pB.y * canvas.height);
      ctx.stroke();
    }

    // Draw major joint points (head, shoulders, elbows, wrists, hips, knees, ankles)
    const keyJoints = [
      POSE_LANDMARKS.NOSE,
      POSE_LANDMARKS.LEFT_SHOULDER,
      POSE_LANDMARKS.RIGHT_SHOULDER,
      POSE_LANDMARKS.LEFT_ELBOW,
      POSE_LANDMARKS.RIGHT_ELBOW,
      POSE_LANDMARKS.LEFT_WRIST,
      POSE_LANDMARKS.RIGHT_WRIST,
      POSE_LANDMARKS.LEFT_HIP,
      POSE_LANDMARKS.RIGHT_HIP,
      POSE_LANDMARKS.LEFT_KNEE,
      POSE_LANDMARKS.RIGHT_KNEE,
      POSE_LANDMARKS.LEFT_ANKLE,
      POSE_LANDMARKS.RIGHT_ANKLE
    ];

    for (const jointIdx of keyJoints) {
      const p = landmarks[jointIdx];
      if (!p || (p.visibility ?? 1) < 0.5) continue;

      const px = p.x * canvas.width;
      const py = p.y * canvas.height;

      ctx.beginPath();
      ctx.arc(px, py, 4.5, 0, 2 * Math.PI);
      ctx.fillStyle = jointColor;
      ctx.fill();
      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    ctx.restore();
  }
}
