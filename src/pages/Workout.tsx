import React, { useState, useEffect } from 'react';
import { WorkoutExerciseCard } from '../components/workout/WorkoutExerciseCard';
import { WorkoutCamera } from '../components/workout/WorkoutCamera';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Play, Square, Plus, Dumbbell, Timer, ArrowLeft, CheckCircle, Camera } from 'lucide-react';
import { Workout as WorkoutType, Exercise, WorkoutSet } from '../types';

interface WorkoutProps {
  workouts: WorkoutType[];
  setWorkouts: React.Dispatch<React.SetStateAction<WorkoutType[]>>;
  onCompleteWorkout: () => void;
  setTab: (tab: string) => void;
}

export const Workout: React.FC<WorkoutProps> = ({
  workouts,
  setWorkouts,
  onCompleteWorkout,
  setTab
}) => {
  const currentWorkout = workouts[0];
  const [showAddModal, setShowAddModal] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseTarget, setNewExerciseTarget] = useState('3 sets of 10 reps');
  const [newExerciseNotes, setNewExerciseNotes] = useState('');

  // Active Timer state
  const [timerSeconds, setTimerSeconds] = useState(90);
  const [timerActive, setTimerActive] = useState(false);
  const [timerMax, setTimerMax] = useState(90);

  const handleLogCompletedReps = (exerciseId: string, reps: number) => {
    setWorkouts(prev => prev.map(w => {
      if (w.id === currentWorkout.id) {
        return {
          ...w,
          exercises: w.exercises.map(ex => {
            if (ex.id === exerciseId) {
              let setCompleted = false;
              const updatedSets = ex.sets.map(s => {
                if (!s.completed && !setCompleted) {
                  setCompleted = true;
                  return { ...s, reps: reps, completed: true };
                }
                return s;
              });

              if (!setCompleted) {
                const newSet: WorkoutSet = {
                  id: `set-cam-${Date.now()}`,
                  weight: ex.sets[ex.sets.length - 1]?.weight || 40,
                  reps: reps,
                  completed: true
                };
                return {
                  ...ex,
                  sets: [...ex.sets, newSet]
                };
              }

              return {
                ...ex,
                sets: updatedSets
              };
            }
            return ex;
          })
        };
      }
      return w;
    }));
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setTimerActive(false);
      // Play a high-tech synthesized notification sound or trigger flash
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
      }
    }
    return () => clearInterval(interval);
  }, [timerActive, timerSeconds]);

  const toggleTimer = () => {
    setTimerActive(!timerActive);
  };

  const resetTimer = (secs: number) => {
    setTimerMax(secs);
    setTimerSeconds(secs);
    setTimerActive(false);
  };

  const handleToggleSet = (exerciseId: string, setId: string) => {
    setWorkouts(prev => prev.map(w => {
      if (w.id === currentWorkout.id) {
        return {
          ...w,
          exercises: w.exercises.map(ex => {
            if (ex.id === exerciseId) {
              const updatedSets = ex.sets.map(s => {
                if (s.id === setId) {
                  // If completing, we could optionally start the rest timer automatically
                  if (!s.completed) {
                    resetTimer(timerMax);
                    setTimerActive(true);
                  }
                  return { ...s, completed: !s.completed };
                }
                return s;
              });
              return { ...ex, sets: updatedSets };
            }
            return ex;
          })
        };
      }
      return w;
    }));
  };

  const handleUpdateSet = (exerciseId: string, setId: string, field: 'weight' | 'reps', value: number) => {
    setWorkouts(prev => prev.map(w => {
      if (w.id === currentWorkout.id) {
        return {
          ...w,
          exercises: w.exercises.map(ex => {
            if (ex.id === exerciseId) {
              return {
                ...ex,
                sets: ex.sets.map(s => {
                  if (s.id === setId) {
                    return { ...s, [field]: value };
                  }
                  return s;
                })
              };
            }
            return ex;
          })
        };
      }
      return w;
    }));
  };

  const handleAddSet = (exerciseId: string) => {
    setWorkouts(prev => prev.map(w => {
      if (w.id === currentWorkout.id) {
        return {
          ...w,
          exercises: w.exercises.map(ex => {
            if (ex.id === exerciseId) {
              // Find average of existing sets for defaults
              const lastSet = ex.sets[ex.sets.length - 1];
              const defaultWeight = lastSet ? lastSet.weight : 50;
              const defaultReps = lastSet ? lastSet.reps : 10;
              const newSet: WorkoutSet = {
                id: `set-${Date.now()}`,
                weight: defaultWeight,
                reps: defaultReps,
                completed: false
              };
              return {
                ...ex,
                sets: [...ex.sets, newSet]
              };
            }
            return ex;
          })
        };
      }
      return w;
    }));
  };

  const handleDeleteSet = (exerciseId: string, setId: string) => {
    setWorkouts(prev => prev.map(w => {
      if (w.id === currentWorkout.id) {
        return {
          ...w,
          exercises: w.exercises.map(ex => {
            if (ex.id === exerciseId) {
              return {
                ...ex,
                sets: ex.sets.filter(s => s.id !== setId)
              };
            }
            return ex;
          })
        };
      }
      return w;
    }));
  };

  const handleDeleteExercise = (exerciseId: string) => {
    setWorkouts(prev => prev.map(w => {
      if (w.id === currentWorkout.id) {
        return {
          ...w,
          exercises: w.exercises.filter(ex => ex.id !== exerciseId)
        };
      }
      return w;
    }));
  };

  const handleAddExerciseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExerciseName.trim()) return;

    const newEx: Exercise = {
      id: `ex-${Date.now()}`,
      name: newExerciseName,
      targetReps: newExerciseTarget,
      notes: newExerciseNotes,
      sets: [
        { id: `s-${Date.now()}-1`, weight: 40, reps: 10, completed: false }
      ]
    };

    setWorkouts(prev => prev.map(w => {
      if (w.id === currentWorkout.id) {
        return {
          ...w,
          exercises: [...w.exercises, newEx]
        };
      }
      return w;
    }));

    setNewExerciseName('');
    setNewExerciseTarget('3 sets of 10 reps');
    setNewExerciseNotes('');
    setShowAddModal(false);
  };

  // Calculations for current progress
  const totalExercises = currentWorkout?.exercises.length || 0;
  const completedExercises = currentWorkout?.exercises.filter(ex => 
    ex.sets.length > 0 && ex.sets.every(s => s.completed)
  ).length || 0;

  const progressPercentage = totalExercises > 0 
    ? Math.round((completedExercises / totalExercises) * 100) 
    : 0;

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentWorkout) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in px-4">
        <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-500 flex items-center justify-center mb-6 shadow-md">
          <Dumbbell className="w-8 h-8 text-cyan-500 animate-pulse" />
        </div>
        <h2 className="text-xl font-black text-white uppercase tracking-wider">No Active Workout</h2>
        <p className="text-zinc-400 max-w-sm text-xs mt-2 leading-relaxed">
          Please configure your goals and available equipment inside Settings to automatically generate your custom training plan.
        </p>
        <div className="mt-8">
          <Button variant="primary" onClick={() => setTab('settings')}>
            Configure Settings
          </Button>
        </div>
      </div>
    );
  }

  if (currentWorkout?.completed) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in px-4">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6 shadow-lg shadow-emerald-950/20">
          <CheckCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-white uppercase tracking-wider">Workout Completed!</h2>
        <p className="text-zinc-400 max-w-sm text-xs mt-2 leading-relaxed">
          Excellent training today! Your stats have been saved and logged to your progress history.
        </p>
        <div className="flex gap-4 mt-8">
          <Button variant="outline" onClick={() => setTab('dashboard')}>
            Go to Dashboard
          </Button>
          <Button variant="primary" onClick={() => {
            // Restart workout demo
            setWorkouts(prev => prev.map(w => {
              if (w.id === currentWorkout.id) {
                return {
                  ...w,
                  completed: false,
                  exercises: w.exercises.map(ex => ({
                    ...ex,
                    sets: ex.sets.map(s => ({ ...s, completed: false }))
                  }))
                };
              }
              return w;
            }));
          }}>
            Restart Workout
          </Button>
        </div>
      </div>
    );
  }

  if (isCameraActive) {
    return (
      <WorkoutCamera 
        currentWorkout={currentWorkout} 
        onLogCompletedReps={handleLogCompletedReps} 
        onClose={() => setIsCameraActive(false)} 
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-950/40 border border-zinc-900 p-5 rounded-xl">
        <div>
          <button 
            onClick={() => setTab('dashboard')} 
            className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-white uppercase tracking-wider mb-2 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </button>
          <h1 className="text-xl font-black text-white uppercase tracking-tight">{currentWorkout?.name || "Active Workout"}</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Target duration: <span className="text-cyan-400 font-bold">{currentWorkout?.durationMinutes} minutes</span> • Muscle groups engaged: Chest, Shoulders, Triceps
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto shrink-0">
          <Button 
            variant="outline" 
            onClick={() => setIsCameraActive(true)} 
            className="w-full sm:w-auto text-cyan-400 hover:text-cyan-300 border-cyan-500/20 hover:bg-cyan-500/5 h-10"
          >
            <span className="flex items-center gap-2 uppercase text-xs tracking-wider font-bold">
              <Camera className="w-4 h-4" /> Open Camera Tracker
            </span>
          </Button>

          <Button variant="primary" onClick={onCompleteWorkout} className="w-full sm:w-auto h-10">
            <span className="flex items-center gap-2 uppercase text-xs tracking-wider">
              ✓ Complete Workout
            </span>
          </Button>
        </div>
      </div>

      {/* Main HUD: Active metrics, Timer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Progress Tracker Card */}
        <Card className="p-5 bg-zinc-950/40 border-zinc-850 flex flex-col justify-between" hoverEffect={false}>
          <div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">WORKOUT PROGRESS</span>
            <div className="flex items-baseline justify-between mb-3">
              <span className="text-3xl font-black text-white">{completedExercises} <span className="text-sm font-semibold text-zinc-400">/ {totalExercises}</span></span>
              <span className="text-xs text-cyan-400 font-mono font-bold">{progressPercentage}% COMPLETED</span>
            </div>
            
            <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-950">
              <div 
                className="h-full bg-cyan-500 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(6,182,212,0.4)]"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
          
          <div className="text-[10px] text-zinc-500 font-medium bg-zinc-900/30 p-2 border border-zinc-850/60 rounded mt-4">
            Complete your exercises to finish today's customized training program.
          </div>
        </Card>
 
        {/* Tactical Rest Timer */}
        <Card className="p-5 bg-zinc-950/40 border-zinc-850 lg:col-span-2 flex flex-col sm:flex-row items-center gap-6" hoverEffect={false}>
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 text-zinc-400 mb-1">
              <Timer className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold uppercase tracking-wider">Rest Interval Timer</span>
            </div>
            <p className="text-[10px] text-zinc-500 max-w-xs mt-1">
              Rest between sets to allow muscle recovery. Completing a set starts the timer automatically.
            </p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-4">
              <button 
                onClick={() => resetTimer(60)} 
                className={`text-[10px] font-mono font-bold px-2 py-1 rounded transition-all duration-200 cursor-pointer ${timerMax === 60 ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400'}`}
              >
                60s
              </button>
              <button 
                onClick={() => resetTimer(90)} 
                className={`text-[10px] font-mono font-bold px-2 py-1 rounded transition-all duration-200 cursor-pointer ${timerMax === 90 ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400'}`}
              >
                90s
              </button>
              <button 
                onClick={() => resetTimer(120)} 
                className={`text-[10px] font-mono font-bold px-2 py-1 rounded transition-all duration-200 cursor-pointer ${timerMax === 120 ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400'}`}
              >
                120s
              </button>
            </div>
          </div>
 
          <div className="flex flex-col items-center justify-center bg-zinc-900/60 border border-zinc-850 p-4 rounded-xl min-w-[140px]">
            <span className={`text-3xl font-mono font-bold tracking-tight mb-2 ${timerActive ? 'text-cyan-400 animate-pulse' : 'text-zinc-300'}`}>
              {formatTime(timerSeconds)}
            </span>
            <Button 
              variant={timerActive ? 'outline' : 'secondary'} 
              onClick={toggleTimer}
              className="w-full h-8 text-[11px] font-bold uppercase tracking-wide"
            >
              <span className="flex items-center gap-1">
                {timerActive ? <Square className="w-3 h-3 fill-white" /> : <Play className="w-3 h-3 fill-cyan-400" />}
                {timerActive ? 'PAUSE TIMER' : 'START TIMER'}
              </span>
            </Button>
          </div>
        </Card>
      </div>
 
      {/* Exercise List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">EXERCISE PLAN</span>
          <Button variant="outline" size="sm" onClick={() => setShowAddModal(true)}>
            <span className="flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> ADD CUSTOM EXERCISE
            </span>
          </Button>
        </div>

        {totalExercises === 0 ? (
          <Card className="p-10 text-center border-dashed border-zinc-800" hoverEffect={false}>
            <Dumbbell className="w-10 h-10 text-zinc-650 mx-auto mb-3" />
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Operational parameters dry</h3>
            <p className="text-[10px] text-zinc-550 max-w-sm mx-auto mt-1">
              No exercises registered for today's protocol. Hit 'Add Custom Exercise' above to queue biomechanic operations.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {currentWorkout.exercises.map((exercise, index) => (
              <WorkoutExerciseCard
                key={exercise.id}
                exercise={exercise}
                exerciseIndex={index}
                onToggleSet={handleToggleSet}
                onUpdateSet={handleUpdateSet}
                onAddSet={handleAddSet}
                onDeleteSet={handleDeleteSet}
                onDeleteExercise={handleDeleteExercise}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Custom Exercise Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Tactical Exercise">
        <form onSubmit={handleAddExerciseSubmit} className="space-y-4">
          <Input 
            id="ex-name"
            label="EXERCISE NAME"
            value={newExerciseName}
            onChange={(e) => setNewExerciseName(e.target.value)}
            placeholder="e.g. Lateral Raises, Pull Ups"
            required
          />
          <Input 
            id="ex-target"
            label="TARGET STANDARD"
            value={newExerciseTarget}
            onChange={(e) => setNewExerciseTarget(e.target.value)}
            placeholder="e.g. 3 sets of 12 reps"
          />
          <Input 
            id="ex-notes"
            label="EXECUTION SUGGESTIONS"
            value={newExerciseNotes}
            onChange={(e) => setNewExerciseNotes(e.target.value)}
            placeholder="e.g. Focus on control, tempo focus"
          />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" type="button" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Queue Exercise
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
