import React from 'react';
import { Card } from '../ui/Card';
import { CircularProgress } from '../ui/CircularProgress';
import { Activity, Apple, GlassWater, Footprints, Moon } from 'lucide-react';

interface TodayScoreProps {
  score: number;
  breakdown: {
    workout: number;
    nutrition: number;
    hydration: number;
    steps: number;
    sleep: number;
  };
}

export const TodayScore: React.FC<TodayScoreProps> = ({
  score,
  breakdown
}) => {
  const metrics = [
    { label: 'Workout', score: breakdown.workout, max: 20, icon: <Activity className="w-3.5 h-3.5 text-cyan-400" /> },
    { label: 'Nutrition', score: breakdown.nutrition, max: 30, icon: <Apple className="w-3.5 h-3.5 text-emerald-400" /> },
    { label: 'Hydration', score: breakdown.hydration, max: 15, icon: <GlassWater className="w-3.5 h-3.5 text-cyan-400" /> },
    { label: 'Steps', score: breakdown.steps, max: 20, icon: <Footprints className="w-3.5 h-3.5 text-amber-400" /> },
    { label: 'Sleep', score: breakdown.sleep, max: 15, icon: <Moon className="w-3.5 h-3.5 text-indigo-400" /> }
  ];

  return (
    <Card className="p-5 flex flex-col items-center justify-between h-full bg-zinc-950/40 border-zinc-850" hoverEffect={true}>
      <div className="w-full flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Tactical Efficiency Score</h3>
        <span className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider">HUD Diagnostics</span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6 w-full justify-around py-2">
        {/* Big Circular Dial */}
        <CircularProgress score={score} size={110} strokeWidth={8} label="" />

        {/* List of score breakdowns */}
        <div className="flex-1 w-full space-y-2.5">
          {metrics.map((m) => {
            const pct = Math.round((m.score / m.max) * 100);
            return (
              <div key={m.label} className="text-xs">
                <div className="flex justify-between items-center text-zinc-400 mb-1">
                  <div className="flex items-center gap-1.5">
                    {m.icon}
                    <span className="font-semibold text-zinc-300">{m.label}</span>
                  </div>
                  <span className="font-mono text-zinc-450">{m.score}/{m.max} <span className="text-[9px] text-zinc-600">({pct}%)</span></span>
                </div>
                <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-zinc-750 rounded-full transition-all duration-500" 
                    style={{ width: `${pct}%` }} 
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};
