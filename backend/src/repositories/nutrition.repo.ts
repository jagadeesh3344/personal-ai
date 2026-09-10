import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '../config/supabase.js';

export interface MealItemEntity {
  id: string;
  name: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MealEntity {
  id: string;
  userId: string;
  date: string;
  type: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  name: string;
  time: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  items: MealItemEntity[];
}

export interface NutritionTargetsEntity {
  userId: string;
  targetCalories: number;
  maintenanceCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  bmr: number;
}

const memoryMeals = new Map<string, MealEntity[]>();
const memoryTargets = new Map<string, NutritionTargetsEntity>();

export class NutritionRepository {
  static async getMealsForDate(userId: string, date: string, client?: SupabaseClient): Promise<MealEntity[]> {
    if (process.env.NODE_ENV === 'test' || !process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('placeholder')) {
      const userList = memoryMeals.get(userId) || [];
      return userList.filter(m => m.date === date);
    }

    const sb = client || getSupabaseAdmin();
    const { data: meals, error } = await sb
      .from('meals')
      .select('*, meal_items(*)')
      .eq('user_id', userId)
      .eq('date', date)
      .order('created_at', { ascending: true });

    if (error || !meals) return [];

    return meals.map((m: any) => ({
      id: m.id,
      userId: m.user_id,
      date: m.date,
      type: m.type,
      name: m.name,
      time: m.time,
      totalCalories: m.total_calories,
      totalProtein: m.total_protein,
      totalCarbs: m.total_carbs,
      totalFat: m.total_fat,
      items: (m.meal_items || []).map((i: any) => ({
        id: i.id,
        name: i.name,
        quantity: i.quantity,
        calories: i.calories,
        protein: i.protein,
        carbs: i.carbs,
        fat: i.fat
      }))
    }));
  }

  static async createMeal(
    userId: string, 
    data: Omit<MealEntity, 'id' | 'userId' | 'items'> & { items?: Array<Omit<MealItemEntity, 'id'> & { id?: string }> }, 
    client?: SupabaseClient
  ): Promise<MealEntity> {
    const mealId = `meal-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newMeal: MealEntity = {
      ...data,
      id: mealId,
      userId,
      items: (data.items || []).map(i => ({ ...i, id: i.id || `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}` }))
    };

    if (process.env.NODE_ENV === 'test' || !process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('placeholder')) {
      const userList = memoryMeals.get(userId) || [];
      userList.push(newMeal);
      memoryMeals.set(userId, userList);
      return newMeal;
    }

    const sb = client || getSupabaseAdmin();
    const { data: createdMeal, error: mealErr } = await sb
      .from('meals')
      .insert({
        user_id: userId,
        date: newMeal.date,
        type: newMeal.type,
        name: newMeal.name,
        time: newMeal.time,
        total_calories: newMeal.totalCalories,
        total_protein: newMeal.totalProtein,
        total_carbs: newMeal.totalCarbs,
        total_fat: newMeal.totalFat
      })
      .select()
      .single();

    if (mealErr) throw mealErr;
    newMeal.id = createdMeal.id;

    if (newMeal.items && newMeal.items.length > 0) {
      const itemsPayload = newMeal.items.map(item => ({
        meal_id: createdMeal.id,
        user_id: userId,
        name: item.name,
        quantity: item.quantity,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat
      }));
      await sb.from('meal_items').insert(itemsPayload);
    }

    return newMeal;
  }

  static async updateMeal(userId: string, mealId: string, updates: Partial<MealEntity>, client?: SupabaseClient): Promise<MealEntity> {
    if (process.env.NODE_ENV === 'test' || !process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('placeholder')) {
      const userList = memoryMeals.get(userId) || [];
      const index = userList.findIndex(m => m.id === mealId);
      if (index === -1) throw new Error('Meal not found or does not belong to user');
      userList[index] = { ...userList[index], ...updates };
      return userList[index];
    }

    const sb = client || getSupabaseAdmin();
    const { data: updated, error } = await sb
      .from('meals')
      .update({
        ...(updates.name && { name: updates.name }),
        ...(updates.type && { type: updates.type }),
        ...(updates.time && { time: updates.time }),
        ...(updates.totalCalories !== undefined && { total_calories: updates.totalCalories }),
        ...(updates.totalProtein !== undefined && { total_protein: updates.totalProtein }),
        ...(updates.totalCarbs !== undefined && { total_carbs: updates.totalCarbs }),
        ...(updates.totalFat !== undefined && { total_fat: updates.totalFat })
      })
      .eq('id', mealId)
      .eq('user_id', userId)
      .select('*, meal_items(*)')
      .single();

    if (error || !updated) throw new Error('Meal not found or update failed');

    return {
      id: updated.id,
      userId: updated.user_id,
      date: updated.date,
      type: updated.type,
      name: updated.name,
      time: updated.time,
      totalCalories: updated.total_calories,
      totalProtein: updated.total_protein,
      totalCarbs: updated.total_carbs,
      totalFat: updated.total_fat,
      items: (updated.meal_items || []).map((i: any) => ({
        id: i.id,
        name: i.name,
        quantity: i.quantity,
        calories: i.calories,
        protein: i.protein,
        carbs: i.carbs,
        fat: i.fat
      }))
    };
  }

  static async deleteMeal(userId: string, mealId: string, client?: SupabaseClient): Promise<boolean> {
    if (process.env.NODE_ENV === 'test' || !process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('placeholder')) {
      const userList = memoryMeals.get(userId) || [];
      const filtered = userList.filter(m => m.id !== mealId);
      if (filtered.length === userList.length) return false;
      memoryMeals.set(userId, filtered);
      return true;
    }

    const sb = client || getSupabaseAdmin();
    const { error } = await sb
      .from('meals')
      .delete()
      .eq('id', mealId)
      .eq('user_id', userId);

    return !error;
  }

  static async getTargets(userId: string, client?: SupabaseClient): Promise<NutritionTargetsEntity | null> {
    if (process.env.NODE_ENV === 'test' || !process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('placeholder')) {
      return memoryTargets.get(userId) || null;
    }

    const sb = client || getSupabaseAdmin();
    const { data, error } = await sb
      .from('nutrition_targets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) return null;

    return {
      userId: data.user_id,
      targetCalories: data.target_calories,
      maintenanceCalories: data.maintenance_calories,
      proteinGrams: data.protein_grams,
      carbsGrams: data.carbs_grams,
      fatGrams: data.fat_grams,
      bmr: data.bmr
    };
  }

  static async saveTargets(userId: string, targets: NutritionTargetsEntity, client?: SupabaseClient): Promise<NutritionTargetsEntity> {
    if (process.env.NODE_ENV === 'test' || !process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('placeholder')) {
      memoryTargets.set(userId, targets);
      return targets;
    }

    const sb = client || getSupabaseAdmin();
    const { error } = await sb
      .from('nutrition_targets')
      .upsert({
        user_id: userId,
        target_calories: targets.targetCalories,
        maintenance_calories: targets.maintenanceCalories,
        protein_grams: targets.proteinGrams,
        carbs_grams: targets.carbsGrams,
        fat_grams: targets.fatGrams,
        bmr: targets.bmr,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
    return targets;
  }

  static async getAllMeals(userId: string, client?: SupabaseClient): Promise<MealEntity[]> {
    if (process.env.NODE_ENV === 'test' || !process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('placeholder')) {
      return memoryMeals.get(userId) || [];
    }

    const sb = client || getSupabaseAdmin();
    const { data: meals, error } = await sb
      .from('meals')
      .select('*, meal_items(*)')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error || !meals) return [];

    return meals.map((m: any) => ({
      id: m.id,
      userId: m.user_id,
      date: m.date,
      type: m.type,
      name: m.name,
      time: m.time,
      totalCalories: m.total_calories,
      totalProtein: m.total_protein,
      totalCarbs: m.total_carbs,
      totalFat: m.total_fat,
      items: (m.meal_items || []).map((i: any) => ({
        id: i.id,
        name: i.name,
        quantity: i.quantity,
        calories: i.calories,
        protein: i.protein,
        carbs: i.carbs,
        fat: i.fat
      }))
    }));
  }
}

