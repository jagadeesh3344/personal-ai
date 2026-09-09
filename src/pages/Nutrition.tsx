import React, { useState } from 'react';
import { MealCard } from '../components/nutrition/MealCard';
import { Card } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Apple, GlassWater, Plus, ArrowLeft, TrendingUp, Sparkles, Trash2 } from 'lucide-react';
import { Nutrition as NutritionType, Meal, MealItem, HydrationData } from '../types';

interface NutritionProps {
  nutrition: NutritionType;
  hydration: HydrationData;
  onAddWater: (amountMl: number) => void;
  onDeleteWaterEntry: (id: string) => void;
  meals: Meal[];
  setMeals: React.Dispatch<React.SetStateAction<Meal[]>>;
  setTab: (tab: string) => void;
}

export const Nutrition: React.FC<NutritionProps> = ({
  nutrition,
  hydration,
  onAddWater,
  onDeleteWaterEntry,
  meals,
  setMeals,
  setTab
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeMealId, setActiveMealId] = useState<string>('m1');
  
  // New food entry forms
  const [foodName, setFoodName] = useState('');
  const [foodCalories, setFoodCalories] = useState('150');
  const [foodProtein, setFoodProtein] = useState('15');
  const [foodCarbs, setFoodCarbs] = useState('15');
  const [foodFat, setFoodFat] = useState('4');

  const handleOpenAddModal = (mealId: string) => {
    setActiveMealId(mealId);
    setShowAddModal(true);
  };

  const handleAddFoodSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodName.trim()) return;

    const calNum = parseInt(foodCalories) || 0;
    const protNum = parseInt(foodProtein) || 0;
    const carbNum = parseInt(foodCarbs) || 0;
    const fatNum = parseInt(foodFat) || 0;

    const newItem: MealItem = {
      name: foodName,
      calories: calNum,
      protein: protNum,
      carbs: carbNum,
      fat: fatNum
    };

    // Update meals logs
    setMeals(prev => prev.map(m => {
      if (m.id === activeMealId) {
        const updatedItems = [...m.items, newItem];
        const updatedCalories = updatedItems.reduce((acc, curr) => acc + curr.calories, 0);
        const updatedProtein = updatedItems.reduce((acc, curr) => acc + curr.protein, 0);
        const updatedCarbs = updatedItems.reduce((acc, curr) => acc + (curr.carbs || 0), 0);
        const updatedFat = updatedItems.reduce((acc, curr) => acc + (curr.fat || 0), 0);
        return {
          ...m,
          items: updatedItems,
          totalCalories: updatedCalories,
          totalProtein: updatedProtein,
          totalCarbs: updatedCarbs,
          totalFat: updatedFat
        };
      }
      return m;
    }));

    setFoodName('');
    setFoodCalories('150');
    setFoodProtein('15');
    setFoodCarbs('15');
    setFoodFat('4');
    setShowAddModal(false);
  };

  const handleDeleteFoodItem = (mealId: string, itemIdx: number) => {
    setMeals(prev => prev.map(m => {
      if (m.id === mealId) {
        const updatedItems = m.items.filter((_, idx) => idx !== itemIdx);
        const updatedCalories = updatedItems.reduce((acc, curr) => acc + curr.calories, 0);
        const updatedProtein = updatedItems.reduce((acc, curr) => acc + curr.protein, 0);
        const updatedCarbs = updatedItems.reduce((acc, curr) => acc + (curr.carbs || 0), 0);
        const updatedFat = updatedItems.reduce((acc, curr) => acc + (curr.fat || 0), 0);
        return {
          ...m,
          items: updatedItems,
          totalCalories: updatedCalories,
          totalProtein: updatedProtein,
          totalCarbs: updatedCarbs,
          totalFat: updatedFat
        };
      }
      return m;
    }));
  };

  // Macro progress calculations
  const calPct = Math.round((nutrition.calories.current / nutrition.calories.target) * 100);
  const protPct = Math.round((nutrition.protein.current / nutrition.protein.target) * 100);
  const carbPct = Math.round((nutrition.carbs.current / nutrition.carbs.target) * 100);
  const fatPct = Math.round((nutrition.fat.current / nutrition.fat.target) * 100);

  // Water intake percentage
  const waterPct = Math.min(100, Math.round((nutrition.waterIntakeLiters / nutrition.waterTargetLiters) * 100));

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-950/40 border border-zinc-900 p-5 rounded-xl">
        <div>
          <button 
            onClick={() => setTab('dashboard')} 
            className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-white uppercase tracking-wider mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </button>
          <h1 className="text-xl font-black text-white uppercase tracking-tight">Nutrition & Water</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Track your macronutrients, food logs, and hydration progress.
          </p>
        </div>

        {/* AI insight quick trigger banner */}
        <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest uppercase">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Active Coaching</span>
        </div>
      </div>

      {/* Main HUD Macro Metrics Display */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Detailed Macronutrient breakdown columns */}
        <Card className="p-5 bg-zinc-950/40 border-zinc-850 lg:col-span-2" hoverEffect={false}>
          <div className="flex items-center justify-between pb-3 border-b border-zinc-900 mb-4">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">MACRONUTRIENT BALANCE</span>
            <span className="text-[10px] font-mono text-zinc-550">DAILY TARGETS</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Left Col: Big Calories Index */}
            <div className="bg-zinc-900/30 border border-zinc-850 p-4 rounded-xl flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">ENERGY SUMMARY</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-black text-white">{nutrition.calories.current}</span>
                  <span className="text-xs text-zinc-500 font-bold uppercase">/ {nutrition.calories.target} kcal</span>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-[10px] text-zinc-400 mb-1.5 uppercase font-semibold">
                  <span>Daily Progress</span>
                  <span>{calPct}% Achieved</span>
                </div>
                <ProgressBar value={nutrition.calories.current} max={nutrition.calories.target} color="emerald" />
              </div>
            </div>

            {/* Right Col: Macro indicators */}
            <div className="space-y-3">
              {/* Protein */}
              <div className="bg-zinc-900/10 border border-zinc-900/60 p-3 rounded-lg">
                <div className="flex justify-between text-xs text-zinc-400 mb-1.5">
                  <span className="font-semibold text-zinc-300">PROTEIN</span>
                  <span className="font-mono text-white font-bold">{nutrition.protein.current} / {nutrition.protein.target}g</span>
                </div>
                <ProgressBar value={nutrition.protein.current} max={nutrition.protein.target} color="cyan" />
              </div>

              {/* Carbs */}
              <div className="bg-zinc-900/10 border border-zinc-900/60 p-3 rounded-lg">
                <div className="flex justify-between text-xs text-zinc-400 mb-1.5">
                  <span className="font-semibold text-zinc-300">CARBOHYDRATES</span>
                  <span className="font-mono text-white font-bold">{nutrition.carbs.current} / {nutrition.carbs.target}g</span>
                </div>
                <ProgressBar value={nutrition.carbs.current} max={nutrition.carbs.target} color="amber" />
              </div>

              {/* Fat */}
              <div className="bg-zinc-900/10 border border-zinc-900/60 p-3 rounded-lg">
                <div className="flex justify-between text-xs text-zinc-400 mb-1.5">
                  <span className="font-semibold text-zinc-300">FATS (LIPIDS)</span>
                  <span className="font-mono text-white font-bold">{nutrition.fat.current} / {nutrition.fat.target}g</span>
                </div>
                <ProgressBar value={nutrition.fat.current} max={nutrition.fat.target} color="red" />
              </div>
            </div>
          </div>
        </Card>

        {/* Water Intake Tracker */}
        <Card className="p-5 bg-zinc-950/40 border-zinc-850 flex flex-col justify-between" hoverEffect={false}>
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-900 mb-4">
              <div className="flex items-center gap-2">
                <GlassWater className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Hydration tracker</h3>
              </div>
              <span className="text-[10px] font-mono text-zinc-550 font-bold uppercase">{waterPct}% TRACKED</span>
            </div>

            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-3xl font-black text-white">{nutrition.waterIntakeLiters.toFixed(2)} <span className="text-sm font-semibold text-zinc-400">L</span></span>
              <span className="text-xs text-zinc-500 font-bold uppercase">/ {nutrition.waterTargetLiters.toFixed(1)} L Target</span>
            </div>

            {/* Custom water visualization (glass HUD bars) */}
            <div className="flex gap-1.5 h-10 items-end bg-zinc-900/40 p-2 border border-zinc-850 rounded-lg mb-4">
              {Array.from({ length: 10 }).map((_, idx) => {
                const filled = (idx + 1) * 10 <= waterPct;
                return (
                  <div 
                    key={idx}
                    className={`flex-1 h-full rounded transition-all duration-300 ${
                      filled 
                        ? 'bg-cyan-500 shadow-[0_0_4px_rgba(6,182,212,0.4)]' 
                        : 'bg-zinc-950/60 border border-zinc-850/60'
                    }`}
                  />
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                onClick={() => onAddWater(250)}
                className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-[11px] font-bold text-zinc-300 py-2 rounded-lg cursor-pointer transition-all duration-150"
              >
                + 250 ML
              </button>
              <button
                onClick={() => onAddWater(500)}
                className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-[11px] font-bold text-zinc-300 py-2 rounded-lg cursor-pointer transition-all duration-150"
              >
                + 500 ML
              </button>
            </div>

            {/* Real Water Entries Logs list */}
            {hydration && hydration.entries && hydration.entries.length > 0 && (
              <div className="mt-4 pt-3 border-t border-zinc-900/60 max-h-36 overflow-y-auto space-y-1.5 scrollbar-thin">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">LOG HISTORY</span>
                {hydration.entries.map((entry) => {
                  const entryTime = new Date(entry.timestamp).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  });
                  return (
                    <div key={entry.id} className="flex items-center justify-between bg-zinc-900/40 border border-zinc-900 px-2.5 py-1.5 rounded-md text-[11px]">
                      <span className="text-zinc-400 font-medium">{entryTime}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-cyan-400 font-mono font-bold">+{entry.amountMl}ml</span>
                        <button 
                          onClick={() => onDeleteWaterEntry(entry.id)}
                          className="text-zinc-600 hover:text-red-400 transition-colors p-0.5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Meal Diary Section */}
      <div className="space-y-4">
        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest block pb-2 border-b border-zinc-900">
          Daily Meals Log
        </span>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {meals.map((meal) => (
            <MealCard
              key={meal.id}
              meal={meal}
              onAddFoodClick={handleOpenAddModal}
              onDeleteFoodItem={handleDeleteFoodItem}
            />
          ))}
        </div>
      </div>

      {/* Add Food Entry Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Food Log">
        <form onSubmit={handleAddFoodSubmit} className="space-y-4">
          <div className="text-xs text-zinc-500 mb-1">
            Logging meal item context: <span className="text-cyan-400 font-bold uppercase">{meals.find(m => m.id === activeMealId)?.name}</span>
          </div>
          <Input 
            id="food-name"
            label="FOOD ITEM / NAME"
            value={foodName}
            onChange={(e) => setFoodName(e.target.value)}
            placeholder="e.g. Grilled Chicken, Brown Rice"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input 
              id="food-cal"
              label="CALORIES (KCAL)"
              type="number"
              value={foodCalories}
              onChange={(e) => setFoodCalories(e.target.value)}
              placeholder="e.g. 150"
              required
            />
            <Input 
              id="food-prot"
              label="PROTEIN (G)"
              type="number"
              value={foodProtein}
              onChange={(e) => setFoodProtein(e.target.value)}
              placeholder="e.g. 15"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input 
              id="food-carbs"
              label="CARBOHYDRATES (G)"
              type="number"
              value={foodCarbs}
              onChange={(e) => setFoodCarbs(e.target.value)}
              placeholder="e.g. 15"
              required
            />
            <Input 
              id="food-fat"
              label="FAT (G)"
              type="number"
              value={foodFat}
              onChange={(e) => setFoodFat(e.target.value)}
              placeholder="e.g. 4"
              required
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" type="button" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Log Meal Item
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
