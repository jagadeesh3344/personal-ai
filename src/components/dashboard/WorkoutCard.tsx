import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Dumbbell, Clock, ChevronRight } from 'lucide-react';
import { Workout } from '../../types';

interface WorkoutCardProps {
  workout: Workout;
  onStartWorkout: () => void;
}

export const WorkoutCard: React.FC<WorkoutCardProps> = ({
  workout,
  onStartWorkout
}) => {
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
            <span>{workout.durationMinutes}m</span>
          </div>
        </div>

        <div className="mb-4">
          <h4 className="text-md font-black text-white tracking-wide uppercase">{workout.name}</h4>
          <p className="text-[10px] text-cyan-500 font-semibold uppercase tracking-wider mt-0.5">Strength & Hypertrophy</p>
        </div>

        <div className="space-y-2 mb-6">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Exercises</span>
          <div className="grid grid-cols-1 gap-1.5">
            {workout.exercises.map((ex, index) => (
              <div key={ex.id} className="flex items-center gap-2 bg-zinc-900/40 border border-zinc-850/60 p-2.5 rounded-lg text-xs">
                <span className="text-cyan-500 font-mono font-bold w-4">0{index + 1}</span>
                <span className="font-semibold text-zinc-200 flex-1">{ex.name}</span>
                <span className="text-[10px] text-zinc-500 font-mono">{ex.targetReps}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Button variant="primary" onClick={onStartWorkout} className="w-full">
        <span className="flex items-center gap-1.5 uppercase tracking-wider text-xs">
          Start Workout <ChevronRight className="w-4 h-4" />
        </span>
      </Button>
    </Card>
  );
};
