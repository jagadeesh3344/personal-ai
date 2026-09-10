import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '../config/supabase.js';

export interface MeasurementEntity {
  id: string;
  userId: string;
  date: string;
  weightKg: number;
  chestCm?: number;
  waistCm?: number;
  hipsCm?: number;
  armsCm?: number;
  thighsCm?: number;
  notes?: string;
  createdAt: string;
}

export interface CheckinEntity {
  id: string;
  userId: string;
  checkinDate: string;
  weightKg: number;
  adherenceScore?: number;
  summary?: string;
  nextMonthFocus?: string;
  createdAt: string;
}

export interface ProgressPhotoEntity {
  id: string;
  userId: string;
  checkinId?: string;
  date: string;
  pose: 'FRONT' | 'SIDE' | 'BACK';
  storagePath: string;
  signedUrl?: string;
  createdAt: string;
}

const memoryMeasurements = new Map<string, MeasurementEntity[]>();
const memoryCheckins = new Map<string, CheckinEntity[]>();
const memoryPhotos = new Map<string, ProgressPhotoEntity[]>();

export class ProgressRepository {
  static async getMeasurements(userId: string, client?: SupabaseClient): Promise<MeasurementEntity[]> {
    if (process.env.NODE_ENV === 'test' || !process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('placeholder')) {
      return memoryMeasurements.get(userId) || [];
    }

    const sb = client || getSupabaseAdmin();
    const { data, error } = await sb
      .from('body_measurements')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error || !data) return [];

    return data.map((d: any) => ({
      id: d.id,
      userId: d.user_id,
      date: d.date,
      weightKg: Number(d.weight_kg),
      chestCm: d.chest_cm ? Number(d.chest_cm) : undefined,
      waistCm: d.waist_cm ? Number(d.waist_cm) : undefined,
      hipsCm: d.hips_cm ? Number(d.hips_cm) : undefined,
      armsCm: d.arms_cm ? Number(d.arms_cm) : undefined,
      thighsCm: d.thighs_cm ? Number(d.thighs_cm) : undefined,
      notes: d.notes,
      createdAt: d.created_at
    }));
  }

  static async addMeasurement(userId: string, data: Omit<MeasurementEntity, 'id' | 'userId' | 'createdAt'>, client?: SupabaseClient): Promise<MeasurementEntity> {
    const item: MeasurementEntity = {
      ...data,
      id: `m-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId,
      createdAt: new Date().toISOString()
    };

    if (process.env.NODE_ENV === 'test' || !process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('placeholder')) {
      const list = memoryMeasurements.get(userId) || [];
      list.unshift(item);
      memoryMeasurements.set(userId, list);
      return item;
    }

    const sb = client || getSupabaseAdmin();
    const { data: created, error } = await sb
      .from('body_measurements')
      .insert({
        user_id: userId,
        date: item.date,
        weight_kg: item.weightKg,
        chest_cm: item.chestCm,
        waist_cm: item.waistCm,
        hips_cm: item.hipsCm,
        arms_cm: item.armsCm,
        thighs_cm: item.thighsCm,
        notes: item.notes
      })
      .select()
      .single();

    if (error) throw error;
    item.id = created.id;
    return item;
  }

  static async getCheckins(userId: string, client?: SupabaseClient): Promise<CheckinEntity[]> {
    if (process.env.NODE_ENV === 'test' || !process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('placeholder')) {
      return memoryCheckins.get(userId) || [];
    }

    const sb = client || getSupabaseAdmin();
    const { data, error } = await sb
      .from('monthly_checkins')
      .select('*')
      .eq('user_id', userId)
      .order('checkin_date', { ascending: false });

    if (error || !data) return [];

    return data.map((c: any) => ({
      id: c.id,
      userId: c.user_id,
      checkinDate: c.checkin_date,
      weightKg: Number(c.weight_kg),
      adherenceScore: c.adherence_score ? Number(c.adherence_score) : undefined,
      summary: c.summary,
      nextMonthFocus: c.next_month_focus,
      createdAt: c.created_at
    }));
  }

  static async createCheckin(userId: string, data: Omit<CheckinEntity, 'id' | 'userId' | 'createdAt'>, client?: SupabaseClient): Promise<CheckinEntity> {
    const item: CheckinEntity = {
      ...data,
      id: `chk-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId,
      createdAt: new Date().toISOString()
    };

    if (process.env.NODE_ENV === 'test' || !process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('placeholder')) {
      const list = memoryCheckins.get(userId) || [];
      list.unshift(item);
      memoryCheckins.set(userId, list);
      return item;
    }

    const sb = client || getSupabaseAdmin();
    const { data: created, error } = await sb
      .from('monthly_checkins')
      .insert({
        user_id: userId,
        checkin_date: item.checkinDate,
        weight_kg: item.weightKg,
        adherence_score: item.adherenceScore,
        summary: item.summary,
        next_month_focus: item.nextMonthFocus
      })
      .select()
      .single();

    if (error) throw error;
    item.id = created.id;
    return item;
  }

  static async createPhotoUploadUrl(userId: string, pose: 'FRONT' | 'SIDE' | 'BACK', fileExtension: string, checkinId?: string): Promise<{ uploadUrl: string; storagePath: string; token: string }> {
    const fileName = `${Date.now()}-${pose.toLowerCase()}.${fileExtension}`;
    const storagePath = `${userId}/${fileName}`;

    if (process.env.NODE_ENV === 'test' || !process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('placeholder')) {
      return {
        uploadUrl: `https://storage.local.mock/upload/${storagePath}`,
        storagePath,
        token: `mock-upload-token-${Date.now()}`
      };
    }

    const sb = getSupabaseAdmin();
    const { data, error } = await sb.storage
      .from('progress-photos')
      .createSignedUploadUrl(storagePath);

    if (error || !data) throw error || new Error('Failed to create upload URL');

    return {
      uploadUrl: data.signedUrl,
      storagePath: data.path,
      token: data.token
    };
  }

  static async getSignedPhotoUrl(userId: string, storagePath: string): Promise<string> {
    // Security check: ensure path belongs to userId
    if (!storagePath.startsWith(`${userId}/`)) {
      throw new Error('Forbidden: Cannot access photos belonging to another user');
    }

    if (process.env.NODE_ENV === 'test' || !process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('placeholder')) {
      return `https://storage.local.mock/download/${storagePath}?signed=true`;
    }

    const sb = getSupabaseAdmin();
    const { data, error } = await sb.storage
      .from('progress-photos')
      .createSignedUrl(storagePath, 60 * 60); // 1 hour expiration

    if (error || !data?.signedUrl) throw error || new Error('Failed to generate signed download URL');
    return data.signedUrl;
  }

  static async getPhotos(userId: string, client?: SupabaseClient): Promise<ProgressPhotoEntity[]> {
    if (process.env.NODE_ENV === 'test' || !process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('placeholder')) {
      return memoryPhotos.get(userId) || [];
    }

    const sb = client || getSupabaseAdmin();
    const { data, error } = await sb
      .from('progress_photos')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error || !data) return [];

    return data.map((p: any) => ({
      id: p.id,
      userId: p.user_id,
      checkinId: p.checkin_id,
      date: p.date,
      pose: p.pose,
      storagePath: p.storage_path,
      createdAt: p.created_at
    }));
  }

  static async addPhotoRecord(
    userId: string, 
    data: { pose: 'FRONT' | 'SIDE' | 'BACK'; storagePath: string; date?: string; checkinId?: string },
    client?: SupabaseClient
  ): Promise<ProgressPhotoEntity> {
    const photo: ProgressPhotoEntity = {
      id: `pho-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId,
      pose: data.pose,
      storagePath: data.storagePath,
      date: data.date || new Date().toISOString().split('T')[0],
      checkinId: data.checkinId,
      createdAt: new Date().toISOString()
    };

    if (process.env.NODE_ENV === 'test' || !process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('placeholder')) {
      const list = memoryPhotos.get(userId) || [];
      list.unshift(photo);
      memoryPhotos.set(userId, list);
      return photo;
    }

    const sb = client || getSupabaseAdmin();
    const { data: created, error } = await sb
      .from('progress_photos')
      .insert({
        user_id: userId,
        pose: photo.pose,
        storage_path: photo.storagePath,
        date: photo.date,
        checkin_id: photo.checkinId
      })
      .select()
      .single();

    if (error) throw error;
    photo.id = created.id;
    return photo;
  }
}

