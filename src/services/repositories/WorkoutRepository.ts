import { WorkoutPlan, WorkoutSession } from '../../types';

const PLAN_KEY = 'friday_workout_plan';
const SESSIONS_KEY = 'friday_workout_sessions';

export interface IWorkoutRepository {
  getActivePlan(): WorkoutPlan | null;
  saveActivePlan(plan: WorkoutPlan): void;
  getSessions(): WorkoutSession[];
  saveSession(session: WorkoutSession): void;
  clear(): void;
}

class LocalWorkoutRepository implements IWorkoutRepository {
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
  }

  clear(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(PLAN_KEY);
    localStorage.removeItem(SESSIONS_KEY);
  }
}

export const WorkoutRepository: IWorkoutRepository = new LocalWorkoutRepository();
