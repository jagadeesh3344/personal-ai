import { UserProfile } from '../../types';

const PROFILE_KEY = 'friday_user_profile';
const ONBOARDED_KEY = 'friday_onboarded';

export interface IProfileRepository {
  getProfile(): UserProfile | null;
  saveProfile(profile: UserProfile): void;
  isOnboarded(): boolean;
  setOnboarded(value: boolean): void;
  clear(): void;
}

class LocalProfileRepository implements IProfileRepository {
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

export const ProfileRepository: IProfileRepository = new LocalProfileRepository();
