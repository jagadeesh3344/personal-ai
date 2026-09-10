import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MobileNav } from './components/layout/MobileNav';

// Types
import { 
  UserProfile, 
  WorkoutPlan, 
  WorkoutSession, 
  Meal, 
  MealItem, 
  DailyHydration, 
  ProgressState, 
  DailyTask, 
  FridayMessage,
  Habit 
} from './types';

// Repositories
import { ProfileRepository } from './services/repositories/ProfileRepository';
import { WorkoutRepository } from './services/repositories/WorkoutRepository';
import { NutritionRepository } from './services/repositories/NutritionRepository';
import { HydrationRepository } from './services/repositories/HydrationRepository';
import { ProgressRepository } from './services/repositories/ProgressRepository';

// Calculators & Generator
import { calculateNutritionTargets } from './utils/nutritionCalculator';
import { calculateHydrationTarget } from './utils/hydrationCalculator';
import { generateWorkoutPlan } from './utils/workoutGenerator';

// Pages
import { Onboarding } from './pages/Onboarding';
import { Dashboard } from './pages/Dashboard';
import { Workout as WorkoutPage } from './pages/Workout';
import { Nutrition as NutritionPage } from './pages/Nutrition';
import { Habits } from './pages/Habits';
import { Progress as ProgressPage } from './pages/Progress';
import { Friday as FridayPage } from './pages/Friday';
import { Settings as SettingsPage } from './pages/Settings';

export default function App() {
  const todayStr = new Date().toISOString().split('T')[0];
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  // Core State backed by clean repository abstraction
  const [isOnboarded, setIsOnboarded] = useState<boolean>(() => ProfileRepository.isOnboarded());
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => ProfileRepository.getProfile());
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(() => WorkoutRepository.getActivePlan());
  const [sessions, setSessions] = useState<WorkoutSession[]>(() => WorkoutRepository.getSessions());
  const [meals, setMeals] = useState<Meal[]>(() => NutritionRepository.getMeals(todayStr));

  // Calculated Targets
  const nutritionTargets = userProfile ? calculateNutritionTargets(userProfile) : null;
  const targetHydrationMl = userProfile ? calculateHydrationTarget(userProfile) : 2500;

  const [hydration, setHydration] = useState<DailyHydration>(() => 
    HydrationRepository.getHydration(todayStr, targetHydrationMl)
  );
  const [progressData, setProgressData] = useState<ProgressState>(() => ProgressRepository.getProgress());

  const [habits, setHabits] = useState<Habit[]>(() => [
    { id: 'h1', name: 'Workout Routine', icon: 'Dumbbell', streak: 0, weeklyHistory: { Mon: false, Tue: false, Wed: false, Thu: false, Fri: false, Sat: false, Sun: false }, currentCompleted: false },
    { id: 'h2', name: 'Protein Target', icon: 'Beef', streak: 0, weeklyHistory: { Mon: false, Tue: false, Wed: false, Thu: false, Fri: false, Sat: false, Sun: false }, currentCompleted: false },
    { id: 'h3', name: 'Hydration Intake', icon: 'GlassWater', streak: 0, weeklyHistory: { Mon: false, Tue: false, Wed: false, Thu: false, Fri: false, Sat: false, Sun: false }, currentCompleted: false },
  ]);

  const [fridayMessages, setFridayMessages] = useState<FridayMessage[]>(() => [
    {
      id: 'init-msg',
      sender: 'friday',
      text: "Hello! I'm FRIDAY, your personal AI trainer. Ready to check today's workout, log your hydration, or review your fitness progress?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      category: 'system'
    }
  ]);


  // Sync profile edits to ProfileRepository
  useEffect(() => {
    if (userProfile) {
      ProfileRepository.saveProfile(userProfile);
    }
  }, [userProfile]);

  // Initial sync from backend API when available
  useEffect(() => {
    ProfileRepository.syncFromBackend().then(p => {
      if (p) setUserProfile(p);
    });
    WorkoutRepository.syncSessionsFromBackend().then(s => {
      if (s && s.length > 0) setSessions(s);
    });
    NutritionRepository.syncFromBackend(todayStr).then(m => {
      if (m && m.length > 0) setMeals(m);
    });
    HydrationRepository.syncFromBackend(todayStr).then(h => {
      if (h) setHydration(h);
    });
    ProgressRepository.syncFromBackend().then(pr => {
      if (pr) setProgressData(pr);
    });
  }, [todayStr]);

  // Determine active workout session for today
  const activeSession = sessions.find(s => s.dayId && !s.completed) || (sessions.length > 0 ? sessions[0] : null);
  const todayWorkoutDay = workoutPlan?.days[0] || null;

  // Real, dynamic tasks derived from actual telemetry
  const totalProteinConsumed = meals.reduce((a, m) => a + m.totalProtein, 0);
  const targetProteinGrams = nutritionTargets?.proteinGrams || 140;

  const waterConsumedLiters = (hydration.consumedMl / 1000).toFixed(2);
  const waterTargetLiters = (hydration.targetMl / 1000).toFixed(1);
  const isHydrationGoalMet = hydration.consumedMl >= hydration.targetMl;

  const isWorkoutCompleted = activeSession?.completed || false;
  const isProteinMet = totalProteinConsumed >= targetProteinGrams;

  const tasks: DailyTask[] = [
    {
      id: 't-hydr',
      category: 'hydration',
      title: `Hydration Target (${waterTargetLiters}L)`,
      completed: isHydrationGoalMet,
      value: `${waterConsumedLiters}L / ${waterTargetLiters}L`
    },
    {
      id: 't-work',
      category: 'workout',
      title: todayWorkoutDay ? `Complete ${todayWorkoutDay.dayName}` : 'Complete Daily Workout',
      completed: isWorkoutCompleted,
      value: isWorkoutCompleted ? 'Completed ✓' : 'Incomplete'
    },
    {
      id: 't-nutr',
      category: 'nutrition',
      title: `Reach Protein Target (${targetProteinGrams}g)`,
      completed: isProteinMet,
      value: `${totalProteinConsumed}g / ${targetProteinGrams}g`
    }
  ];

  // Actions
  const handleAddWater = (amountMl: number) => {
    const updated = HydrationRepository.logWater(todayStr, amountMl, targetHydrationMl);
    setHydration({ ...updated });
  };

  const handleDeleteWaterEntry = (entryId: string) => {
    const updated = HydrationRepository.removeEntry(todayStr, entryId);
    setHydration({ ...updated });
  };

  const handleAddMealItem = (mealId: string, item: MealItem) => {
    NutritionRepository.addMealItem(todayStr, mealId, item);
    setMeals(NutritionRepository.getMeals(todayStr));
  };

  const handleDeleteMealItem = (mealId: string, itemIdx: number) => {
    const meal = meals.find(m => m.id === mealId);
    if (!meal || !meal.items[itemIdx]) return;
    NutritionRepository.removeMealItem(todayStr, mealId, meal.items[itemIdx].id);
    setMeals(NutritionRepository.getMeals(todayStr));
  };

  const handleUpdateSession = (session: WorkoutSession) => {
    WorkoutRepository.saveSession(session);
    setSessions(WorkoutRepository.getSessions());
  };

  const handleCompleteSession = (session: WorkoutSession) => {
    const finished: WorkoutSession = {
      ...session,
      completed: true,
      completedAt: new Date().toISOString()
    };
    WorkoutRepository.saveSession(finished);
    setSessions(WorkoutRepository.getSessions());

    const confirmationMsg: FridayMessage = {
      id: `msg-${Date.now()}`,
      sender: 'friday',
      text: `Session "${session.dayName}" recorded successfully. Great job on completing your workout!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      category: 'workout'
    };

    setFridayMessages(prev => [...prev, confirmationMsg]);
  };

  const handleAddWeight = (weightKg: number) => {
    const updated = ProgressRepository.addWeight(weightKg);
    setProgressData({ ...updated });
    if (userProfile) {
      setUserProfile({
        ...userProfile,
        currentWeightKg: weightKg,
        updatedAt: new Date().toISOString()
      });
    }
  };

  const handleAddMeasurement = (meas: { date: string; chestCm?: number; waistCm?: number; armsCm?: number; thighsCm?: number }) => {
    const updated = ProgressRepository.addMeasurement(meas);
    setProgressData({ ...updated });
  };

  const handleOnboardingComplete = (profile: UserProfile) => {
    ProfileRepository.saveProfile(profile);
    ProfileRepository.setOnboarded(true);
    setUserProfile(profile);

    // Deterministically generate workout plan
    const generatedPlan = generateWorkoutPlan(profile);
    WorkoutRepository.saveActivePlan(generatedPlan);
    setWorkoutPlan(generatedPlan);

    // Initial session for Day 1
    if (generatedPlan.days.length > 0) {
      const firstDay = generatedPlan.days[0];
      const session: WorkoutSession = {
        id: `sess-${Date.now()}`,
        userId: 'user',
        planId: generatedPlan.id,
        dayId: firstDay.id,
        dayName: firstDay.dayName,
        startedAt: new Date().toISOString(),
        completed: false,
        exercises: firstDay.exercises
      };
      WorkoutRepository.saveSession(session);
      setSessions([session]);
    }

    // Record baseline weight
    ProgressRepository.addWeight(profile.currentWeightKg);
    setProgressData(ProgressRepository.getProgress());

    setIsOnboarded(true);
  };

  const handleResetOnboarding = () => {
    ProfileRepository.clear();
    WorkoutRepository.clear();
    NutritionRepository.clear();
    HydrationRepository.clear();
    ProgressRepository.clear();

    setIsOnboarded(false);
    setUserProfile(null);
    setWorkoutPlan(null);
    setSessions([]);
    setMeals(NutritionRepository.getMeals(todayStr));
    setHydration(HydrationRepository.getHydration(todayStr, 2500));
    setProgressData(ProgressRepository.getProgress());
    setCurrentTab('dashboard');
  };

  if (!isOnboarded || !userProfile) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  const renderTabContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return (
          <Dashboard
            userProfile={userProfile}
            workoutPlan={workoutPlan}
            todayWorkout={todayWorkoutDay}
            activeSession={activeSession}
            nutritionTargets={nutritionTargets}
            meals={meals}
            hydration={hydration}
            tasks={tasks}
            onToggleTask={() => {}}
            setTab={setCurrentTab}
            onAddMealClick={() => setCurrentTab('nutrition')}
            onAddWater={handleAddWater}
          />
        );
      case 'workout':
        return (
          <WorkoutPage
            plan={workoutPlan}
            activeSession={activeSession}
            userProfile={userProfile}
            onUpdateSession={handleUpdateSession}
            onCompleteSession={handleCompleteSession}
            setTab={setCurrentTab}
          />
        );
      case 'nutrition':
        return (
          <NutritionPage
            targets={nutritionTargets}
            meals={meals}
            hydration={hydration}
            onAddMealItem={handleAddMealItem}
            onDeleteMealItem={handleDeleteMealItem}
            onAddWater={handleAddWater}
            onDeleteWaterEntry={handleDeleteWaterEntry}
            setTab={setCurrentTab}
            userProfile={userProfile}
          />
        );
      case 'habits':
        return (
          <Habits
            habits={habits}
            setHabits={setHabits}
            setTab={setCurrentTab}
          />
        );
      case 'progress':
        return (
          <ProgressPage
            progressData={progressData}
            onAddWeight={handleAddWeight}
            onAddMeasurement={handleAddMeasurement}
            setTab={setCurrentTab}
          />
        );
      case 'friday':
        return (
          <FridayPage
            messages={fridayMessages}
            setMessages={setFridayMessages}
            userProfile={userProfile}
          />
        );
      case 'settings':
        return (
          <SettingsPage
            userProfile={userProfile}
            setUserProfile={setUserProfile as any}
            setTab={setCurrentTab}
            onResetOnboarding={handleResetOnboarding}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex font-sans select-none antialiased">
      {/* Sidebar Layout */}
      <Sidebar 
        currentTab={currentTab} 
        setTab={setCurrentTab} 
        streakDays={1} 
      />

      {/* Main Shell */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-64 pb-16 md:pb-0 min-h-screen">
        <Header 
          currentTab={currentTab} 
          userName={userProfile.name} 
          userGoal={userProfile.goal.replace('_', ' ')} 
          setTab={setCurrentTab} 
        />
        
        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {renderTabContent()}
        </main>
      </div>

      {/* Mobile Navigation bar */}
      <MobileNav currentTab={currentTab} setTab={setCurrentTab} />
    </div>
  );
}
