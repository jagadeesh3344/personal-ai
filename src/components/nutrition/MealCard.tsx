import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Trash2, Plus, Coffee, Sun, Moon, Sparkles } from 'lucide-react';
import { Meal } from '../../types';

interface MealCardProps {
  meal: Meal;
  onAddFoodClick: (mealId: string) => void;
  onDeleteFoodItem?: (mealId: string, itemIndex: number) => void;
}

export const MealCard: React.FC<MealCardProps> = ({
  meal,
  onAddFoodClick,
  onDeleteFoodItem
}) => {
  const getMealIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'breakfast': return <Coffee className="w-4 h-4 text-amber-400" />;
      case 'lunch': return <Sun className="w-4 h-4 text-cyan-400" />;
      case 'dinner': return <Moon className="w-4 h-4 text-indigo-400" />;
      default: return <Sparkles className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <Card className="p-5 bg-zinc-950/40 border-zinc-850 flex flex-col justify-between h-full" hoverEffect={true}>
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-900/40">
          <div className="flex items-center gap-2">
            {getMealIcon(meal.name)}
            <h3 className="text-sm font-bold text-white uppercase tracking-wide">{meal.name}</h3>
          </div>
          <span className="text-[10px] font-mono text-zinc-500">{meal.time}</span>
        </div>

        {/* Food list */}
        {meal.items.length === 0 ? (
          <div className="my-6 py-4 border border-dashed border-zinc-850 rounded-lg text-center bg-zinc-900/10">
            <span className="text-xs text-zinc-550 block font-medium">No meals logged yet</span>
            <span className="text-[9px] text-zinc-600 block mt-0.5">Click Add Entry below to record what you ate.</span>
          </div>
        ) : (
          <div className="space-y-2.5 my-3">
            {meal.items.map((item, idx) => (
              <div 
                key={`${item.name}-${idx}`}
                className="flex items-center justify-between p-2.5 bg-zinc-900/30 border border-zinc-900 rounded-lg text-xs hover:border-zinc-800 transition-all duration-150 group"
              >
                <div className="flex-1 pr-2">
                  <span className="font-semibold text-zinc-200 block">{item.name}</span>
                  <div className="flex gap-1.5 items-center text-[9px] text-zinc-500 font-bold uppercase mt-0.5">
                    <span className="text-emerald-400/80">{item.calories} kcal</span>
                    <span>•</span>
                    <span className="text-cyan-400/80">{item.protein}g P</span>
                    <span>•</span>
                    <span className="text-amber-400/80">{item.carbs || 0}g C</span>
                    <span>•</span>
                    <span className="text-red-400/80">{item.fat || 0}g F</span>
                  </div>
                </div>
                {onDeleteFoodItem && (
                  <button
                    onClick={() => onDeleteFoodItem(meal.id, idx)}
                    className="text-zinc-700 hover:text-red-400 p-1 rounded hover:bg-zinc-900 opacity-0 group-hover:opacity-100 transition-all duration-200"
                    title="Remove entry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
 
      {/* Stats summary and Add Button */}
      <div className="border-t border-zinc-900/60 pt-4 mt-2">
        <div className="flex justify-between items-center mb-3.5 text-xs">
          <span className="font-bold text-zinc-500 uppercase tracking-wider text-[9px]">MEAL SUMMARY</span>
          <div className="flex gap-2.5 text-[10px] font-mono">
            <span className="text-emerald-400 font-bold">{meal.totalCalories} kcal</span>
            <span className="text-cyan-400 font-bold">{meal.totalProtein}g P</span>
            <span className="text-amber-400 font-bold">{meal.totalCarbs || 0}g C</span>
            <span className="text-red-400 font-bold">{meal.totalFat || 0}g F</span>
          </div>
        </div>
 
        <button
          onClick={() => onAddFoodClick(meal.id)}
          className="w-full border border-dashed border-zinc-800 hover:border-zinc-700 text-[11px] font-bold text-zinc-450 hover:text-zinc-200 py-2 rounded-lg bg-zinc-900/10 hover:bg-zinc-900/30 transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> ADD FOOD LOG
        </button>
      </div>
    </Card>
  );
};
