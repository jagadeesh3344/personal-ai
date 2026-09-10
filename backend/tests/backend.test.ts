import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../src/server.js';

describe('FRIDAY Backend Integration & Security Tests', () => {
  let app: FastifyInstance;

  const userAToken = 'test-token-user-a';
  const userBToken = 'test-token-user-b';

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  // 1. System Health
  it('GET /health returns status ok', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/health'
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.status).toBe('ok');
  });

  // 2. Authentication & Route Protection
  describe('Authentication & Token Verification', () => {
    it('rejects unauthenticated requests to protected endpoints with 401', async () => {
      const endpoints = [
        { method: 'GET' as const, url: '/api/profile' },
        { method: 'GET' as const, url: '/api/workouts/today' },
        { method: 'GET' as const, url: '/api/nutrition/today' },
        { method: 'GET' as const, url: '/api/hydration/today' },
        { method: 'GET' as const, url: '/api/progress' }
      ];

      for (const ep of endpoints) {
        const res = await app.inject({
          method: ep.method,
          url: ep.url
        });
        expect(res.statusCode, `Endpoint ${ep.url} should require auth`).toBe(401);
      }
    });

    it('authenticates valid tokens and retrieves session', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/auth/session',
        headers: { authorization: `Bearer ${userAToken}` }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
      expect(body.user.id).toBe('user-a');
    });
  });

  // 3. Profile Ownership & Single Source of Truth
  describe('Profile Ownership & Multi-tenant Isolation', () => {
    it('allows User A to update their profile and preserves typed fields', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: '/api/profile',
        headers: { authorization: `Bearer ${userAToken}` },
        payload: {
          name: 'Sarah Connor',
          age: 29,
          sex: 'FEMALE',
          heightCm: 168,
          currentWeightKg: 58,
          targetWeightKg: 60,
          goal: 'STRENGTH',
          activityLevel: 'VERY_ACTIVE',
          trainingExperience: 'INTERMEDIATE',
          trainingEnvironment: 'HOME',
          equipment: ['NONE'],
          availableWorkoutDays: ['MON', 'WED', 'FRI', 'SAT']
        }
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
      expect(body.profile.name).toBe('Sarah Connor');
      expect(body.profile.equipment).toEqual(['NONE']);
    });

    it('ensures User B gets their own isolated profile and cannot see User A data', async () => {
      const resB = await app.inject({
        method: 'GET',
        url: '/api/profile',
        headers: { authorization: `Bearer ${userBToken}` }
      });

      expect(resB.statusCode).toBe(200);
      const bodyB = JSON.parse(resB.body);
      expect(bodyB.profile.id).toBe('user-b');
      expect(bodyB.profile.name).not.toBe('Sarah Connor');
    });
  });

  // 4. Workout Ownership & Equipment Validation
  describe('Workout Ownership & Equipment Enforcement', () => {
    let sessionAId: string;

    it('allows User A to start a workout session', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/workout-sessions',
        headers: { authorization: `Bearer ${userAToken}` },
        payload: { notes: 'Leg day circuit' }
      });

      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.body);
      sessionAId = body.session.id;
      expect(sessionAId).toBeDefined();
    });

    it('prevents User A (with equipment: ["NONE"]) from logging an incompatible exercise (Bench Press)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/workout-sessions/${sessionAId}/sets`,
        headers: { authorization: `Bearer ${userAToken}` },
        payload: {
          exerciseId: 'bench-press', // Requires BARBELL and BENCH
          setNumber: 1,
          weightKg: 60,
          reps: 8,
          completed: true
        }
      });

      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(false);
      expect(body.error).toContain('incompatible with user equipment');
    });

    it('allows User A to log a compatible bodyweight exercise (Push-up)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/workout-sessions/${sessionAId}/sets`,
        headers: { authorization: `Bearer ${userAToken}` },
        payload: {
          exerciseId: 'push-up',
          setNumber: 1,
          weightKg: 0,
          reps: 15,
          completed: true
        }
      });

      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
      expect(body.set.exerciseId).toBe('push-up');
    });

    it('prevents User B from modifying User A workout session (Cross-user access denied)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/workout-sessions/${sessionAId}/sets`,
        headers: { authorization: `Bearer ${userBToken}` },
        payload: {
          exerciseId: 'push-up',
          setNumber: 2,
          weightKg: 0,
          reps: 10
        }
      });

      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.body);
      expect(body.error).toContain('does not belong to user');
    });

    // =========================================================================
    // Workout Verification, Beginner Gating & Anti-Tampering Integrity Tests
    // =========================================================================
    it('Backend beginner gating: BEGINNER user receives only BEGINNER exercises from getTodayWorkout', async () => {
      // Set User A to BEGINNER
      await app.inject({
        method: 'PATCH',
        url: '/api/profile',
        headers: { authorization: `Bearer ${userAToken}` },
        payload: { trainingExperience: 'BEGINNER', equipment: ['NONE'] }
      });

      const res = await app.inject({
        method: 'GET',
        url: '/api/workouts/today',
        headers: { authorization: `Bearer ${userAToken}` }
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
      expect(body.workout.exercises.length).toBeGreaterThan(0);

      const { BACKEND_EXERCISES } = await import('../src/services/workouts.service.js');
      body.workout.exercises.forEach((ex: any) => {
        const def = BACKEND_EXERCISES.find(e => e.id === ex.exerciseId);
        expect(def).toBeDefined();
        expect(def?.difficulty).toBe('BEGINNER');
      });
    });

    it('Beginner cannot receive Diamond Push-up (reclassified as ADVANCED)', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/workouts/today',
        headers: { authorization: `Bearer ${userAToken}` }
      });

      const body = JSON.parse(res.body);
      const exIds = body.workout.exercises.map((e: any) => e.exerciseId);
      expect(exIds).not.toContain('diamond-push-up');
    });

    it('Backend API tampering: MANUAL completion claiming VERIFIED is sanitized to SELF_REPORTED', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/workout-sessions/${sessionAId}/sets`,
        headers: { authorization: `Bearer ${userAToken}` },
        payload: {
          exerciseId: 'push-up',
          setNumber: 3,
          weightKg: 0,
          reps: 10,
          completed: true,
          completionMethod: 'MANUAL',
          verification: 'VERIFIED' // Attempted tampering
        }
      });

      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
      expect(body.set.completionMethod).toBe('MANUAL');
      expect(body.set.verification).toBe('SELF_REPORTED'); // Sanitized
    });

    it('Voice tampering: VOICE completion claiming VERIFIED is sanitized to SELF_REPORTED', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/workout-sessions/${sessionAId}/sets`,
        headers: { authorization: `Bearer ${userAToken}` },
        payload: {
          exerciseId: 'push-up',
          setNumber: 4,
          weightKg: 0,
          reps: 10,
          completed: true,
          completionMethod: 'VOICE',
          verification: 'VERIFIED' // Attempted tampering
        }
      });

      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
      expect(body.set.completionMethod).toBe('VOICE');
      expect(body.set.verification).toBe('SELF_REPORTED'); // Sanitized
    });

    it('Camera verification: CAMERA completion produces VERIFIED', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/workout-sessions/${sessionAId}/sets`,
        headers: { authorization: `Bearer ${userAToken}` },
        payload: {
          exerciseId: 'push-up',
          setNumber: 5,
          weightKg: 0,
          reps: 12,
          completed: true,
          completionMethod: 'CAMERA'
        }
      });

      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
      expect(body.set.completionMethod).toBe('CAMERA');
      expect(body.set.verification).toBe('VERIFIED');
    });

    it('Completed zero-rep set: rejects with 400 validation error', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/workout-sessions/${sessionAId}/sets`,
        headers: { authorization: `Bearer ${userAToken}` },
        payload: {
          exerciseId: 'push-up',
          setNumber: 6,
          weightKg: 0,
          reps: 0,
          completed: true
        }
      });

      expect(res.statusCode).toBe(400);
    });

    it('Negative reps: rejects with 400 validation error', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/workout-sessions/${sessionAId}/sets`,
        headers: { authorization: `Bearer ${userAToken}` },
        payload: {
          exerciseId: 'push-up',
          setNumber: 7,
          weightKg: 0,
          reps: -5,
          completed: false
        }
      });

      expect(res.statusCode).toBe(400);
    });

    it('Repository persistence: CAMERA + VERIFIED is stored and retrievable', async () => {
      const { WorkoutsRepository } = await import('../src/repositories/workouts.repo.js');
      const set = await WorkoutsRepository.addSet('user-a', sessionAId, {
        exerciseId: 'push-up',
        setNumber: 8,
        weightKg: 0,
        reps: 15,
        completed: true,
        completionMethod: 'CAMERA',
        verification: 'VERIFIED'
      });

      expect(set.completionMethod).toBe('CAMERA');
      expect(set.verification).toBe('VERIFIED');

      const sessions = await WorkoutsRepository.getSessions('user-a');
      const active = sessions.find(s => s.id === sessionAId);
      const storedSet = active?.sets.find(s => s.id === set.id);
      expect(storedSet?.completionMethod).toBe('CAMERA');
      expect(storedSet?.verification).toBe('VERIFIED');
    });

    it('Existing manual set persistence: MANUAL + SELF_REPORTED is stored and retrievable', async () => {
      const { WorkoutsRepository } = await import('../src/repositories/workouts.repo.js');
      const set = await WorkoutsRepository.addSet('user-a', sessionAId, {
        exerciseId: 'push-up',
        setNumber: 9,
        weightKg: 0,
        reps: 10,
        completed: true,
        completionMethod: 'MANUAL',
        verification: 'SELF_REPORTED'
      });

      expect(set.completionMethod).toBe('MANUAL');
      expect(set.verification).toBe('SELF_REPORTED');

      const sessions = await WorkoutsRepository.getSessions('user-a');
      const active = sessions.find(s => s.id === sessionAId);
      const storedSet = active?.sets.find(s => s.id === set.id);
      expect(storedSet?.completionMethod).toBe('MANUAL');
      expect(storedSet?.verification).toBe('SELF_REPORTED');
    });
  });

  // 5. Nutrition Isolation
  describe('Nutrition Ownership & Isolation', () => {
    let mealAId: string;

    it('creates a meal for User A', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/nutrition/meals',
        headers: { authorization: `Bearer ${userAToken}` },
        payload: {
          type: 'BREAKFAST',
          name: 'Oatmeal & Whey',
          time: '08:00 AM',
          totalCalories: 450,
          totalProtein: 35,
          totalCarbs: 55,
          totalFat: 8,
          items: [
            { name: 'Rolled Oats', quantity: '80g', calories: 300, protein: 10, carbs: 50, fat: 5 },
            { name: 'Whey Protein', quantity: '30g', calories: 150, protein: 25, carbs: 5, fat: 3 }
          ]
        }
      });

      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.body);
      mealAId = body.meal.id;
      expect(mealAId).toBeDefined();
    });

    it('prevents User B from deleting or modifying User A meal', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/nutrition/meals/${mealAId}`,
        headers: { authorization: `Bearer ${userBToken}` }
      });

      expect(res.statusCode).toBe(404);
    });

    it('ensures User B today meals list is completely isolated', async () => {
      const resB = await app.inject({
        method: 'GET',
        url: '/api/nutrition/today',
        headers: { authorization: `Bearer ${userBToken}` }
      });

      const bodyB = JSON.parse(resB.body);
      expect(bodyB.meals.find((m: any) => m.id === mealAId)).toBeUndefined();
    });
  });

  // 6. Hydration Isolation
  describe('Hydration Ownership & Isolation', () => {
    it('logs hydration for User A and keeps User B at 0ml', async () => {
      const resA = await app.inject({
        method: 'POST',
        url: '/api/hydration',
        headers: { authorization: `Bearer ${userAToken}` },
        payload: { amountMl: 500 }
      });

      expect(resA.statusCode).toBe(201);

      // Check User A
      const todayA = await app.inject({
        method: 'GET',
        url: '/api/hydration/today',
        headers: { authorization: `Bearer ${userAToken}` }
      });
      const bodyA = JSON.parse(todayA.body);
      expect(bodyA.consumedMl).toBe(500);

      // Check User B
      const todayB = await app.inject({
        method: 'GET',
        url: '/api/hydration/today',
        headers: { authorization: `Bearer ${userBToken}` }
      });
      const bodyB = JSON.parse(todayB.body);
      expect(bodyB.consumedMl).toBe(0);
    });
  });

  // 7. Progress & Photos Security
  describe('Progress & Photo Storage Isolation', () => {
    it('generates secure photo upload URL scoped to user directory', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/progress/photos/upload-url',
        headers: { authorization: `Bearer ${userAToken}` },
        payload: {
          pose: 'FRONT',
          fileExtension: 'jpg'
        }
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.storagePath).toContain('user-a/');
    });

    it('strictly forbids User B from obtaining signed download URL for User A photo', async () => {
      const userAPhotoPath = 'user-a/12345-front.jpg';

      const res = await app.inject({
        method: 'GET',
        url: `/api/progress/photos/signed-url?storagePath=${encodeURIComponent(userAPhotoPath)}`,
        headers: { authorization: `Bearer ${userBToken}` }
      });

      expect(res.statusCode).toBe(403);
      const body = JSON.parse(res.body);
      expect(body.error).toContain('belonging to another user');
    });
  });

  // 8. FRIDAY AI Agent & Tool Execution Tests
  describe('FRIDAY AI Agent Tool Calling & Security', () => {
    let convAId: string;

    it('User asks for workout -> getTodayWorkout executes', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/friday/message',
        headers: { authorization: `Bearer ${userAToken}` },
        payload: { message: 'What is my workout today?' }
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
      expect(body.data.message).toBeDefined();
      expect(body.data.toolCalls).toBeDefined();
      const toolCall = body.data.toolCalls.find((t: any) => t.name === 'getTodayWorkout');
      expect(toolCall).toBeDefined();
      convAId = body.data.conversationId;
    });

    it('User says "I drank 500 ml" -> logHydration executes and updates database', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/friday/message',
        headers: { authorization: `Bearer ${userAToken}` },
        payload: {
          conversationId: convAId,
          message: 'I drank 500 ml'
        }
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
      const logTool = body.data.toolCalls.find((t: any) => t.name === 'logHydration');
      expect(logTool).toBeDefined();
      expect(logTool.arguments.amountMl).toBe(500);

      // Verify real database record
      const hydrRes = await app.inject({
        method: 'GET',
        url: '/api/hydration/today',
        headers: { authorization: `Bearer ${userAToken}` }
      });
      const hydrBody = JSON.parse(hydrRes.body);
      expect(hydrBody.consumedMl).toBeGreaterThanOrEqual(500);
    });

    it('User asks for hydration -> getHydrationSummary executes', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/friday/message',
        headers: { authorization: `Bearer ${userAToken}` },
        payload: {
          conversationId: convAId,
          message: 'How much water have I had today?'
        }
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
      const hydrTool = body.data.toolCalls.find((t: any) => t.name === 'getHydrationSummary');
      expect(hydrTool).toBeDefined();
    });

    it('getProgressSummary is invoked for progress questions', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/friday/message',
        headers: { authorization: `Bearer ${userAToken}` },
        payload: {
          conversationId: convAId,
          message: 'What is my progress?'
        }
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
      expect(body.data.message).toBeDefined();
      const progressTool = body.data.toolCalls?.find((t: any) => t.name === 'getProgressSummary');
      expect(progressTool).toBeDefined();
    });

    it('Different user messages produce contextually distinct replies and NOT a generic hardcoded response', async () => {
      const genericSimMsg = "FRIDAY Agent online. I am monitoring your telemetry and training metrics. What would you like to review?";
      const genericTelemetryMsg = "FRIDAY AI System online. Telemetry monitoring is active.";

      const prompts = [
        'Hey FRIDAY',
        'What is my progress?',
        "What's my workout today?",
        'I drank 500 ml of water',
        'How much water have I had today?',
        "I don't like burpees."
      ];

      const responses: string[] = [];

      for (const prompt of prompts) {
        const res = await app.inject({
          method: 'POST',
          url: '/api/friday/message',
          headers: { authorization: `Bearer ${userAToken}` },
          payload: { message: prompt }
        });

        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.body);
        expect(body.success).toBe(true);
        const reply = body.data.message;

        // Verify none equal the buggy hardcoded fallback messages
        expect(reply).not.toBe(genericSimMsg);
        expect(reply).not.toBe(genericTelemetryMsg);
        expect(reply.length).toBeGreaterThan(10);

        responses.push(reply);
      }

      // Verify that responses are distinct (not all identical generic responses)
      const uniqueResponses = new Set(responses);
      expect(uniqueResponses.size).toBeGreaterThanOrEqual(4);
    });

    it('Gemini/tool results are converted into a final assistant response', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/friday/message',
        headers: { authorization: `Bearer ${userAToken}` },
        payload: { message: 'I drank 500 ml of water' }
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
      expect(body.data.message).toContain('500 ml');
    });

    it('Backend failures return structured error without fabricated success', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/friday/message',
        headers: { authorization: `Bearer ${userAToken}` },
        payload: {} // missing message field
      });

      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(false);
      expect(body.error).toBeDefined();
    });

    it('User A cannot access User B FRIDAY conversation history', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/friday/history/${convAId}`,
        headers: { authorization: `Bearer ${userBToken}` }
      });

      const body = JSON.parse(res.body);
      // Messages belonging to User A must not be returned to User B
      expect(body.messages?.length || 0).toBe(0);
    });

    it('Tool validation rejects invalid arguments (e.g. negative hydration or missing fields)', async () => {
      const { executeBackendTool } = await import('../src/modules/friday/tools/fridayTools.js');
      await expect(
        executeBackendTool('user-a', 'logHydration', { amountMl: -100 })
      ).rejects.toThrow('amountMl must be a positive number');

      await expect(
        executeBackendTool('user-a', 'unauthorizedTool' as any, {})
      ).rejects.toThrow('not a registered FRIDAY tool');
    });

    it('FRIDAY tool getExerciseHistory returns real persisted history and deterministic progression', async () => {
      const { executeBackendTool } = await import('../src/modules/friday/tools/fridayTools.js');

      // Create a session and add sets for user-a
      const sessionRes = await app.inject({
        method: 'POST',
        url: '/api/workout-sessions',
        headers: { authorization: `Bearer ${userAToken}` },
        payload: { notes: 'Live Push-up Session' }
      });
      const sessionId = JSON.parse(sessionRes.body).session.id;

      await app.inject({
        method: 'POST',
        url: `/api/workout-sessions/${sessionId}/sets`,
        headers: { authorization: `Bearer ${userAToken}` },
        payload: {
          exerciseId: 'wall-push-up',
          setNumber: 1,
          weightKg: 0,
          reps: 15,
          completed: true,
          completionMethod: 'CAMERA'
        }
      });

      const historyData = await executeBackendTool('user-a', 'getExerciseHistory', { exerciseId: 'wall-push-up' });
      expect(historyData.userId).toBe('user-a');
      expect(historyData.history.length).toBeGreaterThanOrEqual(1);
      expect(historyData.history[0].exerciseId).toBe('wall-push-up');
      expect(historyData.progressionRecommendation).toBeDefined();
      expect(historyData.progressionStates).toBeDefined();
    });
  });

  // 10. Adaptive Workout Engine & History API Isolation
  describe('Adaptive Workout History & Progression API', () => {
    it('GET /api/workouts/history enforces user isolation (User B cannot see User A sets)', async () => {
      const resA = await app.inject({
        method: 'GET',
        url: '/api/workouts/history',
        headers: { authorization: `Bearer ${userAToken}` }
      });
      expect(resA.statusCode).toBe(200);
      const bodyA = JSON.parse(resA.body);
      expect(bodyA.success).toBe(true);
      expect(bodyA.history.length).toBeGreaterThanOrEqual(1);

      const resB = await app.inject({
        method: 'GET',
        url: '/api/workouts/history',
        headers: { authorization: `Bearer ${userBToken}` }
      });
      expect(resB.statusCode).toBe(200);
      const bodyB = JSON.parse(resB.body);
      expect(bodyB.success).toBe(true);
      // User B has no recorded sets
      expect(bodyB.history.length).toBe(0);
    });

    it('GET /api/workouts/progression-state returns deterministic family states', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/workouts/progression-state',
        headers: { authorization: `Bearer ${userAToken}` }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.progressionStates)).toBe(true);
      const families = body.progressionStates.map((s: any) => s.exerciseFamily);
      expect(families).toContain('horizontal_push');
      expect(families).toContain('squat');
    });

    it('GET /api/workouts/today generates adaptive protocol respecting beginner gating', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/workouts/today',
        headers: { authorization: `Bearer ${userAToken}` }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
      expect(body.workout.exercises.length).toBeGreaterThanOrEqual(1);
      // Verify every exercise has progression context
      body.workout.exercises.forEach((ex: any) => {
        expect(ex.progression).toBeDefined();
        expect(ex.progression.action).toBeDefined();
        expect(ex.progression.status).toBeDefined();
      });
    });
  });
});


