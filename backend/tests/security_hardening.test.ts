import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../src/server.js';
import { executeBackendTool } from '../src/modules/friday/tools/fridayTools.js';

describe('Phase 11: Production Hardening & Security Regression Suite', () => {
  let app: FastifyInstance;

  const userAToken = 'test-token-sec-user-a';
  const userBToken = 'test-token-sec-user-b';

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  // -------------------------------------------------------------
  // 1. HEALTH & READINESS ENDPOINTS
  // -------------------------------------------------------------
  describe('Health & Readiness Observability', () => {
    it('GET /health returns 200 with uptime and service identifier', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/health'
      });
      expect(res.statusCode).toBe(200);
      const data = JSON.parse(res.body);
      expect(data.status).toBe('ok');
      expect(data.service).toBe('friday-backend');
      expect(typeof data.uptimeSeconds).toBe('number');
      expect(data.timestamp).toBeDefined();
    });

    it('GET /ready returns 200 with dependency statuses without exposing secrets', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/ready'
      });
      expect(res.statusCode).toBe(200);
      const data = JSON.parse(res.body);
      expect(data.status).toBe('ready');
      expect(data.dependencies).toBeDefined();
      expect(data.dependencies.supabase).toBeDefined();
      // Ensure no raw secret strings leak
      expect(res.body).not.toContain('your-gemini-api-key');
      expect(res.body).not.toContain('service_role');
      expect(res.body).not.toContain('password');
    });
  });

  // -------------------------------------------------------------
  // 2. AUTHENTICATION & IDENTITY ENFORCEMENT
  // -------------------------------------------------------------
  describe('Authentication & Token Verification', () => {
    it('strictly rejects missing Authorization header with 401', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/profile'
      });
      expect(res.statusCode).toBe(401);
      const data = JSON.parse(res.body);
      expect(data.success).toBe(false);
    });

    it('strictly rejects malformed Authorization header with 401', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/profile',
        headers: { authorization: 'Basic dXNlcjpwYXNz' }
      });
      expect(res.statusCode).toBe(401);
    });

    it('ignores client-supplied userId in body and scopes mutations to authenticated JWT', async () => {
      // User A attempts to log hydration claiming to be User B
      const res = await app.inject({
        method: 'POST',
        url: '/api/hydration',
        headers: { authorization: `Bearer ${userAToken}` },
        payload: {
          amountMl: 500,
          userId: 'sec-user-b' // Forged userId
        }
      });
      expect(res.statusCode).toBe(201);
      const data = JSON.parse(res.body);
      // Entry should be scoped strictly to authenticated user-a
      expect(data.entry.userId).toBe('sec-user-a');
    });
  });

  // -------------------------------------------------------------
  // 3. CROSS-USER DATA ISOLATION (USER A vs USER B)
  // -------------------------------------------------------------
  describe('Cross-User Data Isolation', () => {
    it('isolates hydration data between User A and User B', async () => {
      const isoAToken = 'test-token-iso-user-a';
      const isoBToken = 'test-token-iso-user-b';

      // User A logs 500ml
      await app.inject({
        method: 'POST',
        url: '/api/hydration',
        headers: { authorization: `Bearer ${isoAToken}` },
        payload: { amountMl: 500 }
      });

      // User B logs 250ml
      await app.inject({
        method: 'POST',
        url: '/api/hydration',
        headers: { authorization: `Bearer ${isoBToken}` },
        payload: { amountMl: 250 }
      });

      // Fetch User A summary
      const resA = await app.inject({
        method: 'GET',
        url: '/api/hydration/today',
        headers: { authorization: `Bearer ${isoAToken}` }
      });
      const dataA = JSON.parse(resA.body);

      // Fetch User B summary
      const resB = await app.inject({
        method: 'GET',
        url: '/api/hydration/today',
        headers: { authorization: `Bearer ${isoBToken}` }
      });
      const dataB = JSON.parse(resB.body);

      expect(dataA.consumedMl).toBe(500);
      expect(dataB.consumedMl).toBe(250);
      expect(dataA.consumedMl).not.toBe(dataB.consumedMl);
    });

    it('isolates workout sessions between User A and User B', async () => {
      // User A creates session
      const createResA = await app.inject({
        method: 'POST',
        url: '/api/workout-sessions',
        headers: { authorization: `Bearer ${userAToken}` },
        payload: { notes: 'User A Exclusive Workout' }
      });
      const sessionA = JSON.parse(createResA.body).session;

      // User B fetches their sessions
      const resB = await app.inject({
        method: 'GET',
        url: '/api/workouts',
        headers: { authorization: `Bearer ${userBToken}` }
      });
      const sessionsB = JSON.parse(resB.body).sessions;

      const userBHasSessionA = sessionsB.some((s: any) => s.id === sessionA.id);
      expect(userBHasSessionA).toBe(false);
    });
  });

  // -------------------------------------------------------------
  // 4. STORAGE & PROGRESS PHOTO SECURITY
  // -------------------------------------------------------------
  describe('Progress Photo Storage Security', () => {
    it('prevents User A from generating a signed download URL for User B photo', async () => {
      // User A requests signed download URL for a storage path owned by user-b
      const res = await app.inject({
        method: 'GET',
        url: '/api/progress/photos/signed-url?storagePath=sec-user-b/1726000000000-front.jpg',
        headers: { authorization: `Bearer ${userAToken}` }
      });

      // Must be rejected with 500 / error (Forbidden)
      expect(res.statusCode).toBeGreaterThanOrEqual(400);
      const data = JSON.parse(res.body);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Forbidden');
    });

    it('allows User A to generate signed download URL for their own storage path', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/progress/photos/signed-url?storagePath=sec-user-a/1726000000000-front.jpg',
        headers: { authorization: `Bearer ${userAToken}` }
      });

      expect(res.statusCode).toBe(200);
      const data = JSON.parse(res.body);
      expect(data.success).toBe(true);
      expect(data.signedUrl).toContain('sec-user-a');
    });
  });

  // -------------------------------------------------------------
  // 5. INPUT VALIDATION & ATTACK REJECTION
  // -------------------------------------------------------------
  describe('Input Validation & Boundary Rejection', () => {
    it('rejects negative hydration values with 400 Bad Request', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/hydration',
        headers: { authorization: `Bearer ${userAToken}` },
        payload: { amountMl: -500 }
      });
      expect(res.statusCode).toBe(400);
      const data = JSON.parse(res.body);
      expect(data.success).toBe(false);
    });

    it('rejects negative reps in workout set with 400 Bad Request', async () => {
      // Create session first
      const sessionRes = await app.inject({
        method: 'POST',
        url: '/api/workout-sessions',
        headers: { authorization: `Bearer ${userAToken}` },
        payload: {}
      });
      const session = JSON.parse(sessionRes.body).session;

      const res = await app.inject({
        method: 'POST',
        url: `/api/workout-sessions/${session.id}/sets`,
        headers: { authorization: `Bearer ${userAToken}` },
        payload: {
          exerciseId: 'push-up',
          setNumber: 1,
          weightKg: 0,
          reps: -10,
          completed: true
        }
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects invalid photo file extension with 400 Bad Request', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/progress/photos/upload-url',
        headers: { authorization: `Bearer ${userAToken}` },
        payload: {
          pose: 'FRONT',
          fileExtension: 'exe' // Malicious extension
        }
      });
      expect(res.statusCode).toBe(400);
    });
  });

  // -------------------------------------------------------------
  // 6. VERIFICATION INTEGRITY & GEMINI TOOL LOCKDOWN
  // -------------------------------------------------------------
  describe('Verification Integrity & Gemini Authority', () => {
    it('overrides attempted client spoofing of VERIFIED status on manual logging', async () => {
      const sessionRes = await app.inject({
        method: 'POST',
        url: '/api/workout-sessions',
        headers: { authorization: `Bearer ${userAToken}` },
        payload: {}
      });
      const session = JSON.parse(sessionRes.body).session;

      // Client attempts to claim VERIFIED with MANUAL method
      const res = await app.inject({
        method: 'POST',
        url: `/api/workout-sessions/${session.id}/sets`,
        headers: { authorization: `Bearer ${userAToken}` },
        payload: {
          exerciseId: 'push-up',
          setNumber: 1,
          weightKg: 0,
          reps: 15,
          completed: true,
          completionMethod: 'MANUAL',
          verification: 'VERIFIED' // Spoof attempt
        }
      });
      expect(res.statusCode).toBe(201);
      const data = JSON.parse(res.body);
      // Server must override to SELF_REPORTED
      expect(data.set.verification).toBe('SELF_REPORTED');
    });

    it('locks Gemini tool-logged sets strictly to SELF_REPORTED verification', async () => {
      const result = await executeBackendTool('sec-user-a', 'logWorkoutSet', {
        exerciseId: 'push-up',
        setNumber: 1,
        reps: 12,
        weightKg: 0,
        completed: true,
        verification: 'VERIFIED', // Gemini attempted spoof
        completionMethod: 'CAMERA' // Gemini attempted spoof
      });

      expect(result.verification).toBe('SELF_REPORTED');
      expect(result.completionMethod).toBe('VOICE');
    });

    it('rejects unregistered arbitrary tool calls from Gemini', async () => {
      await expect(
        executeBackendTool('sec-user-a', 'dropAllTables', {})
      ).rejects.toThrow(/Unauthorized tool execution/);
    });
  });

  // -------------------------------------------------------------
  // 7. SECURITY HEADERS
  // -------------------------------------------------------------
  describe('Security Headers', () => {
    it('emits nosniff and Permissions-Policy headers on responses', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/health'
      });
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['permissions-policy']).toContain('camera=(self)');
      expect(res.headers['permissions-policy']).toContain('microphone=(self)');
    });
  });

});
