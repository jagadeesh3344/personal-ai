import React from 'react';
import { Card } from './Card';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    type: 'up' | 'down' | 'neutral';
  };
  color?: 'cyan' | 'zinc' | 'emerald' | 'amber';
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  icon,
  trend,
  color = 'zinc'
}) => {
  const highlightBorder = {
    cyan: 'border-l-2 border-l-cyan-500',
    zinc: 'border-l-2 border-l-zinc-700',
    emerald: 'border-l-2 border-l-emerald-500',
    amber: 'border-l-2 border-l-amber-500'
  };

  const trendColors = {
    up: 'text-emerald-400',
    down: 'text-red-400',
    neutral: 'text-zinc-400'
  };

  return (
    <Card className={`p-5 flex justify-between items-center ${highlightBorder[color]}`} hoverEffect={true}>
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
          {label}
        </span>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-2xl font-bold text-white tracking-tight">
            {value}
          </span>
          {trend && (
            <span className={`text-xs font-medium ${trendColors[trend.type]}`}>
              {trend.type === 'up' ? '▲' : trend.type === 'down' ? '▼' : '•'} {trend.value}
            </span>
          )}
        </div>
        {subtext && (
          <span className="text-xs text-zinc-500">
            {subtext}
          </span>
        )}
      </div>
      {icon && (
        <div className="p-3 bg-zinc-950/60 border border-zinc-850 text-zinc-400 rounded-lg shadow-inner">
          {icon}
        </div>
      )}
    </Card>
  );
};
