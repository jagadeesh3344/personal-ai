import { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/auth.js';
import { ProgressService } from '../services/progress.service.js';
import { 
  MeasurementCreateSchema, 
  CheckinCreateSchema, 
  PhotoUploadUrlSchema 
} from '../utils/validation.js';

export async function progressRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  // GET /api/progress
  fastify.get('/progress', async (request, reply) => {
    const userId = request.user!.id;
    const progress = await ProgressService.getProgress(userId);
    return reply.send({ success: true, progress });
  });

  // POST /api/progress/measurements
  fastify.post('/progress/measurements', async (request, reply) => {
    const userId = request.user!.id;
    const body = MeasurementCreateSchema.parse(request.body);
    const measurement = await ProgressService.addMeasurement(userId, {
      date: body.date || new Date().toISOString().split('T')[0],
      weightKg: body.weightKg,
      chestCm: body.chestCm,
      waistCm: body.waistCm,
      hipsCm: body.hipsCm,
      armsCm: body.armsCm,
      thighsCm: body.thighsCm,
      notes: body.notes
    });
    return reply.status(201).send({ success: true, measurement });
  });

  // GET /api/check-ins
  fastify.get('/check-ins', async (request, reply) => {
    const userId = request.user!.id;
    const checkins = await ProgressService.getCheckins(userId);
    return reply.send({ success: true, checkins });
  });

  // POST /api/check-ins
  fastify.post('/check-ins', async (request, reply) => {
    const userId = request.user!.id;
    const body = CheckinCreateSchema.parse(request.body);
    const checkin = await ProgressService.createCheckin(userId, {
      checkinDate: body.checkinDate || new Date().toISOString().split('T')[0],
      weightKg: body.weightKg,
      adherenceScore: body.adherenceScore,
      summary: body.summary,
      nextMonthFocus: body.nextMonthFocus
    });
    return reply.status(201).send({ success: true, checkin });
  });

  // POST /api/progress/photos/upload-url
  fastify.post('/progress/photos/upload-url', async (request, reply) => {
    const userId = request.user!.id;
    const { pose, fileExtension, checkinId } = PhotoUploadUrlSchema.parse(request.body);

    try {
      const uploadDetails = await ProgressService.createPhotoUploadUrl(userId, pose, fileExtension, checkinId);
      return reply.send({ success: true, ...uploadDetails });
    } catch (err: any) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  // GET /api/progress/photos/signed-url
  fastify.get('/progress/photos/signed-url', async (request, reply) => {
    const userId = request.user!.id;
    const query = request.query as { storagePath: string };

    if (!query.storagePath) {
      return reply.status(400).send({ success: false, error: 'storagePath query parameter is required' });
    }

    try {
      const signedUrl = await ProgressService.getSignedPhotoUrl(userId, query.storagePath);
      return reply.send({ success: true, signedUrl });
    } catch (err: any) {
      return reply.status(403).send({ success: false, error: err.message });
    }
  });
}
