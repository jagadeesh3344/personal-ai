import { apiClient } from './client';
import { WorkoutSession, WorkoutSet } from '../../types';

export const workoutsApi = {
  async getTodayWorkout() {
    return apiClient.get<{ success: boolean; workout: any }>('/workouts/today');
  },

  async getSessions(): Promise<WorkoutSession[]> {
    const res = await apiClient.get<{ success: boolean; sessions: WorkoutSession[] }>('/workouts');
    return res.sessions;
  },

  async createSession(data: { dayId?: string | null; date?: string; notes?: string }): Promise<WorkoutSession> {
    const res = await apiClient.post<{ success: boolean; session: WorkoutSession }>('/workout-sessions', data);
    return res.session;
  },

  async addSet(sessionId: string, setData: { exerciseId: string; setNumber: number; weightKg: number; reps: number; completed?: boolean }): Promise<WorkoutSet> {
    const res = await apiClient.post<{ success: boolean; set: WorkoutSet }>(`/workout-sessions/${sessionId}/sets`, setData);
    return res.set;
  },

  async completeSession(sessionId: string, durationSeconds: number, notes?: string): Promise<WorkoutSession> {
    const res = await apiClient.post<{ success: boolean; session: WorkoutSession }>(`/workout-sessions/${sessionId}/complete`, {
      durationSeconds,
      notes
    });
    return res.session;
  }
};
