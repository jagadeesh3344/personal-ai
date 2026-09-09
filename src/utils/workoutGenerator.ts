import { generateWorkout } from '../features/workouts/utils/workoutGenerator';
import { UserProfile, WorkoutPlan } from '../types';

export { generateWorkout };

export function generateWorkoutPlan(profile: UserProfile): WorkoutPlan {
  return generateWorkout(profile);
}
