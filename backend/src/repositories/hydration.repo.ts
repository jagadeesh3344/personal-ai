import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '../config/supabase.js';

export interface HydrationEntryEntity {
  id: string;
  userId: string;
  date: string;
  amountMl: number;
  loggedAt: string;
}

const memoryHydration = new Map<string, HydrationEntryEntity[]>();

export class HydrationRepository {
  static async getEntriesForDate(userId: string, date: string, client?: SupabaseClient): Promise<HydrationEntryEntity[]> {
    if (process.env.NODE_ENV === 'test' || !process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('placeholder')) {
      const userList = memoryHydration.get(userId) || [];
      return userList.filter(e => e.date === date);
    }

    const sb = client || getSupabaseAdmin();
    const { data, error } = await sb
      .from('hydration_entries')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .order('logged_at', { ascending: true });

    if (error || !data) return [];

    return data.map((d: any) => ({
      id: d.id,
      userId: d.user_id,
      date: d.date,
      amountMl: d.amount_ml,
      loggedAt: d.logged_at
    }));
  }

  static async addEntry(userId: string, amountMl: number, date?: string, client?: SupabaseClient): Promise<HydrationEntryEntity> {
    const entry: HydrationEntryEntity = {
      id: `hyd-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId,
      date: date || new Date().toISOString().split('T')[0],
      amountMl,
      loggedAt: new Date().toISOString()
    };

    if (process.env.NODE_ENV === 'test' || !process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('placeholder')) {
      const userList = memoryHydration.get(userId) || [];
      userList.push(entry);
      memoryHydration.set(userId, userList);
      return entry;
    }

    const sb = client || getSupabaseAdmin();
    const { data, error } = await sb
      .from('hydration_entries')
      .insert({
        user_id: userId,
        date: entry.date,
        amount_ml: entry.amountMl,
        logged_at: entry.loggedAt
      })
      .select()
      .single();

    if (error) throw error;
    entry.id = data.id;
    return entry;
  }

  static async deleteEntry(userId: string, entryId: string, client?: SupabaseClient): Promise<boolean> {
    if (process.env.NODE_ENV === 'test' || !process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('placeholder')) {
      const userList = memoryHydration.get(userId) || [];
      const filtered = userList.filter(e => e.id !== entryId);
      if (filtered.length === userList.length) return false;
      memoryHydration.set(userId, filtered);
      return true;
    }

    const sb = client || getSupabaseAdmin();
    const { error } = await sb
      .from('hydration_entries')
      .delete()
      .eq('id', entryId)
      .eq('user_id', userId);

    return !error;
  }

  static async getAllEntries(userId: string, client?: SupabaseClient): Promise<HydrationEntryEntity[]> {
    if (process.env.NODE_ENV === 'test' || !process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('placeholder')) {
      return memoryHydration.get(userId) || [];
    }

    const sb = client || getSupabaseAdmin();
    const { data, error } = await sb
      .from('hydration_entries')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error || !data) return [];

    return data.map((d: any) => ({
      id: d.id,
      userId: d.user_id,
      date: d.date,
      amountMl: d.amount_ml,
      loggedAt: d.logged_at
    }));
  }
}

