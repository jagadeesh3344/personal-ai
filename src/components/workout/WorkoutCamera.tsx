import React, { useState, useRef, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Camera, CameraOff, Sparkles, ArrowLeft, Plus, Check } from 'lucide-react';
import { WorkoutExercise } from '../../types';

interface WorkoutCameraProps {
  exercise: WorkoutExercise | null;
  onLogCompletedReps: (exerciseId: string, reps: number) => void;
  onClose: () => void;
}

export const WorkoutCamera: React.FC<WorkoutCameraProps> = ({
  exercise,
  onLogCompletedReps,
  onClose
}) => {
  const [hasCamera, setHasCamera] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [repCount, setRepCount] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    async function initCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
          audio: false
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(e => console.error(e));
        }
        setHasCamera(true);
      } catch (err: any) {
        console.warn('Camera access not granted or unavailable:', err);
        setStreamError('Camera unavailable or permission denied.');
        setHasCamera(false);
      }
    }

    initCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const handleFinishSet = () => {
    if (exercise && repCount > 0) {
      onLogCompletedReps(exercise.id, repCount);
      setRepCount(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col justify-between p-4 md:p-8 animate-fade-in">
      {/* Top Bar */}
      <div className="flex items-center justify-between bg-zinc-950/80 p-4 rounded-xl border border-zinc-900">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" /> Exit Camera View
        </button>
        <div className="text-center">
          <h3 className="text-sm font-black text-white uppercase tracking-wide">
            {exercise ? exercise.name : 'Workout Exercise'}
          </h3>
          <p className="text-[10px] text-cyan-400 font-mono">
            TARGET: {exercise?.targetReps || '3x10'}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-mono bg-cyan-500/10 text-cyan-400 px-2.5 py-1 rounded border border-cyan-500/20">
          <Camera className="w-3.5 h-3.5" />
          <span>OPTICAL SENSOR</span>
        </div>
      </div>

      {/* Center Camera Area */}
      <div className="flex-1 my-4 flex items-center justify-center relative overflow-hidden rounded-2xl bg-zinc-950 border border-zinc-900">
        {hasCamera ? (
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full h-full object-cover mirror max-w-3xl rounded-2xl"
          />
        ) : (
          <div className="text-center p-6 space-y-3">
            <CameraOff className="w-12 h-12 text-zinc-600 mx-auto" />
            <p className="text-xs text-zinc-400">{streamError || 'Connecting optical sensor...'}</p>
          </div>
        )}

        {/* HUD Overlay Banner */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
          <div className="bg-zinc-950/80 backdrop-blur border border-zinc-850 p-3 rounded-xl">
            <div className="text-[9px] text-zinc-500 font-mono uppercase font-bold">SYSTEM STATUS</div>
            <div className="text-xs font-bold text-cyan-400 flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              Live Camera Feed Active
            </div>
            <div className="text-[10px] text-zinc-400 mt-1 max-w-xs leading-relaxed">
              Pose estimation pipeline initializing. Position full body in frame.
            </div>
          </div>

          <div className="bg-zinc-950/90 backdrop-blur border border-zinc-850 px-6 py-4 rounded-xl text-center">
            <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold block">REPETITIONS</span>
            <span className="text-4xl font-black text-white font-mono">{repCount}</span>
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="bg-zinc-950/90 p-4 rounded-xl border border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-zinc-400">
          {exercise?.notes ? `Form Cue: ${exercise.notes}` : 'Keep movement tempo controlled.'}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={() => setRepCount(c => c + 1)}
            className="flex-1 sm:flex-initial text-xs uppercase tracking-wider"
          >
            <Plus className="w-4 h-4 mr-1.5" /> +1 Rep
          </Button>

          <Button
            variant="primary"
            onClick={handleFinishSet}
            disabled={repCount === 0}
            className="flex-1 sm:flex-initial text-xs uppercase tracking-wider font-bold"
          >
            <Check className="w-4 h-4 mr-1.5" /> Log Completed Set
          </Button>
        </div>
      </div>
    </div>
  );
};
