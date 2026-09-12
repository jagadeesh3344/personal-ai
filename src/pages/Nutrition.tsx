import React, { useState } from 'react';
import { MealCard } from '../components/nutrition/MealCard';
import { Card } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Apple, GlassWater, Plus, ArrowLeft, Trash2 } from 'lucide-react';
import { NutritionTargets, Meal, MealItem, DailyHydration } from '../types';
import { UserProfile } from '../types/profile';
import { generateDailyMealPlan, MealRecipe } from '../features/nutrition/mealPlanner';
import { Utensils, Sparkles, CheckCircle2 } from 'lucide-react';

interface NutritionProps {
  targets: NutritionTargets | null;
  meals: Meal[];
  hydration: DailyHydration;
  onAddMealItem: (mealId: string, item: MealItem) => void;
  onDeleteMealItem: (mealId: string, itemIndex: number) => void;
  onAddWater: (amountMl: number) => void;
  onDeleteWaterEntry: (id: string) => void;
  setTab: (tab: string) => void;
  userProfile?: UserProfile | null;
  onAskFriday?: (prompt?: string) => void;
}

export const Nutrition: React.FC<NutritionProps> = ({
  targets,
  meals,
  hydration,
  onAddMealItem,
  onDeleteMealItem,
  onAddWater,
  onDeleteWaterEntry,
  setTab,
  userProfile,
  onAskFriday
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

  const remainingCalories = Math.max(0, targetCalories - currentCalories);
  const remainingProtein = Math.max(0, targetProtein - currentProtein);
  const remainingCarbs = Math.max(0, targetCarbs - currentCarbs);
  const remainingFat = Math.max(0, targetFat - currentFat);

  const rawRemainingCalories = targetCalories - currentCalories;
  const rawRemainingProtein = targetProtein - currentProtein;
  const rawRemainingCarbs = targetCarbs - currentCarbs;
  const rawRemainingFat = targetFat - currentFat;

  const mealPlan = userProfile && targets ? generateDailyMealPlan(userProfile, targets, meals) : null;

  const handleOpenAddModal = (mealId: string) => {
    setActiveMealId(mealId);
    setShowAddModal(true);
  };

  const handleAddRecipeToMeal = (mealId: string, recipe: MealRecipe) => {
    onAddMealItem(mealId, {
      id: `fi-${Date.now()}`,
      name: recipe.name,
      calories: recipe.calories,
      protein: recipe.proteinGrams,
      carbs: recipe.carbsGrams,
      fat: recipe.fatGrams
    });
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
            <ArrowLeft className="w-4 h-4" /> Today
          </button>
          <h1 className="text-xl font-black text-white uppercase tracking-tight">Nutrition & Hydration</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Mifflin-St Jeor goal targets: {targetCalories} kcal | {targetProtein}g Protein | {targetWaterLiters}L Water
          </p>
        </div>

        {onAskFriday && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAskFriday("What should I eat next based on my remaining calories and protein?")}
            className="text-xs uppercase cursor-pointer min-h-[44px]"
          >
            Ask FRIDAY Meal Coach
          </Button>
        )}
      </div>

      {/* Macro HUD Summary with Actual vs Target and Remaining */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Calories */}
        <Card className="p-4 bg-zinc-950/40 border-zinc-850" hoverEffect={false}>
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Calories</span>
            <span className={`text-[10px] font-mono font-bold ${rawRemainingCalories < 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {rawRemainingCalories >= 0 ? `${remainingCalories} remaining` : `${Math.abs(rawRemainingCalories)} over`}
            </span>
          </div>
          <div className="text-xl font-black text-white font-mono">
            {currentCalories} <span className="text-xs text-zinc-500 font-normal">/ {targetCalories} kcal</span>
          </div>
          <ProgressBar value={currentCalories} max={targetCalories} color="emerald" className="mt-2" />
        </Card>

        {/* Protein */}
        <Card className="p-4 bg-zinc-950/40 border-zinc-850" hoverEffect={false}>
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Protein</span>
            <span className={`text-[10px] font-mono font-bold ${remainingProtein <= 0 ? 'text-emerald-400' : 'text-cyan-400'}`}>
              {remainingProtein > 0 ? `${remainingProtein}g remaining` : 'Target met'}
            </span>
          </div>
          <div className="text-xl font-black text-white font-mono">
            {currentProtein} <span className="text-xs text-zinc-500 font-normal">/ {targetProtein}g</span>
          </div>
          <ProgressBar value={currentProtein} max={targetProtein} color="cyan" className="mt-2" />
        </Card>

        {/* Carbs */}
        <Card className="p-4 bg-zinc-950/40 border-zinc-850" hoverEffect={false}>
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Carbohydrates</span>
            <span className={`text-[10px] font-mono font-bold ${rawRemainingCarbs < 0 ? 'text-amber-400' : 'text-amber-300'}`}>
              {rawRemainingCarbs >= 0 ? `${remainingCarbs}g remaining` : `${Math.abs(rawRemainingCarbs)}g over`}
            </span>
          </div>
          <div className="text-xl font-black text-white font-mono">
            {currentCarbs} <span className="text-xs text-zinc-500 font-normal">/ {targetCarbs}g</span>
          </div>
          <ProgressBar value={currentCarbs} max={targetCarbs} color="amber" className="mt-2" />
        </Card>

        {/* Fat */}
        <Card className="p-4 bg-zinc-950/40 border-zinc-850" hoverEffect={false}>
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Fat</span>
            <span className={`text-[10px] font-mono font-bold ${rawRemainingFat < 0 ? 'text-red-400' : 'text-zinc-400'}`}>
              {rawRemainingFat >= 0 ? `${remainingFat}g remaining` : `${Math.abs(rawRemainingFat)}g over`}
            </span>
          </div>
          <div className="text-xl font-black text-white font-mono">
            {currentFat} <span className="text-xs text-zinc-500 font-normal">/ {targetFat}g</span>
          </div>
          <ProgressBar value={currentFat} max={targetFat} color="red" className="mt-2" />
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

      {/* FRIDAY Next Recommended Meal Banner */}
      {mealPlan?.nextRecommendedMeal && (
        mealPlan.nextRecommendedMeal.status === 'DAILY_COMPLETE' ? (
          <Card className="p-4 bg-emerald-950/20 border-emerald-500/30 text-emerald-400 flex items-center justify-between" hoverEffect={false}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-xs font-mono font-bold tracking-wider uppercase text-emerald-300">
                  Daily Nutrition Complete
                </div>
                <p className="text-xs text-zinc-300 mt-0.5">
                  {mealPlan.nextRecommendedMeal.rationale || mealPlan.nextRecommendedMeal.reasoning}
                </p>
              </div>
            </div>
            <div className="text-xs font-mono text-emerald-400 font-bold px-3 py-1 rounded bg-emerald-950/40 border border-emerald-800/40">
              Targets Met
            </div>
          </Card>
        ) : mealPlan.nextRecommendedMeal.recipe ? (
          <Card className="p-5 bg-gradient-to-r from-cyan-950/30 via-zinc-950/50 to-zinc-950/30 border-cyan-500/30 relative overflow-hidden" hoverEffect={false}>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    Recommended Next Meal: {mealPlan.nextRecommendedMeal.mealType}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400">
                    Remaining: {mealPlan.nextRecommendedMeal.remainingCaloriesBeforeMeal} kcal | {mealPlan.nextRecommendedMeal.remainingProteinBeforeMeal}g P
                  </span>
                </div>
                <h3 className="text-base font-bold text-white tracking-wide">
                  {mealPlan.nextRecommendedMeal.recipe.name}
                </h3>
                <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
                  {mealPlan.nextRecommendedMeal.rationale || mealPlan.nextRecommendedMeal.reasoning}
                </p>
                <div className="flex items-center gap-3 text-xs font-mono pt-1">
                  <span className="text-white font-bold">{mealPlan.nextRecommendedMeal.recipe.calories} kcal</span>
                  <span className="text-zinc-600">•</span>
                  <span className="text-cyan-300 font-bold">{mealPlan.nextRecommendedMeal.recipe.proteinGrams}g Protein</span>
                  <span className="text-zinc-600">•</span>
                  <span className="text-amber-300 font-bold">{mealPlan.nextRecommendedMeal.recipe.carbsGrams}g Carbs</span>
                  <span className="text-zinc-600">•</span>
                  <span className="text-red-300 font-bold">{mealPlan.nextRecommendedMeal.recipe.fatGrams}g Fat</span>
                </div>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => handleAddRecipeToMeal(`m-${mealPlan.nextRecommendedMeal!.mealType.toLowerCase()}`, mealPlan.nextRecommendedMeal!.recipe!)}
                className="whitespace-nowrap flex items-center gap-2 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>+ Log to {mealPlan.nextRecommendedMeal.mealType.charAt(0) + mealPlan.nextRecommendedMeal.mealType.slice(1).toLowerCase()}</span>
              </Button>
            </div>
          </Card>
        ) : null
      )}

      {/* FRIDAY Daily Meal Recommendations (Deterministic Planner) */}
      {mealPlan && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <Utensils className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wide">
                  Structured Daily Meal Plan
                </h2>
                <p className="text-[11px] text-zinc-400">
                  Targeted for {userProfile?.dietPreference || 'STANDARD'} diet • Allergies & intolerances filtered
                </p>
              </div>
            </div>
            <div className="text-[11px] font-mono text-zinc-400 hidden sm:block">
              Plan total: <span className="text-white font-bold">{mealPlan.totalCalories} kcal</span> | <span className="text-cyan-400 font-bold">{mealPlan.totalProtein}g protein</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { type: 'BREAKFAST' as const, mealId: 'm-breakfast', recipe: mealPlan.breakfast },
              { type: 'LUNCH' as const, mealId: 'm-lunch', recipe: mealPlan.lunch },
              { type: 'SNACK' as const, mealId: 'm-snack', recipe: mealPlan.snack },
              { type: 'DINNER' as const, mealId: 'm-dinner', recipe: mealPlan.dinner }
            ].map(({ type, mealId, recipe }) => (
              <Card key={recipe.id} className="p-4 bg-zinc-950/50 border-zinc-850 flex flex-col justify-between" hoverEffect={true}>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-900/30">
                      {type}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400">
                      {recipe.calories} kcal
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-white leading-tight mb-1">{recipe.name}</h4>
                  <p className="text-[11px] text-zinc-400 line-clamp-2 mb-2 leading-relaxed">
                    {recipe.description}
                  </p>

                  <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 mb-3">
                    <span className="text-cyan-300 font-bold">{recipe.proteinGrams}g P</span>
                    <span>•</span>
                    <span className="text-amber-300">{recipe.carbsGrams}g C</span>
                    <span>•</span>
                    <span className="text-red-300">{recipe.fatGrams}g F</span>
                  </div>
                </div>

                <button
                  onClick={() => handleAddRecipeToMeal(mealId, recipe)}
                  className="w-full text-center py-1.5 rounded bg-zinc-900 hover:bg-cyan-500/20 text-zinc-300 hover:text-cyan-300 border border-zinc-800 hover:border-cyan-500/40 text-[11px] font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3 h-3" />
                  <span>Log to {type.charAt(0) + type.slice(1).toLowerCase()}</span>
                </button>
              </Card>
            ))}
          </div>
        </div>
      )}

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
