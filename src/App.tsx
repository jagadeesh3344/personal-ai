import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MobileNav } from './components/layout/MobileNav';
import { FridayMessage, UserProfile, Workout, DailyStats, Task, Nutrition, HydrationData, Meal } from './types';

// Pages
import { Dashboard } from './pages/Dashboard';
import { Workout as WorkoutPage } from './pages/Workout';
import { Nutrition as NutritionPage } from './pages/Nutrition';
import { Habits } from './pages/Habits';
import { Progress } from './pages/Progress';
import { Friday } from './pages/Friday';
import { Settings } from './pages/Settings';

// Mock Initial Data
import {
  initialUserProfile,
  initialDailyStats,
  initialTasks,
  initialWorkouts,
  initialNutrition,
  initialHydration,
  initialMeals,
  initialHabits,
  initialProgress,
  initialFridayMessages
} from './data/mockData';

import { Onboarding } from './pages/Onboarding';
import { generateFilteredWorkouts } from './data/exerciseDb';
import { nutritionService } from './services/nutritionService';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  // State Management
  const [isOnboarded, setIsOnboarded] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('friday_onboarded') === 'true';
    }
    return false;
  });

  const [userPhoto, setUserPhoto] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('friday_user_photo');
    }
    return null;
  });

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('friday_user_profile');
      if (saved) return JSON.parse(saved);
    }
    return initialUserProfile;
  });

  const [dailyStats, setDailyStats] = useState<DailyStats>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('friday_daily_stats');
      if (saved) return JSON.parse(saved);
    }
    return initialDailyStats;
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('friday_tasks');
      if (saved) return JSON.parse(saved);
    }
    return initialTasks;
  });

  const [workouts, setWorkouts] = useState<Workout[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('friday_workouts');
      if (saved) return JSON.parse(saved);
    }
    return initialWorkouts;
  });

  const [hydration, setHydration] = useState<HydrationData>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('friday_hydration');
      if (saved) return JSON.parse(saved);
    }
    return initialHydration;
  });

  const [meals, setMeals] = useState<Meal[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('friday_meals');
      if (saved) return JSON.parse(saved);
    }
    return initialMeals;
  });

  // Fully Derived Nutrition State (Single Source of Truth)
  const targets = nutritionService.calculateTargets(userProfile);
  const currentCalories = meals.reduce((acc, m) => acc + (m.totalCalories || 0), 0);
  const currentProtein = meals.reduce((acc, m) => acc + (m.totalProtein || 0), 0);
  const currentCarbs = meals.reduce((acc, m) => acc + (m.totalCarbs || 0), 0);
  const currentFat = meals.reduce((acc, m) => acc + (m.totalFat || 0), 0);

  const nutrition: Nutrition = {
    calories: { current: currentCalories, target: targets.calories },
    protein: { current: currentProtein, target: targets.protein },
    carbs: { current: currentCarbs, target: targets.carbs },
    fat: { current: currentFat, target: targets.fat },
    waterIntakeLiters: parseFloat((hydration.consumedMl / 1000).toFixed(2)),
    waterTargetLiters: targets.waterLiters
  };

  const [habits, setHabits] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('friday_habits');
      if (saved) return JSON.parse(saved);
    }
    return initialHabits;
  });

  const [progressData, setProgressData] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('friday_progress_data');
      if (saved) return JSON.parse(saved);
    }
    return initialProgress;
  });

  const [fridayMessages, setFridayMessages] = useState<FridayMessage[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('friday_messages');
      if (saved) return JSON.parse(saved);
    }
    return initialFridayMessages;
  });

  // Automatically write state changes to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('friday_user_profile', JSON.stringify(userProfile));
    }
  }, [userProfile]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('friday_daily_stats', JSON.stringify(dailyStats));
    }
  }, [dailyStats]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('friday_tasks', JSON.stringify(tasks));
    }
  }, [tasks]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('friday_workouts', JSON.stringify(workouts));
    }
  }, [workouts]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('friday_nutrition', JSON.stringify(nutrition));
    }
  }, [nutrition]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('friday_hydration', JSON.stringify(hydration));
    }
  }, [hydration]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('friday_meals', JSON.stringify(meals));
    }
  }, [meals]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('friday_habits', JSON.stringify(habits));
    }
  }, [habits]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('friday_progress_data', JSON.stringify(progressData));
    }
  }, [progressData]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('friday_messages', JSON.stringify(fridayMessages));
    }
  }, [fridayMessages]);

  // Dynamically re-generate workouts if profile parameters (location, goal, equipment) change
  useEffect(() => {
    if (isOnboarded) {
      const generated = generateFilteredWorkouts(
        userProfile.trainingEnvironment,
        userProfile.equipment || [],
        userProfile.goal || userProfile.fitnessGoal
      );
      if (generated && generated.length > 0) {
        const currentWorkoutName = workouts[0]?.name;
        const currentExercisesCount = workouts[0]?.exercises.length;
        const newWorkoutName = generated[0]?.name;
        const newExercisesCount = generated[0]?.exercises.length;
        
        // Only trigger an update if the generated workout differs structurally
        if (currentWorkoutName !== newWorkoutName || currentExercisesCount !== newExercisesCount) {
          setWorkouts(generated);
        }
      }
    }
  }, [
    userProfile.trainingEnvironment, 
    userProfile.goal, 
    userProfile.fitnessGoal, 
    JSON.stringify(userProfile.equipment), 
    isOnboarded
  ]);

  // Synchronize workout task title dynamically with active workout name
  useEffect(() => {
    const activeWorkout = workouts[0];
    if (activeWorkout) {
      setTasks(currentTasks => {
        const hasWorkoutTask = currentTasks.some(t => t.category === 'workout');
        if (hasWorkoutTask) {
          return currentTasks.map(t => {
            if (t.category === 'workout') {
              const expectedTitle = `Complete ${activeWorkout.name} workout`;
              if (t.title !== expectedTitle) {
                return { ...t, title: expectedTitle };
              }
            }
            return t;
          });
        }
        return currentTasks;
      });
    }
  }, [workouts]);

  // Sync state between Tasks checklist and Today's Score dynamically
  useEffect(() => {
    // Dynamically calculate efficiency score based on task completions & hydration logs
    const completedCount = tasks.filter(t => t.completed).length;
    const computedScore = Math.min(100, Math.round((completedCount / tasks.length) * 100));

    // Dynamic breakdown matching
    const workoutDone = tasks.find(t => t.category === 'workout')?.completed ? 20 : 0;
    const nutritionDone = tasks.find(t => t.category === 'nutrition')?.completed ? 30 : 15;
    const stepsDone = tasks.find(t => t.category === 'steps')?.completed ? 20 : 10;
    const sleepDone = tasks.find(t => t.category === 'sleep')?.completed ? 15 : 10;
    
    const waterGoal = nutrition.waterTargetLiters;
    const waterLog = nutrition.waterIntakeLiters;
    const hydrationDone = Math.min(15, Math.round((waterLog / waterGoal) * 15));

    setDailyStats(prev => ({
      ...prev,
      score: computedScore,
      scoreBreakdown: {
        workout: workoutDone,
        nutrition: nutritionDone,
        hydration: hydrationDone,
        steps: stepsDone,
        sleep: sleepDone
      }
    }));
  }, [tasks, nutrition.waterIntakeLiters]);

  // Sync with habits completion lists
  useEffect(() => {
    // Map today's tasks completion lists back to habits
    setHabits(prev => prev.map(h => {
      if (h.id === 'h1') { // Workout Routine
        const done = tasks.find(t => t.category === 'workout')?.completed || false;
        return { ...h, currentCompleted: done };
      }
      if (h.id === 'h2') { // Protein Target
        const done = tasks.find(t => t.category === 'nutrition')?.completed || false;
        return { ...h, currentCompleted: done };
      }
      if (h.id === 'h3') { // Water Intake
        const done = tasks.find(t => t.category === 'hydration')?.completed || false;
        return { ...h, currentCompleted: done };
      }
      if (h.id === 'h4') { // Steps
        const done = tasks.find(t => t.category === 'steps')?.completed || false;
        return { ...h, currentCompleted: done };
      }
      if (h.id === 'h5') { // Sleep
        const done = tasks.find(t => t.category === 'sleep')?.completed || false;
        return { ...h, currentCompleted: done };
      }
      return h;
    }));
  }, [tasks]);

  const handleAddWater = (amountMl: number) => {
    setHydration(prev => {
      const newEntries = [
        ...prev.entries,
        {
          id: `hyt-${Date.now()}`,
          amountMl,
          timestamp: new Date().toISOString()
        }
      ];
      return {
        ...prev,
        consumedMl: prev.consumedMl + amountMl,
        entries: newEntries
      };
    });
  };

  const handleDeleteWaterEntry = (id: string) => {
    setHydration(prev => {
      const entryToDelete = prev.entries.find(e => e.id === id);
      if (!entryToDelete) return prev;
      const newEntries = prev.entries.filter(e => e.id !== id);
      return {
        ...prev,
        consumedMl: Math.max(0, prev.consumedMl - entryToDelete.amountMl),
        entries: newEntries
      };
    });
  };

  // Central Tasks Synchronization Effect (reactive alignment)
  useEffect(() => {
    setTasks(currentTasks => {
      let changed = false;
      const updated = currentTasks.map(t => {
        if (t.category === 'hydration') {
          const expectedVal = `${nutrition.waterIntakeLiters.toFixed(2)}L / ${nutrition.waterTargetLiters.toFixed(1)}L`;
          const expectedComp = nutrition.waterIntakeLiters >= nutrition.waterTargetLiters;
          if (t.value !== expectedVal || t.completed !== expectedComp) {
            changed = true;
            return { ...t, value: expectedVal, completed: expectedComp };
          }
        }
        if (t.category === 'nutrition') {
          const expectedVal = `${Math.round(nutrition.protein.current)}g / ${Math.round(nutrition.protein.target)}g`;
          const expectedComp = nutrition.protein.current >= nutrition.protein.target;
          if (t.value !== expectedVal || t.completed !== expectedComp) {
            changed = true;
            return { ...t, value: expectedVal, completed: expectedComp };
          }
        }
        return t;
      });
      return changed ? updated : currentTasks;
    });
  }, [nutrition.waterIntakeLiters, nutrition.waterTargetLiters, nutrition.protein.current, nutrition.protein.target]);

  const handleToggleTask = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        return { ...t, completed: !t.completed };
      }
      return t;
    }));
  };

  // Callback when a workout is finished
  const handleCompleteWorkout = () => {
    // Mark active workout as completed
    setWorkouts(prev => prev.map(w => ({ ...w, completed: true })));

    // Toggle workout task as completed
    setTasks(prev => prev.map(t => {
      if (t.category === 'workout') {
        return { ...t, completed: true };
      }
      return t;
    }));

    // Alert and sync
    const confirmationMsg: FridayMessage = {
      id: `msg-sys-${Date.now()}`,
      sender: 'friday',
      text: "Outstanding achievement, Operator. Your Push Day workout protocol has been archived. Biometric indicators suggest 100% muscle engagement.",
      timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      category: 'success'
    };

    setFridayMessages(prev => [...prev, confirmationMsg]);
    setCurrentTab('workout');
  };

  const handleAddMealTransition = () => {
    setCurrentTab('nutrition');
  };

  // Onboarding Callback Handlers
  const handleOnboardingComplete = (
    profile: Partial<UserProfile>,
    photo: string | null,
    customWorkouts: Workout[]
  ) => {
    const completeProfile: UserProfile = {
      id: profile.id || `user-${Date.now()}`,
      name: profile.name || "Jagadeesh",
      goal: profile.goal || "Fat Loss",
      weight: profile.weight || 74.2,
      currentWeight: profile.currentWeight || profile.weight || 74.2,
      height: profile.height || 178,
      age: profile.age || 26,
      sex: profile.sex || "Male",
      trainingExperience: profile.trainingExperience || "Intermediate",
      activityLevel: profile.activityLevel || "Moderately Active",
      trainingEnvironment: profile.trainingEnvironment || "Gym",
      equipment: profile.equipment || [],
      dietPreference: profile.dietPreference || "Standard",
      foodPreferences: profile.foodPreferences || [],
      allergies: profile.allergies || [],
      exercisePreferences: profile.exercisePreferences || { liked: [], disliked: [] },
      availableWorkoutDays: profile.availableWorkoutDays || ["Mon", "Wed", "Fri", "Sat"],
      workoutDuration: profile.workoutDuration || 45,
      bodyPhoto: photo || profile.bodyPhoto || null,
      preferences: profile.preferences || {
        coachingStyle: "Balanced",
        workoutDaysPerWeek: 4,
        preferredWorkoutTime: "18:30",
        targetWeight: profile.targetWeight || 68.0
      },
      // Backward compatibility fields
      fitnessGoal: profile.goal || "Fat Loss",
      targetWeight: profile.targetWeight || 68.0,
      workoutDaysPerWeek: profile.workoutDaysPerWeek || 4,
      preferredWorkoutTime: profile.preferredWorkoutTime || "18:30",
      coachingStyle: profile.coachingStyle || "Balanced"
    };

    setUserProfile(completeProfile);
    
    setDailyStats(prev => ({
      ...prev,
      weight: completeProfile.weight,
      targetWeight: completeProfile.preferences.targetWeight,
    }));

    if (customWorkouts && customWorkouts.length > 0) {
      setWorkouts(customWorkouts);
    }

    if (photo) {
      setUserPhoto(photo);
      if (typeof window !== 'undefined') {
        localStorage.setItem('friday_user_photo', photo);
      }
    }

    setIsOnboarded(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('friday_onboarded', 'true');
    }
  };

  const handleResetOnboarding = () => {
    setIsOnboarded(false);
    setUserPhoto(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('friday_onboarded');
      localStorage.removeItem('friday_user_photo');
    }
    setUserProfile(initialUserProfile);
    setWorkouts(initialWorkouts);
    setCurrentTab('dashboard');
  };

  // Render Page Content
  const renderTabContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return (
          <Dashboard
            userProfile={userProfile}
            dailyStats={dailyStats}
            tasks={tasks}
            workouts={workouts}
            nutrition={nutrition}
            onToggleTask={handleToggleTask}
            setTab={setCurrentTab}
            onAddMealClick={handleAddMealTransition}
            onAddWater={handleAddWater}
          />
        );
      case 'workout':
        return (
          <WorkoutPage
            workouts={workouts}
            setWorkouts={setWorkouts}
            onCompleteWorkout={handleCompleteWorkout}
            setTab={setCurrentTab}
          />
        );
      case 'nutrition':
        return (
          <NutritionPage
            nutrition={nutrition}
            hydration={hydration}
            onAddWater={handleAddWater}
            onDeleteWaterEntry={handleDeleteWaterEntry}
            meals={meals}
            setMeals={setMeals}
            setTab={setCurrentTab}
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
          <Progress
            progressData={progressData}
            setProgressData={setProgressData}
            userPhoto={userPhoto}
            onUpdatePhoto={(photo) => {
              setUserPhoto(photo);
              if (typeof window !== 'undefined') {
                localStorage.setItem('friday_user_photo', photo);
              }
            }}
            setTab={setCurrentTab}
          />
        );
      case 'friday':
        return (
          <Friday
            messages={fridayMessages}
            setMessages={setFridayMessages}
            workouts={workouts}
            userProfile={userProfile}
            nutrition={nutrition}
          />
        );
      case 'settings':
        return (
          <Settings
            userProfile={userProfile}
            setUserProfile={setUserProfile}
            setTab={setCurrentTab}
            onResetOnboarding={handleResetOnboarding}
          />
        );
      default:
        return (
          <Dashboard
            userProfile={userProfile}
            dailyStats={dailyStats}
            tasks={tasks}
            workouts={workouts}
            nutrition={nutrition}
            onToggleTask={handleToggleTask}
            setTab={setCurrentTab}
            onAddMealClick={handleAddMealTransition}
            onAddWater={handleAddWater}
          />
        );
    }
  };

  if (!isOnboarded) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex font-sans select-none antialiased">
      {/* Sidebar Layout */}
      <Sidebar 
        currentTab={currentTab} 
        setTab={setCurrentTab} 
        streakDays={dailyStats.streakDays} 
      />

      {/* Main Container Shell */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-64 pb-16 md:pb-0 min-h-screen">
        <Header 
          currentTab={currentTab} 
          userName={userProfile.name} 
          userGoal={userProfile.fitnessGoal} 
          userPhoto={userPhoto}
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
