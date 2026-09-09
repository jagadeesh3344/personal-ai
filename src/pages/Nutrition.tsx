import React, { useState } from 'react';
import { MealCard } from '../components/nutrition/MealCard';
import { Card } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Apple, GlassWater, Plus, ArrowLeft, Trash2 } from 'lucide-react';
import { NutritionTargets, Meal, MealItem, DailyHydration } from '../types';

interface NutritionProps {
  targets: NutritionTargets | null;
  meals: Meal[];
  hydration: DailyHydration;
  onAddMealItem: (mealId: string, item: MealItem) => void;
  onDeleteMealItem: (mealId: string, itemIndex: number) => void;
  onAddWater: (amountMl: number) => void;
  onDeleteWaterEntry: (id: string) => void;
  setTab: (tab: string) => void;
}

export const Nutrition: React.FC<NutritionProps> = ({
  targets,
  meals,
  hydration,
  onAddMealItem,
  onDeleteMealItem,
  onAddWater,
  onDeleteWaterEntry,
  setTab
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeMealId, setActiveMealId] = useState<string>('m-breakfast');

  // New food entry form
  const [foodName, setFoodName] = useState('');
  const [foodCalories, setFoodCalories] = useState('');
  const [foodProtein, setFoodProtein] = useState('');
  const [foodCarbs, setFoodCarbs] = useState('');
  const [foodFat, setFoodFat] = useState('');

  const currentCalories = meals.reduce((acc, m) => acc + m.totalCalories, 0);
  const currentProtein = meals.reduce((acc, m) => acc + m.totalProtein, 0);
  const currentCarbs = meals.reduce((acc, m) => acc + m.totalCarbs, 0);
  const currentFat = meals.reduce((acc, m) => acc + m.totalFat, 0);

  const targetCalories = targets?.targetCalories || 2000;
  const targetProtein = targets?.proteinGrams || 140;
  const targetCarbs = targets?.carbsGrams || 200;
  const targetFat = targets?.fatGrams || 60;
  const targetWaterLiters = (hydration.targetMl / 1000).toFixed(1);
  const currentWaterLiters = (hydration.consumedMl / 1000).toFixed(2);

  const handleOpenAddModal = (mealId: string) => {
    setActiveMealId(mealId);
    setShowAddModal(true);
  };

  const handleAddFoodSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodName.trim()) return;

    const newItem: MealItem = {
      id: `fi-${Date.now()}`,
      name: foodName.trim(),
      calories: parseInt(foodCalories, 10) || 0,
      protein: parseInt(foodProtein, 10) || 0,
      carbs: parseInt(foodCarbs, 10) || 0,
      fat: parseInt(foodFat, 10) || 0
    };

    onAddMealItem(activeMealId, newItem);

    setFoodName('');
    setFoodCalories('');
    setFoodProtein('');
    setFoodCarbs('');
    setFoodFat('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-950/40 border border-zinc-900 p-5 rounded-xl">
        <div>
          <button 
            onClick={() => setTab('dashboard')} 
            className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-white uppercase tracking-wider mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </button>
          <h1 className="text-xl font-black text-white uppercase tracking-tight">Nutrition & Hydration</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Mifflin-St Jeor goal targets: {targetCalories} kcal | {targetProtein}g Protein | {targetWaterLiters}L Water
          </p>
        </div>
      </div>

      {/* Macro HUD Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Calories */}
        <Card className="p-4 bg-zinc-950/40 border-zinc-850" hoverEffect={false}>
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Calories</span>
          <div className="text-xl font-black text-white font-mono">
            {currentCalories} <span className="text-xs text-zinc-500 font-normal">/ {targetCalories} kcal</span>
          </div>
          <ProgressBar value={currentCalories} max={targetCalories} color="emerald" className="mt-2" />
        </Card>

        {/* Protein */}
        <Card className="p-4 bg-zinc-950/40 border-zinc-850" hoverEffect={false}>
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Protein</span>
          <div className="text-xl font-black text-white font-mono">
            {currentProtein} <span className="text-xs text-zinc-500 font-normal">/ {targetProtein}g</span>
          </div>
          <ProgressBar value={currentProtein} max={targetProtein} color="cyan" className="mt-2" />
        </Card>

        {/* Carbs */}
        <Card className="p-4 bg-zinc-950/40 border-zinc-850" hoverEffect={false}>
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Carbohydrates</span>
          <div className="text-xl font-black text-white font-mono">
            {currentCarbs} <span className="text-xs text-zinc-500 font-normal">/ {targetCarbs}g</span>
          </div>
          <ProgressBar value={currentCarbs} max={targetCarbs} color="amber" className="mt-2" />
        </Card>

        {/* Hydration */}
        <Card className="p-4 bg-zinc-950/40 border-zinc-850" hoverEffect={false}>
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Water Intake</span>
          <div className="text-xl font-black text-white font-mono">
            {currentWaterLiters} <span className="text-xs text-zinc-500 font-normal">/ {targetWaterLiters}L</span>
          </div>
          <ProgressBar value={hydration.consumedMl} max={hydration.targetMl} color="cyan" className="mt-2" />
        </Card>
      </div>

      {/* Hydration Quick Log Tray */}
      <Card className="p-5 bg-zinc-950/40 border-zinc-850" hoverEffect={false}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <GlassWater className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Hydration Intake Log</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                {hydration.consumedMl} ml consumed today. Quick add or review timestamped entries.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {[250, 500, 750, 1000].map(amount => (
              <Button
                key={amount}
                variant="outline"
                size="sm"
                onClick={() => onAddWater(amount)}
                className="text-xs font-mono font-bold"
              >
                +{amount >= 1000 ? '1L' : `${amount}ml`}
              </Button>
            ))}
          </div>
        </div>

        {/* Recent Water Entries */}
        {hydration.entries.length > 0 && (
          <div className="mt-4 pt-3 border-t border-zinc-900/60 flex flex-wrap gap-2">
            {hydration.entries.map(entry => (
              <div
                key={entry.id}
                className="flex items-center gap-2 bg-zinc-900/50 border border-zinc-850 px-2.5 py-1 rounded-md text-xs font-mono text-zinc-300"
              >
                <span>+{entry.amountMl}ml</span>
                <span className="text-[10px] text-zinc-500">
                  {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <button
                  onClick={() => onDeleteWaterEntry(entry.id)}
                  className="text-zinc-500 hover:text-red-400 ml-1 cursor-pointer"
                  title="Delete entry"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Meals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {meals.map(meal => (
          <MealCard
            key={meal.id}
            meal={meal}
            onAddFoodClick={handleOpenAddModal}
            onDeleteFoodItem={onDeleteMealItem}
          />
        ))}
      </div>

      {/* Add Food Item Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="LOG FOOD ITEM">
        <form onSubmit={handleAddFoodSubmit} className="space-y-4 pt-2">
          <Input
            id="food-name"
            label="Food / Meal Description"
            value={foodName}
            onChange={e => setFoodName(e.target.value)}
            placeholder="e.g. Grilled Chicken Breast (200g)"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="food-cal"
              label="Calories (kcal)"
              type="number"
              value={foodCalories}
              onChange={e => setFoodCalories(e.target.value)}
              placeholder="e.g. 330"
              required
            />
            <Input
              id="food-prot"
              label="Protein (grams)"
              type="number"
              value={foodProtein}
              onChange={e => setFoodProtein(e.target.value)}
              placeholder="e.g. 62"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="food-carbs"
              label="Carbohydrates (g)"
              type="number"
              value={foodCarbs}
              onChange={e => setFoodCarbs(e.target.value)}
              placeholder="e.g. 0"
            />
            <Input
              id="food-fat"
              label="Fat (g)"
              type="number"
              value={foodFat}
              onChange={e => setFoodFat(e.target.value)}
              placeholder="e.g. 7"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Log Food
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
