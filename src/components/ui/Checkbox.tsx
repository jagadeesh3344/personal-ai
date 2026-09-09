import React from 'react';
import { Check } from 'lucide-react';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  id: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  label,
  id
}) => {
  return (
    <label 
      htmlFor={id} 
      className="flex items-center gap-3 cursor-pointer select-none group text-sm text-zinc-300 hover:text-white"
    >
      <div className="relative">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all duration-200 ${
          checked 
            ? 'bg-cyan-500 border-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.3)]' 
            : 'border-zinc-700 bg-zinc-950/40 group-hover:border-zinc-500'
        }`}>
          {checked && (
            <Check className="w-3.5 h-3.5 text-black stroke-[3.5]" />
          )}
        </div>
      </div>
      {label && (
        <span className={`transition-all duration-200 ${checked ? 'line-through text-zinc-500' : ''}`}>
          {label}
        </span>
      )}
    </label>
  );
};
