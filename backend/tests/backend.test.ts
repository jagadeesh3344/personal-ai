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
});
