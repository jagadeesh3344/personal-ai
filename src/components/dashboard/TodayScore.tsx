import React from 'react';
import { Card } from '../ui/Card';
import { CircularProgress } from '../ui/CircularProgress';
import { Activity, Apple, GlassWater } from 'lucide-react';

interface TodayScoreProps {
  workoutDone: boolean;
  proteinPct: number;
  waterPct: number;
}

export const TodayScore: React.FC<TodayScoreProps> = ({
  workoutDone,
  proteinPct,
  waterPct
}) => {
  // Score based purely on real daily actions
  const workoutScore = workoutDone ? 40 : 0;
  const proteinScore = Math.round(Math.min(100, proteinPct) * 0.35);
  const waterScore = Math.round(Math.min(100, waterPct) * 0.25);
  const totalScore = workoutScore + proteinScore + waterScore;

  const metrics = [
    { label: 'Workout Execution', score: workoutScore, max: 40, icon: <Activity className="w-3.5 h-3.5 text-cyan-400" /> },
    { label: 'Protein Target', score: proteinScore, max: 35, icon: <Apple className="w-3.5 h-3.5 text-emerald-400" /> },
    { label: 'Hydration Intake', score: waterScore, max: 25, icon: <GlassWater className="w-3.5 h-3.5 text-cyan-400" /> }
  ];

  return (
    <Card className="p-5 flex flex-col items-center justify-between h-full bg-zinc-950/40 border-zinc-850" hoverEffect={true}>
      <div className="w-full flex items-center justify-between mb-4 pb-2 border-b border-zinc-900/40">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Daily Adherence Score</h3>
        <span className="text-[10px] text-zinc-500 font-bold uppercase">Realtime</span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6 w-full justify-around py-2">
        <CircularProgress score={totalScore} size={110} strokeWidth={8} label="" />

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
                  <span className="font-mono text-zinc-400">{m.score}/{m.max}</span>
                </div>
                <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-cyan-500 rounded-full transition-all duration-500" 
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
