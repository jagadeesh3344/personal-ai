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
}
