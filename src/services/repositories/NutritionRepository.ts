import { Meal, MealItem } from '../../types';
import { nutritionApi } from '../api/nutritionApi';

const NUTRITION_PREFIX = 'friday_meals_';

export interface INutritionRepository {
  getMeals(dateStr: string): Meal[];
  saveMeals(dateStr: string, meals: Meal[]): void;
  addMealItem(dateStr: string, mealId: string, item: MealItem): void;
  removeMealItem(dateStr: string, mealId: string, itemId: string): void;
  syncFromBackend(dateStr: string): Promise<Meal[]>;
  clear(): void;
}

export function getDefaultDayMeals(): Meal[] {
  return [
    { id: 'm-breakfast', name: 'Breakfast', type: 'BREAKFAST', items: [], totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 },
    { id: 'm-lunch', name: 'Lunch', type: 'LUNCH', items: [], totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 },
    { id: 'm-dinner', name: 'Dinner', type: 'DINNER', items: [], totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 },
    { id: 'm-snack', name: 'Snacks', type: 'SNACK', items: [], totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 }
  ];
}

class ApiBackedNutritionRepository implements INutritionRepository {
  private getKey(dateStr: string): string {
    return `${NUTRITION_PREFIX}${dateStr}`;
  }

  getMeals(dateStr: string): Meal[] {
    if (typeof window === 'undefined') return getDefaultDayMeals();
    const raw = localStorage.getItem(this.getKey(dateStr));
    if (!raw) return getDefaultDayMeals();
    try {
      return JSON.parse(raw) as Meal[];
    } catch {
      return getDefaultDayMeals();
    }
  }

  saveMeals(dateStr: string, meals: Meal[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.getKey(dateStr), JSON.stringify(meals));
  }

  addMealItem(dateStr: string, mealId: string, item: MealItem): void {
    const meals = this.getMeals(dateStr);
    const target = meals.find(m => m.id === mealId);
    if (!target) return;

    const prevItems = [...target.items];
    target.items.push(item);
    target.totalCalories = target.items.reduce((acc, curr) => acc + curr.calories, 0);
    target.totalProtein = target.items.reduce((acc, curr) => acc + curr.protein, 0);
    target.totalCarbs = target.items.reduce((acc, curr) => acc + curr.carbs, 0);
    target.totalFat = target.items.reduce((acc, curr) => acc + curr.fat, 0);

    this.saveMeals(dateStr, meals);

    // Sync to backend with rollback on persistent failure
    nutritionApi.updateMeal(target.id, target).catch(() => {
      // Fallback: create meal if not yet existing on backend
      nutritionApi.createMeal(target).catch(err => {
        console.warn('[NutritionRepository] Background meal sync failed. Rolling back:', err.message);
        target.items = prevItems;
        target.totalCalories = target.items.reduce((acc, curr) => acc + curr.calories, 0);
        target.totalProtein = target.items.reduce((acc, curr) => acc + curr.protein, 0);
        target.totalCarbs = target.items.reduce((acc, curr) => acc + curr.carbs, 0);
        target.totalFat = target.items.reduce((acc, curr) => acc + curr.fat, 0);
        this.saveMeals(dateStr, meals);
      });
    });
  }

  removeMealItem(dateStr: string, mealId: string, itemId: string): void {
    const meals = this.getMeals(dateStr);
    const target = meals.find(m => m.id === mealId);
    if (!target) return;

    const removedItem = target.items.find(i => i.id === itemId);
    const prevItems = [...target.items];
    target.items = target.items.filter(i => i.id !== itemId);
    target.totalCalories = target.items.reduce((acc, curr) => acc + curr.calories, 0);
    target.totalProtein = target.items.reduce((acc, curr) => acc + curr.protein, 0);
    target.totalCarbs = target.items.reduce((acc, curr) => acc + curr.carbs, 0);
    target.totalFat = target.items.reduce((acc, curr) => acc + curr.fat, 0);

    this.saveMeals(dateStr, meals);

    nutritionApi.updateMeal(target.id, target).catch(err => {
      console.warn('[NutritionRepository] Background item removal sync failed. Rolling back:', err.message);
      if (removedItem) {
        target.items = prevItems;
        target.totalCalories = target.items.reduce((acc, curr) => acc + curr.calories, 0);
        target.totalProtein = target.items.reduce((acc, curr) => acc + curr.protein, 0);
        target.totalCarbs = target.items.reduce((acc, curr) => acc + curr.carbs, 0);
        target.totalFat = target.items.reduce((acc, curr) => acc + curr.fat, 0);
        this.saveMeals(dateStr, meals);
      }
    });
  }

  async syncFromBackend(dateStr: string): Promise<Meal[]> {
    try {
      const data = await nutritionApi.getTodayMeals(dateStr);
      if (data?.meals && data.meals.length > 0) {
        this.saveMeals(dateStr, data.meals);
        return data.meals;
      }
    } catch (err: any) {
      console.warn('[NutritionRepository] Backend fetch failed:', err.message);
    }
    return this.getMeals(dateStr);
  }

  clear(): void {
    if (typeof window === 'undefined') return;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(NUTRITION_PREFIX)) {
        localStorage.removeItem(key);
      }
    }
  }
}

export const NutritionRepository: INutritionRepository = new ApiBackedNutritionRepository();
