import { describe, it, expect, beforeEach } from 'vitest';
import { PushUpAnalyzer } from '../src/features/camera/analyzers/PushUpAnalyzer';
import { SquatAnalyzer } from '../src/features/camera/analyzers/SquatAnalyzer';
import { BicepCurlAnalyzer } from '../src/features/camera/analyzers/BicepCurlAnalyzer';
import { resolveExerciseAnalyzer } from '../src/features/camera/analyzers/analyzerRegistry';
import { POSE_LANDMARKS, PoseLandmark } from '../src/features/camera/types';

// Helper to create a baseline 33 landmark dummy skeleton
function createDummySkeleton(): PoseLandmark[] {
  const landmarks: PoseLandmark[] = [];
  for (let i = 0; i < 33; i++) {
    landmarks.push({ x: 0.5, y: 0.5, z: 0, visibility: 0.95 });
  }
  return landmarks;
}

// Push-up landmark builder with configurable elbow and body-line angles
function createPushUpFrame(elbowAngleDeg: number, isSagging = false): PoseLandmark[] {
  const skeleton = createDummySkeleton();
  
  // Shoulder at (0.4, 0.4)
  skeleton[POSE_LANDMARKS.LEFT_SHOULDER] = { x: 0.4, y: 0.4, z: 0, visibility: 0.95 };
  
  // Elbow vertex at (0.4, 0.6). Vector BA is (0, -0.2), angle -90 deg.
  skeleton[POSE_LANDMARKS.LEFT_ELBOW] = { x: 0.4, y: 0.6, z: 0, visibility: 0.95 };
  
  // Wrist positioned so angle between BA and BC equals elbowAngleDeg
  const rad = ((-90 + elbowAngleDeg) * Math.PI) / 180;
  skeleton[POSE_LANDMARKS.LEFT_WRIST] = {
    x: 0.4 + Math.cos(rad) * 0.2,
    y: 0.6 + Math.sin(rad) * 0.2,
    z: 0,
    visibility: 0.95
  };

  // Body alignment: Shoulder (0.4, 0.4) -> Hip (0.6, y) -> Ankle (0.8, 0.4)
  skeleton[POSE_LANDMARKS.LEFT_HIP] = { 
    x: 0.6, 
    y: isSagging ? 0.7 : 0.4, // Sagging dips hip down
    z: 0, 
    visibility: 0.95 
  };
  skeleton[POSE_LANDMARKS.LEFT_ANKLE] = { x: 0.8, y: 0.4, z: 0, visibility: 0.95 };

  return skeleton;
}

// Squat landmark builder with configurable knee angle (Hip - Knee - Ankle)
function createSquatFrame(kneeAngleDeg: number, torsoLeaning = false): PoseLandmark[] {
  const skeleton = createDummySkeleton();

  // Shoulder: if leaning, tilted forward
  skeleton[POSE_LANDMARKS.LEFT_SHOULDER] = {
    x: torsoLeaning ? 0.15 : 0.5,
    y: 0.15,
    z: 0,
    visibility: 0.95
  };

  // Hip at (0.5, 0.45)
  skeleton[POSE_LANDMARKS.LEFT_HIP] = { x: 0.5, y: 0.45, z: 0, visibility: 0.95 };

  // Knee vertex at (0.5, 0.7). Vector KB is (0, -0.25), angle -90 deg.
  skeleton[POSE_LANDMARKS.LEFT_KNEE] = { x: 0.5, y: 0.7, z: 0, visibility: 0.95 };

  // Ankle based on knee angle
  const rad = ((-90 + kneeAngleDeg) * Math.PI) / 180;
  skeleton[POSE_LANDMARKS.LEFT_ANKLE] = {
    x: 0.5 + Math.cos(rad) * 0.2,
    y: 0.7 + Math.sin(rad) * 0.2,
    z: 0,
    visibility: 0.95
  };

  return skeleton;
}

// Bicep curl landmark builder with configurable elbow flexion angle
function createBicepCurlFrame(elbowAngleDeg: number, elbowFlaring = false): PoseLandmark[] {
  const skeleton = createDummySkeleton();

  // Shoulder at (0.5, 0.3)
  skeleton[POSE_LANDMARKS.LEFT_SHOULDER] = { x: 0.5, y: 0.3, z: 0, visibility: 0.95 };

  // Hip at (0.5, 0.6)
  skeleton[POSE_LANDMARKS.LEFT_HIP] = { x: 0.5, y: 0.6, z: 0, visibility: 0.95 };

  // Elbow at (x, 0.6) - if flaring, elbow moves far out from hip x
  skeleton[POSE_LANDMARKS.LEFT_ELBOW] = { 
    x: elbowFlaring ? 0.75 : 0.5, 
    y: 0.6, 
    z: 0, 
    visibility: 0.95 
  };

  // Wrist based on flexion angle relative to shoulder-elbow vector (0, -0.3)
  const rad = ((-90 + elbowAngleDeg) * Math.PI) / 180;
  skeleton[POSE_LANDMARKS.LEFT_WRIST] = {
    x: (elbowFlaring ? 0.75 : 0.5) + Math.cos(rad) * 0.18,
    y: 0.6 + Math.sin(rad) * 0.18,
    z: 0,
    visibility: 0.95
  };

  return skeleton;
}

describe('FRIDAY Phase 5 — Computer Vision, Pose Estimation & Rep State Machines', () => {

  // ==========================================
  // 1. PUSH-UP ANALYZER TESTS
  // ==========================================
  describe('PushUpAnalyzer', () => {
    let analyzer: PushUpAnalyzer;

    beforeEach(() => {
      analyzer = new PushUpAnalyzer();
    });

    it('should complete a valid repetition through TOP -> DESCENDING -> BOTTOM -> ASCENDING -> TOP', async () => {
      expect(analyzer.exerciseId).toBe('push-up');

      // 1. Start at TOP (straight arms, ~160 deg)
      let out = analyzer.process(createPushUpFrame(160), 0.90);
      expect(out.phase).toBe('TOP');
      expect(out.repCount).toBe(0);

      // 2. Descending (~130 deg)
      out = analyzer.process(createPushUpFrame(130), 0.90);
      expect(out.phase).toBe('DESCENDING');
      expect(out.repCount).toBe(0);

      // 3. Bottom depth reached (~85 deg <= 95)
      out = analyzer.process(createPushUpFrame(85), 0.90);
      expect(out.phase).toBe('BOTTOM');
      expect(out.repCount).toBe(0);

      // 4. Ascending back up (~120 deg)
      out = analyzer.process(createPushUpFrame(120), 0.90);
      expect(out.phase).toBe('ASCENDING');
      expect(out.repCount).toBe(0);

      // Add a slight delay to satisfy the 800ms debounce
      await new Promise(r => setTimeout(r, 850));

      // 5. Back to TOP (~160 deg) -> triggers rep count
      out = analyzer.process(createPushUpFrame(160), 0.90);
      expect(out.phase).toBe('TOP');
      expect(out.repCount).toBe(1);
      expect(out.isRepCompleted).toBe(true);
    });

    it('should NOT count rep if movement is incomplete (fails to reach bottom depth)', () => {
      // Start top
      analyzer.process(createPushUpFrame(160), 0.90);
      // Descend partially to only 110 deg (bottom requires <= 95)
      analyzer.process(createPushUpFrame(110), 0.90);
      // Return straight back to top
      const out = analyzer.process(createPushUpFrame(160), 0.90);

      expect(out.repCount).toBe(0);
      expect(out.form.quality).toBe('NEEDS_ADJUSTMENT');
      expect(out.form.cue).toContain('Go a little deeper');
    });

    it('should NOT double count on duplicate identical frames', async () => {
      analyzer.process(createPushUpFrame(160), 0.90);
      analyzer.process(createPushUpFrame(130), 0.90);
      analyzer.process(createPushUpFrame(85), 0.90);
      analyzer.process(createPushUpFrame(120), 0.90);

      await new Promise(r => setTimeout(r, 850));

      analyzer.process(createPushUpFrame(160), 0.90);
      expect(analyzer.process(createPushUpFrame(160), 0.90).repCount).toBe(1);
      expect(analyzer.process(createPushUpFrame(160), 0.90).repCount).toBe(1);
    });

    it('should reject rep counting and warn when pose confidence is too low', () => {
      const out = analyzer.process(createPushUpFrame(160), 0.35); // Very low confidence
      expect(out.form.quality).toBe('POOR');
      expect(out.form.cue).toContain('Position your full body clearly');
      expect(out.repCount).toBe(0);
    });

    it('should issue a body alignment form warning if hips sag significantly', () => {
      const out = analyzer.process(createPushUpFrame(155, true), 0.90); // isSagging = true
      expect(out.form.quality).toBe('NEEDS_ADJUSTMENT');
      expect(out.form.cue).toContain('Keep your body straight');
    });
  });

  // ==========================================
  // 2. SQUAT ANALYZER TESTS
  // ==========================================
  describe('SquatAnalyzer', () => {
    let analyzer: SquatAnalyzer;

    beforeEach(() => {
      analyzer = new SquatAnalyzer();
    });

    it('should complete a valid squat repetition', async () => {
      // 1. Standing upright (knee ~170 deg)
      let out = analyzer.process(createSquatFrame(170), 0.90);
      expect(out.phase).toBe('TOP');

      // 2. Descending (knee ~140 deg)
      out = analyzer.process(createSquatFrame(140), 0.90);
      expect(out.phase).toBe('DESCENDING');

      // 3. Parallel squat depth (knee ~90 deg <= 95)
      out = analyzer.process(createSquatFrame(90), 0.90);
      expect(out.phase).toBe('BOTTOM');

      // 4. Ascending (knee ~125 deg)
      out = analyzer.process(createSquatFrame(125), 0.90);
      expect(out.phase).toBe('ASCENDING');

      await new Promise(r => setTimeout(r, 950));

      // 5. Back to standing (knee ~165 deg)
      out = analyzer.process(createSquatFrame(165), 0.90);
      expect(out.phase).toBe('TOP');
      expect(out.repCount).toBe(1);
      expect(out.isRepCompleted).toBe(true);
    });

    it('should provide form warning if chest leans too far forward', () => {
      const out = analyzer.process(createSquatFrame(165, true), 0.90); // torsoLeaning = true
      expect(out.form.quality).toBe('NEEDS_ADJUSTMENT');
      expect(out.form.cue).toContain('Keep your chest up');
    });
  });

  // ==========================================
  // 3. BICEP CURL ANALYZER TESTS
  // ==========================================
  describe('BicepCurlAnalyzer', () => {
    let analyzer: BicepCurlAnalyzer;

    beforeEach(() => {
      analyzer = new BicepCurlAnalyzer();
    });

    it('should complete a valid bicep curl repetition', async () => {
      // 1. Extended at bottom (~155 deg)
      let out = analyzer.process(createBicepCurlFrame(155), 0.90);
      expect(out.phase).toBe('BOTTOM');

      // 2. Ascending (~115 deg)
      out = analyzer.process(createBicepCurlFrame(115), 0.90);
      expect(out.phase).toBe('ASCENDING');

      // 3. Peak contraction at top (~50 deg <= 60)
      out = analyzer.process(createBicepCurlFrame(50), 0.90);
      expect(out.phase).toBe('TOP');

      // 4. Descending (~85 deg)
      out = analyzer.process(createBicepCurlFrame(85), 0.90);
      expect(out.phase).toBe('DESCENDING');

      await new Promise(r => setTimeout(r, 850));

      // 5. Returned to full extension bottom (~155 deg)
      out = analyzer.process(createBicepCurlFrame(155), 0.90);
      expect(out.phase).toBe('BOTTOM');
      expect(out.repCount).toBe(1);
      expect(out.isRepCompleted).toBe(true);
    });

    it('should warn when elbows swing significantly away from torso', () => {
      const out = analyzer.process(createBicepCurlFrame(110, true), 0.90); // elbowFlaring = true
      expect(out.form.quality).toBe('NEEDS_ADJUSTMENT');
      expect(out.form.cue).toContain('Keep your elbows pinned');
    });
  });

  // ==========================================
  // 4. EQUIPMENT CONSTRAINT & REGISTRY TESTS
  // ==========================================
  describe('Exercise Analyzer Registry & Equipment Safety Constraints', () => {
    it('always permits Push-up analyzer for zero equipment profile (HOME + NONE)', () => {
      const result = resolveExerciseAnalyzer('push-up', 'Push-up', {
        trainingEnvironment: 'HOME',
        equipment: ['NONE']
      });
      expect(result.allowed).toBe(true);
      expect(result.analyzer).toBeInstanceOf(PushUpAnalyzer);
    });

    it('always permits Bodyweight Squat analyzer for zero equipment profile (HOME + NONE)', () => {
      const result = resolveExerciseAnalyzer('bodyweight-squat', 'Bodyweight Squat', {
        trainingEnvironment: 'HOME',
        equipment: ['NONE']
      });
      expect(result.allowed).toBe(true);
      expect(result.analyzer).toBeInstanceOf(SquatAnalyzer);
    });

    it('STRICTLY BLOCKS Bicep Curl analyzer if user profile has zero equipment (NONE)', () => {
      const result = resolveExerciseAnalyzer('dumbbell-curl', 'Dumbbell Curl', {
        trainingEnvironment: 'HOME',
        equipment: ['NONE']
      });
      expect(result.allowed).toBe(false);
      expect(result.analyzer).toBeNull();
      expect(result.reason).toContain('require Dumbbells');
    });

    it('permits Bicep Curl analyzer if user profile includes DUMBBELLS', () => {
      const result = resolveExerciseAnalyzer('dumbbell-curl', 'Dumbbell Curl', {
        trainingEnvironment: 'HOME',
        equipment: ['DUMBBELLS']
      });
      expect(result.allowed).toBe(true);
      expect(result.analyzer).toBeInstanceOf(BicepCurlAnalyzer);
    });
  });
});
