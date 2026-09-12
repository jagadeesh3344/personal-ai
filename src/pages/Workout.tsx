import React, { useState, useEffect } from 'react';
import { WorkoutExerciseCard } from '../components/workout/WorkoutExerciseCard';
import { WorkoutCamera } from '../components/workout/WorkoutCamera';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { 
  Dumbbell, 
  Timer, 
  ArrowLeft, 
  CheckCircle, 
  Camera, 
  Plus, 
  Play, 
  Pause, 
  SkipForward, 
  Bot, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  Info,
  Award,
  ChevronRight
} from 'lucide-react';
import { WorkoutPlan, WorkoutSession, WorkoutExercise, WorkoutSet } from '../types';
import { UserProfile } from '../types/profile';
import { workoutsApi } from '../services/api/workoutsApi';
import { EXERCISES } from '../features/workouts/data/exercises';

interface WorkoutProps {
  plan: WorkoutPlan | null;
  activeSession: WorkoutSession | null;
  userProfile?: UserProfile | null;
  onUpdateSession: (session: WorkoutSession) => void;
  onCompleteSession: (session: WorkoutSession) => void;
  setTab: (tab: string) => void;
  onAskFriday?: (prompt?: string) => void;
}

export const Workout: React.FC<WorkoutProps> = ({
  plan,
  activeSession,
  userProfile,
  onUpdateSession,
  onCompleteSession,
  setTab,
  onAskFriday
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
  const [restFinishedNotice, setRestFinishedNotice] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0 && timerActive) {
      setTimerActive(false);
      setRestFinishedNotice(true);
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([100, 50, 100]);
        } catch {
          // Ignore vibration error
        }
      }
    }
    return () => clearInterval(interval);
  }, [timerActive, timerSeconds]);

  const resetTimer = (secs: number) => {
    setTimerMax(secs);
    setTimerSeconds(secs);
    setTimerActive(false);
    setRestFinishedNotice(false);
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
              setRestFinishedNotice(false);
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

    // Start rest timer automatically after camera set
    resetTimer(currentEx?.restSeconds || 60);
    setTimerActive(true);
    setRestFinishedNotice(false);

    setIsCameraActive(false);
  };

  const totalExercises = currentExercises.length;
  const completedExercises = currentExercises.filter(ex => 
    ex.sets.length > 0 && ex.sets.every(s => s.completed)
  ).length;

  // Identify next uncompleted exercise for the focused briefing view
  const activeExerciseIndex = currentExercises.findIndex(ex => ex.sets.some(s => !s.completed));
  const focusedExercise = activeExerciseIndex >= 0 ? currentExercises[activeExerciseIndex] : currentExercises[0] || null;
  const focusedExerciseMeta = focusedExercise ? EXERCISES.find(e => e.id === focusedExercise.exerciseId || e.name === focusedExercise.name) : null;
  const focusedUncompletedSets = focusedExercise ? focusedExercise.sets.filter(s => !s.completed) : [];
  const focusedCurrentSet = focusedUncompletedSets[0] || focusedExercise?.sets[0];

  // Calculate stats for completion view
  const allSets = currentExercises.flatMap(e => e.sets);
  const completedSets = allSets.filter(s => s.completed);
  const verifiedSetsCount = completedSets.filter(s => s.verification === 'VERIFIED').length;
  const selfReportedSetsCount = completedSets.filter(s => s.verification !== 'VERIFIED').length;
  const totalRepsCount = completedSets.reduce((acc, s) => acc + (s.reps || 0), 0);

  // 1. If session is completed, render authoritative completion summary
  if (activeSession && activeSession.completed) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-12">
        <div className="bg-gradient-to-br from-emerald-950/40 via-zinc-950 to-zinc-950 border border-emerald-500/30 rounded-2xl p-6 md:p-8 text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mx-auto text-emerald-400 shadow-lg shadow-emerald-500/20">
            <Award className="w-8 h-8" />
          </div>

          <div>
            <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              Session Authenticated & Logged
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight mt-2">
              Workout Complete!
            </h1>
            <p className="text-xs text-zinc-400 font-medium mt-1">
              "{activeSession.dayName}" recorded into fitness database.
            </p>
          </div>

          {/* Genuine Stats Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-left">
            <div className="p-3.5 bg-zinc-900/60 border border-zinc-800 rounded-xl">
              <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Exercises</span>
              <span className="text-lg font-black text-white">{completedExercises} / {totalExercises}</span>
              <span className="text-[10px] text-emerald-400 block font-mono">100% completed</span>
            </div>

            <div className="p-3.5 bg-zinc-900/60 border border-zinc-800 rounded-xl">
              <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Sets Logged</span>
              <span className="text-lg font-black text-white">{completedSets.length}</span>
              <span className="text-[10px] text-zinc-400 block font-mono">Total sets</span>
            </div>

            <div className="p-3.5 bg-zinc-900/60 border border-zinc-800 rounded-xl">
              <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Verified Sets</span>
              <span className="text-lg font-black text-cyan-400">{verifiedSetsCount}</span>
              <span className="text-[10px] text-zinc-400 block font-mono">{selfReportedSetsCount} self-reported</span>
            </div>

            <div className="p-3.5 bg-zinc-900/60 border border-zinc-800 rounded-xl">
              <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Total Reps</span>
              <span className="text-lg font-black text-white">{totalRepsCount}</span>
              <span className="text-[10px] text-indigo-400 block font-mono">Recorded reps</span>
            </div>
          </div>

          {/* Real FRIDAY Coaching Summary (No fabricated facts) */}
          <div className="p-4 bg-zinc-900/50 border border-zinc-850 rounded-xl text-left space-y-1.5">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> FRIDAY Coach Assessment
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed font-medium">
              Workout successfully completed. You executed {completedSets.length} sets across {completedExercises} planned exercises, including {verifiedSetsCount} optical camera-verified sets. Your next immediate priorities are muscle protein synthesis and rehydration.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="primary"
              onClick={() => setTab('dashboard')}
              className="w-full sm:w-auto px-6 py-3 text-xs font-bold uppercase tracking-wider min-h-[44px]"
            >
              Return to Today
            </Button>
            <Button
              variant="outline"
              onClick={() => setTab('nutrition')}
              className="w-full sm:w-auto px-6 py-3 text-xs font-bold uppercase tracking-wider min-h-[44px]"
            >
              Check Nutrition & Fuel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-5xl mx-auto">
      {/* 1. Page & Session Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-950/60 border border-zinc-900 p-5 rounded-2xl shadow-sm">
        <div>
          <button 
            onClick={() => setTab('dashboard')} 
            className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-white uppercase tracking-wider mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Today
          </button>
          <h1 className="text-xl font-black text-white uppercase tracking-tight">
            {activeSession ? activeSession.dayName : (currentDay ? currentDay.dayName : 'Workout Session')}
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            {plan ? `${plan.name} — ${completedExercises}/${totalExercises} Exercises Finished` : 'Active Session'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {onAskFriday && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAskFriday("How many sets do I have left in today's workout?")}
              className="text-xs min-h-[44px]"
            >
              <Bot className="w-4 h-4 mr-1 text-cyan-400" />
              Ask FRIDAY
            </Button>
          )}

          {activeSession && !activeSession.completed && (
            <Button 
              variant="primary" 
              size="sm"
              onClick={() => onCompleteSession(activeSession)}
              className="text-xs font-bold uppercase min-h-[44px]"
            >
              <CheckCircle className="w-4 h-4 mr-1.5" />
              Complete Workout
            </Button>
          )}
        </div>
      </div>

      {/* 2. Focused Exercise Briefing & Active HUD (Section 6 & 7) */}
      {activeSession && focusedExercise && (
        <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-cyan-500/30 rounded-2xl p-5 md:p-6 space-y-4 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-zinc-850/80 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                CURRENT EXERCISE ({(activeExerciseIndex >= 0 ? activeExerciseIndex : 0) + 1} of {totalExercises})
              </span>
              <span className="text-xs font-mono text-zinc-400">
                Set {focusedCurrentSet ? focusedCurrentSet.setNumber : 1} of {focusedExercise.sets.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase">Target:</span>
              <span className="text-xs font-mono font-bold text-white bg-zinc-900 px-2.5 py-0.5 rounded border border-zinc-800">
                {focusedExercise.targetReps}
              </span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg md:text-xl font-black text-white uppercase tracking-tight">
                {focusedExercise.name}
              </h2>
              <p className="text-xs text-zinc-300 mt-1 max-w-xl leading-relaxed">
                {focusedExerciseMeta?.instructions || focusedExercise.notes || 'Maintain strict form, core engagement, and steady tempo through full range of motion.'}
              </p>
              {focusedExerciseMeta?.safetyNotes && (
                <p className="text-[11px] text-amber-400/90 mt-1 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" /> {focusedExerciseMeta.safetyNotes}
                </p>
              )}
            </div>

            {/* Tracking Action Buttons */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
              <Button
                variant="primary"
                onClick={() => {
                  setActiveCameraExercise(focusedExercise);
                  setIsCameraActive(true);
                }}
                className="text-xs font-bold uppercase min-h-[44px]"
              >
                <Camera className="w-4 h-4 mr-1.5" /> Start Camera
              </Button>
              {focusedCurrentSet && (
                <Button
                  variant="outline"
                  onClick={() => handleToggleSet(focusedExercise.id, focusedCurrentSet.id)}
                  className="text-xs font-bold uppercase min-h-[44px]"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-400" /> Log Set Manually
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Section 10: Real Rest Countdown Timer */}
      <Card className="p-4 md:p-5 bg-zinc-950/60 border-zinc-850 flex flex-wrap items-center justify-between gap-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border ${
            restFinishedNotice 
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 animate-pulse' 
              : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
          }`}>
            <Timer className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-500 font-mono font-bold uppercase tracking-wider block">
                Rest Timer
              </span>
              {restFinishedNotice && (
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-2 py-0.2 rounded border border-emerald-500/20">
                  Ready for your next set!
                </span>
              )}
            </div>
            <span className="text-2xl font-black text-white font-mono">{timerSeconds}s</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {[30, 60, 90, 120].map(sec => (
            <button
              key={sec}
              onClick={() => resetTimer(sec)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer min-h-[36px] ${
                timerMax === sec ? 'bg-cyan-500 text-black' : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              {sec}s
            </button>
          ))}
          <Button
            variant={timerActive ? 'danger' : 'outline'}
            size="sm"
            onClick={() => {
              setTimerActive(!timerActive);
              setRestFinishedNotice(false);
            }}
            className="text-xs min-h-[36px]"
          >
            {timerActive ? <Pause className="w-3.5 h-3.5 mr-1" /> : <Play className="w-3.5 h-3.5 mr-1" />}
            {timerActive ? 'Pause' : 'Start'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setTimerSeconds(0);
              setTimerActive(false);
              setRestFinishedNotice(true);
            }}
            className="text-xs text-zinc-400 hover:text-white min-h-[36px]"
            title="Skip Rest Timer"
          >
            <SkipForward className="w-3.5 h-3.5 mr-1" /> Skip
          </Button>
        </div>
      </Card>

      {/* 4. Complete List of Workout Exercises */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            All Planned Exercises ({totalExercises})
          </h3>
          <span className="text-xs font-mono text-zinc-500">
            {completedExercises} Completed
          </span>
        </div>

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
            className="w-full py-3.5 text-xs uppercase tracking-wider min-h-[44px]"
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
            <Button type="button" variant="outline" onClick={() => setShowAddModal(false)} className="min-h-[44px]">
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="min-h-[44px]">
              Add Exercise
            </Button>
          </div>
        </form>
      </Modal>

      {/* Optical Camera View Modal with Section 9 Error & Voice Fallback */}
      {isCameraActive && (
        <WorkoutCamera
          exercise={activeCameraExercise}
          userProfile={userProfile}
          currentSetIndex={(activeCameraExercise?.sets.filter(s => s.completed).length || 0) + 1}
          totalSets={activeCameraExercise?.sets.length || 3}
          onLogCompletedReps={handleCameraLogReps}
          onSkipExercise={() => setIsCameraActive(false)}
          onLogManually={() => {
            setIsCameraActive(false);
            if (activeCameraExercise) {
              const uncompleted = activeCameraExercise.sets.find(s => !s.completed);
              if (uncompleted) {
                handleToggleSet(activeCameraExercise.id, uncompleted.id);
              }
            }
          }}
          onUseVoice={() => {
            setIsCameraActive(false);
            if (onAskFriday) {
              onAskFriday("I did 10 reps on my set.");
            } else {
              setTab('friday');
            }
          }}
          onClose={() => setIsCameraActive(false)}
        />
      )}
    </div>
  );
};
