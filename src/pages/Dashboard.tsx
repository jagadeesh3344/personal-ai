import React from 'react';
import { BodyStatusCard } from '../components/dashboard/BodyStatusCard';
import { TodayScore } from '../components/dashboard/TodayScore';
import { TodayMissions } from '../components/dashboard/TodayMissions';
import { WorkoutCard } from '../components/dashboard/WorkoutCard';
import { NutritionCard } from '../components/dashboard/NutritionCard';
import { FridayInsightCard } from '../components/dashboard/FridayInsightCard';
import { HydrationCard } from '../components/dashboard/HydrationCard';
import { UserProfile, DailyStats, Task, Workout, Nutrition } from '../types';
import { Sparkles, Terminal } from 'lucide-react';

interface DashboardProps {
  userProfile: UserProfile;
  dailyStats: DailyStats;
  tasks: Task[];
  workouts: Workout[];
  nutrition: Nutrition;
  onToggleTask: (id: string) => void;
  setTab: (tab: string) => void;
  onAddMealClick: () => void;
  onAddWater: (ml: number) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  userProfile,
  dailyStats,
  tasks,
  workouts,
  nutrition,
  onToggleTask,
  setTab,
  onAddMealClick,
  onAddWater
}) => {
  // Get time of day greeting
  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good morning';
    if (hr < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const todayWorkout = workouts[0] || {
    id: 'w1',
    name: "Push Day",
    durationMinutes: 45,
    completed: false,
    date: '',
    exercises: []
  };

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Dynamic Greeting section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-950/60 p-5 rounded-xl border border-zinc-900 shadow-inner">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">FRIDAY Active Coaching</span>
          </div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">
            {getGreeting()}, <span className="text-cyan-400">{userProfile.name}</span>.
          </h1>
          <p className="text-xs text-zinc-400 font-medium mt-0.5">
            Let's reach today's goals. Your training plan is tailored for you.
          </p>
        </div>
        
        {/* Holographic operational index badge */}
        <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 p-3 rounded-lg text-xs self-start md:self-auto">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse" />
          <div className="font-mono">
            <span className="text-zinc-500 font-bold uppercase block text-[8px]">Trainer Status</span>
            <span className="text-zinc-200 font-bold">FRIDAY Coach V1.5</span>
          </div>
        </div>
      </div>

      {/* Grid 1: Diagnostic score, Body status, and missions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="h-full">
          <TodayScore score={dailyStats.score} breakdown={dailyStats.scoreBreakdown} />
        </div>
        <div className="h-full">
          <BodyStatusCard 
            currentWeight={userProfile.weight} 
            targetWeight={userProfile.targetWeight} 
            weightChange={dailyStats.weightChange} 
            streakDays={dailyStats.streakDays} 
          />
        </div>
        <div className="h-full">
          <TodayMissions tasks={tasks} onToggleTask={onToggleTask} />
        </div>
      </div>

      {/* Grid 2: Core modules (Workout, Nutrition, Hydration, FRIDAY Insight) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="h-full">
          <WorkoutCard workout={todayWorkout} onStartWorkout={() => setTab('workout')} />
        </div>
        <div className="h-full">
          <NutritionCard nutrition={nutrition} onAddMeal={onAddMealClick} />
        </div>
        <div className="h-full">
          <HydrationCard 
            waterIntakeLiters={nutrition.waterIntakeLiters} 
            waterTargetLiters={nutrition.waterTargetLiters} 
            onAddWater={onAddWater} 
          />
        </div>
        <div className="h-full">
          <FridayInsightCard onAskFriday={() => setTab('friday')} />
        </div>
      </div>
    </div>
  );
};
