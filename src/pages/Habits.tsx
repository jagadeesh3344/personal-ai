import React, { useState } from 'react';
import { HabitItem } from '../components/habits/HabitItem';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { ArrowLeft, Plus, Flame } from 'lucide-react';
import { Habit } from '../types';

interface HabitsProps {
  habits: Habit[];
  setHabits: React.Dispatch<React.SetStateAction<Habit[]>>;
  setTab: (tab: string) => void;
}

export const Habits: React.FC<HabitsProps> = ({
  habits,
  setHabits,
  setTab
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitIcon, setNewHabitIcon] = useState('Dumbbell');

  const daysAbbr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayKey = daysAbbr[new Date().getDay()];

  const handleToggleHabit = (id: string) => {
    setHabits(prev => prev.map(h => {
      if (h.id === id) {
        const nextCompleted = !h.currentCompleted;
        const newStreak = nextCompleted ? h.streak + 1 : Math.max(0, h.streak - 1);
        const updatedHistory = {
          ...h.weeklyHistory,
          [todayKey]: nextCompleted
        };

        return {
          ...h,
          currentCompleted: nextCompleted,
          streak: newStreak,
          weeklyHistory: updatedHistory
        };
      }
      return h;
    }));
  };

  const handleAddHabitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;

    const newH: Habit = {
      id: `h-${Date.now()}`,
      name: newHabitName.trim(),
      icon: newHabitIcon,
      streak: 0,
      weeklyHistory: { Mon: false, Tue: false, Wed: false, Thu: false, Fri: false, Sat: false, Sun: false },
      currentCompleted: false
    };

    setHabits(prev => [...prev, newH]);
    setNewHabitName('');
    setNewHabitIcon('Dumbbell');
    setShowAddModal(false);
  };

  const totalHabits = habits.length;
  const completedHabits = habits.filter(h => h.currentCompleted).length;
  const completionPercentage = totalHabits > 0 
    ? Math.round((completedHabits / totalHabits) * 100) 
    : 0;

  const bestStreak = habits.reduce((acc, h) => Math.max(acc, h.streak), 0);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-950/40 border border-zinc-900 p-5 rounded-xl">
        <div>
          <button 
            onClick={() => setTab('dashboard')} 
            className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-white uppercase tracking-wider mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </button>
          <h1 className="text-xl font-black text-white uppercase tracking-tight">Daily Habits Board</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Build consistency and track multi-day adherence routines.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={() => setShowAddModal(true)} className="w-full sm:w-auto text-xs uppercase">
          <Plus className="w-4 h-4 mr-1.5" /> Add Habit Target
        </Button>
      </div>

      {/* Habits HUD Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-5 bg-zinc-950/40 border-zinc-850 flex items-center justify-between" hoverEffect={false}>
          <div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">DAILY COMPLETED</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-white font-mono">{completedHabits} <span className="text-xs text-zinc-500">/ {totalHabits}</span></span>
            </div>
            <span className="text-[10px] text-zinc-500 font-semibold block mt-1">TODAY'S SCORE</span>
          </div>
          <div className="w-12 h-12 rounded-full border border-zinc-800 bg-zinc-900/60 flex items-center justify-center text-cyan-400 font-mono font-bold text-xs">
            {completionPercentage}%
          </div>
        </Card>

        <Card className="p-5 bg-zinc-950/40 border-zinc-850 flex items-center justify-between" hoverEffect={false}>
          <div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">PEAK STREAK</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-white font-mono">{bestStreak} <span className="text-xs text-zinc-500">Days</span></span>
            </div>
            <span className="text-[10px] text-zinc-500 font-semibold block mt-1">ACTIVE RUN</span>
          </div>
          <div className="p-3 rounded-lg border border-amber-500/10 bg-amber-500/5 text-amber-400">
            <Flame className="w-5 h-5 fill-amber-500/10" />
          </div>
        </Card>

        <Card className="p-5 bg-zinc-950/40 border-zinc-850 flex items-center justify-between" hoverEffect={false}>
          <div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">HABIT DISCIPLINE</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold text-white uppercase">
                {completionPercentage >= 70 ? 'Consistent' : (completionPercentage > 0 ? 'In Progress' : 'Pending Logs')}
              </span>
            </div>
            <span className="text-[10px] text-zinc-500 font-semibold block mt-1">WEEKLY CORRELATION</span>
          </div>
        </Card>
      </div>

      {/* Habit Items list */}
      <div className="space-y-3">
        {habits.map((habit) => (
          <HabitItem 
            key={habit.id} 
            habit={habit} 
            onToggleHabit={handleToggleHabit} 
          />
        ))}
      </div>

      {/* Add Habit Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="ADD HABIT TARGET">
        <form onSubmit={handleAddHabitSubmit} className="space-y-4 pt-2">
          <Input 
            id="habit-name"
            label="Habit Description"
            value={newHabitName}
            onChange={(e) => setNewHabitName(e.target.value)}
            placeholder="e.g. 10 Minutes Mobility & Stretching"
            required
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create Habit
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
