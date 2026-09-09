import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'cyan' | 'zinc' | 'success' | 'warning' | 'indigo' | 'danger';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'zinc'
}) => {
  const styles = {
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    zinc: 'bg-zinc-800 text-zinc-300 border-zinc-700/60',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    danger: 'bg-red-500/10 text-red-400 border-red-500/20'
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${styles[variant]} tracking-wide`}>
      {children}
    </span>
  );
};
