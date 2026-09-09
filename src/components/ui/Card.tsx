import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'glass' | 'accent' | 'outlined';
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'default',
  hoverEffect = true,
  ...props
}) => {
  const baseStyle = 'rounded-xl border transition-all duration-300 overflow-hidden';
  
  const variants = {
    default: 'bg-zinc-900/60 border-zinc-800/80 shadow-lg shadow-black/40',
    glass: 'bg-zinc-950/40 backdrop-blur-md border-zinc-800/60 shadow-lg shadow-black/50',
    accent: 'bg-zinc-900/80 border-cyan-500/20 shadow-lg shadow-cyan-950/10',
    outlined: 'bg-transparent border-zinc-800/80'
  };

  const hoverStyle = hoverEffect 
    ? 'hover:border-zinc-700/80 hover:shadow-black/60 hover:-translate-y-[2px]' 
    : '';

  return (
    <div
      className={`${baseStyle} ${variants[variant]} ${hoverStyle} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
