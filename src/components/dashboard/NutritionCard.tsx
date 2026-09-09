import React from 'react';
import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';
import { Apple, Scale } from 'lucide-react';
import { Nutrition } from '../../types';

interface NutritionCardProps {
  nutrition: Nutrition;
  onAddMeal: () => void;
}

export const NutritionCard: React.FC<NutritionCardProps> = ({
  nutrition,
  onAddMeal
}) => {
  const calPct = Math.round((nutrition.calories.current / nutrition.calories.target) * 100);
  const protPct = Math.round((nutrition.protein.current / nutrition.protein.target) * 100);
  const carbPct = Math.round((nutrition.carbs.current / nutrition.carbs.target) * 100);
  const fatPct = Math.round((nutrition.fat.current / nutrition.fat.target) * 100);

  return (
    <Card className="p-5 flex flex-col justify-between h-full bg-zinc-950/40 border-zinc-850" hoverEffect={true}>
      <div>
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-900/40">
          <div className="flex items-center gap-2">
            <Apple className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Nutrition Macro Synthesis</h3>
          </div>
          <span className="text-[10px] font-mono text-zinc-550 uppercase tracking-widest font-bold">
            Fuel Matrix
          </span>
        </div>

        {/* Calories Circle/Bar */}
        <div className="mb-4 bg-zinc-900/40 border border-zinc-850 p-3 rounded-lg">
          <div className="flex justify-between items-center text-xs text-zinc-400 mb-1.5">
            <span className="font-semibold text-zinc-300">Calories Intake</span>
            <span className="font-mono text-zinc-200 font-bold">{nutrition.calories.current} / {nutrition.calories.target} <span className="text-[10px] font-normal text-zinc-500">kcal</span></span>
          </div>
          <ProgressBar value={nutrition.calories.current} max={nutrition.calories.target} color="emerald" />
        </div>

        {/* Macro breakdown columns */}
        <div className="space-y-3">
          {/* Protein */}
          <div>
            <div className="flex justify-between text-xs text-zinc-400 mb-1">
              <span className="font-semibold text-zinc-300">Protein Target</span>
              <span className="font-mono text-zinc-200">{nutrition.protein.current} / {nutrition.protein.target}g <span className="text-[10px] text-zinc-550">({protPct}%)</span></span>
            </div>
            <ProgressBar value={nutrition.protein.current} max={nutrition.protein.target} color="cyan" />
          </div>

          {/* Carbs */}
          <div>
            <div className="flex justify-between text-xs text-zinc-400 mb-1">
              <span className="font-semibold text-zinc-300">Carbs Target</span>
              <span className="font-mono text-zinc-200">{nutrition.carbs.current} / {nutrition.carbs.target}g <span className="text-[10px] text-zinc-550">({carbPct}%)</span></span>
            </div>
            <ProgressBar value={nutrition.carbs.current} max={nutrition.carbs.target} color="amber" />
          </div>

          {/* Fat */}
          <div>
            <div className="flex justify-between text-xs text-zinc-400 mb-1">
              <span className="font-semibold text-zinc-300">Fat Target</span>
              <span className="font-mono text-zinc-200">{nutrition.fat.current} / {nutrition.fat.target}g <span className="text-[10px] text-zinc-550">({fatPct}%)</span></span>
            </div>
            <ProgressBar value={nutrition.fat.current} max={nutrition.fat.target} color="red" />
          </div>
        </div>
      </div>

      <button 
        onClick={onAddMeal}
        className="w-full text-center mt-5 text-xs font-semibold text-zinc-400 hover:text-cyan-400 border border-zinc-800/80 hover:border-cyan-500/30 bg-zinc-900/30 hover:bg-zinc-900/60 py-2.5 rounded-lg cursor-pointer transition-all duration-200"
      >
        + ADD MEAL ENTRY
      </button>
    </Card>
  );
};
