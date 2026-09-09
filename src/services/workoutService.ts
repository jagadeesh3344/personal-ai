import { Workout, UserProfile } from '../types';
import { generateFilteredWorkouts } from '../data/exerciseDb';

export const workoutService = {
  /**
   * Generates a fully personalized workout plan based on the user's biometrics and physical environment constraints.
   */
  generateProgram(profile: UserProfile): Workout[] {
    const environment = profile.trainingEnvironment;
    const equipment = profile.equipment || [];
    const goal = profile.goal || profile.fitnessGoal || '';
    return generateFilteredWorkouts(environment, equipment, goal);
  },

  /**
   * Retreives the cached active workout logs from local storage.
   */
  getStoredWorkouts(): Workout[] | null {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('friday_workouts');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse stored workouts", e);
        }
      }
    }
    return null;
  },

  /**
   * Commits the active workout logs to persistent storage.
   */
  saveWorkouts(workouts: Workout[]): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('friday_workouts', JSON.stringify(workouts));
    }
  }
};
