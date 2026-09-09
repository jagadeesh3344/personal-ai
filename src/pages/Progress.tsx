import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Scale, ArrowLeft, Plus } from 'lucide-react';
import { ProgressState } from '../types';

interface ProgressProps {
  progressData: ProgressState;
  onAddWeight: (weightKg: number) => void;
  onAddMeasurement: (record: { date: string; chestCm?: number; waistCm?: number; armsCm?: number; thighsCm?: number }) => void;
  setTab: (tab: string) => void;
}

export const Progress: React.FC<ProgressProps> = ({
  progressData,
  onAddWeight,
  onAddMeasurement,
  setTab
}) => {
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [newChest, setNewChest] = useState('');
  const [newWaist, setNewWaist] = useState('');
  const [newArms, setNewArms] = useState('');
  const [newThighs, setNewThighs] = useState('');

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

  const weights = progressData.weights;
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

  const latestWeight = weights.length > 0 ? weights[weights.length - 1].weightKg : null;
  const latestMeas = progressData.measurements.length > 0 ? progressData.measurements[progressData.measurements.length - 1] : null;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-950/40 border border-zinc-900 p-5 rounded-xl">
        <div>
          <button 
            onClick={() => setTab('dashboard')} 
            className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-white uppercase tracking-wider mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </button>
          <h1 className="text-xl font-black text-white uppercase tracking-tight">Biometric Progress</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Track real body weight fluctuations and circumference progression over time.
          </p>
        </div>

        <Button 
          variant="primary" 
          size="sm" 
          onClick={() => setShowCheckInModal(true)}
          className="w-full sm:w-auto text-xs uppercase"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Log Check-in
        </Button>
      </div>

      {/* Weight History Line Chart */}
      <Card className="p-6 bg-zinc-950/40 border-zinc-850" hoverEffect={false}>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-900/60">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Weight Progress Trend</h3>
          </div>
          <span className="text-xs font-mono font-bold text-white">
            {latestWeight ? `${latestWeight} kg current` : 'No weight check-ins'}
          </span>
        </div>

        {weights.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 text-xs">
            No weight entries recorded yet. Click "Log Check-in" above to log your first reading.
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-44 overflow-visible">
              {/* Grid Lines */}
              <line x1={padding} y1={padding} x2={chartWidth - padding} y2={padding} stroke="#27272a" strokeDasharray="3 3" />
              <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="#27272a" />

              {/* Curve line */}
              {pathD && (
                <path d={pathD} fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              )}

              {/* Data points */}
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

      {/* Body Circumference Measurements */}
      <Card className="p-6 bg-zinc-950/40 border-zinc-850" hoverEffect={false}>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-900/60">
          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Body Circumference Measurements (cm)</h3>
          <span className="text-[10px] text-zinc-500 font-mono">
            {latestMeas ? `Last recorded: ${latestMeas.date}` : 'Awaiting baseline'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-zinc-900/40 border border-zinc-850 p-4 rounded-xl">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Chest</span>
            <span className="text-xl font-black text-white font-mono">{latestMeas?.chestCm ? `${latestMeas.chestCm} cm` : '--'}</span>
          </div>
          <div className="bg-zinc-900/40 border border-zinc-850 p-4 rounded-xl">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Waist</span>
            <span className="text-xl font-black text-white font-mono">{latestMeas?.waistCm ? `${latestMeas.waistCm} cm` : '--'}</span>
          </div>
          <div className="bg-zinc-900/40 border border-zinc-850 p-4 rounded-xl">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Arms</span>
            <span className="text-xl font-black text-white font-mono">{latestMeas?.armsCm ? `${latestMeas.armsCm} cm` : '--'}</span>
          </div>
          <div className="bg-zinc-900/40 border border-zinc-850 p-4 rounded-xl">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Thighs</span>
            <span className="text-xl font-black text-white font-mono">{latestMeas?.thighsCm ? `${latestMeas.thighsCm} cm` : '--'}</span>
          </div>
        </div>
      </Card>

      {/* Check-In Modal */}
      <Modal isOpen={showCheckInModal} onClose={() => setShowCheckInModal(false)} title="BIOMETRIC CHECK-IN">
        <form onSubmit={handleCheckInSubmit} className="space-y-4 pt-2">
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
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowCheckInModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Commit Check-in
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
