import { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/auth.js';
import { HydrationService } from '../services/hydration.service.js';
import { HydrationCreateSchema } from '../utils/validation.js';

export async function hydrationRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  // GET /api/hydration/today
  fastify.get('/hydration/today', async (request, reply) => {
    const userId = request.user!.id;
    const query = request.query as { date?: string };
    const status = await HydrationService.getTodayHydration(userId, query.date);
    return reply.send({ success: true, ...status });
  });

  // POST /api/hydration
  fastify.post('/hydration', async (request, reply) => {
    const userId = request.user!.id;
    const { amountMl, date } = HydrationCreateSchema.parse(request.body);
    const entry = await HydrationService.logHydration(userId, amountMl, date);
    return reply.status(201).send({ success: true, entry });
  });

  // DELETE /api/hydration/:id
  fastify.delete('/hydration/:id', async (request, reply) => {
    const userId = request.user!.id;
    const { id: entryId } = request.params as { id: string };
    const deleted = await HydrationService.deleteHydration(userId, entryId);
    if (!deleted) {
      return reply.status(404).send({ success: false, error: 'Entry not found or could not be deleted' });
    }
    return reply.send({ success: true, message: 'Hydration entry deleted' });
  });
}
