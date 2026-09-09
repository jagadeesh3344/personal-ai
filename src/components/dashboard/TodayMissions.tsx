import React from 'react';
import { Card } from '../ui/Card';
import { Checkbox } from '../ui/Checkbox';
import { Task } from '../../types';
import { Target, CheckCircle2 } from 'lucide-react';

interface TodayMissionsProps {
  tasks: Task[];
  onToggleTask: (id: string) => void;
}

export const TodayMissions: React.FC<TodayMissionsProps> = ({
  tasks,
  onToggleTask
}) => {
  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const allDone = completedCount === totalCount;

  return (
    <Card className="p-5 flex flex-col h-full bg-zinc-950/40 border-zinc-850" hoverEffect={true}>
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-900/40">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Today's Tactical Missions</h3>
        </div>
        <span className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider">
          {completedCount} / {totalCount} Done
        </span>
      </div>

      {allDone ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-lg">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mb-2 animate-bounce" />
          <p className="text-xs font-semibold text-zinc-200">ALL OBJECTIVES SECURED</p>
          <p className="text-[10px] text-zinc-500 mt-1">Excellent performance. Let's maintain operational status.</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between">
          <div className="space-y-3.5 my-1">
            {tasks.map((task) => (
              <div 
                key={task.id} 
                className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
                  task.completed 
                    ? 'bg-zinc-900/30 border-zinc-900 text-zinc-500' 
                    : 'bg-zinc-900/60 border-zinc-850 text-zinc-200'
                }`}
              >
                <Checkbox
                  id={`task-${task.id}`}
                  checked={task.completed}
                  onChange={() => onToggleTask(task.id)}
                  label={task.title}
                />
                {task.value && (
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    task.completed 
                      ? 'bg-zinc-950/40 text-zinc-650' 
                      : 'bg-zinc-950/80 text-zinc-450 border border-zinc-800/60'
                  }`}>
                    {task.value}
                  </span>
                )}
              </div>
            ))}
          </div>
          
          <div className="text-[10px] text-zinc-500 text-center mt-3 bg-zinc-900/20 py-1.5 rounded border border-zinc-850">
            Toggling missions updates biometrics efficiency scores instantly
          </div>
        </div>
      )}
    </Card>
  );
};
