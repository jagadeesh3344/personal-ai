import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { 
  Sparkles, 
  Dumbbell, 
  Utensils, 
  Droplets, 
  TrendingUp, 
  ArrowRight, 
  CheckCircle2, 
  UserCheck,
  RefreshCw
} from 'lucide-react';
import { DailyCoachingBrief } from '../../features/friday/coaching/types';

interface TodayFocusHeroProps {
  coachingBrief: DailyCoachingBrief | null;
  isLoading?: boolean;
  onRefresh?: () => void;
  onActionClick: (actionType: string) => void;
}

export const TodayFocusHero: React.FC<TodayFocusHeroProps> = ({
  coachingBrief,
  isLoading = false,
  onRefresh,
  onActionClick
}) => {
  if (!coachingBrief) {
    return (
      <div className="bg-zinc-950/70 border border-zinc-900 rounded-2xl p-6 flex items-center justify-between animate-pulse">
        <div className="space-y-2">
          <div className="h-4 w-28 bg-zinc-850 rounded" />
          <div className="h-6 w-72 bg-zinc-800 rounded" />
        </div>
        <div className="h-10 w-36 bg-zinc-850 rounded-xl" />
      </div>
    );
  }

  const { priority, nextRecommendedAction, priorityRationale, workout } = coachingBrief;

  // Determine button label, icon, and destination based on authoritative backend priority
  let buttonLabel = 'View Plan';
  let buttonIcon = <ArrowRight className="w-4 h-4" />;
  let actionDestination = 'dashboard';
  let badgeColor = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
  let heroGradient = 'from-cyan-950/20 via-zinc-950 to-zinc-950 border-cyan-500/30';

  switch (priority) {
    case 'WORKOUT':
      badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      heroGradient = 'from-emerald-950/25 via-zinc-950 to-zinc-950 border-emerald-500/30';
      if (workout.status === 'IN_PROGRESS') {
        buttonLabel = 'Continue Workout';
        buttonIcon = <Dumbbell className="w-4 h-4" />;
        actionDestination = 'workout';
      } else if (workout.status === 'COMPLETED') {
        buttonLabel = 'Workout Completed ✓';
        buttonIcon = <CheckCircle2 className="w-4 h-4" />;
        actionDestination = 'workout';
      } else {
        buttonLabel = 'Start Workout';
        buttonIcon = <Dumbbell className="w-4 h-4" />;
        actionDestination = 'workout';
      }
      break;

    case 'NUTRITION':
      badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      heroGradient = 'from-amber-950/25 via-zinc-950 to-zinc-950 border-amber-500/30';
      buttonLabel = `Log Meal (${coachingBrief.nutrition.nextMealSlot || 'Next'})`;
      buttonIcon = <Utensils className="w-4 h-4" />;
      actionDestination = 'nutrition';
      break;

    case 'HYDRATION':
      badgeColor = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      heroGradient = 'from-cyan-950/25 via-zinc-950 to-zinc-950 border-cyan-500/30';
      buttonLabel = 'Log +500 ml Water';
      buttonIcon = <Droplets className="w-4 h-4" />;
      actionDestination = 'quick_water_500';
      break;

    case 'PROGRESS_TRACKING':
      badgeColor = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
      heroGradient = 'from-indigo-950/25 via-zinc-950 to-zinc-950 border-indigo-500/30';
      buttonLabel = 'Check-In / Progress';
      buttonIcon = <TrendingUp className="w-4 h-4" />;
      actionDestination = 'progress';
      break;

    case 'PROFILE_SETUP':
      badgeColor = 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      heroGradient = 'from-purple-950/25 via-zinc-950 to-zinc-950 border-purple-500/30';
      buttonLabel = 'Complete Setup';
      buttonIcon = <UserCheck className="w-4 h-4" />;
      actionDestination = 'settings';
      break;

    default:
      badgeColor = 'bg-zinc-800 text-zinc-300 border-zinc-700';
      heroGradient = 'from-zinc-900 via-zinc-950 to-zinc-950 border-zinc-800';
      buttonLabel = 'Consult FRIDAY';
      actionDestination = 'friday';
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${heroGradient} border p-5 md:p-6 shadow-xl transition-all duration-300`}>
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-zinc-900 border border-zinc-800 text-white">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              Today's Focus
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase border ${badgeColor}`}>
              PRIORITY: {priority}
            </span>
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isLoading}
                title="Refresh coaching brief"
                className="p-1 text-zinc-500 hover:text-white rounded transition cursor-pointer"
                aria-label="Refresh coaching brief"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
              </button>
            )}
          </div>

          <h2 className="text-lg md:text-xl font-black text-white tracking-tight leading-snug">
            {nextRecommendedAction}
          </h2>

          <p className="text-xs text-zinc-400 leading-relaxed font-medium">
            {priorityRationale}
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-3">
          <button
            onClick={() => onActionClick(actionDestination)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-black text-xs uppercase tracking-wider transition-all duration-200 shadow-lg shadow-cyan-500/20 hover:scale-[1.02] cursor-pointer min-h-[44px]"
            aria-label={buttonLabel}
          >
            {buttonIcon}
            <span>{buttonLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
