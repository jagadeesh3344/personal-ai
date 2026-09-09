import { ProfileRepository, UserProfileEntity } from '../repositories/profile.repo.js';

export class ProfileService {
  static async getProfile(userId: string): Promise<UserProfileEntity> {
    let profile = await ProfileRepository.getProfile(userId);
    if (!profile) {
      // Auto-initialize baseline profile
      profile = await ProfileRepository.upsertProfile(userId, {
        name: 'Athlete',
        age: 25,
        sex: 'MALE',
        heightCm: 175,
        currentWeightKg: 70,
        targetWeightKg: 70,
        goal: 'GENERAL_FITNESS',
        activityLevel: 'MODERATELY_ACTIVE',
        trainingExperience: 'BEGINNER',
        trainingEnvironment: 'HOME',
        equipment: ['NONE'],
        availableWorkoutDays: ['MON', 'WED', 'FRI'],
        preferredWorkoutDuration: 45,
        dietPreference: 'STANDARD'
      });
    }
    return profile;
  }

  static async updateProfile(userId: string, data: Partial<UserProfileEntity>): Promise<UserProfileEntity> {
    return ProfileRepository.upsertProfile(userId, data);
  }
}
