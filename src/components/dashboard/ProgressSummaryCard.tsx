import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { TrendingUp, TrendingDown, Minus, LineChart, ChevronRight } from 'lucide-react';
import { DailyCoachingBrief } from '../../features/friday/coaching/types';
import { ProgressState } from '../../types';

interface ProgressSummaryCardProps {
  coachingBrief: DailyCoachingBrief | null;
  progressData?: ProgressState | null;
  onViewProgress: () => void;
}

export const ProgressSummaryCard: React.FC<ProgressSummaryCardProps> = ({
  coachingBrief,
  progressData,
  onViewProgress
}) => {
  const trend = coachingBrief?.progress.weightTrend || 'MAINTAINING';
  const overallStatus = coachingBrief?.progress.overallStatus || 'DATA_ACCUMULATING';
  const dataQuality = coachingBrief?.progress.dataQuality || 'FAIR';

  const hasWeights = (progressData?.weights?.length || 0) > 0;
  const latestWeight = hasWeights ? progressData?.weights[progressData.weights.length - 1]?.weightKg : null;

  return (
    <Card className="p-5 flex flex-col justify-between h-full bg-zinc-950/40 border-zinc-850" hoverEffect={true}>
      <div>
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-900/40">
          <div className="flex items-center gap-2">
            <LineChart className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Progress Intelligence</h3>
          </div>
          <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 border border-indigo-500/20 rounded uppercase font-bold">
            Phase 8
          </span>
        </div>

        {/* Trend Indicator & Status */}
        <div className="mb-4 bg-zinc-900/40 border border-zinc-850 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-0.5">
              Weight Trend
            </span>
            <div className="flex items-center gap-2">
              {trend.includes('DOWN') || trend.includes('LOSS') ? (
                <TrendingDown className="w-5 h-5 text-emerald-400" />
              ) : trend.includes('UP') || trend.includes('GAIN') ? (
                <TrendingUp className="w-5 h-5 text-indigo-400" />
              ) : (
                <Minus className="w-5 h-5 text-zinc-400" />
              )}
              <span className="text-sm font-black text-white uppercase tracking-tight">
                {trend.replace(/_/g, ' ')}
              </span>
            </div>
            {latestWeight && (
              <span className="text-[11px] text-zinc-400 font-mono mt-0.5 block">
                Latest: {latestWeight} kg
              </span>
            )}
          </div>

          <div className="text-right">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-0.5">
              Data Quality
            </span>
            <span className="text-xs font-mono font-bold text-cyan-400">
              {dataQuality}
            </span>
          </div>
        </div>

        {/* Progress Metrics Pill Row */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between items-center text-xs p-2 bg-zinc-900/30 border border-zinc-850/60 rounded-lg">
            <span className="text-zinc-400 text-[11px] font-medium">Trajectory Status</span>
            <span className="font-mono text-zinc-200 text-[11px] font-bold uppercase">
              {overallStatus.replace(/_/g, ' ')}
            </span>
          </div>
        </div>
      </div>

      <Button variant="outline" onClick={onViewProgress} className="w-full text-xs font-bold uppercase min-h-[44px]">
        <span className="flex items-center justify-center gap-1.5">
          View Progress & Check-In <ChevronRight className="w-4 h-4" />
        </span>
      </Button>
    </Card>
  );
};
