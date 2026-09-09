import { UserProfile } from '../types';
import { initialUserProfile } from '../data/mockData';

export const userService = {
  /**
   * Retrieves the active user profile from cache or database.
   */
  getProfile(): UserProfile {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('friday_user_profile');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse user profile from cache", e);
        }
      }
    }
    return initialUserProfile;
  },

  /**
   * Updates user profile parameters.
   */
  saveProfile(profile: UserProfile): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('friday_user_profile', JSON.stringify(profile));
    }
  },

  /**
   * Completely wipes all cached biometrics, workouts, and state to perform a total system factory reset.
   */
  clearAllData(): void {
    if (typeof window !== 'undefined') {
      const keysToWipe = [
        'friday_onboarded',
        'friday_user_photo',
        'friday_user_profile',
        'friday_workouts',
        'friday_daily_stats',
        'friday_tasks',
        'friday_nutrition',
        'friday_hydration',
        'friday_meals',
        'friday_habits',
        'friday_progress_data',
        'friday_messages'
      ];
      keysToWipe.forEach(k => localStorage.removeItem(k));
    }
  }
};
