import { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/auth.js';
import { ProfileService } from '../services/profile.service.js';
import { ProfileUpdateSchema } from '../utils/validation.js';

export async function profileRoutes(fastify: FastifyInstance) {
  // All profile routes require authentication
  fastify.addHook('preHandler', authenticate);

  // GET /api/profile
  fastify.get('/profile', async (request, reply) => {
    const userId = request.user!.id;
    const profile = await ProfileService.getProfile(userId);
    return reply.send({ success: true, profile });
  });

  // PATCH /api/profile
  fastify.patch('/profile', async (request, reply) => {
    const userId = request.user!.id;
    const validatedData = ProfileUpdateSchema.parse(request.body);
    const updated = await ProfileService.updateProfile(userId, validatedData as any);
    return reply.send({ success: true, profile: updated });
  });
}
