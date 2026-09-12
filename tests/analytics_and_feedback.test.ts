import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AnalyticsService } from '../src/services/telemetry/analyticsService';
import { FeatureFlagsService } from '../src/services/telemetry/featureFlagsService';

describe('Frontend Analytics & Feature Flags', () => {
  beforeEach(() => {
    AnalyticsService.clearQueue();
    FeatureFlagsService.reset();
    vi.restoreAllMocks();
  });

  it('1. sanitizes metadata to scrub sensitive keys, tokens, and raw media', () => {
    const raw = {
      reps: 12,
      exercise: 'dumbbell-curl',
      token: 'jwt-bearer-token-must-be-removed',
      userPassword: 'secret-pass-must-be-removed',
      video_frame: 'data:image/jpeg;base64,...',
      audio_stream: 'blob-data',
      apiKey: 'ai-key',
      nested: {
        safeField: 'workout',
        secret_hash: 'abc',
      },
    };

    const sanitized = AnalyticsService.sanitizeMetadata(raw);
    expect(sanitized.reps).toBe(12);
    expect(sanitized.exercise).toBe('dumbbell-curl');
    expect(sanitized.token).toBeUndefined();
    expect(sanitized.userPassword).toBeUndefined();
    expect(sanitized.video_frame).toBeUndefined();
    expect(sanitized.audio_stream).toBeUndefined();
    expect(sanitized.apiKey).toBeUndefined();
    expect(sanitized.nested?.safeField).toBe('workout');
    expect(sanitized.nested?.secret_hash).toBeUndefined();
  });

  it('2. queues events with valid platform, version, and sanitized metadata', () => {
    AnalyticsService.trackEvent('WORKOUT_STARTED', {
      workoutId: 'push-day',
      password: 'drop-me',
    });

    const queue = AnalyticsService.getQueue();
    expect(queue.length).toBe(1);
    expect(queue[0].eventName).toBe('WORKOUT_STARTED');
    expect(queue[0].platform).toBeDefined();
    expect(queue[0].appVersion).toBe('1.0.0');
    expect(queue[0].sessionId).toBeDefined();
    expect(queue[0].metadata?.workoutId).toBe('push-day');
    expect(queue[0].metadata?.password).toBeUndefined();
  });

  it('3. flushes event queue over HTTP', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, count: 2 }),
    });
    globalThis.fetch = mockFetch as any;
    if (typeof window !== 'undefined') {
      (window as any).fetch = mockFetch;
    }

    AnalyticsService.trackEvent('APP_OPENED');
    AnalyticsService.trackEvent('WORKOUT_VIEWED');

    await AnalyticsService.flush();

    expect(mockFetch).toHaveBeenCalledWith('/api/telemetry/events', expect.objectContaining({
      method: 'POST',
    }));
    expect(AnalyticsService.getQueue().length).toBe(0);
  });

  it('4. FeatureFlagsService defaults to enabled and supports overrides', () => {
    expect(FeatureFlagsService.isEnabled('camera_tracking')).toBe(true);
    expect(FeatureFlagsService.isEnabled('voice_input')).toBe(true);
    expect(FeatureFlagsService.isEnabled('gemini_coaching')).toBe(true);

    FeatureFlagsService.setLocalOverride('camera_tracking', false);
    expect(FeatureFlagsService.isEnabled('camera_tracking')).toBe(false);
    expect(FeatureFlagsService.isEnabled('voice_input')).toBe(true);
  });
});
