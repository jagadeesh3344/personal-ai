import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { 
  Camera, 
  CameraOff, 
  ArrowLeft, 
  Check, 
  Pause, 
  Play, 
  SkipForward, 
  ShieldAlert, 
  Activity, 
  Volume2, 
  VolumeX,
  ExternalLink,
  BookOpen,
  ShieldCheck
} from 'lucide-react';
import { WorkoutExercise } from '../../types';
import { UserProfile } from '../../types/profile';
import { MediaPipePoseProvider } from '../../features/camera/MediaPipePoseProvider';
import { resolveExerciseAnalyzer } from '../../features/camera/analyzers/analyzerRegistry';
import { ExerciseAnalyzer } from '../../features/camera/analyzers/ExerciseAnalyzer';
import { FormQuality, RepPhase } from '../../features/camera/types';
import { EXERCISES } from '../../features/workouts/data/exercises';

interface WorkoutCameraProps {
  exercise: WorkoutExercise | null;
  userProfile?: UserProfile | null;
  currentSetIndex?: number;
  totalSets?: number;
  onLogCompletedReps: (exerciseId: string, reps: number, formSummary?: string) => void;
  onSkipExercise?: () => void;
  onLogManually?: () => void;
  onUseVoice?: () => void;
  onClose: () => void;
}

export const WorkoutCamera: React.FC<WorkoutCameraProps> = ({
  exercise,
  userProfile,
  currentSetIndex = 1,
  totalSets = 3,
  onLogCompletedReps,
  onSkipExercise,
  onLogManually,
  onUseVoice,
  onClose
}) => {
  // Educational briefing state
  const [showTutorial, setShowTutorial] = useState(true);

  // Video & Canvas Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const providerRef = useRef<MediaPipePoseProvider | null>(null);
  const analyzerRef = useRef<ExerciseAnalyzer | null>(null);

  // Vision State
  const [cameraActive, setCameraActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [equipmentRestriction, setEquipmentRestriction] = useState<string | null>(null);
  const [retryTrigger, setRetryTrigger] = useState(0);

  // Reps & Form HUD State
  const [repCount, setRepCount] = useState(0);
  const [phase, setPhase] = useState<RepPhase>('IDLE');
  const [confidence, setConfidence] = useState(0);
  const [formQuality, setFormQuality] = useState<FormQuality>('GOOD');
  const [coachCue, setCoachCue] = useState('Position your body in view to begin.');
  const [audioFeedbackEnabled, setAudioFeedbackEnabled] = useState(true);

  // Retrieve rich educational details for active exercise
  const exerciseMeta = exercise ? EXERCISES.find(e => e.id === exercise.exerciseId || e.name === exercise.name) : null;

  // Target reps extraction (e.g. "10-12 reps" -> 10)
  const targetRepsNum = (() => {
    if (!exercise?.targetReps) return 10;
    const match = exercise.targetReps.match(/\d+/);
    return match ? parseInt(match[0], 10) : 10;
  })();

  // 1. Initialize analyzer with equipment constraint check
  useEffect(() => {
    if (!exercise) return;

    const resolution = resolveExerciseAnalyzer(exercise.id, exercise.name, userProfile);
    if (!resolution.allowed || !resolution.analyzer) {
      setEquipmentRestriction(resolution.reason || 'Exercise not eligible for optical tracking.');
      analyzerRef.current = null;
    } else {
      setEquipmentRestriction(null);
      analyzerRef.current = resolution.analyzer;
      analyzerRef.current.reset();
    }
  }, [exercise, userProfile]);

  // 2. Audio Coaching synthesis helper
  const speakCue = useCallback((text: string) => {
    if (!audioFeedbackEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.1;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Audio speech failed gracefully
    }
  }, [audioFeedbackEnabled]);

  // 3. Initialize MediaPipe camera provider
  useEffect(() => {
    if (equipmentRestriction) return;

    const provider = new MediaPipePoseProvider();
    providerRef.current = provider;

    async function startTracking() {
      if (!videoRef.current || !canvasRef.current) return;

      try {
        await provider.start(
          videoRef.current,
          (result) => {
            if (isPaused) return;

            setConfidence(result.confidence);

            // Draw skeleton overlay
            if (canvasRef.current) {
              provider.drawSkeleton(canvasRef.current, result.landmarks, formQuality);
            }

            // Execute Analyzer
            if (analyzerRef.current) {
              const output = analyzerRef.current.process(result.landmarks, result.confidence);
              setRepCount(output.repCount);
              setPhase(output.phase);
              setFormQuality(output.form.quality);
              setCoachCue(output.form.cue);

              // If rep was just completed, provide audio reinforcement
              if (output.isRepCompleted) {
                speakCue(`Rep ${output.repCount}. ${output.form.cue}`);
              }
            }
          },
          (err) => {
            setErrorMessage(err.message);
            setCameraActive(false);
          },
          { width: 640, height: 480, minDetectionConfidence: 0.60 }
        );

        setCameraActive(true);
        setErrorMessage(null);
      } catch (err: any) {
        setErrorMessage(err.message || 'Unable to open camera.');
        setCameraActive(false);
      }
    }

    startTracking();

    return () => {
      provider.stop();
      providerRef.current = null;
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [equipmentRestriction, isPaused, formQuality, speakCue, retryTrigger]);

  const handleFinishSet = () => {
    if (exercise && repCount > 0) {
      speakCue(`Great set! ${repCount} reps logged.`);
      onLogCompletedReps(exercise.id, repCount, `Form quality: ${formQuality}`);
    }
  };

  const togglePause = () => {
    setIsPaused(prev => !prev);
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/95 backdrop-blur-md flex flex-col justify-between p-4 md:p-6 animate-fade-in text-white font-sans">
      {/* Top HUD Header */}
      <div className="flex items-center justify-between bg-zinc-900/80 border border-zinc-800 p-4 rounded-2xl backdrop-blur">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white uppercase tracking-wider transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Exit Camera View
        </button>

        <div className="text-center">
          <div className="text-[10px] text-cyan-400 font-mono tracking-wider uppercase font-bold">
            EXERCISE TRACKER
          </div>
          <h2 className="text-sm md:text-base font-black uppercase text-white tracking-wide">
            {exercise ? exercise.name : 'Active Exercise'}
          </h2>
          <div className="text-xs text-zinc-400 font-mono">
            SET {currentSetIndex} OF {totalSets} • TARGET: {exercise?.targetReps || '10 reps'}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAudioFeedbackEnabled(!audioFeedbackEnabled)}
            className={`p-2 rounded-xl border text-xs transition-all cursor-pointer ${
              audioFeedbackEnabled 
                ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' 
                : 'bg-zinc-800 border-zinc-700 text-zinc-500'
            }`}
            title={audioFeedbackEnabled ? 'Voice cues active' : 'Voice cues muted'}
          >
            {audioFeedbackEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Center Viewport: Either Pre-Camera Briefing or Optical Tracking */}
      <div className="flex-1 my-4 relative flex items-center justify-center overflow-hidden rounded-3xl bg-zinc-950 border border-zinc-850 shadow-2xl">
        {showTutorial ? (
          <div className="max-w-xl w-full p-6 md:p-8 space-y-6 text-left animate-fade-in">
            <div className="flex items-center justify-between border-b border-zinc-850 pb-4">
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-5 h-5 text-cyan-400" />
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
                  Exercise Briefing
                </span>
              </div>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 uppercase">
                Difficulty: {exerciseMeta?.difficulty || 'Standard'}
              </span>
            </div>

            <div>
              <h1 className="text-2xl font-black uppercase text-white tracking-wide">
                {exercise ? exercise.name : 'Target Exercise'}
              </h1>
              <p className="text-xs text-zinc-400 mt-1">
                Target: <span className="text-zinc-200 font-bold">{exercise?.targetReps || '3 sets of 10 reps'}</span>
              </p>
            </div>

            {/* How to do it */}
            <div className="bg-zinc-900/60 border border-zinc-850 p-4 rounded-xl space-y-2">
              <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                How to do it
              </h4>
              <p className="text-xs text-zinc-300 leading-relaxed">
                {exerciseMeta?.instructions || exercise?.notes || 'Maintain controlled tempo, brace your core, and achieve full range of motion.'}
              </p>
            </div>

            {/* Safety notes */}
            {exerciseMeta?.safetyNotes && (
              <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-xl space-y-1">
                <h5 className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> Safety Cue
                </h5>
                <p className="text-xs text-amber-200/90 leading-relaxed">
                  {exerciseMeta.safetyNotes}
                </p>
              </div>
            )}

            {/* Watch Tutorial Link if available */}
            {exerciseMeta?.tutorialUrl && (
              <a
                href={exerciseMeta.tutorialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 underline underline-offset-4"
              >
                <span>Watch reputable exercise tutorial</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <Button
                variant="primary"
                onClick={() => setShowTutorial(false)}
                className="w-full py-3 text-xs uppercase font-bold tracking-wider"
              >
                <Camera className="w-4 h-4 mr-2" /> Start Camera Tracking
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                className="w-full sm:w-auto text-xs uppercase"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : equipmentRestriction ? (
          <div className="text-center p-8 max-w-md space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Equipment Constraint</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">{equipmentRestriction}</p>
            <Button variant="outline" onClick={onClose} className="text-xs">
              Return to Manual Logging
            </Button>
          </div>
        ) : errorMessage ? (
          <div className="text-center p-8 max-w-md space-y-4 bg-zinc-950 border border-zinc-850 rounded-2xl shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <CameraOff className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Camera tracking isn't available right now.</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {errorMessage || 'Camera access was blocked or could not be initialized. You can retry or switch to manual/voice logging.'}
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <Button
                variant="primary"
                onClick={() => {
                  setErrorMessage(null);
                  setRetryTrigger(prev => prev + 1);
                }}
                className="w-full text-xs font-bold uppercase min-h-[44px]"
              >
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (onLogManually) onLogManually();
                  else onClose();
                }}
                className="w-full text-xs font-bold uppercase min-h-[44px]"
              >
                Log Set Manually
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  if (onUseVoice) onUseVoice();
                  else onClose();
                }}
                className="w-full text-xs font-bold uppercase text-cyan-400 hover:text-cyan-300 min-h-[44px]"
              >
                Use Voice
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Mirror Video Feed */}
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-cover max-w-4xl rounded-3xl transform scale-x-[-1]"
            />

            {/* Skeletal Landmarks Canvas Overlay */}
            <canvas
              ref={canvasRef}
              width={640}
              height={480}
              className="absolute inset-0 w-full h-full object-cover max-w-4xl mx-auto rounded-3xl pointer-events-none transform scale-x-[-1]"
            />

            {/* Top Left: Vision Telemetry Pill */}
            <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
              <div className="bg-zinc-950/80 backdrop-blur border border-zinc-800 px-3.5 py-2 rounded-2xl flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  isPaused ? 'bg-amber-400' : confidence >= 0.6 ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                }`} />
                <span className="text-[11px] font-mono font-bold text-zinc-300">
                  {isPaused ? 'PAUSED' : confidence >= 0.6 ? 'POSE TRACKED' : 'ALIGNING BODY...'}
                </span>
                <span className="text-[10px] font-mono text-zinc-500">
                  ({Math.round(confidence * 100)}%)
                </span>
              </div>

              {/* Form Quality Badge */}
              <div className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold uppercase tracking-wider backdrop-blur inline-flex items-center gap-1.5 ${
                formQuality === 'GOOD'
                  ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-400'
                  : formQuality === 'NEEDS_ADJUSTMENT'
                    ? 'bg-amber-950/70 border-amber-500/40 text-amber-400'
                    : 'bg-rose-950/70 border-rose-500/40 text-rose-400'
              }`}>
                <Activity className="w-3.5 h-3.5" />
                <span>FORM: {formQuality.replace('_', ' ')}</span>
              </div>
            </div>

            {/* Top Right: Real-time Rep Counter */}
            <div className="absolute top-4 right-4 bg-zinc-950/90 backdrop-blur border border-zinc-800 px-6 py-4 rounded-2xl text-center shadow-xl pointer-events-none">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold block">
                REPETITIONS
              </span>
              <div className="flex items-baseline justify-center gap-1 mt-1">
                <span className="text-4xl md:text-5xl font-black text-white font-mono">{repCount}</span>
                <span className="text-xs text-zinc-500 font-mono font-bold">/ {targetRepsNum}</span>
              </div>
              <span className="text-[9px] font-mono uppercase text-cyan-400 mt-1 block">
                PHASE: {phase}
              </span>
            </div>

            {/* Center Bottom: FRIDAY Coaching Bubble */}
            <div className="absolute bottom-6 left-6 right-6 flex justify-center pointer-events-none">
              <div className="bg-zinc-950/90 backdrop-blur border border-cyan-500/30 px-5 py-3 rounded-2xl shadow-2xl max-w-lg text-center">
                <div className="text-[10px] font-mono text-cyan-400 uppercase font-bold tracking-wider mb-0.5">
                  FRIDAY COACH
                </div>
                <div className="text-sm font-semibold text-zinc-100 leading-snug">
                  "{coachCue}"
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bottom Controls Bar */}
      <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-2xl backdrop-blur flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={togglePause}
            className="flex-1 sm:flex-initial text-xs uppercase tracking-wider"
          >
            {isPaused ? <Play className="w-4 h-4 mr-1.5" /> : <Pause className="w-4 h-4 mr-1.5" />}
            {isPaused ? 'Resume' : 'Pause'}
          </Button>

          {onSkipExercise && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSkipExercise}
              className="flex-1 sm:flex-initial text-xs uppercase tracking-wider text-zinc-400 hover:text-white"
            >
              <SkipForward className="w-4 h-4 mr-1.5" /> Skip
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <Button
            variant="primary"
            onClick={handleFinishSet}
            disabled={repCount === 0}
            className="w-full sm:w-auto text-xs uppercase font-bold tracking-wider py-2.5 px-6"
          >
            <Check className="w-4 h-4 mr-1.5 stroke-[3]" />
            Finish Set ({repCount} Reps)
          </Button>
        </div>
      </div>
    </div>
  );
};
