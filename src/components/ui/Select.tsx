import React from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
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
      <div className="relative">
        <select
          id={id}
          className={`w-full bg-zinc-950/60 border border-zinc-800 focus:border-cyan-500/80 rounded-lg h-10 px-3.5 pr-8 text-sm text-zinc-100 transition-all duration-200 outline-none cursor-pointer appearance-none ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-zinc-900 text-zinc-100">
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-zinc-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
};
