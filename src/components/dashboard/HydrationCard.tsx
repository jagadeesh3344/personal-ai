import React from 'react';
import { Card } from '../ui/Card';
import { GlassWater, Plus, Droplets } from 'lucide-react';
import { ProgressBar } from '../ui/ProgressBar';

interface HydrationCardProps {
  waterIntakeLiters: number;
  waterTargetLiters: number;
  onAddWater: (amountMl: number) => void;
}

export const HydrationCard: React.FC<HydrationCardProps> = ({
  waterIntakeLiters,
  waterTargetLiters,
  onAddWater
}) => {
  const percent = Math.min(100, Math.round((waterIntakeLiters / waterTargetLiters) * 100));
  const remainingLiters = Math.max(0, parseFloat((waterTargetLiters - waterIntakeLiters).toFixed(2)));
  const remainingMl = Math.round(remainingLiters * 1000);

  return (
    <Card className="p-5 flex flex-col justify-between h-full bg-zinc-950/40 border-zinc-850" hoverEffect={true}>
      <div>
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-900/40">
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Hydration Telemetry</h3>
          </div>
          <span className="text-[9px] font-mono text-cyan-400 bg-cyan-500/5 px-2 py-0.5 border border-cyan-500/10 rounded uppercase tracking-widest font-bold">
            Live
          </span>
        </div>

        {/* Visual Water Level and Stats */}
        <div className="mb-5 bg-zinc-900/40 border border-zinc-850 p-4 rounded-xl flex items-center gap-4 relative overflow-hidden">
          <div className="relative w-12 h-12 rounded-full border border-cyan-500/30 flex items-center justify-center shrink-0 bg-cyan-500/5">
            <div 
              style={{ height: `${percent}%` }}
              className="absolute bottom-0 left-0 right-0 bg-cyan-500/20 transition-all duration-700 ease-out rounded-b-full"
            />
            <GlassWater className="w-5 h-5 text-cyan-400 relative z-10" />
          </div>

          <div>
            <div className="text-lg font-black text-white tracking-tight">
              {waterIntakeLiters.toFixed(2)} <span className="text-xs text-zinc-500 font-semibold uppercase">L</span>
              <span className="text-zinc-500 font-normal mx-1.5">/</span>
              <span className="text-sm text-zinc-400">{waterTargetLiters.toFixed(1)} L</span>
            </div>
            <div className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider mt-0.5">
              {remainingMl > 0 ? `${remainingMl} ml remaining` : "Target Achieved ✓"}
            </div>
          </div>
        </div>

        {/* Liters Progress Bar */}
        <div className="mb-5 space-y-1.5">
          <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
            <span>Progress</span>
            <span className="text-cyan-400 font-mono">{percent}%</span>
          </div>
          <ProgressBar value={waterIntakeLiters} max={waterTargetLiters} color="cyan" />
        </div>
      </div>

      {/* Quick Add Buttons Tray */}
      <div>
        <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-2.5 text-center">
          Verbal Log Overrides / Quick Logs
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: '+250 ml', amount: 250 },
            { label: '+500 ml', amount: 500 },
            { label: '+750 ml', amount: 750 }
          ].map(btn => (
            <button
              key={btn.amount}
              type="button"
              onClick={() => onAddWater(btn.amount)}
              className="flex flex-col items-center justify-center py-2 bg-zinc-900/40 hover:bg-cyan-500/10 border border-zinc-850 hover:border-cyan-500/20 rounded-lg text-[10px] text-zinc-300 hover:text-cyan-400 font-bold transition-all cursor-pointer group"
            >
              <Plus className="w-3.5 h-3.5 mb-0.5 text-zinc-500 group-hover:text-cyan-400" />
              <span>{btn.label}</span>
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
};
