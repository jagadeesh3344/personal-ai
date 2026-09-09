import { UserProfile } from '../types';

/**
 * Calculates evidence-based daily hydration baseline:
 * 35 ml per kg of bodyweight + 500 ml for active users + 250 ml per 30 minutes of workout duration.
 */
export function calculateHydrationTarget(profile: UserProfile): number {
  const weight = profile.currentWeightKg > 0 ? profile.currentWeightKg : 70;
  let targetMl = weight * 35;

  if (profile.activityLevel && profile.activityLevel !== 'SEDENTARY') {
    targetMl += 500;
  }

  const workoutMinutes = profile.preferredWorkoutDuration || 45;
  targetMl += (workoutMinutes / 30) * 250;

  // Round to nearest 50 ml
  return Math.round(targetMl / 50) * 50;
}
