import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'friday' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className = '',
  variant = 'secondary',
  size = 'md',
  ...props
}) => {
  const baseStyle = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 active:scale-98 cursor-pointer disabled:opacity-50 disabled:pointer-events-none select-none';
  
  const variants = {
    primary: 'bg-cyan-500 text-black hover:bg-cyan-400 font-semibold shadow-md shadow-cyan-500/20',
    secondary: 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700 hover:text-white border border-zinc-700/60',
    outline: 'bg-transparent text-zinc-300 border border-zinc-700 hover:bg-zinc-800/60 hover:text-white',
    ghost: 'bg-transparent text-zinc-400 hover:bg-zinc-850 hover:text-zinc-100',
    friday: 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white hover:from-cyan-500 hover:to-indigo-500 font-semibold shadow-lg shadow-cyan-500/10 border border-cyan-400/30 animate-pulse-subtle',
    danger: 'bg-red-950/40 text-red-400 border border-red-800/40 hover:bg-red-900/40 hover:text-red-200'
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 h-8',
    md: 'text-sm px-4 py-2 h-10',
    lg: 'text-base px-6 py-3 h-12',
    icon: 'p-2 w-10 h-10'
  };

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
