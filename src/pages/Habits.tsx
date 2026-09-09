import React, { useState } from 'react';
import { HabitItem } from '../components/habits/HabitItem';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { CheckSquare, ArrowLeft, Plus, Award, Calendar, Flame } from 'lucide-react';
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

  const handleToggleHabit = (id: string) => {
    setHabits(prev => prev.map(h => {
      if (h.id === id) {
        const nextCompleted = !h.currentCompleted;
        
        // Update current streak
        const newStreak = nextCompleted ? h.streak + 1 : Math.max(0, h.streak - 1);
        
        // Update Tue (Assuming Tuesday is today "2026-09-08")
        const updatedHistory = {
          ...h.weeklyHistory,
          Tue: nextCompleted
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
      name: newHabitName,
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

  // Calculations
  const totalHabits = habits.length;
  const completedHabits = habits.filter(h => h.currentCompleted).length;
  const completionPercentage = totalHabits > 0 
    ? Math.round((completedHabits / totalHabits) * 100) 
    : 0;

  // Best active streak
  const bestStreak = habits.reduce((acc, h) => Math.max(acc, h.streak), 0);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-950/40 border border-zinc-900 p-5 rounded-xl">
        <div>
          <button 
            onClick={() => setTab('dashboard')} 
            className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-white uppercase tracking-wider mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </button>
          <h1 className="text-xl font-black text-white uppercase tracking-tight">Daily Habits</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Build consistency and stick to your daily routines.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={() => setShowAddModal(true)} className="w-full sm:w-auto">
          <span className="flex items-center gap-1.5 uppercase tracking-wider text-xs">
            <Plus className="w-4 h-4" /> Add Habit Target
          </span>
        </Button>
      </div>

      {/* Habits HUD Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Daily Completion card */}
        <Card className="p-5 bg-zinc-950/40 border-zinc-850 flex items-center justify-between" hoverEffect={false}>
          <div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">DAILY COMPLETED</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-white">{completedHabits} <span className="text-xs text-zinc-400">/ {totalHabits}</span></span>
            </div>
            <span className="text-[10px] text-zinc-500 font-semibold block mt-1">TODAY'S MISSION INDEX</span>
          </div>
          <div className="w-12 h-12 rounded-full border border-zinc-800 bg-zinc-900/60 flex items-center justify-center text-cyan-400 font-mono font-bold text-xs">
            {completionPercentage}%
          </div>
        </Card>

        {/* Consistency coefficient */}
        <Card className="p-5 bg-zinc-950/40 border-zinc-850 flex items-center justify-between" hoverEffect={false}>
          <div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">PEAK LOOP STREAK</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-white">{bestStreak} <span className="text-xs text-zinc-400">Days</span></span>
            </div>
            <span className="text-[10px] text-zinc-500 font-semibold block mt-1">CORE ACTIVE MATRIX</span>
          </div>
          <div className="p-3 rounded-lg border border-amber-500/10 bg-amber-500/5 text-amber-400 shadow-inner">
            <Flame className="w-5 h-5 fill-amber-500/10" />
          </div>
        </Card>

        {/* Global summary status card */}
        <Card className="p-5 bg-zinc-950/40 border-zinc-850 flex items-center justify-between" hoverEffect={false}>
          <div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">HABIT COMPLIANCE</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-md font-bold text-white uppercase">Consistent</span>
            </div>
            <span className="text-[10px] text-zinc-550 block mt-1.5 uppercase font-bold">FRIDAY COACH FEEDBACK</span>
          </div>
          <div className="p-3 rounded-lg border border-cyan-500/10 bg-cyan-500/5 text-cyan-400 shadow-inner">
            <Award className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* Habit list columns */}
      <div className="space-y-4">
        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest block pb-2 border-b border-zinc-900">
          DAILY HABITS STATUS
        </span>
        <div className="flex flex-col gap-4">
          {habits.map((habit) => (
            <HabitItem
              key={habit.id}
              habit={habit}
              onToggleHabit={handleToggleHabit}
            />
          ))}
        </div>
      </div>

      {/* Add Custom Habit Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Queue Loop Target">
        <form onSubmit={handleAddHabitSubmit} className="space-y-4">
          <Input 
            id="habit-name"
            label="HABIT TARGET NAME"
            value={newHabitName}
            onChange={(e) => setNewHabitName(e.target.value)}
            placeholder="e.g. Meditate 10 mins, Limit Screen Time"
            required
          />
          <Select 
            id="habit-icon"
            label="ICON GLYPH"
            value={newHabitIcon}
            onChange={(e) => setNewHabitIcon(e.target.value)}
            options={[
              { value: 'Dumbbell', label: 'Dumbbell Glyph' },
              { value: 'Beef', label: 'Beef Protein Glyph' },
              { value: 'GlassWater', label: 'Hydration Glyph' },
              { value: 'Footprints', label: 'Footprints Step Glyph' },
              { value: 'Moon', label: 'Moon Sleep Glyph' }
            ]}
          />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" type="button" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Queue Loop
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
