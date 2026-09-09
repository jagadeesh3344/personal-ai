import React from 'react';
import { 
  LayoutDashboard, 
  Dumbbell, 
  Apple, 
  CheckSquare, 
  LineChart, 
  Bot, 
  Settings,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setTab: (tab: string) => void;
  streakDays: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setTab,
  streakDays
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'workout', label: 'Workout Tracker', icon: <Dumbbell className="w-5 h-5" /> },
    { id: 'nutrition', label: 'Nutrition & Water', icon: <Apple className="w-5 h-5" /> },
    { id: 'habits', label: 'Habits Board', icon: <CheckSquare className="w-5 h-5" /> },
    { id: 'progress', label: 'Your Progress', icon: <LineChart className="w-5 h-5" /> },
  ];

  return (
    <aside className="w-64 bg-zinc-950 border-r border-zinc-900 flex flex-col justify-between h-screen fixed left-0 top-0 z-30 hidden md:flex">
      {/* Brand Header */}
      <div className="p-6 border-b border-zinc-900/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-md shadow-cyan-500/20">
            <span className="font-black text-black text-sm tracking-tighter">F</span>
          </div>
          <div>
            <h1 className="text-md font-black tracking-widest text-white uppercase">FRIDAY</h1>
            <p className="text-[9px] text-cyan-400 font-semibold uppercase tracking-wider">AI Personal Trainer</p>
          </div>
        </div>
        {streakDays > 0 && (
          <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 rounded-md px-1.5 py-0.5" title="Daily Streak">
            <span className="text-xs">🔥</span>
            <span className="text-[10px] font-bold text-amber-400">{streakDays}</span>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <div className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        <span className="px-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-3">Navigation</span>
        
        {menuItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer text-left ${
                isActive 
                  ? 'bg-zinc-900/80 text-cyan-400 border border-zinc-800' 
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={isActive ? 'text-cyan-400' : 'text-zinc-500'}>
                  {item.icon}
                </span>
                <span className="text-xs font-semibold tracking-wide">{item.label}</span>
              </div>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />}
            </button>
          );
        })}

        <div className="pt-6 border-t border-zinc-900/60 my-4">
          <span className="px-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-3">AI Coach</span>
          <button
            onClick={() => setTab('friday')}
            className={`w-full flex items-center justify-between px-3 py-3 rounded-lg transition-all duration-300 cursor-pointer text-left ${
              currentTab === 'friday'
                ? 'bg-gradient-to-r from-cyan-950/40 to-indigo-950/40 text-cyan-300 border border-cyan-500/20 shadow-md'
                : 'bg-zinc-900/20 border border-zinc-850 text-zinc-350 hover:bg-zinc-850 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Bot className={`w-5 h-5 ${currentTab === 'friday' ? 'text-cyan-400 animate-pulse' : 'text-zinc-400'}`} />
              <div>
                <span className="text-xs font-bold block">Consult FRIDAY</span>
                <span className="text-[9px] text-zinc-550 block">Your AI Fitness Companion</span>
              </div>
            </div>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
          </button>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="p-4 border-t border-zinc-900/60 bg-zinc-950/80">
        <button
          onClick={() => setTab('settings')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer text-left ${
            currentTab === 'settings' 
              ? 'bg-zinc-900 text-white' 
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Settings className="w-5 h-5 text-zinc-500" />
          <span className="text-xs font-semibold tracking-wide">Settings & Profile</span>
        </button>
      </div>
    </aside>
  );
};
