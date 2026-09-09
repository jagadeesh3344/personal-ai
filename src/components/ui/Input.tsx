import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className = '',
  id,
  ...props
}) => {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wider text-zinc-450">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`w-full bg-zinc-950/60 border border-zinc-800 focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/40 rounded-lg h-10 px-3.5 text-sm text-zinc-100 placeholder-zinc-650 transition-all duration-200 outline-none ${className}`}
        {...props}
      />
      {error && (
        <span className="text-xs text-red-400 mt-0.5">{error}</span>
      )}
    </div>
  );
};
