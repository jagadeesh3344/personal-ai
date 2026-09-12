import { FastifyInstance } from 'fastify';
import { env } from '../config/env.js';
import { authRoutes } from './auth.routes.js';
import { profileRoutes } from './profile.routes.js';
import { workoutRoutes } from './workouts.routes.js';
import { nutritionRoutes } from './nutrition.routes.js';
import { hydrationRoutes } from './hydration.routes.js';
import { progressRoutes } from './progress.routes.js';
import { fridayRoutes } from './friday.routes.js';
import { voiceRoutes } from './voice.routes.js';
import { telemetryRoutes } from './telemetry.routes.js';

export async function registerRoutes(fastify: FastifyInstance) {
  // Liveness health check
  fastify.get('/health', async () => {
    return {
      status: 'ok',
      service: 'friday-backend',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime())
    };
  });

  // Readiness health check
  fastify.get('/ready', async (_request, reply) => {
    const isSupabaseConfigured = Boolean(env.SUPABASE_URL && !env.SUPABASE_URL.includes('placeholder'));
    const isGeminiConfigured = Boolean(env.GEMINI_API_KEY && env.GEMINI_API_KEY !== 'your-gemini-api-key-here');

    return reply.send({
      status: 'ready',
      service: 'friday-backend',
      environment: env.NODE_ENV,
      dependencies: {
        supabase: isSupabaseConfigured ? 'configured' : 'fallback-or-placeholder',
        gemini: isGeminiConfigured ? 'configured' : 'mock-fallback'
      },
      timestamp: new Date().toISOString()
    });
  });

  // API Route groups
  await fastify.register(authRoutes, { prefix: '/api' });
  await fastify.register(profileRoutes, { prefix: '/api' });
  await fastify.register(workoutRoutes, { prefix: '/api' });
  await fastify.register(nutritionRoutes, { prefix: '/api' });
  await fastify.register(hydrationRoutes, { prefix: '/api' });
  await fastify.register(progressRoutes, { prefix: '/api' });
  await fastify.register(fridayRoutes, { prefix: '/api' });
  await fastify.register(voiceRoutes, { prefix: '/api' });
  await fastify.register(telemetryRoutes, { prefix: '/api' });
}

