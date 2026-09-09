import React from 'react';

interface TabOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  options: TabOption[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  options,
  activeId,
  onChange,
  className = ''
}) => {
  return (
    <div className={`flex border-b border-zinc-800/80 p-1 bg-zinc-950/20 rounded-lg gap-1 ${className}`}>
      {options.map((option) => {
        const isActive = option.id === activeId;
        return (
          <button
            key={option.id}
            onClick={() => onChange(option.id)}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-md transition-all duration-200 cursor-pointer ${
              isActive
                ? 'bg-zinc-800 text-cyan-400 border border-zinc-750'
                : 'text-zinc-550 hover:text-zinc-300 hover:bg-zinc-900/40'
            }`}
          >
            {option.icon}
            {option.label}
          </button>
        );
      })}
    </div>
  );
};
