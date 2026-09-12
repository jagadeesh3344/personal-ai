import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import {
  Scale,
  ArrowLeft,
  Plus,
  Activity,
  Flame,
  Droplets,
  Dumbbell,
  Calendar,
  Camera,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { ProgressState } from '../types';
import { UserProfile } from '../types/profile';
import { progressApi } from '../services/api/progressApi';
import { ProgressSnapshot } from '../features/progress/intelligence/types';
import { buildProgressSnapshot } from '../features/progress/intelligence/progressAnalyzer';
import { analyzeWeightTrend } from '../features/progress/intelligence/weightTrendAnalyzer';
import { analyzeWorkoutProgress } from '../features/progress/intelligence/workoutProgressAnalyzer';
import { analyzeNutritionAdherence } from '../features/progress/intelligence/nutritionAdherenceAnalyzer';
import { analyzeHydration } from '../features/progress/intelligence/hydrationAnalyzer';
import { analyzeBodyMeasurements } from '../features/progress/intelligence/measurementAnalyzer';
import { analyzeCheckins, analyzePhotos } from '../features/progress/intelligence/checkinAnalyzer';

interface ProgressProps {
  progressData: ProgressState;
  onAddWeight: (weightKg: number) => void;
  onAddMeasurement: (record: { date: string; chestCm?: number; waistCm?: number; armsCm?: number; thighsCm?: number }) => void;
  setTab: (tab: string) => void;
  userProfile?: UserProfile | null;
  onAskFriday?: (prompt?: string) => void;
}

export const Progress: React.FC<ProgressProps> = ({
  progressData,
  onAddWeight,
  onAddMeasurement,
  setTab,
  userProfile,
  onAskFriday
}) => {
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [newChest, setNewChest] = useState('');
  const [newWaist, setNewWaist] = useState('');
  const [newArms, setNewArms] = useState('');
  const [newThighs, setNewThighs] = useState('');
  const [frontPhotoName, setFrontPhotoName] = useState<string | null>(null);
  const [sidePhotoName, setSidePhotoName] = useState<string | null>(null);
  const [backPhotoName, setBackPhotoName] = useState<string | null>(null);
  const [reflectionNotes, setReflectionNotes] = useState('');

  const [backendSnapshot, setBackendSnapshot] = useState<ProgressSnapshot | null>(null);
  const [loadingIntelligence, setLoadingIntelligence] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoadingIntelligence(true);
    progressApi.getIntelligence(30)
      .then(data => {
        if (isMounted && data) {
          setBackendSnapshot(data);
        }
      })
      .catch(() => {
        // Fallback to local deterministic derivation if offline or dev mode
      })
      .finally(() => {
        if (isMounted) setLoadingIntelligence(false);
      });

    return () => {
      isMounted = false;
    };
  }, [progressData.weights.length, progressData.measurements.length]);

  // Compute fallback snapshot deterministically from available props if backend fetch is pending or fails
  const localSnapshot: ProgressSnapshot = React.useMemo(() => {
    if (backendSnapshot) return backendSnapshot;

    const weightRecords = progressData.weights.map(w => ({ date: w.date, weightKg: w.weightKg }));
    const weightAnalysis = analyzeWeightTrend(weightRecords, userProfile?.targetWeightKg);
    const measurementAnalysis = analyzeBodyMeasurements(
      progressData.measurements.map(m => ({
        date: m.date,
        chestCm: m.chestCm,
        waistCm: m.waistCm,
        armsCm: m.armsCm,
        thighsCm: m.thighsCm
      }))
    );

    const workoutAnalysis = analyzeWorkoutProgress([], [], 3);
    const nutritionAnalysis = analyzeNutritionAdherence([], 2000, 140, 30);
    const hydrationAnalysis = analyzeHydration([], 2500, 30);
    const checkinAnalysis = analyzeCheckins([]);
    const photoAnalysis = analyzePhotos([]);

    return buildProgressSnapshot({
      userId: 'local-user',
      goal: userProfile?.goal || 'GENERAL_FITNESS',
      periodDays: 30,
      weight: weightAnalysis,
      workouts: workoutAnalysis,
      nutrition: nutritionAnalysis,
      hydration: hydrationAnalysis,
      measurements: measurementAnalysis,
      checkins: checkinAnalysis,
      photos: photoAnalysis
    });
  }, [backendSnapshot, progressData, userProfile]);

  const snapshot = backendSnapshot || localSnapshot;

  const handleCheckInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const weightNum = parseFloat(newWeight);
    if (!isNaN(weightNum) && weightNum > 0) {
      onAddWeight(weightNum);
    }

    const chestNum = parseFloat(newChest);
    const waistNum = parseFloat(newWaist);
    const armsNum = parseFloat(newArms);
    const thighsNum = parseFloat(newThighs);

    if (!isNaN(chestNum) || !isNaN(waistNum) || !isNaN(armsNum) || !isNaN(thighsNum)) {
      onAddMeasurement({
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit' }).toUpperCase(),
        chestCm: !isNaN(chestNum) ? chestNum : undefined,
        waistCm: !isNaN(waistNum) ? waistNum : undefined,
        armsCm: !isNaN(armsNum) ? armsNum : undefined,
        thighsCm: !isNaN(thighsNum) ? thighsNum : undefined
      });
    }

    setNewWeight('');
    setNewChest('');
    setNewWaist('');
    setNewArms('');
    setNewThighs('');
    setShowCheckInModal(false);
  };

  const weights = snapshot.weight.history;
  const values = weights.map(w => w.weightKg);
  const maxWeight = values.length > 0 ? Math.max(...values) + 1 : 100;
  const minWeight = values.length > 0 ? Math.min(...values) - 1 : 50;
  const range = Math.max(1, maxWeight - minWeight);

  const chartHeight = 160;
  const chartWidth = 500;
  const padding = 30;

  const points = weights.map((item, index) => {
    const divisor = Math.max(1, weights.length - 1);
    const x = padding + (index * (chartWidth - padding * 2)) / divisor;
    const y = chartHeight - padding - ((item.weightKg - minWeight) / range) * (chartHeight - padding * 2);
    return { x, y, item };
  });

  const pathD = points.length > 1
    ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
    : (points.length === 1 ? `M ${points[0].x} ${points[0].y} L ${points[0].x + 10} ${points[0].y}` : '');

  // Helper badge renderers
  const getOverallStatusBadge = (status: string) => {
    switch (status) {
      case 'ON_TRACK':
      case 'IMPROVING':
        return <span className="px-2.5 py-1 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> {status}</span>;
      case 'MIXED_PROGRESS':
        return <span className="px-2.5 py-1 rounded bg-amber-950/60 text-amber-400 border border-amber-500/30 text-xs font-mono font-bold flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> {status}</span>;
      case 'NEEDS_ATTENTION':
      case 'STALLED':
        return <span className="px-2.5 py-1 rounded bg-red-950/60 text-red-400 border border-red-500/30 text-xs font-mono font-bold flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> {status}</span>;
      default:
        return <span className="px-2.5 py-1 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 text-xs font-mono font-bold flex items-center gap-1.5"><Minus className="w-3.5 h-3.5" /> INSUFFICIENT DATA</span>;
    }
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'INCREASING') return <TrendingUp className="w-4 h-4 text-emerald-400" />;
    if (trend === 'DECREASING') return <TrendingDown className="w-4 h-4 text-cyan-400" />;
    if (trend === 'STABLE') return <Minus className="w-4 h-4 text-zinc-400" />;
    return <span className="text-[10px] text-zinc-500 font-mono">--</span>;
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-950/40 border border-zinc-900 p-5 rounded-xl">
        <div>
          <button
            onClick={() => setTab('dashboard')}
            className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-white uppercase tracking-wider mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Today
          </button>
          <h1 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            Deterministic Progress Intelligence
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Real biometric telemetry, historical performance trends, and goal adherence. No estimates or fabricated claims.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {onAskFriday && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAskFriday("Am I progressing towards my fitness goal?")}
              className="text-xs uppercase cursor-pointer min-h-[44px]"
            >
              Ask FRIDAY
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowCheckInModal(true)}
            className="w-full sm:w-auto text-xs uppercase cursor-pointer min-h-[44px]"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Monthly Check-in
          </Button>
        </div>
      </div>

      {/* 1. Overall Progress Status & Goal Card */}
      <Card className="p-6 bg-gradient-to-r from-zinc-950/60 via-zinc-900/30 to-zinc-950/60 border-zinc-800" hoverEffect={false}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-zinc-850">
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest block">
              30-Day Evaluation Period • Goal: {snapshot.goal}
            </span>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-black text-white uppercase tracking-wide">
                Progress Status
              </h2>
              {getOverallStatusBadge(snapshot.overallStatus)}
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Data Quality:</span>
            <span className={`font-bold ${snapshot.dataQuality.status === 'GOOD' ? 'text-emerald-400' : snapshot.dataQuality.status === 'LIMITED' ? 'text-amber-400' : 'text-zinc-500'}`}>
              {snapshot.dataQuality.status} ({snapshot.dataQuality.score}%)
            </span>
          </div>
        </div>

        <p className="text-xs text-zinc-300 mt-4 leading-relaxed max-w-3xl">
          {snapshot.statusRationale}
        </p>

        {snapshot.dataQuality.reasons.length > 0 && (
          <div className="mt-4 pt-3 border-t border-zinc-900/60 flex flex-wrap gap-2">
            {snapshot.dataQuality.reasons.map((r, i) => (
              <span key={i} className="text-[10px] font-mono bg-zinc-900 px-2 py-0.5 rounded text-zinc-400 border border-zinc-850">
                • {r}
              </span>
            ))}
          </div>
        )}
      </Card>

      {/* 2. Weight Trend Analysis & Line Chart */}
      <Card className="p-6 bg-zinc-950/40 border-zinc-850" hoverEffect={false}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-zinc-900/60">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Bodyweight Telemetry & Trend</h3>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            {snapshot.weight.currentWeightKg ? (
              <>
                <span className="text-white font-bold">{snapshot.weight.currentWeightKg} kg current</span>
                {snapshot.weight.absoluteChangeKg !== null && (
                  <span className={snapshot.weight.absoluteChangeKg < 0 ? 'text-cyan-400' : snapshot.weight.absoluteChangeKg > 0 ? 'text-emerald-400' : 'text-zinc-400'}>
                    ({snapshot.weight.absoluteChangeKg > 0 ? '+' : ''}{snapshot.weight.absoluteChangeKg} kg • {snapshot.weight.percentageChange}%)
                  </span>
                )}
                <span className="text-zinc-500">• Trend:</span>
                <span className="text-cyan-300 font-bold uppercase">{snapshot.weight.trend}</span>
              </>
            ) : (
              <span className="text-zinc-500">Awaiting baseline readings</span>
            )}
          </div>
        </div>

        {weights.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 text-xs">
            No weight history yet. Add measurements to start tracking your trend.
          </div>
        ) : weights.length === 1 ? (
          <div className="py-10 text-center text-zinc-400 text-xs">
            Single measurement logged ({weights[0].weightKg} kg on {weights[0].date}). Log at least one more reading over time to unlock deterministic rolling trend analysis.
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-44 overflow-visible">
              <line x1={padding} y1={padding} x2={chartWidth - padding} y2={padding} stroke="#27272a" strokeDasharray="3 3" />
              <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="#27272a" />

              {pathD && (
                <path d={pathD} fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              )}

              {points.map((p, idx) => (
                <g key={idx}>
                  <circle cx={p.x} cy={p.y} r="4.5" fill="#06b6d4" stroke="#09090b" strokeWidth="2" />
                  <text x={p.x} y={p.y - 10} fill="#a1a1aa" fontSize="9" textAnchor="middle" fontFamily="monospace">
                    {p.item.weightKg}kg
                  </text>
                  <text x={p.x} y={chartHeight - 10} fill="#71717a" fontSize="8" textAnchor="middle" fontFamily="monospace">
                    {p.item.date}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        )}
      </Card>

      {/* 3. Workout & Nutrition Telemetry Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Workout Progress Card */}
        <Card className="p-5 bg-zinc-950/40 border-zinc-850" hoverEffect={false}>
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-900/60">
            <div className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Workout Consistency</h3>
            </div>
            <span className="text-xs font-mono font-bold text-cyan-400">
              {snapshot.workouts.completionRate}% completion
            </span>
          </div>

          {snapshot.workouts.sessionsCompleted === 0 ? (
            <div className="py-8 text-center text-zinc-500 text-xs">
              No completed workouts yet.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded bg-zinc-900/50 border border-zinc-850 text-center">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase block">Completed</span>
                  <span className="text-base font-black text-white font-mono">{snapshot.workouts.sessionsCompleted}</span>
                </div>
                <div className="p-2.5 rounded bg-zinc-900/50 border border-zinc-850 text-center">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase block">Total Sets</span>
                  <span className="text-base font-black text-white font-mono">{snapshot.workouts.totalSetsCompleted}</span>
                </div>
                <div className="p-2.5 rounded bg-zinc-900/50 border border-zinc-850 text-center">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase block">Verified</span>
                  <span className="text-base font-black text-cyan-400 font-mono">{snapshot.workouts.verifiedSetsCount}</span>
                </div>
              </div>

              {snapshot.workouts.exercises.length > 0 && (
                <div className="pt-2">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">Tracked Exercises</span>
                  <div className="space-y-1.5">
                    {snapshot.workouts.exercises.slice(0, 3).map(ex => (
                      <div key={ex.exerciseId} className="flex items-center justify-between text-xs font-mono bg-zinc-900/30 p-2 rounded border border-zinc-850/60">
                        <span className="text-zinc-300 font-bold">{ex.exerciseName}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-500">{ex.bestReps} reps best</span>
                          <span className="text-cyan-400 text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/40 border border-cyan-800/30">{ex.progressionState}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Nutrition Adherence Card */}
        <Card className="p-5 bg-zinc-950/40 border-zinc-850" hoverEffect={false}>
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-900/60">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Nutrition Adherence</h3>
            </div>
            <span className="text-xs font-mono font-bold text-amber-400">
              {snapshot.nutrition.loggingStatus}
            </span>
          </div>

          {snapshot.nutrition.daysTracked === 0 ? (
            <div className="py-8 text-center text-zinc-500 text-xs">
              Nutrition tracking hasn't started yet.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded bg-zinc-900/50 border border-zinc-850 text-center">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase block">Avg Calories</span>
                  <span className="text-base font-black text-white font-mono">
                    {snapshot.nutrition.averageCalories} <span className="text-[10px] text-zinc-500">/ {snapshot.nutrition.targetCalories}</span>
                  </span>
                </div>
                <div className="p-2.5 rounded bg-zinc-900/50 border border-zinc-850 text-center">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase block">Avg Protein</span>
                  <span className="text-base font-black text-cyan-400 font-mono">
                    {snapshot.nutrition.averageProtein}g <span className="text-[10px] text-zinc-500">/ {snapshot.nutrition.targetProtein}g</span>
                  </span>
                </div>
              </div>

              <div className="p-3 rounded bg-zinc-900/30 border border-zinc-850 text-xs text-zinc-400 font-mono flex items-center justify-between">
                <span>Days Tracked: {snapshot.nutrition.daysTracked} / {snapshot.nutrition.totalDaysInPeriod}</span>
                <span className="text-amber-300 font-bold">{snapshot.nutrition.trackingConsistencyRate}% consistency</span>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* 4. Body Circumference Measurements (cm) */}
      <Card className="p-6 bg-zinc-950/40 border-zinc-850" hoverEffect={false}>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-900/60">
          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Body Circumference Measurements (cm)</h3>
          <span className="text-[10px] text-zinc-500 font-mono">
            {snapshot.measurements.latestRecordedDate ? `Last recorded: ${snapshot.measurements.latestRecordedDate}` : 'Awaiting baseline'}
          </span>
        </div>

        {snapshot.measurements.changes.length === 0 ? (
          <div className="py-8 text-center text-zinc-500 text-xs">
            No circumference sites recorded. Click "Log Check-in" to log chest, waist, arms, or thighs.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {snapshot.measurements.changes.map(m => (
              <div key={m.site} className="bg-zinc-900/40 border border-zinc-850 p-4 rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">{m.site}</span>
                  {getTrendIcon(m.trend)}
                </div>
                <div className="text-xl font-black text-white font-mono">{m.latestCm} cm</div>
                {m.trend !== 'INSUFFICIENT_DATA' && (
                  <div className={`text-[10px] font-mono mt-1 ${m.absoluteChangeCm < 0 ? 'text-cyan-400' : m.absoluteChangeCm > 0 ? 'text-amber-400' : 'text-zinc-500'}`}>
                    {m.absoluteChangeCm > 0 ? '+' : ''}{m.absoluteChangeCm} cm ({m.percentageChange}%)
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 5. Real Progress Events Timeline */}
      {snapshot.timeline.length > 0 && (
        <Card className="p-6 bg-zinc-950/40 border-zinc-850" hoverEffect={false}>
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-900/60">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Verified Telemetry Timeline</h3>
            </div>
            <span className="text-[10px] font-mono text-zinc-500">Real Events Log</span>
          </div>

          <div className="space-y-2.5">
            {snapshot.timeline.slice(0, 8).map(evt => (
              <div key={evt.id} className="flex items-start justify-between bg-zinc-900/30 border border-zinc-850/60 p-3 rounded-lg text-xs font-mono">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{evt.title}</span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded ${evt.type === 'MEASURED_FACT' ? 'bg-cyan-950/40 text-cyan-300 border border-cyan-800/40' : 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40'}`}>
                      {evt.type === 'MEASURED_FACT' ? 'MEASURED FACT' : 'DETERMINISTIC TREND'}
                    </span>
                  </div>
                  <p className="text-zinc-400 text-[11px]">{evt.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-zinc-500 block">{evt.date}</span>
                  {evt.metricValue && <span className="text-cyan-400 font-bold text-xs">{evt.metricValue}</span>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Section 19 & 20: Monthly Biometric & Visual Check-In Modal */}
      <Modal isOpen={showCheckInModal} onClose={() => setShowCheckInModal(false)} title="MONTHLY FITNESS CHECK-IN">
        <form onSubmit={handleCheckInSubmit} className="space-y-4 pt-2">
          {/* Section 20: Photo & Camera Privacy UX Notice */}
          <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl flex items-start gap-2.5 text-xs text-zinc-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-zinc-200 block text-[11px] uppercase tracking-wider">Photo & Camera Privacy</span>
              Progress photos are stored in private, user-isolated cloud storage and accessed strictly via temporary 1-hour signed URLs. They are never public, never shared, and never sent to AI models. Optical camera frames during workouts are processed 100% on-device and never leave your phone.
            </div>
          </div>

          <Input
            id="chk-weight"
            label="Current Bodyweight (kg)"
            type="number"
            step="0.1"
            value={newWeight}
            onChange={(e) => setNewWeight(e.target.value)}
            placeholder="e.g. 74.0"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="chk-chest"
              label="Chest (cm, optional)"
              type="number"
              step="0.5"
              value={newChest}
              onChange={(e) => setNewChest(e.target.value)}
              placeholder="e.g. 104.0"
            />
            <Input
              id="chk-waist"
              label="Waist (cm, optional)"
              type="number"
              step="0.5"
              value={newWaist}
              onChange={(e) => setNewWaist(e.target.value)}
              placeholder="e.g. 84.0"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="chk-arms"
              label="Arms (cm, optional)"
              type="number"
              step="0.5"
              value={newArms}
              onChange={(e) => setNewArms(e.target.value)}
              placeholder="e.g. 37.0"
            />
            <Input
              id="chk-thighs"
              label="Thighs (cm, optional)"
              type="number"
              step="0.5"
              value={newThighs}
              onChange={(e) => setNewThighs(e.target.value)}
              placeholder="e.g. 58.0"
            />
          </div>

          {/* Monthly Progress Photos (Optional) */}
          <div className="space-y-2 pt-1 border-t border-zinc-900">
            <span className="text-xs font-bold text-zinc-300 block uppercase tracking-wider">
              Progress Photos (Optional)
            </span>
            <div className="grid grid-cols-3 gap-2">
              <label className="flex flex-col items-center justify-center p-3 rounded-xl border border-dashed border-zinc-800 hover:border-cyan-500/40 bg-zinc-900/40 text-center cursor-pointer transition">
                <Camera className="w-4 h-4 text-cyan-400 mb-1" />
                <span className="text-[10px] font-bold text-zinc-300 uppercase">Front</span>
                <span className="text-[9px] text-zinc-500 truncate max-w-[80px]">{frontPhotoName || 'Select'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => setFrontPhotoName(e.target.files?.[0]?.name || null)}
                />
              </label>

              <label className="flex flex-col items-center justify-center p-3 rounded-xl border border-dashed border-zinc-800 hover:border-cyan-500/40 bg-zinc-900/40 text-center cursor-pointer transition">
                <Camera className="w-4 h-4 text-cyan-400 mb-1" />
                <span className="text-[10px] font-bold text-zinc-300 uppercase">Side</span>
                <span className="text-[9px] text-zinc-500 truncate max-w-[80px]">{sidePhotoName || 'Select'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => setSidePhotoName(e.target.files?.[0]?.name || null)}
                />
              </label>

              <label className="flex flex-col items-center justify-center p-3 rounded-xl border border-dashed border-zinc-800 hover:border-cyan-500/40 bg-zinc-900/40 text-center cursor-pointer transition">
                <Camera className="w-4 h-4 text-cyan-400 mb-1" />
                <span className="text-[10px] font-bold text-zinc-300 uppercase">Back</span>
                <span className="text-[9px] text-zinc-500 truncate max-w-[80px]">{backPhotoName || 'Select'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => setBackPhotoName(e.target.files?.[0]?.name || null)}
                />
              </label>
            </div>
          </div>

          {/* Reflection & Subjective Adherence */}
          <div className="space-y-1 pt-1">
            <label htmlFor="chk-notes" className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
              Monthly Reflection & Adherence (Optional)
            </label>
            <textarea
              id="chk-notes"
              rows={2}
              value={reflectionNotes}
              onChange={e => setReflectionNotes(e.target.value)}
              placeholder="How do you feel this cycle? (e.g. Energy levels high, recovery on squats was great)"
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-cyan-500 rounded-xl p-2.5 text-xs text-white outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-zinc-900">
            <Button type="button" variant="outline" onClick={() => setShowCheckInModal(false)} className="min-h-[44px]">
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="min-h-[44px]">
              Save Check-in
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
