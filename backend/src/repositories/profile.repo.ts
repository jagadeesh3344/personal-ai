import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '../config/supabase.js';

export interface UserProfileEntity {
  id: string;
  name: string;
  age: number;
  sex: 'MALE' | 'FEMALE' | 'OTHER';
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg: number;
  goal: string;
  activityLevel: string;
  trainingExperience: string;
  trainingEnvironment: string;
  equipment: string[];
  availableWorkoutDays: string[];
  preferredWorkoutDuration: number;
  dietPreference: string;
  foodPreferences: string[];
  allergies: string[];
  intolerances: string[];
  createdAt?: string;
  updatedAt?: string;
}

// In-memory store for test/offline mock resilience
const memoryProfiles = new Map<string, UserProfileEntity>();

export class ProfileRepository {
  static async getProfile(userId: string, client?: SupabaseClient): Promise<UserProfileEntity | null> {
    if (process.env.NODE_ENV === 'test' || !process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('placeholder')) {
      return memoryProfiles.get(userId) || null;
    }

    const sb = client || getSupabaseAdmin();
    const { data: profile, error } = await sb
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !profile) return null;

    const { data: equipRows } = await sb
      .from('user_equipment')
      .select('equipment')
      .eq('user_id', userId);

    const equipment = equipRows && equipRows.length > 0 
      ? equipRows.map((r: any) => r.equipment) 
      : ['NONE'];

    return {
      id: profile.id,
      name: profile.name,
      age: profile.age,
      sex: profile.sex,
      heightCm: Number(profile.height_cm),
      currentWeightKg: Number(profile.current_weight_kg),
      targetWeightKg: Number(profile.target_weight_kg),
      goal: profile.goal,
      activityLevel: profile.activity_level,
      trainingExperience: profile.training_experience,
      trainingEnvironment: profile.training_environment,
      equipment,
      availableWorkoutDays: profile.available_workout_days || ['MON', 'WED', 'FRI'],
      preferredWorkoutDuration: profile.preferred_workout_duration || 45,
      dietPreference: profile.diet_preference || 'STANDARD',
      foodPreferences: profile.food_preferences || [],
      allergies: profile.allergies || [],
      intolerances: profile.intolerances || [],
      createdAt: profile.created_at,
      updatedAt: profile.updated_at
    };
  }

  static async upsertProfile(
    userId: string, 
    data: Partial<UserProfileEntity>, 
    client?: SupabaseClient
  ): Promise<UserProfileEntity> {
    const existing = await this.getProfile(userId, client);
    const updated: UserProfileEntity = {
      id: userId,
      name: data.name ?? existing?.name ?? 'Athlete',
      age: data.age ?? existing?.age ?? 25,
      sex: data.sex ?? existing?.sex ?? 'MALE',
      heightCm: data.heightCm ?? existing?.heightCm ?? 175,
      currentWeightKg: data.currentWeightKg ?? existing?.currentWeightKg ?? 70,
      targetWeightKg: data.targetWeightKg ?? existing?.targetWeightKg ?? 70,
      goal: data.goal ?? existing?.goal ?? 'GENERAL_FITNESS',
      activityLevel: data.activityLevel ?? existing?.activityLevel ?? 'MODERATELY_ACTIVE',
      trainingExperience: data.trainingExperience ?? existing?.trainingExperience ?? 'BEGINNER',
      trainingEnvironment: data.trainingEnvironment ?? existing?.trainingEnvironment ?? 'HOME',
      equipment: data.equipment ?? existing?.equipment ?? ['NONE'],
      availableWorkoutDays: data.availableWorkoutDays ?? existing?.availableWorkoutDays ?? ['MON', 'WED', 'FRI'],
      preferredWorkoutDuration: data.preferredWorkoutDuration ?? existing?.preferredWorkoutDuration ?? 45,
      dietPreference: data.dietPreference ?? existing?.dietPreference ?? 'STANDARD',
      foodPreferences: data.foodPreferences ?? existing?.foodPreferences ?? [],
      allergies: data.allergies ?? existing?.allergies ?? [],
      intolerances: data.intolerances ?? existing?.intolerances ?? [],
      updatedAt: new Date().toISOString()
    };

    if (process.env.NODE_ENV === 'test' || !process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('placeholder')) {
      memoryProfiles.set(userId, updated);
      return updated;
    }

    const sb = client || getSupabaseAdmin();
    const { error: profileErr } = await sb
      .from('profiles')
      .upsert({
        id: userId,
        name: updated.name,
        age: updated.age,
        sex: updated.sex,
        height_cm: updated.heightCm,
        current_weight_kg: updated.currentWeightKg,
        target_weight_kg: updated.targetWeightKg,
        goal: updated.goal,
        activity_level: updated.activityLevel,
        training_experience: updated.trainingExperience,
        training_environment: updated.trainingEnvironment,
        diet_preference: updated.dietPreference,
        food_preferences: updated.foodPreferences,
        allergies: updated.allergies,
        intolerances: updated.intolerances,
        updated_at: new Date().toISOString()
      });

    if (profileErr) throw profileErr;

    if (data.equipment) {
      await sb.from('user_equipment').delete().eq('user_id', userId);
      const equipRows = data.equipment.map(eq => ({ user_id: userId, equipment: eq }));
      if (equipRows.length > 0) {
        await sb.from('user_equipment').insert(equipRows);
      }
    }

    return updated;
  }
}
