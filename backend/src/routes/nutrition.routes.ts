import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { NutritionService } from '../services/nutrition.service.js';
import { MealCreateSchema, MealUpdateSchema } from '../utils/validation.js';

export async function nutritionRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  // GET /api/nutrition/today
  fastify.get('/nutrition/today', async (request, reply) => {
    const userId = request.user!.id;
    const query = request.query as { date?: string };
    const data = await NutritionService.getTodayMeals(userId, query.date);
    return reply.send({ success: true, ...data });
  });

  // GET /api/nutrition/state
  fastify.get('/nutrition/state', async (request, reply) => {
    const userId = request.user!.id;
    const query = request.query as { date?: string };
    const state = await NutritionService.getDailyNutritionState(userId, query.date);
    return reply.send({ success: true, state });
  });

  // GET /api/nutrition/recommendation
  fastify.get('/nutrition/recommendation', async (request, reply) => {
    const userId = request.user!.id;
    const query = request.query as { mealType?: any; date?: string; preferenceFilter?: any };
    const recommendation = await NutritionService.getAdaptiveMealRecommendation(userId, query);
    return reply.send({ success: true, recommendation });
  });

  // GET /api/nutrition/plan
  fastify.get('/nutrition/plan', async (request, reply) => {
    const userId = request.user!.id;
    const query = request.query as { date?: string };
    const plan = await NutritionService.getAdaptiveDailyMealPlan(userId, query.date);
    return reply.send({ success: true, plan });
  });

  // GET /api/nutrition/targets
  fastify.get('/nutrition/targets', async (request, reply) => {
    const userId = request.user!.id;
    const targets = await NutritionService.getTargets(userId);
    return reply.send({ success: true, targets });
  });

  // POST /api/nutrition/meals
  fastify.post('/nutrition/meals', async (request, reply) => {
    const userId = request.user!.id;
    const mealData = MealCreateSchema.parse(request.body);
    const created = await NutritionService.createMeal(userId, {
      ...mealData,
      date: mealData.date || new Date().toISOString().split('T')[0]
    });
    return reply.status(201).send({ success: true, meal: created });
  });

  // PATCH /api/nutrition/meals/:id
  fastify.patch('/nutrition/meals/:id', async (request, reply) => {
    const userId = request.user!.id;
    const { id: mealId } = request.params as { id: string };
    const updates = MealUpdateSchema.parse(request.body);

    try {
      const updated = await NutritionService.updateMeal(userId, mealId, updates as any);
      return reply.send({ success: true, meal: updated });
    } catch (err: any) {
      return reply.status(404).send({ success: false, error: err.message });
    }
  });

  // DELETE /api/nutrition/meals/:id
  fastify.delete('/nutrition/meals/:id', async (request, reply) => {
    const userId = request.user!.id;
    const { id: mealId } = request.params as { id: string };
    const deleted = await NutritionService.deleteMeal(userId, mealId);
    if (!deleted) {
      return reply.status(404).send({ success: false, error: 'Meal not found or could not be deleted' });
    }
    return reply.send({ success: true, message: 'Meal deleted successfully' });
  });
}
