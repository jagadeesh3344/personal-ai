import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Bot, Sparkles, MessageSquare } from 'lucide-react';

interface FridayInsightCardProps {
  onAskFriday: () => void;
  insight: string;
}

export const FridayInsightCard: React.FC<FridayInsightCardProps> = ({
  onAskFriday,
  insight
}) => {
  return (
    <Card 
      className="p-5 relative overflow-hidden bg-gradient-to-br from-zinc-900 to-zinc-950 border-cyan-500/20 shadow-xl"
      hoverEffect={true}
    >
      <div className="relative z-10 flex flex-col justify-between h-full">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-850/60">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <Bot className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-widest">FRIDAY Tactical AI</h3>
                <span className="text-[8px] text-cyan-400 font-bold uppercase tracking-widest">Active Coach</span>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded px-1.5 py-0.5 text-[9px] font-semibold">
              <Sparkles className="w-3 h-3" />
              <span>ONLINE</span>
            </div>
          </div>

          {/* AI Response Text */}
          <div className="my-3 pl-3 border-l-2 border-cyan-500 bg-zinc-900/30 py-2.5 rounded-r-lg">
            <p className="text-xs text-zinc-300 leading-relaxed font-medium">
              "{insight}"
            </p>
          </div>
        </div>

        {/* Call to action button */}
        <div className="mt-4">
          <Button 
            variant="friday" 
            onClick={onAskFriday}
            className="w-full text-xs font-bold uppercase tracking-wider h-10"
          >
            <span className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Consult FRIDAY
            </span>
          </Button>
        </div>
      </div>
    </Card>
  );
};
