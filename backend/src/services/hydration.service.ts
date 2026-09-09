import { HydrationRepository, HydrationEntryEntity } from '../repositories/hydration.repo.js';
import { ProfileRepository } from '../repositories/profile.repo.js';

export class HydrationService {
  static calculateTargetMl(weightKg: number, activityLevel: string, workoutDurationMin: number): number {
    let target = weightKg * 35;
    if (activityLevel !== 'SEDENTARY') target += 500;
    target += (workoutDurationMin / 30) * 250;
    return Math.round(target / 50) * 50;
  }

  static async getTodayHydration(userId: string, date?: string) {
    const today = date || new Date().toISOString().split('T')[0];
    const profile = await ProfileRepository.getProfile(userId);
    const targetMl = this.calculateTargetMl(
      profile?.currentWeightKg || 70,
      profile?.activityLevel || 'MODERATELY_ACTIVE',
      profile?.preferredWorkoutDuration || 45
    );

    const entries = await HydrationRepository.getEntriesForDate(userId, today);
    const consumedMl = entries.reduce((acc, e) => acc + e.amountMl, 0);

    return {
      date: today,
      targetMl,
      consumedMl,
      remainingMl: Math.max(0, targetMl - consumedMl),
      percentage: Math.min(100, Math.round((consumedMl / targetMl) * 100)),
      entries
    };
  }

  static async logHydration(userId: string, amountMl: number, date?: string): Promise<HydrationEntryEntity> {
    return HydrationRepository.addEntry(userId, amountMl, date);
  }

  static async deleteHydration(userId: string, entryId: string): Promise<boolean> {
    return HydrationRepository.deleteEntry(userId, entryId);
  }
}
