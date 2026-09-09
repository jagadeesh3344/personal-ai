import { apiClient } from './client';
import { UserProfile } from '../../types/profile';

export const profileApi = {
  async getProfile(): Promise<UserProfile> {
    const res = await apiClient.get<{ success: boolean; profile: UserProfile }>('/profile');
    return res.profile;
  },

  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    const res = await apiClient.patch<{ success: boolean; profile: UserProfile }>('/profile', updates);
    return res.profile;
  }
};
