import React from 'react';
import { Bot, User, Bell, Shield } from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  userName: string;
  userGoal: string;
  userPhoto?: string | null;
  setTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  userName,
  userGoal,
  userPhoto,
  setTab
}) => {
  // Format current date nicely
  const formatDate = () => {
    const d = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    };
    return d.toLocaleDateString('en-US', options);
  };

  const getPageTitle = (tab: string) => {
    switch (tab) {
      case 'dashboard': return 'Dashboard';
      case 'workout': return 'Today\'s Workout';
      case 'nutrition': return 'Nutrition & Water';
      case 'habits': return 'Your Habits';
      case 'progress': return 'Your Progress';
      case 'friday': return 'FRIDAY AI';
      case 'settings': return 'Settings';
      default: return 'FRIDAY';
    }
  };

  return (
    <header className="h-16 border-b border-zinc-900/60 bg-zinc-950/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-20 w-full">
      {/* Page Title & Status */}
      <div className="flex items-center gap-3">
        <div className="hidden md:block">
          <h2 className="text-sm font-black uppercase tracking-widest text-zinc-100">{getPageTitle(currentTab)}</h2>
          <p className="text-[10px] text-zinc-500 font-medium">Ready for your training session</p>
        </div>
        {/* Mobile menu logo trigger */}
        <div className="md:hidden flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center">
            <span className="font-black text-black text-xs">F</span>
          </div>
          <span className="text-xs font-black tracking-wider text-white uppercase">FRIDAY</span>
        </div>
      </div>

      {/* Date, Profile, Notifications */}
      <div className="flex items-center gap-4">
        {/* Date Display */}
        <div className="hidden sm:flex flex-col text-right">
          <span className="text-xs font-bold text-zinc-200">{formatDate()}</span>
          <span className="text-[9px] font-semibold text-cyan-400 tracking-wider uppercase">T-Minus Target</span>
        </div>

        {/* AI quick trigger badge */}
        <button
          onClick={() => setTab('friday')}
          className="p-2 bg-zinc-900/60 border border-zinc-800/80 hover:border-cyan-500/30 text-zinc-400 hover:text-cyan-400 rounded-lg transition-all duration-200 shadow-inner flex items-center gap-1.5 cursor-pointer text-xs font-semibold"
        >
          <Bot className="w-4 h-4 animate-pulse" />
          <span className="hidden lg:inline text-[10px] uppercase tracking-wider">AI Coach</span>
        </button>

        {/* Divider */}
        <div className="w-[1px] h-6 bg-zinc-800" />

        {/* Profile Card */}
        <button 
          onClick={() => setTab('settings')}
          className="flex items-center gap-2.5 text-left group hover:opacity-90 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-zinc-850 border border-zinc-750 flex items-center justify-center overflow-hidden transition-all duration-200 group-hover:border-cyan-400">
            {userPhoto ? (
              <img src={userPhoto} alt="Operator Baseline Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <User className="w-4 h-4 text-zinc-400 group-hover:text-cyan-400" />
            )}
          </div>
          <div className="hidden sm:block">
            <h4 className="text-xs font-bold text-white group-hover:text-cyan-400">{userName}</h4>
            <p className="text-[9px] text-zinc-500 font-semibold">{userGoal}</p>
          </div>
        </button>
      </div>
    </header>
  );
};
