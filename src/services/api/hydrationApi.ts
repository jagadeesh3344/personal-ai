import { apiClient } from './client';
import { DailyHydration, HydrationEntry } from '../../types';

export const hydrationApi = {
  async getTodayHydration(date?: string): Promise<{ date: string; targetMl: number; consumedMl: number; remainingMl: number; percentage: number; entries: HydrationEntry[] }> {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    return apiClient.get(`/hydration/today${query}`);
  },

  async logHydration(amountMl: number, date?: string): Promise<HydrationEntry> {
    const res = await apiClient.post<{ success: boolean; entry: HydrationEntry }>('/hydration', {
      amountMl,
      date
    });
    return res.entry;
  },

  async deleteHydration(entryId: string): Promise<boolean> {
    const res = await apiClient.delete<{ success: boolean }>(`/hydration/${entryId}`);
    return res.success;
  }
};
