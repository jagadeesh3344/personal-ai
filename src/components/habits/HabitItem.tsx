import React from 'react';
import { Card } from '../ui/Card';
import { Checkbox } from '../ui/Checkbox';
import { Dumbbell, Beef, GlassWater, Footprints, Moon, CheckCircle2, Flame, HelpCircle } from 'lucide-react';
import { Habit } from '../../types';

interface HabitItemProps {
  habit: Habit;
  onToggleHabit: (id: string) => void;
}

export const HabitItem: React.FC<HabitItemProps> = ({
  habit,
  onToggleHabit
}) => {
  const getHabitIcon = (iconName: string) => {
    const classStyle = "w-4.5 h-4.5";
    switch (iconName) {
      case 'Dumbbell': return <Dumbbell className={`${classStyle} text-cyan-400`} />;
      case 'Beef': return <Beef className={`${classStyle} text-emerald-400`} />;
      case 'GlassWater': return <GlassWater className={`${classStyle} text-cyan-400`} />;
      case 'Footprints': return <Footprints className={`${classStyle} text-amber-400`} />;
      case 'Moon': return <Moon className={`${classStyle} text-indigo-400`} />;
      default: return <HelpCircle className={`${classStyle} text-zinc-400`} />;
    }
  };

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <Card className="p-4 bg-zinc-950/40 border-zinc-850" hoverEffect={true}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left segment */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-lg shadow-inner">
            {getHabitIcon(habit.icon)}
          </div>
          <div>
            <h4 className="text-sm font-bold text-zinc-100 tracking-wide uppercase">{habit.name}</h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="flex items-center gap-1 text-[10px] text-amber-500 font-bold">
                <Flame className="w-3.5 h-3.5 fill-amber-500/20" />
                <span>{habit.streak} DAY STREAK</span>
              </span>
            </div>
          </div>
        </div>

        {/* Calendar visual indicators */}
        <div className="flex items-center gap-1.5 bg-zinc-900/30 p-2 border border-zinc-900/60 rounded-lg">
          {daysOfWeek.map((day) => {
            const completed = habit.weeklyHistory[day];
            return (
              <div key={day} className="flex flex-col items-center gap-1 w-8">
                <span className="text-[8px] font-bold text-zinc-550 uppercase tracking-wider">{day}</span>
                <div 
                  className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold border transition-all duration-300 ${
                    completed 
                      ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.1)]' 
                      : 'bg-zinc-950/50 border-zinc-850 text-zinc-600'
                  }`}
                >
                  {completed ? '✓' : '•'}
                </div>
              </div>
            );
          })}
        </div>

        {/* Checkbox trigger */}
        <div className="flex items-center gap-4 border-t sm:border-t-0 sm:pl-4 border-zinc-900 pt-3 sm:pt-0 justify-between">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest sm:hidden">TODAY'S METRIC</span>
          <Checkbox
            id={`habit-chk-${habit.id}`}
            checked={habit.currentCompleted}
            onChange={() => onToggleHabit(habit.id)}
            label="MARK DONE"
          />
        </div>
      </div>
    </Card>
  );
};
