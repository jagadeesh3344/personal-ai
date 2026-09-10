import React, { useState, useEffect } from 'react';
import { WorkoutExerciseCard } from '../components/workout/WorkoutExerciseCard';
import { WorkoutCamera } from '../components/workout/WorkoutCamera';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Dumbbell, Timer, ArrowLeft, CheckCircle, Camera, Plus, Play, Pause } from 'lucide-react';
import { WorkoutPlan, WorkoutSession, WorkoutExercise, WorkoutSet } from '../types';
import { UserProfile } from '../types/profile';
import { workoutsApi } from '../services/api/workoutsApi';

interface WorkoutProps {
  plan: WorkoutPlan | null;
  activeSession: WorkoutSession | null;
  userProfile?: UserProfile | null;
  onUpdateSession: (session: WorkoutSession) => void;
  onCompleteSession: (session: WorkoutSession) => void;
  setTab: (tab: string) => void;
}

export const Workout: React.FC<WorkoutProps> = ({
  plan,
  activeSession,
  userProfile,
  onUpdateSession,
  onCompleteSession,
  setTab
}) => {
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [activeCameraExercise, setActiveCameraExercise] = useState<WorkoutExercise | null>(null);

  // New exercise inputs
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseTarget, setNewExerciseTarget] = useState('3 sets of 10 reps');
  const [newExerciseNotes, setNewExerciseNotes] = useState('');

  // Active Rest Timer
  const [timerSeconds, setTimerSeconds] = useState(60);
  const [timerMax, setTimerMax] = useState(60);
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setTimerActive(false);
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
      }
    }
    return () => clearInterval(interval);
  }, [timerActive, timerSeconds]);

  const resetTimer = (secs: number) => {
    setTimerMax(secs);
    setTimerSeconds(secs);
    setTimerActive(false);
  };

  const currentDay = plan?.days[selectedDayIdx] || null;

  // Derive active exercise list from session if running, or default plan day
  const currentExercises: WorkoutExercise[] = activeSession?.exercises || currentDay?.exercises || [];

  const handleToggleSet = async (exerciseId: string, setId: string) => {
    if (!activeSession) return;

    let targetSet: WorkoutSet | undefined;
    let targetEx: WorkoutExercise | undefined;

    const updatedExercises = activeSession.exercises.map(ex => {
      if (ex.id === exerciseId) {
        targetEx = ex;
        const updatedSets = ex.sets.map(s => {
          if (s.id === setId) {
            const nextCompleted = !s.completed;
            if (nextCompleted) {
              resetTimer(ex.restSeconds || 60);
              setTimerActive(true);
            }
            const updated: WorkoutSet = {
              ...s,
              completed: nextCompleted,
              completionMethod: nextCompleted ? 'MANUAL' : undefined,
              verification: nextCompleted ? 'SELF_REPORTED' : undefined,
              completedAt: nextCompleted ? new Date().toISOString() : undefined
            };
            targetSet = updated;
            return updated;
          }
          return s;
        });
        return { ...ex, sets: updatedSets };
      }
      return ex;
    });

    onUpdateSession({
      ...activeSession,
      exercises: updatedExercises
    });

    // If marked completed, persist authoritative set record to backend DB
    if (targetSet?.completed && targetEx) {
      try {
        await workoutsApi.addSet(activeSession.id, {
          exerciseId: targetEx.exerciseId || targetEx.id,
          setNumber: targetSet.setNumber,
          weightKg: targetSet.weightKg || 0,
          reps: targetSet.reps || 10,
          durationSeconds: targetSet.durationSeconds,
          resistanceLevel: targetSet.resistanceLevel,
          completed: true,
          completionMethod: 'MANUAL',
          verification: 'SELF_REPORTED'
        });
      } catch (err) {
        console.warn('[Workout] backend manual set sync warning:', err);
      }
    }
  };

  const handleUpdateSet = (exerciseId: string, setId: string, field: 'weightKg' | 'reps' | 'durationSeconds' | 'resistanceLevel', value: any) => {
    if (!activeSession) return;

    const updatedExercises = activeSession.exercises.map(ex => {
      if (ex.id === exerciseId) {
        return {
          ...ex,
          sets: ex.sets.map(s => s.id === setId ? { ...s, [field]: value } : s)
        };
      }
      return ex;
    });

    onUpdateSession({
      ...activeSession,
      exercises: updatedExercises
    });
  };

  const handleAddSet = (exerciseId: string) => {
    if (!activeSession) return;

    const updatedExercises = activeSession.exercises.map(ex => {
      if (ex.id === exerciseId) {
        const lastSet = ex.sets[ex.sets.length - 1];
        const newSet: WorkoutSet = {
          id: `set-${Date.now()}`,
          setNumber: ex.sets.length + 1,
          weightKg: lastSet ? lastSet.weightKg : 10,
          reps: lastSet ? lastSet.reps : 10,
          completed: false
        };
        return { ...ex, sets: [...ex.sets, newSet] };
      }
      return ex;
    });

    onUpdateSession({
      ...activeSession,
      exercises: updatedExercises
    });
  };

  const handleDeleteSet = (exerciseId: string, setId: string) => {
    if (!activeSession) return;

    const updatedExercises = activeSession.exercises.map(ex => {
      if (ex.id === exerciseId) {
        return {
          ...ex,
          sets: ex.sets.filter(s => s.id !== setId)
        };
      }
      return ex;
    });

    onUpdateSession({
      ...activeSession,
      exercises: updatedExercises
    });
  };

  const handleDeleteExercise = (exerciseId: string) => {
    if (!activeSession) return;

    onUpdateSession({
      ...activeSession,
      exercises: activeSession.exercises.filter(ex => ex.id !== exerciseId)
    });
  };

  const handleAddExerciseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExerciseName.trim() || !activeSession) return;

    const newEx: WorkoutExercise = {
      id: `ex-${Date.now()}`,
      exerciseId: `custom-${Date.now()}`,
      name: newExerciseName,
      muscleGroups: ['CHEST'],
      targetSets: 3,
      targetReps: newExerciseTarget,
      restSeconds: 60,
      notes: newExerciseNotes,
      sets: [
        { id: `s-${Date.now()}-1`, setNumber: 1, weightKg: 10, reps: 10, completed: false }
      ]
    };

    onUpdateSession({
      ...activeSession,
      exercises: [...activeSession.exercises, newEx]
    });

    setNewExerciseName('');
    setNewExerciseTarget('3 sets of 10 reps');
    setNewExerciseNotes('');
    setShowAddModal(false);
  };

  const handleCameraLogReps = async (exerciseId: string, reps: number, formSummary?: string) => {
    if (!activeSession) return;

    let loggedSetNumber = 1;
    const currentEx = activeSession.exercises.find(e => e.id === exerciseId);
    if (currentEx) {
      const nextUncompleted = currentEx.sets.find(s => !s.completed);
      loggedSetNumber = nextUncompleted ? nextUncompleted.setNumber : currentEx.sets.length + 1;
    }

    // 1. Dispatch to real backend API to persist in workout_sets table
    try {
      await workoutsApi.addSet(activeSession.id, {
        exerciseId,
        setNumber: loggedSetNumber,
        weightKg: currentEx?.sets[0]?.weightKg || 0,
        reps,
        completed: true,
        completionMethod: 'CAMERA',
        verification: 'VERIFIED'
      });
    } catch (err) {
      console.warn('[Workout] Notice: backend set sync handled or in offline mode', err);
    }

    // 2. Update local session state
    const updatedExercises = activeSession.exercises.map(ex => {
      if (ex.id === exerciseId) {
        let setMarked = false;
        const updatedSets = ex.sets.map(s => {
          if (!s.completed && !setMarked) {
            setMarked = true;
            return { 
              ...s, 
              reps, 
              completed: true, 
              completionMethod: 'CAMERA' as const,
              verification: 'VERIFIED' as const,
              completedAt: new Date().toISOString() 
            };
          }
          return s;
        });

        if (!setMarked) {
          updatedSets.push({
            id: `set-cam-${Date.now()}`,
            setNumber: updatedSets.length + 1,
            weightKg: ex.sets[ex.sets.length - 1]?.weightKg || 0,
            reps,
            completed: true,
            completionMethod: 'CAMERA' as const,
            verification: 'VERIFIED' as const,
            completedAt: new Date().toISOString()
          });
        }
        return { ...ex, sets: updatedSets };
      }
      return ex;
    });

    onUpdateSession({
      ...activeSession,
      exercises: updatedExercises
    });

    setIsCameraActive(false);
  };

  const totalExercises = currentExercises.length;
  const completedExercises = currentExercises.filter(ex => 
    ex.sets.length > 0 && ex.sets.every(s => s.completed)
  ).length;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-950/40 border border-zinc-900 p-5 rounded-xl">
        <div>
          <button 
            onClick={() => setTab('dashboard')} 
            className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-white uppercase tracking-wider mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </button>
          <h1 className="text-xl font-black text-white uppercase tracking-tight">
            {activeSession ? activeSession.dayName : (currentDay ? currentDay.dayName : 'Workout Session')}
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            {plan ? `${plan.name} — ${completedExercises}/${totalExercises} Exercises Completed` : 'No active workout plan'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {activeSession && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setActiveCameraExercise(currentExercises[0] || null);
                setIsCameraActive(true);
              }}
              className="text-xs"
            >
              <Camera className="w-4 h-4 mr-1.5 text-cyan-400" />
              Camera View
            </Button>
          )}

          {activeSession && !activeSession.completed && (
            <Button 
              variant="primary" 
              size="sm"
              onClick={() => onCompleteSession(activeSession)}
              className="text-xs font-bold uppercase"
            >
              <CheckCircle className="w-4 h-4 mr-1.5" />
              Complete Workout
            </Button>
          )}
        </div>
      </div>

      {/* Day Selector if multiple plan days exist */}
      {plan && plan.days.length > 1 && !activeSession && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {plan.days.map((d, idx) => (
            <button
              key={d.id}
              onClick={() => setSelectedDayIdx(idx)}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
                selectedDayIdx === idx
                  ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-300'
                  : 'bg-zinc-900/40 border border-zinc-850 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              {d.dayName}
            </button>
          ))}
        </div>
      )}

      {/* Rest Timer HUD */}
      <Card className="p-4 bg-zinc-950/40 border-zinc-850 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Timer className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 font-mono font-bold uppercase block">REST COUNTDOWN TIMER</span>
            <span className="text-2xl font-black text-white font-mono">{timerSeconds}s</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {[30, 60, 90, 120].map(sec => (
            <button
              key={sec}
              onClick={() => resetTimer(sec)}
              className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-all ${
                timerMax === sec ? 'bg-cyan-500 text-black' : 'bg-zinc-900 text-zinc-400 hover:text-white'
              }`}
            >
              {sec}s
            </button>
          ))}
          <Button
            variant={timerActive ? 'danger' : 'outline'}
            size="sm"
            onClick={() => setTimerActive(!timerActive)}
            className="text-xs"
          >
            {timerActive ? <Pause className="w-3.5 h-3.5 mr-1" /> : <Play className="w-3.5 h-3.5 mr-1" />}
            {timerActive ? 'Pause' : 'Start'}
          </Button>
        </div>
      </Card>

      {/* Exercises Grid */}
      <div className="space-y-4">
        {currentExercises.map((exercise, index) => (
          <WorkoutExerciseCard
            key={exercise.id}
            exercise={exercise}
            exerciseIndex={index}
            onToggleSet={handleToggleSet}
            onUpdateSet={handleUpdateSet}
            onAddSet={handleAddSet}
            onDeleteSet={handleDeleteSet}
            onDeleteExercise={handleDeleteExercise}
            onStartCamera={(ex) => {
              setActiveCameraExercise(ex);
              setIsCameraActive(true);
            }}
          />
        ))}

        {activeSession && (
          <Button
            variant="outline"
            onClick={() => setShowAddModal(true)}
            className="w-full py-3 text-xs uppercase tracking-wider"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Add Custom Exercise to Session
          </Button>
        )}
      </div>

      {/* Add Custom Exercise Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="ADD EXERCISE">
        <form onSubmit={handleAddExerciseSubmit} className="space-y-4 pt-2">
          <Input
            id="ex-name"
            label="Exercise Name"
            value={newExerciseName}
            onChange={e => setNewExerciseName(e.target.value)}
            placeholder="e.g. Incline Dumbbell Press"
            required
          />
          <Input
            id="ex-target"
            label="Target Sets & Reps"
            value={newExerciseTarget}
            onChange={e => setNewExerciseTarget(e.target.value)}
            placeholder="e.g. 3 sets of 10 reps"
          />
          <Input
            id="ex-notes"
            label="Form Notes (Optional)"
            value={newExerciseNotes}
            onChange={e => setNewExerciseNotes(e.target.value)}
            placeholder="e.g. Keep chest high, control eccentric"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Add Exercise
            </Button>
          </div>
        </form>
      </Modal>

      {/* Optical Camera View Modal */}
      {isCameraActive && (
        <WorkoutCamera
          exercise={activeCameraExercise}
          userProfile={userProfile}
          currentSetIndex={(activeCameraExercise?.sets.filter(s => s.completed).length || 0) + 1}
          totalSets={activeCameraExercise?.sets.length || 3}
          onLogCompletedReps={handleCameraLogReps}
          onSkipExercise={() => setIsCameraActive(false)}
          onClose={() => setIsCameraActive(false)}
        />
      )}
    </div>
  );
};
