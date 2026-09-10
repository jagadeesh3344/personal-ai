import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { WorkoutsService } from '../services/workouts.service.js';
import { WorkoutSessionCreateSchema, WorkoutSetCreateSchema } from '../utils/validation.js';

export async function workoutRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  // GET /api/workouts/today
  fastify.get('/workouts/today', async (request, reply) => {
    const userId = request.user!.id;
    const workout = await WorkoutsService.getTodayWorkout(userId);
    return reply.send({ success: true, workout });
  });

  // GET /api/workouts
  fastify.get('/workouts', async (request, reply) => {
    const userId = request.user!.id;
    const sessions = await WorkoutsService.getSessions(userId);
    return reply.send({ success: true, sessions });
  });

  // GET /api/workouts/history
  fastify.get('/workouts/history', async (request, reply) => {
    const userId = request.user!.id;
    const { exerciseId } = request.query as { exerciseId?: string };
    const history = await WorkoutsService.getExerciseHistory(userId, exerciseId);
    return reply.send({ success: true, history });
  });

  // GET /api/workouts/history/:exerciseId
  fastify.get('/workouts/history/:exerciseId', async (request, reply) => {
    const userId = request.user!.id;
    const { exerciseId } = request.params as { exerciseId: string };
    const historyData = await WorkoutsService.getExerciseHistoryWithProgression(userId, exerciseId);
    return reply.send({ success: true, ...historyData });
  });

  // GET /api/workouts/progression-state
  fastify.get('/workouts/progression-state', async (request, reply) => {
    const userId = request.user!.id;
    const progressionStates = await WorkoutsService.getProgressionStates(userId);
    return reply.send({ success: true, progressionStates });
  });

  // POST /api/workout-sessions
  fastify.post('/workout-sessions', async (request, reply) => {
    const userId = request.user!.id;
    const data = WorkoutSessionCreateSchema.parse(request.body);
    const session = await WorkoutsService.createSession(userId, data);
    return reply.status(201).send({ success: true, session });
  });

  // POST /api/workout-sessions/:id/sets
  fastify.post('/workout-sessions/:id/sets', async (request, reply) => {
    const userId = request.user!.id;
    const { id: sessionId } = request.params as { id: string };
    const setData = WorkoutSetCreateSchema.parse(request.body);

    try {
      const set = await WorkoutsService.addSet(userId, sessionId, setData);
      return reply.status(201).send({ success: true, set });
    } catch (err: any) {
      return reply.status(400).send({ success: false, error: err.message });
    }
  });

  // POST /api/workout-sessions/:id/complete
  fastify.post('/workout-sessions/:id/complete', async (request, reply) => {
    const userId = request.user!.id;
    const { id: sessionId } = request.params as { id: string };
    const body = z.object({
      durationSeconds: z.number().int().min(0),
      notes: z.string().optional()
    }).parse(request.body);

    try {
      const completed = await WorkoutsService.completeSession(userId, sessionId, body.durationSeconds, body.notes);
      return reply.send({ success: true, session: completed });
    } catch (err: any) {
      return reply.status(400).send({ success: false, error: err.message });
    }
  });
}
