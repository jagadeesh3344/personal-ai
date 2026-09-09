import React from 'react';
import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';
import { Apple } from 'lucide-react';
import { NutritionTargets, Meal } from '../../types';

interface NutritionCardProps {
  targets: NutritionTargets | null;
  meals: Meal[];
  onAddMeal: () => void;
}

export const NutritionCard: React.FC<NutritionCardProps> = ({
  targets,
  meals,
  onAddMeal
}) => {
  const currentCalories = meals.reduce((acc, m) => acc + (m.totalCalories || 0), 0);
  const currentProtein = meals.reduce((acc, m) => acc + (m.totalProtein || 0), 0);
  const currentCarbs = meals.reduce((acc, m) => acc + (m.totalCarbs || 0), 0);
  const currentFat = meals.reduce((acc, m) => acc + (m.totalFat || 0), 0);

  const targetCalories = targets?.targetCalories || 2000;
  const targetProtein = targets?.proteinGrams || 140;
  const targetCarbs = targets?.carbsGrams || 200;
  const targetFat = targets?.fatGrams || 60;

  const calPct = Math.min(100, Math.round((currentCalories / targetCalories) * 100));
  const protPct = Math.min(100, Math.round((currentProtein / targetProtein) * 100));
  const carbPct = Math.min(100, Math.round((currentCarbs / targetCarbs) * 100));
  const fatPct = Math.min(100, Math.round((currentFat / targetFat) * 100));

  return (
    <Card className="p-5 flex flex-col justify-between h-full bg-zinc-950/40 border-zinc-850" hoverEffect={true}>
      <div>
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-900/40">
          <div className="flex items-center gap-2">
            <Apple className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Nutrition & Macros</h3>
          </div>
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">
            Today
          </span>
        </div>

        {/* Calories Circle/Bar */}
        <div className="mb-4 bg-zinc-900/40 border border-zinc-850 p-3 rounded-lg">
          <div className="flex justify-between items-center text-xs text-zinc-400 mb-1.5">
            <span className="font-semibold text-zinc-300">Calories</span>
            <span className="font-mono text-zinc-200 font-bold">
              {currentCalories} / {targetCalories} <span className="text-[10px] font-normal text-zinc-500">kcal</span>
            </span>
          </div>
          <ProgressBar value={currentCalories} max={targetCalories} color="emerald" />
          <div className="text-[10px] text-zinc-500 mt-1">
            {currentCalories === 0 ? '0 kcal logged today' : `${calPct}% of daily caloric allowance`}
          </div>
        </div>

        {/* Macro breakdown columns */}
        <div className="space-y-3">
          {/* Protein */}
          <div>
            <div className="flex justify-between text-xs text-zinc-400 mb-1">
              <span className="font-semibold text-zinc-300">Protein</span>
              <span className="font-mono text-zinc-200">{currentProtein} / {targetProtein}g <span className="text-[10px] text-zinc-500">({protPct}%)</span></span>
            </div>
            <ProgressBar value={currentProtein} max={targetProtein} color="cyan" />
          </div>

          {/* Carbs */}
          <div>
            <div className="flex justify-between text-xs text-zinc-400 mb-1">
              <span className="font-semibold text-zinc-300">Carbs</span>
              <span className="font-mono text-zinc-200">{currentCarbs} / {targetCarbs}g <span className="text-[10px] text-zinc-500">({carbPct}%)</span></span>
            </div>
            <ProgressBar value={currentCarbs} max={targetCarbs} color="amber" />
          </div>

          {/* Fat */}
          <div>
            <div className="flex justify-between text-xs text-zinc-400 mb-1">
              <span className="font-semibold text-zinc-300">Fat</span>
              <span className="font-mono text-zinc-200">{currentFat} / {targetFat}g <span className="text-[10px] text-zinc-500">({fatPct}%)</span></span>
            </div>
            <ProgressBar value={currentFat} max={targetFat} color="red" />
          </div>
        </div>
      </div>

      <button 
        onClick={onAddMeal}
        className="w-full text-center mt-5 text-xs font-semibold text-zinc-400 hover:text-cyan-400 border border-zinc-800/80 hover:border-cyan-500/30 bg-zinc-900/30 hover:bg-zinc-900/60 py-2.5 rounded-lg cursor-pointer transition-all duration-200 uppercase tracking-wider"
      >
        + Log Meal
      </button>
    </Card>
  );
};
