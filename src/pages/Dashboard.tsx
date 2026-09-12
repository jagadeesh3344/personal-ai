import React from 'react';
import { BodyStatusCard } from '../components/dashboard/BodyStatusCard';
import { TodayScore } from '../components/dashboard/TodayScore';
import { TodayMissions } from '../components/dashboard/TodayMissions';
import { WorkoutCard } from '../components/dashboard/WorkoutCard';
import { NutritionCard } from '../components/dashboard/NutritionCard';
import { HydrationCard } from '../components/dashboard/HydrationCard';
import { TodayFocusHero } from '../components/dashboard/TodayFocusHero';
import { ProgressSummaryCard } from '../components/dashboard/ProgressSummaryCard';
import { TodayFridayChatBar } from '../components/dashboard/TodayFridayChatBar';
import { 
  UserProfile, 
  WorkoutPlan, 
  WorkoutDay, 
  WorkoutSession, 
  NutritionTargets, 
  Meal, 
  DailyHydration, 
  DailyTask,
  ProgressState
} from '../types';
import { DailyCoachingBrief } from '../features/friday/coaching/types';
import { Sparkles, Bot } from 'lucide-react';

interface DashboardProps {
  userProfile: UserProfile;
  workoutPlan: WorkoutPlan | null;
  todayWorkout: WorkoutDay | null;
  activeSession: WorkoutSession | null;
  nutritionTargets: NutritionTargets | null;
  meals: Meal[];
  hydration: DailyHydration;
  tasks: DailyTask[];
  onToggleTask: (id: string) => void;
  setTab: (tab: string) => void;
  onAddMealClick: () => void;
  onAddWater: (ml: number) => void;
  coachingBrief?: DailyCoachingBrief | null;
  isLoadingCoaching?: boolean;
  onRefreshCoaching?: () => void;
  onQuickAskFriday?: (prompt: string) => void;
  progressData?: ProgressState | null;
}

export const Dashboard: React.FC<DashboardProps> = ({
  userProfile,
  workoutPlan,
  todayWorkout,
  activeSession,
  nutritionTargets,
  meals,
  hydration,
  tasks,
  onToggleTask,
  setTab,
  onAddMealClick,
  onAddWater,
  coachingBrief = null,
  isLoadingCoaching = false,
  onRefreshCoaching,
  onQuickAskFriday,
  progressData = null
}) => {
  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good morning';
    if (hr < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const currentProtein = meals.reduce((acc, m) => acc + m.totalProtein, 0);
  const targetProtein = nutritionTargets?.proteinGrams || 140;
  const targetWater = hydration.targetMl || 2500;

  const proteinPct = Math.min(100, Math.round((currentProtein / targetProtein) * 100));
  const waterPct = Math.min(100, Math.round((hydration.consumedMl / targetWater) * 100));
  const workoutDone = activeSession?.completed || false;

  const handleHeroActionClick = (destination: string) => {
    if (destination === 'quick_water_500') {
      onAddWater(500);
      if (onRefreshCoaching) onRefreshCoaching();
    } else {
      setTab(destination);
    }
  };

  const handleChatSendMessage = (prompt: string) => {
    if (onQuickAskFriday) {
      onQuickAskFriday(prompt);
    }
    setTab('friday');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-7xl mx-auto">
      {/* 1. Header with FRIDAY Greeting & Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-950/60 p-5 rounded-2xl border border-zinc-900 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
              FRIDAY AI Coach Orchestration
            </span>
          </div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">
            {getGreeting()}, <span className="text-cyan-400">{userProfile.name}</span>.
          </h1>
          <p className="text-xs text-zinc-400 font-medium mt-0.5">
            Goal: <span className="text-zinc-200 font-semibold">{userProfile.goal.replace('_', ' ')}</span> | Environment: <span className="text-zinc-200 font-semibold">{userProfile.trainingEnvironment}</span>
          </p>
        </div>
        
        <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-850 px-4 py-2.5 rounded-xl text-xs self-start md:self-auto">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <div>
            <span className="text-zinc-500 font-bold uppercase block text-[8px] tracking-wider">Coach Status</span>
            <span className="text-zinc-200 font-mono font-bold text-xs">ONLINE & AUTHORITATIVE</span>
          </div>
        </div>
      </div>

      {/* 2. Primary Next Action: TODAY'S FOCUS Hero Card */}
      <TodayFocusHero
        coachingBrief={coachingBrief}
        isLoading={isLoadingCoaching}
        onRefresh={onRefreshCoaching}
        onActionClick={handleHeroActionClick}
      />

      {/* 3. Core Four Pillars: Workout, Nutrition, Hydration, Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="h-full">
          <WorkoutCard 
            todayWorkout={todayWorkout} 
            activeSession={activeSession} 
            onStartWorkout={() => setTab('workout')} 
          />
        </div>
        <div className="h-full">
          <NutritionCard 
            targets={nutritionTargets} 
            meals={meals} 
            onAddMeal={onAddMealClick} 
          />
        </div>
        <div className="h-full">
          <HydrationCard 
            hydration={hydration} 
            onAddWater={onAddWater} 
          />
        </div>
        <div className="h-full">
          <ProgressSummaryCard 
            coachingBrief={coachingBrief}
            progressData={progressData}
            onViewProgress={() => setTab('progress')}
          />
        </div>
      </div>

      {/* 4. Inline FRIDAY Chat/Voice Bar */}
      <TodayFridayChatBar
        onSendMessage={handleChatSendMessage}
        onOpenFridayTab={() => setTab('friday')}
      />

      {/* 5. Metrics & Daily Missions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="h-full">
          <TodayScore 
            workoutDone={workoutDone} 
            proteinPct={proteinPct} 
            waterPct={waterPct} 
          />
        </div>
        <div className="h-full">
          <BodyStatusCard 
            currentWeight={userProfile.currentWeightKg} 
            targetWeight={userProfile.targetWeightKg} 
          />
        </div>
        <div className="h-full">
          <TodayMissions tasks={tasks} onToggleTask={onToggleTask} />
        </div>
      </div>
    </div>
  );
};
