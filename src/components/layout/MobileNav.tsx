import React from 'react';
import { 
  LayoutDashboard, 
  Dumbbell, 
  Apple, 
  CheckSquare, 
  Bot,
  Settings,
  LineChart
} from 'lucide-react';

interface MobileNavProps {
  currentTab: string;
  setTab: (tab: string) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentTab,
  setTab
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Today', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'workout', label: 'Workout', icon: <Dumbbell className="w-5 h-5" /> },
    { id: 'friday', label: 'FRIDAY', icon: <Bot className="w-5 h-5 animate-pulse" />, isFriday: true },
    { id: 'nutrition', label: 'Fuel', icon: <Apple className="w-5 h-5" /> },
    { id: 'progress', label: 'Progress', icon: <LineChart className="w-5 h-5" /> }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-zinc-950/90 backdrop-blur-lg border-t border-zinc-900/80 px-4 flex items-center justify-around z-40 shadow-[0_-8px_24px_rgba(0,0,0,0.6)]">
      {navItems.map((item) => {
        const isActive = currentTab === item.id;
        
        if (item.isFriday) {
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`relative -top-3 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer shadow-lg ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-black scale-110 shadow-cyan-500/30 border border-cyan-400'
                  : 'bg-zinc-900 text-cyan-400 border border-zinc-800'
              }`}
            >
              <Bot className="w-6 h-6" />
            </button>
          );
        }

        return (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`flex flex-col items-center justify-center gap-1 transition-all duration-200 cursor-pointer ${
              isActive ? 'text-cyan-400' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {item.icon}
            <span className="text-[9px] font-bold uppercase tracking-wider">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
