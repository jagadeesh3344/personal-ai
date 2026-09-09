import { ProgressRepository, MeasurementEntity, CheckinEntity } from '../repositories/progress.repo.js';

export class ProgressService {
  static async getProgress(userId: string) {
    const measurements = await ProgressRepository.getMeasurements(userId);
    const checkins = await ProgressRepository.getCheckins(userId);

    const weightHistory = measurements.map(m => ({
      date: m.date,
      weightKg: m.weightKg
    }));

    return {
      measurements,
      checkins,
      weightHistory,
      latestMeasurement: measurements[0] || null,
      latestCheckin: checkins[0] || null
    };
  }

  static async addMeasurement(userId: string, data: Omit<MeasurementEntity, 'id' | 'userId' | 'createdAt'>): Promise<MeasurementEntity> {
    return ProgressRepository.addMeasurement(userId, data);
  }

  static async getCheckins(userId: string): Promise<CheckinEntity[]> {
    return ProgressRepository.getCheckins(userId);
  }

  static async createCheckin(userId: string, data: Omit<CheckinEntity, 'id' | 'userId' | 'createdAt'>): Promise<CheckinEntity> {
    return ProgressRepository.createCheckin(userId, data);
  }

  static async createPhotoUploadUrl(userId: string, pose: 'FRONT' | 'SIDE' | 'BACK', fileExtension: string, checkinId?: string) {
    return ProgressRepository.createPhotoUploadUrl(userId, pose, fileExtension, checkinId);
  }

  static async getSignedPhotoUrl(userId: string, storagePath: string) {
    return ProgressRepository.getSignedPhotoUrl(userId, storagePath);
  }
}
