import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { buildApp } from '../src/server.js';
import { TelemetryService } from '../src/modules/telemetry/telemetryService.js';
import { featureFlags } from '../src/modules/telemetry/featureFlags.js';
import { FastifyInstance } from 'fastify';

describe('Phase 13 Telemetry, Privacy, Feature Flags & Beta Metrics', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    TelemetryService.clearMemory();
    featureFlags.resetToDefaults();
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('1. accepts valid telemetry events and rejects invalid event names', async () => {
    // Valid event
    const validRes = await app.inject({
      method: 'POST',
      url: '/api/telemetry/events',
      headers: { authorization: 'Bearer test-token-user-1' },
      payload: {
        eventName: 'WORKOUT_STARTED',
        platform: 'ios',
        appVersion: '1.0.0',
        sessionId: 'sess-123',
        metadata: { workoutId: 'plan-chest-day' },
      },
    });
    expect(validRes.statusCode).toBe(201);
    const validBody = JSON.parse(validRes.body);
    expect(validBody.success).toBe(true);
    expect(validBody.event.eventName).toBe('WORKOUT_STARTED');

    // Invalid event name
    const invalidRes = await app.inject({
      method: 'POST',
      url: '/api/telemetry/events',
      headers: { authorization: 'Bearer test-token-user-1' },
      payload: {
        eventName: 'UNSUPPORTED_MALICIOUS_EVENT',
        platform: 'ios',
      },
    });
    expect(invalidRes.statusCode).toBe(400);
  });

  it('2. sanitizes and drops forbidden sensitive keys from metadata', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/telemetry/events',
      headers: { authorization: 'Bearer test-token-user-1' },
      payload: {
        eventName: 'CAMERA_SET_COMPLETED',
        platform: 'android',
        metadata: {
          exercise: 'squats',
          reps: 10,
          token: 'secret-bearer-token-should-be-dropped',
          password: 'user-plaintext-pass-should-be-dropped',
          raw_audio: 'audio-bytes-should-be-dropped',
          video_frame: 'base64-frame-should-be-dropped',
          apiKey: 'gemini-key-should-be-dropped',
        },
      },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    const meta = body.event.metadata;
    expect(meta.exercise).toBe('squats');
    expect(meta.reps).toBe(10);
    expect(meta.token).toBeUndefined();
    expect(meta.password).toBeUndefined();
    expect(meta.raw_audio).toBeUndefined();
    expect(meta.video_frame).toBeUndefined();
    expect(meta.apiKey).toBeUndefined();
  });

  it('3. accepts batch event submissions', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/telemetry/events',
      headers: { authorization: 'Bearer test-token-user-1' },
      payload: {
        events: [
          { eventName: 'APP_OPENED', platform: 'web' },
          { eventName: 'WORKOUT_VIEWED', platform: 'web' },
          { eventName: 'HYDRATION_LOGGED', platform: 'web', metadata: { amountMl: 500 } },
        ],
      },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.count).toBe(3);
  });

  it('4. accepts user feedback (helpful / unhelpful) with valid categories', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/telemetry/feedback',
      headers: { authorization: 'Bearer test-token-user-1' },
      payload: {
        rating: 'helpful',
        category: 'camera',
        comment: 'Rep counting felt very accurate on squats!',
        interactionRef: 'workout-sess-1',
      },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.feedback.rating).toBe('helpful');
    expect(body.feedback.category).toBe('camera');
  });

  it('5. records categorized beta bug issues with P0–P3 severity', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/telemetry/issues',
      headers: { authorization: 'Bearer test-token-user-1' },
      payload: {
        category: 'camera',
        platform: 'ios',
        appVersion: '1.0.0',
        severity: 'P2',
        reproductionSteps: 'Positioned phone on gym bench, angle detection showed low confidence warning.',
        expectedBehavior: 'Warning should clear once standing in frame.',
        actualBehavior: 'Warning persisted for 5 seconds.',
      },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.issue.severity).toBe('P2');
    expect(body.issue.status).toBe('open');
  });

  it('6. user isolation: authenticated user ID is enforced and cannot be spoofed', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/telemetry/events',
      headers: { authorization: 'Bearer test-token-user-alice' },
      payload: {
        eventName: 'WORKOUT_STARTED',
        userId: 'victim-bob-spoofed',
        platform: 'ios',
      },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    // Server enforces the identity from the authenticated JWT, not client payload
    expect(body.event.userId).toBe('user-alice');
    expect(body.event.userId).not.toBe('victim-bob-spoofed');
  });

  it('7. admin metrics returns ONLY aggregated numbers, zero PII or private payloads', async () => {
    // Generate some diverse events
    await app.inject({
      method: 'POST',
      url: '/api/telemetry/events',
      headers: { authorization: 'Bearer test-token-user-1' },
      payload: { eventName: 'ONBOARDING_STARTED', platform: 'ios' },
    });
    await app.inject({
      method: 'POST',
      url: '/api/telemetry/events',
      headers: { authorization: 'Bearer test-token-user-1' },
      payload: { eventName: 'ONBOARDING_COMPLETED', platform: 'ios' },
    });
    await app.inject({
      method: 'POST',
      url: '/api/telemetry/events',
      headers: { authorization: 'Bearer test-token-user-1' },
      payload: { eventName: 'CAMERA_STARTED', platform: 'ios' },
    });
    await app.inject({
      method: 'POST',
      url: '/api/telemetry/events',
      headers: { authorization: 'Bearer test-token-user-1' },
      payload: { eventName: 'CAMERA_SET_COMPLETED', platform: 'ios' },
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/telemetry/admin/metrics',
      headers: { authorization: 'Bearer test-token-admin' },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.metrics).toBeDefined();

    // Verify aggregate structure
    expect(body.metrics.users.onboardingCompletionRatePct).toBe(100);
    expect(body.metrics.camera.setsCompleted).toBe(1);
    expect(body.metrics.camera.successRatePct).toBe(100);

    // Verify ZERO user PII leakage
    const rawString = JSON.stringify(body.metrics);
    expect(rawString).not.toContain('test-user-1');
    expect(rawString).not.toContain('test-token');
    expect(rawString).not.toContain('email');
  });

  it('8. feature flags: retrieves flags and supports dynamic runtime toggle', async () => {
    // Initial fetch
    const getRes = await app.inject({
      method: 'GET',
      url: '/api/telemetry/feature-flags',
    });
    expect(getRes.statusCode).toBe(200);
    const getBody = JSON.parse(getRes.body);
    expect(getBody.flags.camera_tracking).toBe(true);

    // Dynamic toggle
    const patchRes = await app.inject({
      method: 'PATCH',
      url: '/api/telemetry/admin/feature-flags',
      headers: { authorization: 'Bearer test-token-admin' },
      payload: {
        flag: 'camera_tracking',
        enabled: false,
      },
    });
    expect(patchRes.statusCode).toBe(200);
    const patchBody = JSON.parse(patchRes.body);
    expect(patchBody.flags.camera_tracking).toBe(false);

    // Check manager state
    expect(featureFlags.isEnabled('camera_tracking')).toBe(false);
  });
});
