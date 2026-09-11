import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { FridayService } from '../services/friday.service.js';

const FridayMessageRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  conversationId: z.string().optional()
});

export async function fridayRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  // POST /api/friday/message
  fastify.post('/friday/message', async (request, reply) => {
    const userId = request.user!.id;
    const { message, conversationId } = FridayMessageRequestSchema.parse(request.body);

    try {
      const response = await FridayService.handleMessage(userId, message, conversationId);
      return reply.send({
        success: true,
        data: {
          conversationId: response.conversationId,
          message: response.reply,
          toolCalls: response.toolCalls
        }
      });
    } catch (err: any) {
      return reply.status(500).send({
        success: false,
        error: err.message || 'FRIDAY Agent encountered an error processing request'
      });
    }
  });

  // GET /api/friday/history/:conversationId
  fastify.get('/friday/history/:conversationId', async (request, reply) => {
    const userId = request.user!.id;
    const { conversationId } = request.params as { conversationId: string };

    try {
      const history = await FridayService.getConversationHistory(userId, conversationId);
      return reply.send({ success: true, messages: history });
    } catch (err: any) {
      return reply.status(404).send({ success: false, error: err.message });
    }
  });

  // GET /api/friday/coaching/today
  fastify.get('/friday/coaching/today', async (request, reply) => {
    const userId = request.user!.id;
    try {
      const brief = await FridayService.getTodayCoaching(userId);
      return reply.send({ success: true, coaching: brief, brief });
    } catch (err: any) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  // GET /api/friday/coaching/weekly
  fastify.get('/friday/coaching/weekly', async (request, reply) => {
    const userId = request.user!.id;
    try {
      const review = await FridayService.getWeeklyCoaching(userId);
      return reply.send({ success: true, review });
    } catch (err: any) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });
}
