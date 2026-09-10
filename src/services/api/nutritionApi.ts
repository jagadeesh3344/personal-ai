import { apiClient } from './client';
import { Meal, NutritionTargets } from '../../types';

export const nutritionApi = {
  async getTodayMeals(date?: string): Promise<{ date: string; meals: Meal[]; totals: { calories: number; protein: number; carbs: number; fat: number } }> {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    return apiClient.get(`/nutrition/today${query}`);
  },

  async getTargets(): Promise<NutritionTargets> {
    const res = await apiClient.get<{ success: boolean; targets: NutritionTargets }>('/nutrition/targets');
    return res.targets;
  },

  async getState(date?: string) {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    const res = await apiClient.get<{ success: boolean; state: any }>(`/nutrition/state${query}`);
    return res.state;
  },

  async getRecommendation(options?: { mealType?: string; date?: string; preferenceFilter?: string }) {
    const params = new URLSearchParams();
    if (options?.mealType) params.append('mealType', options.mealType);
    if (options?.date) params.append('date', options.date);
    if (options?.preferenceFilter) params.append('preferenceFilter', options.preferenceFilter);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await apiClient.get<{ success: boolean; recommendation: any }>(`/nutrition/recommendation${qs}`);
    return res.recommendation;
  },

  async getPlan(date?: string) {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    const res = await apiClient.get<{ success: boolean; plan: any }>(`/nutrition/plan${query}`);
    return res.plan;
  },

  async createMeal(meal: Omit<Meal, 'id'>): Promise<Meal> {
    const res = await apiClient.post<{ success: boolean; meal: Meal }>('/nutrition/meals', meal);
    return res.meal;
  },

  async updateMeal(mealId: string, updates: Partial<Meal>): Promise<Meal> {
    const res = await apiClient.patch<{ success: boolean; meal: Meal }>(`/nutrition/meals/${mealId}`, updates);
    return res.meal;
  },

  async deleteMeal(mealId: string): Promise<boolean> {
    const res = await apiClient.delete<{ success: boolean }>(`/nutrition/meals/${mealId}`);
    return res.success;
  }
};
