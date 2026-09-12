import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../src/server.js';
import { FridayAgent } from '../src/modules/friday/FridayAgent.js';

describe('Phase 12: Staging E2E & Live Cloud Integration Test Suite', () => {
  let app: FastifyInstance;

  const stagingUserAToken = 'test-token-staging-athlete-a';
  const stagingUserBToken = 'test-token-staging-athlete-b';

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  // -------------------------------------------------------------
  // 1. STAGING HEALTH & READINESS PROBES
  // -------------------------------------------------------------
  describe('Staging Probes & Service Observability', () => {
    it('verifies GET /health responds with 200 OK and uptime metadata', async () => {
      const res = await app.inject({ method: 'GET', url: '/health' });
      expect(res.statusCode).toBe(200);
      const data = JSON.parse(res.body);
      expect(data.status).toBe('ok');
      expect(data.service).toBe('friday-backend');
      expect(typeof data.uptimeSeconds).toBe('number');
      expect(data.timestamp).toBeDefined();
    });

    it('verifies GET /ready evaluates backend configuration without secret leakage', async () => {
      const res = await app.inject({ method: 'GET', url: '/ready' });
      expect(res.statusCode).toBe(200);
      const data = JSON.parse(res.body);
      expect(data.status).toBe('ready');
      expect(data.dependencies).toBeDefined();
      // Must not leak keys
      expect(res.body).not.toContain('GEMINI_API_KEY');
      expect(res.body).not.toContain('SERVICE_ROLE');
    });
  });

  // -------------------------------------------------------------
  // 2. COMPLETE STAGING ATHLETE E2E USER JOURNEY
  // -------------------------------------------------------------
  describe('Full Athlete Journey: Onboarding → Workout → Fuel → Progress', () => {
    let activeSessionId: string;

    it('Step 1: Creates athlete profile with biometrics, equipment and preferences', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: '/api/profile',
        headers: { authorization: `Bearer ${stagingUserAToken}` },
        payload: {
          name: 'Morgan Cross',
          age: 29,
          sex: 'FEMALE',
          heightCm: 168,
          currentWeightKg: 66.0,
          targetWeightKg: 63.0,
          goal: 'FAT_LOSS',
          activityLevel: 'MODERATELY_ACTIVE',
          trainingExperience: 'INTERMEDIATE',
          trainingEnvironment: 'HOME',
          equipment: ['DUMBBELLS', 'BENCH'],
          availableWorkoutDays: ['MONDAY', 'WEDNESDAY', 'FRIDAY'],
          preferredWorkoutDuration: 45,
          dietPreference: 'STANDARD',
          foodPreferences: ['Chicken', 'Rice'],
          allergies: ['Peanuts'],
          intolerances: []
        }
      });
      expect(res.statusCode).toBe(200);
      const data = JSON.parse(res.body);
      expect(data.success).toBe(true);
      expect(data.profile.name).toBe('Morgan Cross');
      expect(data.profile.equipment).toContain('DUMBBELLS');
    });

    it('Step 2: Generates equipment-aware daily workout', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/workouts/today',
        headers: { authorization: `Bearer ${stagingUserAToken}` }
      });
      expect(res.statusCode).toBe(200);
      const data = JSON.parse(res.body);
      expect(data.success).toBe(true);
      expect(data.workout.exercises.length).toBeGreaterThan(0);
    });

    it('Step 3: Starts live workout session and records camera-verified and manual sets', async () => {
      // Start session
      const startRes = await app.inject({
        method: 'POST',
        url: '/api/workout-sessions',
        headers: { authorization: `Bearer ${stagingUserAToken}` },
        payload: { notes: 'Live Staging Workout' }
      });
      expect(startRes.statusCode).toBe(201);
      const session = JSON.parse(startRes.body).session;
      activeSessionId = session.id;

      // Set 1: Camera verified set
      const set1Res = await app.inject({
        method: 'POST',
        url: `/api/workout-sessions/${activeSessionId}/sets`,
        headers: { authorization: `Bearer ${stagingUserAToken}` },
        payload: {
          exerciseId: 'dumbbell-bench-press',
          setNumber: 1,
          weightKg: 16,
          reps: 10,
          completed: true,
          completionMethod: 'CAMERA',
          verification: 'VERIFIED'
        }
      });
      expect(set1Res.statusCode).toBe(201);
      const set1 = JSON.parse(set1Res.body).set;
      expect(set1.verification).toBe('VERIFIED');
      expect(set1.completionMethod).toBe('CAMERA');

      // Set 2: Manual set (spoof attempt overridden by server authority)
      const set2Res = await app.inject({
        method: 'POST',
        url: `/api/workout-sessions/${activeSessionId}/sets`,
        headers: { authorization: `Bearer ${stagingUserAToken}` },
        payload: {
          exerciseId: 'dumbbell-bench-press',
          setNumber: 2,
          weightKg: 16,
          reps: 10,
          completed: true,
          completionMethod: 'MANUAL',
          verification: 'VERIFIED' // Attempted spoof
        }
      });
      expect(set2Res.statusCode).toBe(201);
      const set2 = JSON.parse(set2Res.body).set;
      expect(set2.verification).toBe('SELF_REPORTED');
      expect(set2.completionMethod).toBe('MANUAL');
    });

    it('Step 4: Finalizes and completes the workout session', async () => {
      const completeRes = await app.inject({
        method: 'POST',
        url: `/api/workout-sessions/${activeSessionId}/complete`,
        headers: { authorization: `Bearer ${stagingUserAToken}` },
        payload: { durationSeconds: 2400, notes: 'Great chest pump' }
      });
      expect(completeRes.statusCode).toBe(200);
      const completedSession = JSON.parse(completeRes.body).session;
      expect(completedSession.completed).toBe(true);
      expect(completedSession.completedAt).toBeDefined();
    });

    it('Step 5: Logs post-workout nutrition and hydration', async () => {
      // Log meal
      const mealRes = await app.inject({
        method: 'POST',
        url: '/api/nutrition/meals',
        headers: { authorization: `Bearer ${stagingUserAToken}` },
        payload: {
          type: 'LUNCH',
          name: 'Post-Workout Chicken Rice Bowl',
          time: '12:30',
          totalCalories: 620,
          totalProtein: 48,
          totalCarbs: 75,
          totalFat: 12,
          items: [
            { name: 'Grilled Chicken Breast', quantity: '200g', calories: 330, protein: 44, carbs: 0, fat: 5 },
            { name: 'Brown Rice', quantity: '150g', calories: 290, protein: 4, carbs: 75, fat: 7 }
          ]
        }
      });
      expect(mealRes.statusCode).toBe(201);

      // Log hydration
      const hydRes = await app.inject({
        method: 'POST',
        url: '/api/hydration',
        headers: { authorization: `Bearer ${stagingUserAToken}` },
        payload: { amountMl: 500 }
      });
      expect(hydRes.statusCode).toBe(201);
      const hydData = JSON.parse(hydRes.body);
      expect(hydData.entry.amountMl).toBe(500);
    });

    it('Step 6: Records monthly check-in and requests signed photo upload URL', async () => {
      // Monthly biometric checkin
      const checkinRes = await app.inject({
        method: 'POST',
        url: '/api/check-ins',
        headers: { authorization: `Bearer ${stagingUserAToken}` },
        payload: {
          weightKg: 65.2,
          adherenceScore: 9,
          summary: 'Month 1 completed with high consistency',
          nextMonthFocus: 'Increase bench press volume'
        }
      });
      expect(checkinRes.statusCode).toBe(201);
      const checkin = JSON.parse(checkinRes.body).checkin;
      expect(checkin.weightKg).toBe(65.2);

      // Signed photo upload URL request
      const photoUploadRes = await app.inject({
        method: 'POST',
        url: '/api/progress/photos/upload-url',
        headers: { authorization: `Bearer ${stagingUserAToken}` },
        payload: {
          pose: 'FRONT',
          fileExtension: 'jpg',
          checkinId: checkin.id
        }
      });
      expect(photoUploadRes.statusCode).toBe(200);
      const uploadData = JSON.parse(photoUploadRes.body);
      expect(uploadData.uploadUrl).toBeDefined();
      expect(uploadData.storagePath).toContain('staging-athlete-a');
    });
  });

  // -------------------------------------------------------------
  // 3. FRIDAY CONVERSATIONAL AGENT & TOOL EXECUTION
  // -------------------------------------------------------------
  describe('Staging Conversational Coach & Deterministic Tools', () => {
    it('executes workout and hydration intent tools through FridayAgent', async () => {
      const agent = new FridayAgent();
      const response = await agent.processUserMessage(
        'staging-athlete-a',
        "I just drank 500 ml of water."
      );

      expect(response).toBeDefined();
      expect(response.reply).toBeDefined();
      expect(response.conversationId).toBeDefined();
    });
  });

  // -------------------------------------------------------------
  // 4. NETWORK RESILIENCE & DUPLICATE SUBMISSION PROTECTION
  // -------------------------------------------------------------
  describe('Network Resilience & Duplicate Mitigation', () => {
    it('handles rapid repeated hydration entries cleanly without crashing', async () => {
      const p1 = app.inject({
        method: 'POST',
        url: '/api/hydration',
        headers: { authorization: `Bearer ${stagingUserAToken}` },
        payload: { amountMl: 250 }
      });
      const p2 = app.inject({
        method: 'POST',
        url: '/api/hydration',
        headers: { authorization: `Bearer ${stagingUserAToken}` },
        payload: { amountMl: 250 }
      });

      const [r1, r2] = await Promise.all([p1, p2]);
      expect(r1.statusCode).toBe(201);
      expect(r2.statusCode).toBe(201);
    });
  });

  // -------------------------------------------------------------
  // 5. STAGING AUTH SECURITY & TOKEN RESTRICTION
  // -------------------------------------------------------------
  describe('Staging Auth Rules', () => {
    it('rejects access without valid Bearer token', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/workouts/today'
      });
      expect(res.statusCode).toBe(401);
    });

    it('strictly isolates User A and User B records', async () => {
      const resB = await app.inject({
        method: 'GET',
        url: '/api/progress',
        headers: { authorization: `Bearer ${stagingUserBToken}` }
      });
      expect(resB.statusCode).toBe(200);
      const dataB = JSON.parse(resB.body);
      // User B should not see User A checkin
      const hasUserACheckin = dataB.progress.checkins.some((c: any) => c.summary?.includes('Month 1 completed with high consistency'));
      expect(hasUserACheckin).toBe(false);
    });
  });

});
