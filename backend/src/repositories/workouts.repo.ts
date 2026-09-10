import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '../config/supabase.js';

export interface WorkoutSessionEntity {
  id: string;
  userId: string;
  dayId?: string | null;
  date: string;
  startedAt: string;
  completedAt?: string | null;
  completed: boolean;
  durationSeconds: number;
  notes?: string | null;
  sets: WorkoutSetEntity[];
}

export interface WorkoutSetEntity {
  id: string;
  sessionId: string;
  exerciseId: string;
  setNumber: number;
  weightKg: number;
  reps: number;
  durationSeconds?: number;
  resistanceLevel?: string;
  completed: boolean;
  rpe?: number;
  completionMethod?: 'CAMERA' | 'VOICE' | 'MANUAL';
  verification?: 'VERIFIED' | 'SELF_REPORTED';
}

const memorySessions = new Map<string, WorkoutSessionEntity[]>();

export class WorkoutsRepository {
  static async getSessions(userId: string, client?: SupabaseClient): Promise<WorkoutSessionEntity[]> {
    if (process.env.NODE_ENV === 'test' || !process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('placeholder')) {
      return memorySessions.get(userId) || [];
    }

    const sb = client || getSupabaseAdmin();
    const { data: sessions, error } = await sb
      .from('workout_sessions')
      .select('*, workout_sets(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !sessions) return [];

    return sessions.map((s: any) => ({
      id: s.id,
      userId: s.user_id,
      dayId: s.day_id,
      date: s.date,
      startedAt: s.started_at,
      completedAt: s.completed_at,
      completed: s.completed,
      durationSeconds: s.duration_seconds || 0,
      notes: s.notes,
      sets: (s.workout_sets || []).map((set: any) => ({
        id: set.id,
        sessionId: set.session_id,
        exerciseId: set.exercise_id,
        setNumber: set.set_number,
        weightKg: Number(set.weight_kg),
        reps: set.reps,
        durationSeconds: set.duration_seconds ? Number(set.duration_seconds) : undefined,
        resistanceLevel: set.resistance_level || undefined,
        completed: set.completed,
        rpe: set.rpe ? Number(set.rpe) : undefined,
        completionMethod: set.completion_method || 'MANUAL',
        verification: set.verification || 'SELF_REPORTED'
      }))
    }));
  }

  static async createSession(
    userId: string, 
    data: { dayId?: string | null; date?: string; notes?: string }, 
    client?: SupabaseClient
  ): Promise<WorkoutSessionEntity> {
    const newSession: WorkoutSessionEntity = {
      id: `sess-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId,
      dayId: data.dayId || null,
      date: data.date || new Date().toISOString().split('T')[0],
      startedAt: new Date().toISOString(),
      completed: false,
      durationSeconds: 0,
      notes: data.notes || '',
      sets: []
    };

    if (process.env.NODE_ENV === 'test' || !process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('placeholder')) {
      const userList = memorySessions.get(userId) || [];
      userList.unshift(newSession);
      memorySessions.set(userId, userList);
      return newSession;
    }

    const sb = client || getSupabaseAdmin();
    const { data: created, error } = await sb
      .from('workout_sessions')
      .insert({
        user_id: userId,
        day_id: data.dayId || null,
        date: newSession.date,
        started_at: newSession.startedAt,
        completed: false,
        notes: data.notes
      })
      .select()
      .single();

    if (error) throw error;
    newSession.id = created.id;
    return newSession;
  }

  static async addSet(
    userId: string, 
    sessionId: string, 
    setData: { 
      exerciseId: string; 
      setNumber: number; 
      weightKg: number; 
      reps: number; 
      durationSeconds?: number;
      resistanceLevel?: string;
      completed?: boolean; 
      rpe?: number;
      completionMethod?: 'CAMERA' | 'VOICE' | 'MANUAL';
      verification?: 'VERIFIED' | 'SELF_REPORTED';
    }, 
    client?: SupabaseClient
  ): Promise<WorkoutSetEntity> {
    const newSet: WorkoutSetEntity = {
      id: `set-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      sessionId,
      exerciseId: setData.exerciseId,
      setNumber: setData.setNumber,
      weightKg: setData.weightKg,
      reps: setData.reps,
      durationSeconds: setData.durationSeconds,
      resistanceLevel: setData.resistanceLevel,
      completed: setData.completed ?? false,
      rpe: setData.rpe,
      completionMethod: setData.completionMethod || 'MANUAL',
      verification: setData.verification || 'SELF_REPORTED'
    };

    if (process.env.NODE_ENV === 'test' || !process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('placeholder')) {
      const userList = memorySessions.get(userId) || [];
      const session = userList.find(s => s.id === sessionId);
      if (!session) {
        throw new Error('Session not found or does not belong to user');
      }
      session.sets.push(newSet);
      return newSet;
    }

    const sb = client || getSupabaseAdmin();
    // Validate session ownership
    const { data: session } = await sb
      .from('workout_sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    if (!session) {
      throw new Error('Session not found or does not belong to user');
    }

    const { data: created, error } = await sb
      .from('workout_sets')
      .insert({
        session_id: sessionId,
        user_id: userId,
        exercise_id: setData.exerciseId,
        set_number: setData.setNumber,
        weight_kg: setData.weightKg,
        reps: setData.reps,
        duration_seconds: setData.durationSeconds || null,
        resistance_level: setData.resistanceLevel || null,
        completed: setData.completed ?? false,
        rpe: setData.rpe || null,
        completion_method: newSet.completionMethod,
        verification: newSet.verification
      })
      .select()
      .single();

    if (error) throw error;
    newSet.id = created.id;
    newSet.completionMethod = created.completion_method || newSet.completionMethod;
    newSet.verification = created.verification || newSet.verification;
    return newSet;
  }

  static async completeSession(
    userId: string, 
    sessionId: string, 
    durationSeconds: number, 
    notes?: string, 
    client?: SupabaseClient
  ): Promise<WorkoutSessionEntity> {
    const completedAt = new Date().toISOString();

    if (process.env.NODE_ENV === 'test' || !process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('placeholder')) {
      const userList = memorySessions.get(userId) || [];
      const session = userList.find(s => s.id === sessionId);
      if (!session) throw new Error('Session not found or does not belong to user');
      session.completed = true;
      session.completedAt = completedAt;
      session.durationSeconds = durationSeconds;
      if (notes) session.notes = notes;
      return session;
    }

    const sb = client || getSupabaseAdmin();
    const { data: updated, error } = await sb
      .from('workout_sessions')
      .update({
        completed: true,
        completed_at: completedAt,
        duration_seconds: durationSeconds,
        notes: notes || undefined
      })
      .eq('id', sessionId)
      .eq('user_id', userId)
      .select('*, workout_sets(*)')
      .single();

    if (error || !updated) throw new Error('Session not found or update failed');

    return {
      id: updated.id,
      userId: updated.user_id,
      dayId: updated.day_id,
      date: updated.date,
      startedAt: updated.started_at,
      completedAt: updated.completed_at,
      completed: updated.completed,
      durationSeconds: updated.duration_seconds,
      notes: updated.notes,
      sets: (updated.workout_sets || []).map((set: any) => ({
        id: set.id,
        sessionId: set.session_id,
        exerciseId: set.exercise_id,
        setNumber: set.set_number,
        weightKg: Number(set.weight_kg),
        reps: set.reps,
        durationSeconds: set.duration_seconds ? Number(set.duration_seconds) : undefined,
        resistanceLevel: set.resistance_level || undefined,
        completed: set.completed,
        rpe: set.rpe ? Number(set.rpe) : undefined,
        completionMethod: set.completion_method || 'MANUAL',
        verification: set.verification || 'SELF_REPORTED'
      }))
    };
  }

  static async getExerciseHistory(
    userId: string,
    exerciseId?: string,
    client?: SupabaseClient
  ): Promise<Array<{
    sessionId: string;
    date: string;
    exerciseId: string;
    setNumber: number;
    actualReps: number;
    weightKg: number;
    durationSeconds?: number;
    resistanceLevel?: string;
    completed: boolean;
    completionMethod: 'CAMERA' | 'VOICE' | 'MANUAL';
    verification: 'VERIFIED' | 'SELF_REPORTED';
    rpe?: number;
  }>> {
    const sessions = await this.getSessions(userId, client);
    const history: Array<{
      sessionId: string;
      date: string;
      exerciseId: string;
      setNumber: number;
      actualReps: number;
      weightKg: number;
      durationSeconds?: number;
      resistanceLevel?: string;
      completed: boolean;
      completionMethod: 'CAMERA' | 'VOICE' | 'MANUAL';
      verification: 'VERIFIED' | 'SELF_REPORTED';
      rpe?: number;
    }> = [];

    for (const session of sessions) {
      for (const set of session.sets) {
        if (!exerciseId || set.exerciseId === exerciseId) {
          history.push({
            sessionId: session.id,
            date: session.date,
            exerciseId: set.exerciseId,
            setNumber: set.setNumber,
            actualReps: set.reps,
            weightKg: set.weightKg,
            durationSeconds: set.durationSeconds,
            resistanceLevel: set.resistanceLevel,
            completed: set.completed,
            completionMethod: set.completionMethod || 'MANUAL',
            verification: set.verification || 'SELF_REPORTED',
            rpe: set.rpe
          });
        }
      }
    }

    return history.sort((a, b) => a.date.localeCompare(b.date) || a.setNumber - b.setNumber);
  }
}
