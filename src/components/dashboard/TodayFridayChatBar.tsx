import React, { useState } from 'react';
import { Bot, Send, Mic, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';

interface TodayFridayChatBarProps {
  onSendMessage: (text: string) => void;
  onOpenFridayTab: () => void;
}

export const TodayFridayChatBar: React.FC<TodayFridayChatBarProps> = ({
  onSendMessage,
  onOpenFridayTab
}) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const samplePrompts = [
    "What's my workout today?",
    "What should I eat next?",
    "How much water do I have left?",
    "Am I progressing?"
  ];

  return (
    <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-cyan-500/20 rounded-2xl p-4 md:p-5 shadow-lg">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Bot className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-wider">Ask FRIDAY Coach</h3>
            <p className="text-[10px] text-zinc-400">Voice-ready personal trainer with real-time coaching memory</p>
          </div>
        </div>

        {/* Quick Prompts */}
        <div className="hidden lg:flex items-center gap-2 overflow-x-auto">
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSendMessage(p)}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-zinc-900/60 hover:bg-cyan-500/10 border border-zinc-800 hover:border-cyan-500/30 text-zinc-300 hover:text-cyan-300 transition-all cursor-pointer whitespace-nowrap"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenFridayTab}
          className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-cyan-500/30 text-zinc-400 hover:text-cyan-400 transition cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
          title="Open Voice Coach"
          aria-label="Open Voice Coach"
        >
          <Mic className="w-4 h-4" />
        </button>

        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask FRIDAY anything (e.g., 'What should I do next?')..."
          className="flex-1 bg-zinc-900/80 border border-zinc-800 focus:border-cyan-500 px-4 py-2.5 rounded-xl text-xs text-white outline-none min-h-[44px]"
        />

        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={!input.trim()}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Send message to FRIDAY"
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
};
