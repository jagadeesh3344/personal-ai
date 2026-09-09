import React from 'react';

interface ProgressBarProps {
  value: number; // e.g. current
  max: number;   // e.g. target
  color?: 'cyan' | 'emerald' | 'amber' | 'indigo' | 'red';
  showLabel?: boolean;
  unit?: string;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max,
  color = 'cyan',
  showLabel = false,
  unit = '',
  className = ''
}) => {
  const percentage = Math.min(100, Math.max(0, max > 0 ? (value / max) * 100 : 0));
  
  const colors = {
    cyan: 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.4)]',
    emerald: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]',
    amber: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]',
    indigo: 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]',
    red: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]'
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between text-xs text-zinc-400 mb-1">
          <span>Progress</span>
          <span>{value} / {max} {unit} ({Math.round(percentage)}%)</span>
        </div>
      )}
      <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden border border-zinc-900">
        <div 
          className={`h-full rounded-full transition-all duration-500 ease-out ${colors[color]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
