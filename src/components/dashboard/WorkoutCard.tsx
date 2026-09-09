import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Dumbbell, Clock, ChevronRight, CheckCircle2 } from 'lucide-react';
import { WorkoutDay, WorkoutSession } from '../../types';

interface WorkoutCardProps {
  todayWorkout: WorkoutDay | null;
  activeSession: WorkoutSession | null;
  onStartWorkout: () => void;
}

export const WorkoutCard: React.FC<WorkoutCardProps> = ({
  todayWorkout,
  activeSession,
  onStartWorkout
}) => {
  if (!todayWorkout) {
    return (
      <Card className="p-5 flex flex-col justify-between h-full bg-zinc-950/40 border-zinc-850" hoverEffect={true}>
        <div>
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-900/40">
            <div className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Today's Protocol</h3>
            </div>
            <span className="text-[10px] font-mono text-zinc-500">REST</span>
          </div>
          <div className="py-6 text-center">
            <p className="text-sm font-bold text-zinc-300">Rest / Recovery Day</p>
            <p className="text-xs text-zinc-500 mt-1">No scheduled session today. Prioritize hydration and protein synthesis.</p>
          </div>
        </div>
        <Button variant="outline" onClick={onStartWorkout} className="w-full text-xs">
          View All Workouts
        </Button>
      </Card>
    );
  }

  const isCompleted = activeSession?.completed;

  return (
    <Card className="p-5 flex flex-col justify-between h-full bg-zinc-950/40 border-zinc-850" hoverEffect={true}>
      <div>
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-900/40">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Today's Workout</h3>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-550">
            <Clock className="w-3.5 h-3.5 text-zinc-550" />
            <span>{todayWorkout.exercises.length * 8}m est.</span>
          </div>
        </div>

        <div className="mb-3">
          <h4 className="text-md font-black text-white tracking-wide uppercase">{todayWorkout.dayName}</h4>
          <p className="text-[10px] text-cyan-400 font-semibold uppercase tracking-wider mt-0.5">{todayWorkout.focus}</p>
        </div>

        <div className="space-y-1.5 mb-4">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Exercises</span>
          <div className="grid grid-cols-1 gap-1.5 max-h-44 overflow-y-auto">
            {todayWorkout.exercises.map((ex, index) => (
              <div key={ex.id} className="flex items-center gap-2 bg-zinc-900/40 border border-zinc-850/60 p-2 rounded-lg text-xs">
                <span className="text-cyan-500 font-mono font-bold w-4">0{index + 1}</span>
                <span className="font-semibold text-zinc-200 flex-1 truncate">{ex.name}</span>
                <span className="text-[10px] text-zinc-500 font-mono">{ex.targetReps}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {isCompleted ? (
        <div className="flex items-center justify-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 py-2.5 rounded-lg text-xs font-bold uppercase">
          <CheckCircle2 className="w-4 h-4" /> Workout Completed
        </div>
      ) : (
        <Button variant="primary" onClick={onStartWorkout} className="w-full">
          <span className="flex items-center gap-1.5 uppercase tracking-wider text-xs">
            {activeSession ? 'Resume Workout' : 'Start Workout'} <ChevronRight className="w-4 h-4" />
          </span>
        </Button>
      )}
    </Card>
  );
};
