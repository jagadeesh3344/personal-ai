import { UserProfile } from '../../types';
import { profileApi } from '../api/profileApi';

const PROFILE_KEY = 'friday_user_profile';
const ONBOARDED_KEY = 'friday_onboarded';

export interface IProfileRepository {
  getProfile(): UserProfile | null;
  saveProfile(profile: UserProfile): void;
  syncFromBackend(): Promise<UserProfile | null>;
  saveProfileToBackend(profile: UserProfile): Promise<UserProfile>;
  isOnboarded(): boolean;
  setOnboarded(value: boolean): void;
  clear(): void;
}

class ApiBackedProfileRepository implements IProfileRepository {
  getProfile(): UserProfile | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as UserProfile;
    } catch {
      return null;
    }
  }

  saveProfile(profile: UserProfile): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    // Asynchronously synchronize with backend
    this.saveProfileToBackend(profile).catch(err => {
      console.warn('[ProfileRepository] Background sync failed (backend may be offline):', err.message);
    });
  }

  async syncFromBackend(): Promise<UserProfile | null> {
    try {
      const remote = await profileApi.getProfile();
      if (remote && typeof window !== 'undefined') {
        localStorage.setItem(PROFILE_KEY, JSON.stringify(remote));
        localStorage.setItem(ONBOARDED_KEY, 'true');
      }
      return remote;
    } catch (err: any) {
      console.warn('[ProfileRepository] Could not fetch profile from backend:', err.message);
      return this.getProfile();
    }
  }

  async saveProfileToBackend(profile: UserProfile): Promise<UserProfile> {
    const updated = await profileApi.updateProfile(profile);
    if (typeof window !== 'undefined') {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(updated));
    }
    return updated;
  }

  isOnboarded(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(ONBOARDED_KEY) === 'true';
  }

  setOnboarded(value: boolean): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ONBOARDED_KEY, value ? 'true' : 'false');
  }

  clear(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(PROFILE_KEY);
    localStorage.removeItem(ONBOARDED_KEY);
  }
}

export const ProfileRepository: IProfileRepository = new ApiBackedProfileRepository();
