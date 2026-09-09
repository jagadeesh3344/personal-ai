import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Trash2, Plus, HelpCircle, Check, Play, Square } from 'lucide-react';
import { Exercise, WorkoutSet } from '../../types';

interface WorkoutExerciseCardProps {
  exercise: Exercise;
  exerciseIndex: number;
  onToggleSet: (exerciseId: string, setId: string) => void;
  onUpdateSet: (exerciseId: string, setId: string, field: 'weight' | 'reps', value: number) => void;
  onAddSet: (exerciseId: string) => void;
  onDeleteSet: (exerciseId: string, setId: string) => void;
  onDeleteExercise: (exerciseId: string) => void;
}

export const WorkoutExerciseCard: React.FC<WorkoutExerciseCardProps> = ({
  exercise,
  exerciseIndex,
  onToggleSet,
  onUpdateSet,
  onAddSet,
  onDeleteSet,
  onDeleteExercise
}) => {
  const completedSets = exercise.sets.filter(s => s.completed).length;
  const totalSets = exercise.sets.length;
  const isCompleted = completedSets === totalSets && totalSets > 0;

  return (
    <Card 
      className={`p-5 bg-zinc-950/40 border-zinc-850 ${
        isCompleted ? 'border-emerald-500/20 bg-emerald-950/5' : ''
      }`}
      hoverEffect={true}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4 pb-2 border-b border-zinc-900/40">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-900/30">
              EX-0{exerciseIndex + 1}
            </span>
            <h3 className="text-sm font-bold text-white tracking-wide uppercase">{exercise.name}</h3>
          </div>
          {exercise.notes && (
            <p className="text-[10px] text-zinc-500 mt-1 italic">
              📌 {exercise.notes}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-zinc-450 font-mono">
            {completedSets} / {totalSets} Sets Done
          </span>
          <button 
            onClick={() => onDeleteExercise(exercise.id)}
            className="text-zinc-600 hover:text-red-400 p-1 rounded hover:bg-zinc-900/80 transition-all duration-200"
            title="Delete exercise"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Target parameters badge */}
      <div className="mb-4 flex items-center gap-1.5 bg-zinc-900/50 border border-zinc-850 p-2 rounded-lg text-xs">
        <HelpCircle className="w-3.5 h-3.5 text-cyan-500" />
        <span className="text-zinc-400">Target Standard:</span>
        <span className="text-zinc-200 font-bold font-mono">{exercise.targetReps}</span>
      </div>

      {/* Sets Grid */}
      <div className="space-y-2 mb-4">
        {exercise.sets.map((set, setIdx) => (
          <div 
            key={set.id}
            className={`grid grid-cols-12 gap-2 items-center p-2 rounded-lg border transition-all duration-150 ${
              set.completed 
                ? 'bg-zinc-900/20 border-zinc-900/50 text-zinc-550' 
                : 'bg-zinc-900/40 border-zinc-850 text-zinc-200'
            }`}
          >
            {/* Set index */}
            <div className="col-span-2 text-xs font-bold font-mono text-zinc-500 pl-1">
              SET {setIdx + 1}
            </div>

            {/* Weight Input */}
            <div className="col-span-3 flex items-center gap-1">
              <input
                type="number"
                value={set.weight || ''}
                onChange={(e) => onUpdateSet(exercise.id, set.id, 'weight', parseFloat(e.target.value) || 0)}
                disabled={set.completed}
                className="w-full h-8 bg-zinc-950/80 border border-zinc-800 focus:border-cyan-500 text-center rounded text-xs font-bold text-white outline-none disabled:opacity-50 disabled:bg-transparent"
              />
              <span className="text-[10px] text-zinc-500">kg</span>
            </div>

            {/* Reps Input */}
            <div className="col-span-3 flex items-center gap-1">
              <input
                type="number"
                value={set.reps || ''}
                onChange={(e) => onUpdateSet(exercise.id, set.id, 'reps', parseInt(e.target.value) || 0)}
                disabled={set.completed}
                className="w-full h-8 bg-zinc-950/80 border border-zinc-800 focus:border-cyan-500 text-center rounded text-xs font-bold text-white outline-none disabled:opacity-50 disabled:bg-transparent"
              />
              <span className="text-[10px] text-zinc-500">reps</span>
            </div>

            {/* Delete set button */}
            <div className="col-span-2 flex justify-center">
              <button
                onClick={() => onDeleteSet(exercise.id, set.id)}
                className="text-zinc-700 hover:text-red-400 p-1 rounded hover:bg-zinc-900"
                title="Remove set"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>

            {/* Completion checkbox */}
            <div className="col-span-2 flex justify-end">
              <button
                onClick={() => onToggleSet(exercise.id, set.id)}
                className={`w-6 h-6 rounded flex items-center justify-center transition-all duration-200 border cursor-pointer ${
                  set.completed 
                    ? 'bg-emerald-500 border-emerald-500 text-black shadow-[0_0_8px_rgba(16,185,129,0.3)]' 
                    : 'border-zinc-700 bg-zinc-950/40 hover:border-zinc-500'
                }`}
              >
                {set.completed && <Check className="w-3.5 h-3.5 stroke-[3.5]" />}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Card Actions */}
      <button
        onClick={() => onAddSet(exercise.id)}
        className="w-full border border-dashed border-zinc-800 hover:border-zinc-700 text-[11px] font-semibold text-zinc-450 hover:text-zinc-200 py-2 rounded-lg bg-zinc-900/10 hover:bg-zinc-900/30 transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" /> ADD WORKOUT SET
      </button>
    </Card>
  );
};
