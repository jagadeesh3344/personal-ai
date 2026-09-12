import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import {
  TelemetryService,
  ALLOWED_EVENT_NAMES,
  TelemetryEventName,
} from '../modules/telemetry/telemetryService.js';
import { featureFlags, FeatureFlags } from '../modules/telemetry/featureFlags.js';

const TelemetryEventSchema = z.object({
  eventName: z.enum(ALLOWED_EVENT_NAMES),
  platform: z.string().default('web'),
  appVersion: z.string().default('1.0.0'),
  sessionId: z.string().default('default-session'),
  metadata: z.record(z.any()).optional(),
});

const BatchTelemetryEventSchema = z.object({
  events: z.array(TelemetryEventSchema).min(1).max(50),
});

const UserFeedbackSchema = z.object({
  rating: z.enum(['helpful', 'unhelpful']),
  category: z.enum([
    'workout',
    'camera',
    'voice',
    'nutrition',
    'hydration',
    'progress',
    'friday_answer',
    'ui',
    'bug',
    'other',
  ]),
  comment: z.string().max(500).optional(),
  interactionRef: z.string().optional(),
});

const BetaIssueSchema = z.object({
  category: z.string().min(1).max(50),
  platform: z.string().min(1).max(50),
  appVersion: z.string().min(1).max(20),
  sessionId: z.string().optional(),
  severity: z.enum(['P0', 'P1', 'P2', 'P3']),
  reproductionSteps: z.string().min(5).max(2000),
  expectedBehavior: z.string().min(5).max(1000),
  actualBehavior: z.string().min(5).max(1000),
});

const FeatureFlagUpdateSchema = z.object({
  flag: z.enum(['camera_tracking', 'voice_input', 'gemini_coaching']),
  enabled: z.boolean(),
});

export async function telemetryRoutes(fastify: FastifyInstance) {
  // Public or authenticated feature flags endpoint
  fastify.get('/telemetry/feature-flags', async (_request, reply) => {
    return reply.send({
      success: true,
      flags: featureFlags.getFlags(),
    });
  });

  // Protected routes require authenticated user
  fastify.register(async (authenticatedRoutes) => {
    authenticatedRoutes.addHook('preHandler', authenticate);

    // POST /api/telemetry/events (Single or batch event logging)
    authenticatedRoutes.post('/telemetry/events', async (request, reply) => {
      const userId = request.user!.id;
      const body = request.body as any;

      if (body && Array.isArray(body.events)) {
        const parsed = BatchTelemetryEventSchema.parse(body);
        const recorded = await Promise.all(
          parsed.events.map((evt) =>
            TelemetryService.recordEvent({
              userId,
              eventName: evt.eventName as TelemetryEventName,
              platform: evt.platform,
              appVersion: evt.appVersion,
              sessionId: evt.sessionId,
              metadata: evt.metadata,
            })
          )
        );
        return reply.status(201).send({ success: true, count: recorded.length });
      }

      const parsed = TelemetryEventSchema.parse(body);
      const recorded = await TelemetryService.recordEvent({
        userId,
        eventName: parsed.eventName as TelemetryEventName,
        platform: parsed.platform,
        appVersion: parsed.appVersion,
        sessionId: parsed.sessionId,
        metadata: parsed.metadata,
      });

      return reply.status(201).send({ success: true, event: recorded });
    });

    // POST /api/telemetry/feedback
    authenticatedRoutes.post('/telemetry/feedback', async (request, reply) => {
      const userId = request.user!.id;
      const parsed = UserFeedbackSchema.parse(request.body);

      const feedback = await TelemetryService.recordFeedback({
        userId,
        rating: parsed.rating,
        category: parsed.category,
        comment: parsed.comment,
        interactionRef: parsed.interactionRef,
      });

      return reply.status(201).send({ success: true, feedback });
    });

    // POST /api/telemetry/issues (Beta bug reporting)
    authenticatedRoutes.post('/telemetry/issues', async (request, reply) => {
      const userId = request.user!.id;
      const parsed = BetaIssueSchema.parse(request.body);

      const issue = await TelemetryService.recordBetaIssue({
        userId,
        category: parsed.category,
        platform: parsed.platform,
        appVersion: parsed.appVersion,
        sessionId: parsed.sessionId,
        severity: parsed.severity,
        reproductionSteps: parsed.reproductionSteps,
        expectedBehavior: parsed.expectedBehavior,
        actualBehavior: parsed.actualBehavior,
      });

      return reply.status(201).send({ success: true, issue });
    });

    // GET /api/telemetry/admin/metrics (Aggregated metrics only — zero PII or private payloads)
    authenticatedRoutes.get('/telemetry/admin/metrics', async (_request, reply) => {
      const metrics = await TelemetryService.getAggregateMetrics();
      return reply.send({ success: true, metrics });
    });

    // PATCH /api/telemetry/admin/feature-flags (Dynamic runtime flag toggle)
    authenticatedRoutes.patch('/telemetry/admin/feature-flags', async (request, reply) => {
      const { flag, enabled } = FeatureFlagUpdateSchema.parse(request.body);
      featureFlags.setFlag(flag as keyof FeatureFlags, enabled);
      return reply.send({
        success: true,
        flags: featureFlags.getFlags(),
      });
    });
  });
}
