import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { FridayService } from '../services/friday.service.js';

const VoiceMessageRequestSchema = z.object({
  transcript: z.string().min(1).max(2000),
  conversationId: z.string().optional()
});

export async function voiceRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  // GET & POST /api/friday/voice/session
  fastify.route({
    method: ['GET', 'POST'],
    url: '/friday/voice/session',
    handler: async (request, reply) => {
      const userId = request.user!.id;
      return reply.send({
        success: true,
        data: {
          sessionId: `voice-${userId}-${Date.now()}`,
          userId,
          status: 'ready'
        }
      });
    }
  });


  // POST /api/friday/voice/message
  fastify.post('/friday/voice/message', async (request, reply) => {
    const userId = request.user!.id;
    const { transcript, conversationId } = VoiceMessageRequestSchema.parse(request.body);

    try {
      const response = await FridayService.handleVoiceMessage(userId, transcript, conversationId);
      return reply.send({
        success: true,
        data: {
          conversationId: response.conversationId,
          reply: response.reply,
          spokenText: response.spokenText,
          toolCalls: response.toolCalls
        }
      });
    } catch (err: any) {
      return reply.status(500).send({
        success: false,
        error: err.message || 'FRIDAY Voice Agent encountered an error processing speech'
      });
    }
  });
}
