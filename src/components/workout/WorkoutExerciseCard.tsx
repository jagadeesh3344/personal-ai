import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { 
  Trash2, 
  Plus, 
  HelpCircle, 
  Check, 
  Camera, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  ShieldAlert,
  ClipboardPen
} from 'lucide-react';
import { WorkoutExercise } from '../../types';
import { EXERCISES } from '../../features/workouts/data/exercises';

interface WorkoutExerciseCardProps {
  exercise: WorkoutExercise;
  exerciseIndex: number;
  onToggleSet: (exerciseId: string, setId: string) => void;
  onUpdateSet: (exerciseId: string, setId: string, field: 'weightKg' | 'reps' | 'durationSeconds' | 'resistanceLevel', value: any) => void;
  onAddSet: (exerciseId: string) => void;
  onDeleteSet: (exerciseId: string, setId: string) => void;
  onDeleteExercise: (exerciseId: string) => void;
  onStartCamera?: (exercise: WorkoutExercise) => void;
}

export const WorkoutExerciseCard: React.FC<WorkoutExerciseCardProps> = ({
  exercise,
  exerciseIndex,
  onToggleSet,
  onUpdateSet,
  onAddSet,
  onDeleteSet,
  onDeleteExercise,
  onStartCamera
}) => {
  const [showEducation, setShowEducation] = useState(false);
  const completedSets = exercise.sets.filter(s => s.completed).length;
  const totalSets = exercise.sets.length;
  const isCompleted = completedSets === totalSets && totalSets > 0;

  const exerciseMeta = EXERCISES.find(e => e.id === exercise.exerciseId || e.name === exercise.name);

  const effectiveTrackingType = (() => {
    if (exercise.trackingType) return exercise.trackingType;
    const name = exercise.name.toLowerCase();
    const reps = (exercise.targetReps || '').toLowerCase();
    if (name.includes('plank') || name.includes('climber') || reps.includes('sec')) {
      return 'TIME_SECONDS';
    }
    if (name.includes('band')) {
      return 'REPS_RESISTANCE';
    }
    if (
      name.includes('push-up') ||
      name.includes('bodyweight') ||
      name.includes('pull-up') ||
      name.includes('chin-up') ||
      name.includes('dip') ||
      name.includes('crunch') ||
      name.includes('lunge') ||
      name.includes('glute bridge')
    ) {
      return 'REPS_ONLY';
    }
    return 'WEIGHT_AND_REPS';
  })();

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
          <span className="text-[10px] text-zinc-400 font-mono">
            {completedSets} / {totalSets} Sets Done
          </span>
          <button 
            onClick={() => onDeleteExercise(exercise.id)}
            className="text-zinc-600 hover:text-red-400 p-1 rounded hover:bg-zinc-900/80 transition-all duration-200 cursor-pointer"
            title="Delete exercise"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Educational & Tutorial Bar */}
      <div className="mb-3">
        <button
          onClick={() => setShowEducation(!showEducation)}
          className="flex items-center justify-between w-full bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-850 p-2.5 rounded-lg text-xs font-semibold text-zinc-300 transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-1.5 text-cyan-400">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>How to do it & Form Guide</span>
          </span>
          {showEducation ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
        </button>

        {showEducation && (
          <div className="mt-2 p-3 bg-zinc-900/40 border border-zinc-850 rounded-lg space-y-2.5 text-xs animate-fade-in">
            <div>
              <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold block">Execution Technique</span>
              <p className="text-zinc-300 mt-0.5 leading-relaxed">
                {exerciseMeta?.instructions || exercise.notes || 'Perform each repetition with controlled tempo and full range of motion.'}
              </p>
            </div>

            {exerciseMeta?.safetyNotes && (
              <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300/90 flex items-start gap-2 text-[11px]">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <span>{exerciseMeta.safetyNotes}</span>
              </div>
            )}

            {exerciseMeta?.tutorialUrl && (
              <div className="pt-1">
                <a
                  href={exerciseMeta.tutorialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 underline underline-offset-4 text-[11px]"
                >
                  <span>Watch reputable tutorial demonstration</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Target parameters badge & Optical Tracker trigger */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 bg-zinc-900/50 border border-zinc-850 p-2 rounded-lg text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-400">Target Standard:</span>
          <span className="text-zinc-200 font-bold font-mono">{exercise.targetReps}</span>
        </div>

        <div className="flex items-center gap-2">
          {onStartCamera && (
            <button
              onClick={() => onStartCamera(exercise)}
              className="flex items-center gap-1.5 text-[11px] font-bold font-mono px-2.5 py-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 transition-all cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Camera Track</span>
            </button>
          )}

          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
            {effectiveTrackingType === 'TIME_SECONDS' ? 'Timed' : 
             effectiveTrackingType === 'REPS_ONLY' ? 'Bodyweight' :
             effectiveTrackingType === 'REPS_RESISTANCE' ? 'Band' : 'Weight + Reps'}
          </span>
        </div>
      </div>

      {/* Sets Grid */}
      <div className="space-y-2 mb-4">
        {exercise.sets.map((set, setIdx) => (
          <div 
            key={set.id}
            className={`grid grid-cols-12 gap-2 items-center p-2 rounded-lg border transition-all duration-150 ${
              set.completed 
                ? 'bg-zinc-900/20 border-zinc-900/50 text-zinc-500' 
                : 'bg-zinc-900/40 border-zinc-850 text-zinc-200'
            }`}
          >
            {/* Set index */}
            <div className="col-span-2 text-xs font-bold font-mono text-zinc-500 pl-1">
              SET {set.setNumber || setIdx + 1}
            </div>

            {/* Inputs based on trackingType */}
            {effectiveTrackingType === 'TIME_SECONDS' && (
              <div className="col-span-5 flex items-center gap-1.5">
                <input
                  type="number"
                  value={set.durationSeconds ?? set.reps ?? 45}
                  onChange={(e) => onUpdateSet(exercise.id, set.id, 'durationSeconds', parseInt(e.target.value, 10) || 0)}
                  disabled={set.completed}
                  className="w-full h-8 bg-zinc-950/80 border border-zinc-800 focus:border-cyan-500 text-center rounded text-xs font-bold text-white outline-none disabled:opacity-50 disabled:bg-transparent"
                />
                <span className="text-[10px] text-zinc-500 font-mono">sec</span>
              </div>
            )}

            {effectiveTrackingType === 'REPS_ONLY' && (
              <div className="col-span-5 flex items-center gap-1.5">
                <input
                  type="number"
                  value={set.reps || ''}
                  onChange={(e) => onUpdateSet(exercise.id, set.id, 'reps', parseInt(e.target.value, 10) || 0)}
                  disabled={set.completed}
                  className="w-full h-8 bg-zinc-950/80 border border-zinc-800 focus:border-cyan-500 text-center rounded text-xs font-bold text-white outline-none disabled:opacity-50 disabled:bg-transparent"
                />
                <span className="text-[10px] text-zinc-500 font-mono">reps</span>
              </div>
            )}

            {effectiveTrackingType === 'REPS_RESISTANCE' && (
              <div className="col-span-5 grid grid-cols-2 gap-1">
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={set.resistanceLevel || 'Medium'}
                    onChange={(e) => onUpdateSet(exercise.id, set.id, 'resistanceLevel', e.target.value)}
                    disabled={set.completed}
                    placeholder="Band"
                    className="w-full h-8 bg-zinc-950/80 border border-zinc-800 focus:border-cyan-500 text-center rounded text-xs font-bold text-white outline-none disabled:opacity-50 disabled:bg-transparent"
                  />
                  <span className="text-[10px] text-zinc-500">res</span>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={set.reps || ''}
                    onChange={(e) => onUpdateSet(exercise.id, set.id, 'reps', parseInt(e.target.value, 10) || 0)}
                    disabled={set.completed}
                    className="w-full h-8 bg-zinc-950/80 border border-zinc-800 focus:border-cyan-500 text-center rounded text-xs font-bold text-white outline-none disabled:opacity-50 disabled:bg-transparent"
                  />
                  <span className="text-[10px] text-zinc-500 font-mono">reps</span>
                </div>
              </div>
            )}

            {effectiveTrackingType === 'WEIGHT_AND_REPS' && (
              <div className="col-span-5 grid grid-cols-2 gap-1">
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={set.weightKg ?? 0}
                    onChange={(e) => onUpdateSet(exercise.id, set.id, 'weightKg', parseFloat(e.target.value) || 0)}
                    disabled={set.completed}
                    className="w-full h-8 bg-zinc-950/80 border border-zinc-800 focus:border-cyan-500 text-center rounded text-xs font-bold text-white outline-none disabled:opacity-50 disabled:bg-transparent"
                  />
                  <span className="text-[10px] text-zinc-500 font-mono">kg</span>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={set.reps || ''}
                    onChange={(e) => onUpdateSet(exercise.id, set.id, 'reps', parseInt(e.target.value, 10) || 0)}
                    disabled={set.completed}
                    className="w-full h-8 bg-zinc-950/80 border border-zinc-800 focus:border-cyan-500 text-center rounded text-xs font-bold text-white outline-none disabled:opacity-50 disabled:bg-transparent"
                  />
                  <span className="text-[10px] text-zinc-500 font-mono">reps</span>
                </div>
              </div>
            )}

            {/* Delete set button */}
            <div className="col-span-1 flex justify-center">
              <button
                onClick={() => onDeleteSet(exercise.id, set.id)}
                className="text-zinc-700 hover:text-red-400 p-1 rounded hover:bg-zinc-900 cursor-pointer"
                title="Remove set"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>

            {/* Set action & verification status */}
            <div className="col-span-4 flex items-center justify-end gap-2">
              {set.completed ? (
                <div className="flex items-center gap-1.5">
                  {set.verification === 'VERIFIED' || set.completionMethod === 'CAMERA' ? (
                    <span 
                      className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-400"
                      title="Verified by optical pose tracking"
                    >
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      <span>VERIFIED</span>
                    </span>
                  ) : (
                    <span 
                      className="inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-zinc-800/80 border border-zinc-700 text-zinc-300"
                      title="Self-reported completion"
                    >
                      <ClipboardPen className="w-3 h-3 text-zinc-400" />
                      <span>SELF-REPORTED</span>
                    </span>
                  )}
                  <button
                    onClick={() => onToggleSet(exercise.id, set.id)}
                    className="p-1 text-zinc-500 hover:text-zinc-300 text-[10px] font-mono hover:underline cursor-pointer"
                    title="Re-open set"
                  >
                    Reset
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => onToggleSet(exercise.id, set.id)}
                  className="px-2.5 py-1 text-[11px] font-bold font-mono rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:border-cyan-500/50 flex items-center gap-1 transition-all cursor-pointer shadow-sm active:scale-95"
                  title="Explicitly log this set as completed (Self-Reported)"
                >
                  <Check className="w-3 h-3 stroke-[3]" />
                  <span>Log Set</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>


      {/* Card Actions */}
      <button
        onClick={() => onAddSet(exercise.id)}
        className="w-full border border-dashed border-zinc-800 hover:border-zinc-700 text-[11px] font-semibold text-zinc-400 hover:text-zinc-200 py-2 rounded-lg bg-zinc-900/10 hover:bg-zinc-900/30 transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer uppercase"
      >
        <Plus className="w-3.5 h-3.5" /> Add Set
      </button>
    </Card>
  );
};
