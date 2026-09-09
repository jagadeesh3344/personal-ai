import React, { useState, useRef } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { LineChart, Sparkles, Scale, Compass, Activity, ShieldAlert, ArrowLeft, Camera, ShieldCheck, Check, Upload, Trash2 } from 'lucide-react';
import { ProgressMeasurement } from '../types';

interface ProgressProps {
  progressData: ProgressMeasurement;
  setProgressData: React.Dispatch<React.SetStateAction<ProgressMeasurement>>;
  userPhoto?: string | null;
  onUpdatePhoto: (photo: string) => void;
  setTab: (tab: string) => void;
}

export const Progress: React.FC<ProgressProps> = ({
  progressData,
  setProgressData,
  userPhoto,
  onUpdatePhoto,
  setTab
}) => {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  
  // Form states for biometric assessment check-in
  const [newWeight, setNewWeight] = useState('');
  const [newChest, setNewChest] = useState('');
  const [newWaist, setNewWaist] = useState('');
  const [newArms, setNewArms] = useState('');
  const [newThighs, setNewThighs] = useState('');
  const [checkInPhoto, setCheckInPhoto] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handlePhotoFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handlePhotoFile(e.target.files[0]);
    }
  };

  const handlePhotoFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setCheckInPhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCheckInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWeight) return;

    const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit' }).toUpperCase(); // e.g. "SEP 08"

    setProgressData(prev => ({
      ...prev,
      weightHistory: [...prev.weightHistory, { date: dateStr, value: parseFloat(newWeight) }],
      chest: newChest ? [...prev.chest, { date: dateStr, value: parseFloat(newChest) }] : prev.chest,
      waist: newWaist ? [...prev.waist, { date: dateStr, value: parseFloat(newWaist) }] : prev.waist,
      arms: newArms ? [...prev.arms, { date: dateStr, value: parseFloat(newArms) }] : prev.arms,
      thighs: newThighs ? [...prev.thighs, { date: dateStr, value: parseFloat(newThighs) }] : prev.thighs,
    }));

    if (checkInPhoto) {
      onUpdatePhoto(checkInPhoto);
    }

    // Reset fields
    setNewWeight('');
    setNewChest('');
    setNewWaist('');
    setNewArms('');
    setNewThighs('');
    setCheckInPhoto(null);
    setShowCheckInModal(false);
  };

  // Custom SVG line chart calculations
  const weightHistory = progressData.weightHistory;
  const weights = weightHistory.map(w => w.value);
  const maxWeight = Math.max(...weights) + 0.5;
  const minWeight = Math.min(...weights) - 0.5;
  const range = maxWeight - minWeight;

  // Render SVG Dimensions
  const chartHeight = 160;
  const chartWidth = 500;
  const padding = 30;

  // Get SVG coordinate nodes
  const points = weightHistory.map((item, index) => {
    const x = padding + (index * (chartWidth - padding * 2)) / (weightHistory.length - 1);
    const y = chartHeight - padding - ((item.value - minWeight) / range) * (chartHeight - padding * 2);
    return { x, y, item };
  });

  // Build SVG Path curve string
  const pathD = points.length > 0 
    ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
    : '';

  // Build SVG Area path string
  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${chartHeight - padding} L ${points[0].x} ${chartHeight - padding} Z`
    : '';

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
          <h1 className="text-xl font-black text-white uppercase tracking-tight">Your Progress</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Track your weight logs, performance trends, and progress photos.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto shrink-0">
          <Button 
            variant="primary" 
            onClick={() => setShowCheckInModal(true)} 
            className="w-full sm:w-auto text-xs font-bold uppercase tracking-wider h-10"
          >
            <span className="flex items-center gap-2">
              <Camera className="w-4 h-4" />
              LOG WEIGHT & PHOTO
            </span>
          </Button>

          <div className="flex items-center justify-center gap-2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-4 py-2 rounded-lg text-[10px] font-bold tracking-widest uppercase h-10 select-none">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Analysis Calibrated</span>
          </div>
        </div>
      </div>

      {/* Grid 1: Chart and Photo HUD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SVG Weight Line Chart */}
        <Card className="p-5 bg-zinc-950/40 border-zinc-850 lg:col-span-2 flex flex-col justify-between" hoverEffect={false}>
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-900 mb-4">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Weight Progress Curve</h3>
              </div>
              <span className="text-[10px] font-mono text-zinc-550 font-bold uppercase">76.5 kg starting</span>
            </div>

            {/* SVG Visual */}
            <div className="relative w-full h-[180px] mt-4 bg-zinc-950/40 p-2 border border-zinc-900 rounded-lg flex items-center justify-center">
              <svg 
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-full overflow-visible"
              >
                {/* Grid Lines */}
                {Array.from({ length: 4 }).map((_, idx) => {
                  const yVal = padding + (idx * (chartHeight - padding * 2)) / 3;
                  const label = (maxWeight - (idx * range) / 3).toFixed(1);
                  return (
                    <g key={idx}>
                      <line 
                        x1={padding} 
                        y1={yVal} 
                        x2={chartWidth - padding} 
                        y2={yVal} 
                        className="stroke-zinc-900" 
                        strokeWidth="1"
                        strokeDasharray="4 4"
                      />
                      <text 
                        x={padding - 5} 
                        y={yVal + 3} 
                        className="fill-zinc-650 text-[9px] font-mono font-bold text-right"
                        textAnchor="end"
                      >
                        {label}
                      </text>
                    </g>
                  );
                })}

                {/* Shaded Area */}
                {areaD && (
                  <path 
                    d={areaD} 
                    className="fill-cyan-500/5"
                  />
                )}

                {/* Line Path */}
                {pathD && (
                  <path 
                    d={pathD} 
                    className="stroke-cyan-500" 
                    strokeWidth="2.5" 
                    fill="none"
                    style={{
                      filter: 'drop-shadow(0 0 4px rgba(6,182,212,0.3))'
                    }}
                  />
                )}

                {/* Points Circle & Label Values */}
                {points.map((p, idx) => (
                  <g key={idx}>
                    <circle 
                      cx={p.x} 
                      cy={p.y} 
                      r="4" 
                      className="fill-black stroke-cyan-400" 
                      strokeWidth="2"
                    />
                    <text 
                      x={p.x} 
                      y={p.y - 10} 
                      className="fill-zinc-300 text-[9px] font-mono font-bold"
                      textAnchor="middle"
                    >
                      {p.item.value}
                    </text>
                    <text 
                      x={p.x} 
                      y={chartHeight - 8} 
                      className="fill-zinc-500 text-[8px] font-bold uppercase tracking-wider"
                      textAnchor="middle"
                    >
                      {p.item.date}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>

          <div className="text-[10px] text-zinc-550 bg-zinc-900/30 p-2.5 border border-zinc-850/60 rounded mt-4 flex items-center justify-between">
            <span>METRIC DECREASE: <span className="text-emerald-400 font-bold">-2.3 kg net loss (3.01%)</span></span>
            <span>TREND: STABLE</span>
          </div>
        </Card>

        {/* Progress Photos HUD Placeholder */}
        <Card className="p-5 bg-zinc-950/40 border-zinc-850 flex flex-col justify-between" hoverEffect={false}>
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-900 mb-4">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Progress Photos</h3>
              </div>
              <span className="text-[10px] font-mono text-zinc-550 font-bold uppercase">SEP 07</span>
            </div>

            {/* Photo positions grid */}
            <div className="grid grid-cols-3 gap-2.5">
              {['Front', 'Side', 'Back'].map((view, idx) => (
                <div 
                  key={view}
                  onClick={() => setSelectedPhotoIndex(idx)}
                  className="group relative h-28 rounded-lg border border-zinc-850 bg-zinc-900/40 hover:border-cyan-500/40 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 overflow-hidden"
                >
                  {view === 'Front' && userPhoto ? (
                    <img src={userPhoto} alt="Baseline Front" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <>
                      <Camera className="w-5 h-5 text-zinc-650 group-hover:text-cyan-400 transition-all duration-300 mb-1" />
                      <span className="text-[10px] font-bold text-zinc-450 group-hover:text-zinc-200 transition-all duration-300 uppercase tracking-widest">
                        {view}
                      </span>
                    </>
                  )}
                  <div className="absolute inset-x-0 bottom-0 py-0.5 bg-zinc-950/80 border-t border-zinc-900 rounded-b-lg text-[7px] text-zinc-500 text-center font-bold uppercase tracking-wider">
                    {view === 'Front' && userPhoto ? 'Baseline Front' : 'Dry log'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[9px] text-zinc-600 leading-normal mt-4 bg-zinc-900/20 py-1.5 px-2 rounded border border-zinc-850">
            Image logging is fully supported. Capture or upload your body progress photos to compare visual changes side-by-side.
          </p>
        </Card>
      </div>

      {/* Grid 2: Measurements & Strength Progression */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Body Circumference Measurements */}
        <Card className="p-5 bg-zinc-950/40 border-zinc-850" hoverEffect={false}>
          <div className="flex items-center justify-between pb-3 border-b border-zinc-900 mb-4">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Body Circumferences</h3>
            </div>
            <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">TRACKED</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Chest', key: 'chest' as const, color: 'border-l-cyan-500' },
              { label: 'Waist', key: 'waist' as const, color: 'border-l-emerald-500' },
              { label: 'Arms', key: 'arms' as const, color: 'border-l-amber-500' },
              { label: 'Thighs', key: 'thighs' as const, color: 'border-l-indigo-500' }
            ].map((m) => {
              const history = progressData[m.key];
              const latest = history[history.length - 1];
              const previous = history[history.length - 2];
              const delta = previous && latest ? parseFloat((latest.value - previous.value).toFixed(1)) : 0;
              const unit = 'cm';
              
              return (
                <div key={m.label} className={`border-l-2 ${m.color} bg-zinc-900/30 p-3 rounded-r-lg border border-zinc-850`}>
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">{m.label}</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-lg font-black text-white">{latest?.value || '--'} <span className="text-[10px] text-zinc-400">{unit}</span></span>
                    {delta !== 0 && (
                      <span className={`text-[10px] font-bold ${delta < 0 ? 'text-emerald-400' : 'text-cyan-400'}`}>
                        {delta > 0 ? `+${delta}` : delta} {unit}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Strength Progression log */}
        <Card className="p-5 bg-zinc-950/40 border-zinc-850 flex flex-col justify-between" hoverEffect={false}>
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-900 mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Estimated 1RM Performance</h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">ASCENDING</span>
            </div>

            <div className="space-y-4">
              {progressData.strengthProgression.map((item) => {
                const latest = item.history[item.history.length - 1];
                const prev = item.history[0];
                const delta = prev && latest ? latest.oneRepMax - prev.oneRepMax : 0;

                return (
                  <div key={item.exerciseName} className="bg-zinc-900/40 border border-zinc-850 p-3 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-zinc-200 block uppercase tracking-wide">{item.exerciseName}</span>
                      <span className="text-[9px] text-zinc-500 font-semibold block mt-0.5">INITIAL STANDARDS: {prev?.oneRepMax} kg</span>
                    </div>
                    <div className="text-right">
                      <span className="text-md font-extrabold text-white block">{latest?.oneRepMax} <span className="text-xs font-normal text-zinc-400">kg</span></span>
                      {delta > 0 && (
                        <span className="text-[9px] text-emerald-400 font-extrabold block">▲ +{delta} kg (+{Math.round((delta/prev.oneRepMax)*100)}%)</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </div>

      {/* Monthly Assessment Check-In Modal */}
      <Modal 
        isOpen={showCheckInModal} 
        onClose={() => setShowCheckInModal(false)} 
        title="Log Check-In Progress"
      >
        <form onSubmit={handleCheckInSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          <p className="text-[10px] text-zinc-400 font-medium leading-relaxed uppercase tracking-wide">
            Record physical bodyweight, circumference changes, and update baseline tracking metrics.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <Input 
              id="m-weight"
              label="BODYWEIGHT (KG)"
              type="number"
              step="0.1"
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
              placeholder="e.g. 74.2"
              required
            />
            <Input 
              id="m-chest"
              label="CHEST CIRCUMFERENCE (CM)"
              type="number"
              step="0.1"
              value={newChest}
              onChange={(e) => setNewChest(e.target.value)}
              placeholder="e.g. 102.5"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input 
              id="m-waist"
              label="WAIST (CM)"
              type="number"
              step="0.1"
              value={newWaist}
              onChange={(e) => setNewWaist(e.target.value)}
              placeholder="e.g. 82.0"
            />
            <Input 
              id="m-arms"
              label="ARMS (CM)"
              type="number"
              step="0.1"
              value={newArms}
              onChange={(e) => setNewArms(e.target.value)}
              placeholder="e.g. 36.5"
            />
            <Input 
              id="m-thighs"
              label="THIGHS (CM)"
              type="number"
              step="0.1"
              value={newThighs}
              onChange={(e) => setNewThighs(e.target.value)}
              placeholder="e.g. 56.2"
            />
          </div>

          {/* High-fidelity Drag and Drop Photo Uploader */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">UPLOAD PROGRESS PHOTO</label>
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center relative overflow-hidden h-36 ${
                dragActive 
                  ? 'border-cyan-400 bg-cyan-500/5' 
                  : checkInPhoto 
                    ? 'border-emerald-500/40 bg-emerald-500/[0.02]' 
                    : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950/40'
              }`}
            >
              <input 
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {checkInPhoto ? (
                <div className="absolute inset-0 flex items-center justify-center group">
                  <img src={checkInPhoto} alt="Upload preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity gap-2.5">
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-300 hover:text-white hover:border-zinc-700"
                    >
                      <Upload className="w-4 h-4" />
                    </button>
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCheckInPhoto(null);
                      }}
                      className="p-2 bg-zinc-900 border border-red-500/20 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <Upload className="w-7 h-7 text-zinc-500 mx-auto group-hover:text-cyan-400 transition-colors" />
                  <p className="text-xs text-zinc-300 font-semibold uppercase">Drag and drop or Click to Upload</p>
                  <p className="text-[9px] text-zinc-550">Supports JPEG, PNG, or HEIC</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-3 border-t border-zinc-900">
            <Button variant="ghost" type="button" onClick={() => setShowCheckInModal(false)} className="h-10 text-xs">
              Cancel
            </Button>
            <Button variant="primary" type="submit" className="h-10 text-xs">
              <span className="flex items-center gap-2 font-bold">
                <Check className="w-4 h-4" />
                Save Progress Log
              </span>
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
