import { WorkoutPlan, WorkoutSession } from '../../types';
import { workoutsApi } from '../api/workoutsApi';

const PLAN_KEY = 'friday_workout_plan';
const SESSIONS_KEY = 'friday_workout_sessions';

export interface IWorkoutRepository {
  getActivePlan(): WorkoutPlan | null;
  saveActivePlan(plan: WorkoutPlan): void;
  getSessions(): WorkoutSession[];
  saveSession(session: WorkoutSession): void;
  syncSessionsFromBackend(): Promise<WorkoutSession[]>;
  saveSessionToBackend(session: WorkoutSession): Promise<WorkoutSession>;
  clear(): void;
}

class ApiBackedWorkoutRepository implements IWorkoutRepository {
  getActivePlan(): WorkoutPlan | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(PLAN_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as WorkoutPlan;
    } catch {
      return null;
    }
  }

  saveActivePlan(plan: WorkoutPlan): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(PLAN_KEY, JSON.stringify(plan));
  }

  getSessions(): WorkoutSession[] {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as WorkoutSession[];
    } catch {
      return [];
    }
  }

  saveSession(session: WorkoutSession): void {
    if (typeof window === 'undefined') return;
    const current = this.getSessions();
    const existingIdx = current.findIndex(s => s.id === session.id);
    if (existingIdx >= 0) {
      current[existingIdx] = session;
    } else {
      current.unshift(session);
    }
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(current));

    // Background sync
    this.saveSessionToBackend(session).catch(err => {
      console.warn('[WorkoutRepository] Background session sync failed:', err.message);
    });
  }

  async syncSessionsFromBackend(): Promise<WorkoutSession[]> {
    try {
      const remoteSessions = await workoutsApi.getSessions();
      if (remoteSessions && typeof window !== 'undefined') {
        localStorage.setItem(SESSIONS_KEY, JSON.stringify(remoteSessions));
      }
      return remoteSessions;
    } catch (err: any) {
      console.warn('[WorkoutRepository] Could not fetch sessions from backend:', err.message);
      return this.getSessions();
    }
  }

  async saveSessionToBackend(session: WorkoutSession): Promise<WorkoutSession> {
    try {
      if (session.completed) {
        return await workoutsApi.completeSession(session.id, session.durationSeconds, session.notes);
      } else {
        return await workoutsApi.createSession({
          dayId: session.dayId,
          date: session.date,
          notes: session.notes
        });
      }
    } catch {
      return session;
    }
  }

  clear(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(PLAN_KEY);
    localStorage.removeItem(SESSIONS_KEY);
  }
}

export const WorkoutRepository: IWorkoutRepository = new ApiBackedWorkoutRepository();
