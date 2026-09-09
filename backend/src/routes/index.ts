import { FastifyInstance } from 'fastify';
import { authRoutes } from './auth.routes.js';
import { profileRoutes } from './profile.routes.js';
import { workoutRoutes } from './workouts.routes.js';
import { nutritionRoutes } from './nutrition.routes.js';
import { hydrationRoutes } from './hydration.routes.js';
import { progressRoutes } from './progress.routes.js';
import { fridayRoutes } from './friday.routes.js';

export async function registerRoutes(fastify: FastifyInstance) {
  // Health check endpoint
  fastify.get('/health', async () => {
    return {
      status: 'ok',
      service: 'friday-backend',
      timestamp: new Date().toISOString()
    };
  });

  // API Route groups
  await fastify.register(authRoutes, { prefix: '/api' });
  await fastify.register(profileRoutes, { prefix: '/api' });
  await fastify.register(workoutRoutes, { prefix: '/api' });
  await fastify.register(nutritionRoutes, { prefix: '/api' });
  await fastify.register(hydrationRoutes, { prefix: '/api' });
  await fastify.register(progressRoutes, { prefix: '/api' });
  await fastify.register(fridayRoutes, { prefix: '/api' });
}
