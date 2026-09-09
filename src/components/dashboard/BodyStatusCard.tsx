import React from 'react';
import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';
import { Scale, Flame, ArrowDown } from 'lucide-react';

interface BodyStatusCardProps {
  currentWeight: number;
  targetWeight: number;
  weightChange: string;
  streakDays: number;
}

export const BodyStatusCard: React.FC<BodyStatusCardProps> = ({
  currentWeight,
  targetWeight,
  weightChange,
  streakDays
}) => {
  // Dynamic weight progress modeling based on target direction (muscle gain vs fat loss)
  const isGain = targetWeight >= currentWeight;
  // Use a realistic starting baseline based on the current and target parameters
  const initialWeight = isGain ? Math.max(50, currentWeight - 2.5) : Math.min(150, currentWeight + 2.5);
  const totalToChange = Math.abs(initialWeight - targetWeight);
  const changedSoFar = Math.abs(initialWeight - currentWeight);
  const progressPercentage = totalToChange > 0 
    ? Math.round(Math.max(0, Math.min(100, (changedSoFar / totalToChange) * 100)))
    : 100;

  return (
    <Card className="p-5 flex flex-col justify-between h-full bg-zinc-950/40 border-zinc-850" hoverEffect={true}>
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Body Status Diagnostics</h3>
          </div>
          <div className="flex items-center gap-1.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
            Active
          </div>
        </div>

        {/* Weight Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-zinc-900/40 border border-zinc-850 p-3 rounded-lg">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">CURRENT WEIGHT</span>
            <span className="text-xl font-black text-white">{currentWeight} <span className="text-xs font-semibold text-zinc-400">kg</span></span>
          </div>
          <div className="bg-zinc-900/40 border border-zinc-850 p-3 rounded-lg">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">TARGET WEIGHT</span>
            <span className="text-xl font-black text-zinc-300">{targetWeight} <span className="text-xs font-semibold text-zinc-500">kg</span></span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-[10px] font-semibold text-zinc-400 mb-1.5 uppercase tracking-wide">
            <span>{isGain ? 'Mass Accretion Protocol' : 'Deficit Reduction Protocol'}</span>
            <span>{progressPercentage}% Completed</span>
          </div>
          <ProgressBar value={changedSoFar} max={totalToChange} color="cyan" />
        </div>
      </div>

      {/* Meta Indicators */}
      <div className="flex items-center justify-between border-t border-zinc-900/60 pt-3 mt-1.5 text-xs">
        <div className="flex items-center gap-1.5 text-zinc-400">
          <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[11px]">{weightChange}</span>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-400">
          <Flame className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-[11px] font-semibold"><span className="text-amber-400 font-bold">{streakDays}</span> day streak</span>
        </div>
      </div>
    </Card>
  );
};
