import React from 'react';
import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';
import { Scale, Target, Activity } from 'lucide-react';

interface BodyStatusCardProps {
  currentWeight: number;
  targetWeight: number;
  weightChangeText?: string;
  streakDays?: number;
}

export const BodyStatusCard: React.FC<BodyStatusCardProps> = ({
  currentWeight,
  targetWeight,
  weightChangeText = "Baseline recorded",
  streakDays = 0
}) => {
  const isGain = targetWeight >= currentWeight;
  const diff = Math.abs(currentWeight - targetWeight);

  return (
    <Card className="p-5 flex flex-col justify-between h-full bg-zinc-950/40 border-zinc-850" hoverEffect={true}>
      <div>
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-900/40">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Body Status</h3>
          </div>
          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 border border-cyan-500/20 rounded uppercase font-bold">
            Live
          </span>
        </div>

        {/* Weight Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-zinc-900/40 border border-zinc-850 p-3 rounded-lg">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">CURRENT WEIGHT</span>
            <span className="text-xl font-black text-white">{currentWeight > 0 ? currentWeight : '--'} <span className="text-xs font-semibold text-zinc-400">kg</span></span>
          </div>
          <div className="bg-zinc-900/40 border border-zinc-850 p-3 rounded-lg">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">TARGET WEIGHT</span>
            <span className="text-xl font-black text-zinc-300">{targetWeight > 0 ? targetWeight : '--'} <span className="text-xs font-semibold text-zinc-500">kg</span></span>
          </div>
        </div>

        <div className="mb-4 bg-zinc-900/30 p-3 rounded-lg border border-zinc-850/60">
          <div className="flex justify-between text-xs text-zinc-400 mb-1">
            <span className="font-semibold">{isGain ? 'Target Surplus' : 'Target Deficit'}</span>
            <span className="font-mono text-cyan-400 font-bold">{diff > 0 ? `${diff.toFixed(1)} kg to goal` : 'Goal Reached'}</span>
          </div>
          <div className="text-[10px] text-zinc-500 mt-1">
            {isGain ? 'Caloric surplus with progressive overload' : 'Caloric deficit preserving lean mass'}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-zinc-900/60 pt-3 text-xs text-zinc-400">
        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[11px]">{weightChangeText}</span>
        </div>
        <div className="flex items-center gap-1 font-mono text-[11px]">
          <span className="text-zinc-500">Streak:</span>
          <span className="text-cyan-400 font-bold">{streakDays} days</span>
        </div>
      </div>
    </Card>
  );
};
