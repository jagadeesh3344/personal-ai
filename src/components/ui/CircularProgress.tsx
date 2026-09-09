import React from 'react';

interface CircularProgressProps {
  score: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  score,
  max = 100,
  size = 120,
  strokeWidth = 8,
  label = "Today's Score"
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.min(100, Math.max(0, (score / max) * 100));
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full transform -rotate-90">
          {/* Background circle */}
          <circle
            className="text-zinc-800"
            strokeWidth={strokeWidth}
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          {/* Highlight path */}
          <circle
            className="text-cyan-500 transition-all duration-1000 ease-out"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
            style={{
              filter: 'drop-shadow(0 0 6px rgba(6,182,212,0.4))'
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-extrabold text-white tracking-tight">{score}</span>
          <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold">/ {max}</span>
        </div>
      </div>
      {label && (
        <span className="mt-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
          {label}
        </span>
      )}
    </div>
  );
};
