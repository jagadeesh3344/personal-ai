import React from 'react';
import { Bot, User, Cpu } from 'lucide-react';
import { FridayMessage as FridayMessageType } from '../../types';

interface FridayMessageProps {
  message: FridayMessageType;
}

export const FridayMessage: React.FC<FridayMessageProps> = ({
  message
}) => {
  const isFriday = message.sender === 'friday';

  return (
    <div className={`flex gap-3.5 w-full max-w-2xl ${isFriday ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}>
      {/* Icon */}
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-all duration-300 ${
        isFriday 
          ? 'bg-gradient-to-tr from-cyan-600 to-indigo-600 border-cyan-400/20 text-white shadow-md shadow-cyan-500/10' 
          : 'bg-zinc-800 border-zinc-700 text-zinc-300'
      }`}>
        {isFriday ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
      </div>

      {/* Bubble content */}
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        {/* Name / Category & Time */}
        <div className={`flex items-center gap-2 text-[10px] font-bold tracking-wider uppercase ${isFriday ? 'text-zinc-400' : 'text-zinc-400 justify-end'}`}>
          <span>{isFriday ? 'FRIDAY' : 'YOU'}</span>
          {isFriday && message.category && (
            <span className="text-[8px] font-extrabold px-1.5 py-0.2 rounded bg-cyan-950/40 border border-cyan-900/30 text-cyan-400">
              {message.category}
            </span>
          )}
          <span className="text-zinc-600 font-normal font-mono">{message.timestamp}</span>
        </div>

        {/* Text bubble */}
        <div className={`rounded-xl px-4 py-3 border text-xs leading-relaxed transition-all duration-300 ${
          isFriday 
            ? 'bg-zinc-900/60 border-zinc-850/80 text-zinc-200 rounded-tl-none shadow-lg' 
            : 'bg-cyan-950/10 border-cyan-500/20 text-cyan-100 rounded-tr-none shadow-md shadow-cyan-950/5'
        }`}>
          <p className="whitespace-pre-line font-medium">{message.text}</p>
        </div>
      </div>
    </div>
  );
};
