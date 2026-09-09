import React from 'react';
import { BodyStatusCard } from '../components/dashboard/BodyStatusCard';
import { TodayScore } from '../components/dashboard/TodayScore';
import { TodayMissions } from '../components/dashboard/TodayMissions';
import { WorkoutCard } from '../components/dashboard/WorkoutCard';
import { NutritionCard } from '../components/dashboard/NutritionCard';
import { FridayInsightCard } from '../components/dashboard/FridayInsightCard';
import { HydrationCard } from '../components/dashboard/HydrationCard';
import { 
  UserProfile, 
  WorkoutPlan, 
  WorkoutDay, 
  WorkoutSession, 
  NutritionTargets, 
  Meal, 
  DailyHydration, 
  DailyTask 
} from '../types';
import { Sparkles } from 'lucide-react';

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
  onAddWater
}) => {
  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good morning';
    if (hr < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const currentCalories = meals.reduce((acc, m) => acc + m.totalCalories, 0);
  const currentProtein = meals.reduce((acc, m) => acc + m.totalProtein, 0);
  const targetProtein = nutritionTargets?.proteinGrams || 140;
  const targetWater = hydration.targetMl || 2500;

  const proteinPct = Math.min(100, Math.round((currentProtein / targetProtein) * 100));
  const waterPct = Math.min(100, Math.round((hydration.consumedMl / targetWater) * 100));
  const workoutDone = activeSession?.completed || false;

  // Real, dynamic insight generation
  let dynamicInsight = `Welcome back, ${userProfile.name}. `;
  if (!workoutDone && todayWorkout) {
    dynamicInsight += `Your primary mission today is "${todayWorkout.dayName}". Ensure you consume adequate hydration before training.`;
  } else if (currentProtein < targetProtein) {
    const short = Math.round(targetProtein - currentProtein);
    dynamicInsight += `Workout completed, but you are currently ${short}g short of your protein target. Prioritize a lean protein dinner.`;
  } else {
    dynamicInsight += `Outstanding discipline today. Both your workout and nutrition objectives are firmly on track.`;
  }

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-950/60 p-5 rounded-xl border border-zinc-900">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
              FRIDAY Core System
            </span>
          </div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">
            {getGreeting()}, <span className="text-cyan-400">{userProfile.name}</span>.
          </h1>
          <p className="text-xs text-zinc-400 font-medium mt-0.5">
            Goal: <span className="text-zinc-200 font-semibold">{userProfile.goal.replace('_', ' ')}</span> | Environment: <span className="text-zinc-200 font-semibold">{userProfile.trainingEnvironment}</span>
          </p>
        </div>
        
        <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-850 p-3 rounded-lg text-xs self-start md:self-auto">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <div className="font-mono">
            <span className="text-zinc-500 font-bold uppercase block text-[8px]">Trainer Status</span>
            <span className="text-zinc-200 font-bold">FRIDAY Coach V2.0</span>
          </div>
        </div>
      </div>

      {/* Row 1: Adherence score, Body status, and missions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

      {/* Row 2: Workout, Nutrition, Hydration, FRIDAY Insight */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
          <FridayInsightCard 
            onAskFriday={() => setTab('friday')} 
            insight={dynamicInsight} 
          />
        </div>
      </div>
    </div>
  );
};
