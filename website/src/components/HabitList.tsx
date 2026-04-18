'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Pencil, Trash2 } from 'lucide-react';
import { toggleHabitLog, updateHabit, deleteHabit } from '@/app/dashboard/actions';
import { HabitForm } from './AddHabitModal';
import Twemoji from './Twemoji';

export type Habit = {
  id: string;
  name: string;
  description?: string;
  emoji?: string;
  color: string;
  type: 'task' | 'amount' | 'timer';
  mode: 'build' | 'quit';
  frequency: string | string[];
  target_value?: number;
  unit?: string;
};

export type HabitLog = {
  habit_id: string;
  is_completed: boolean;
  value?: number;
};

function calculateStreak(logs: string[]): number {
  if (!logs.length) return 0;
  const sorted = [...logs].sort((a, b) => b.localeCompare(a));
  const today = new Date();
  let streak = 0;
  let cursor = new Date(today);
  cursor.setHours(0, 0, 0, 0);

  for (const dateStr of sorted) {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    const diffDays = Math.round((cursor.getTime() - d.getTime()) / 86400000);
    if (diffDays === 0) { streak++; cursor.setDate(cursor.getDate() - 1); }
    else if (diffDays === 1) { streak++; cursor = d; cursor.setDate(cursor.getDate() - 1); }
    else break;
  }
  return streak;
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────
export function EditHabitModal({ habit, onClose }: { habit: Habit; onClose: () => void }) {
  const handleUpdate = async (data: any) => {
    await updateHabit(habit.id, data);
  };

  return (
    <>
      <motion.div
        key="edit-backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999]"
      />
      <div className="fixed inset-0 flex items-center justify-center z-[1000] p-4 pointer-events-none">
        <motion.div
          key="edit-content"
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          className="bg-[var(--bg-card)] backdrop-blur-xl border border-[var(--border-subtle)] rounded-3xl p-7 w-full max-w-lg shadow-2xl pointer-events-auto max-h-[90vh] overflow-y-auto custom-scrollbar"
        >
          <div className="flex items-center justify-between mb-6 border-b border-[var(--border-subtle)] pb-4">
            <h2 className="text-xl font-black text-[var(--text-primary)]">Edit Habit</h2>
            <div className="flex gap-2">
              <button
                onClick={async () => { await deleteHabit(habit.id); onClose(); }}
                className="text-red-400 hover:text-red-300 p-2 rounded-full hover:bg-red-500/10 transition-colors"
                title="Delete Habit"
              >
                <Trash2 size={18} />
              </button>
              <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-2 rounded-full hover:bg-[var(--bg-hover)] transition-colors">
                <X size={20} />
              </button>
            </div>
          </div>
          <HabitForm initialData={habit} onSubmit={handleUpdate} onClose={onClose} submitLabel="Save Changes" />
        </motion.div>
      </div>
    </>
  );
}

// ─── Main HabitList ───────────────────────────────────────────────────────────
export default function HabitList({
  habits,
  logs,
  today,
  allLogs,
}: {
  habits: Habit[];
  logs: HabitLog[];
  today: string;
  allLogs: { habit_id: string; log_date: string; is_completed: boolean }[];
}) {
  if (habits.length === 0) {
    return (
      <div className="text-center py-20 border border-dashed border-[var(--border-subtle)] rounded-2xl">
        <div className="text-5xl mb-4 text-[var(--text-muted)] opacity-50">🌱</div>
        <h3 className="text-xl font-black text-[var(--text-primary)] mb-2 uppercase tracking-wide">No habits yet</h3>
        <p className="text-[var(--text-secondary)] max-w-xs mx-auto text-sm font-medium">Tap "New Habit" above to start building your discipline.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {habits.map((habit, i) => {
        const log = logs.find(l => l.habit_id === habit.id);
        const isCompleted = !!log?.is_completed;
        const habitAllLogs = allLogs.filter(l => l.habit_id === habit.id && l.is_completed).map(l => l.log_date);
        const streak = calculateStreak(habitAllLogs);

        return (
          <HabitCard
            key={habit.id}
            habit={habit}
            isCompleted={isCompleted}
            today={today}
            index={i}
            streak={streak}
          />
        );
      })}
    </div>
  );
}

function HabitCard({
  habit,
  isCompleted,
  today,
  index,
  streak,
}: {
  habit: Habit;
  isCompleted: boolean;
  today: string;
  index: number;
  streak: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const isQuit = habit.mode === 'quit';
  const displayCompleted = isQuit ? !isCompleted : isCompleted;

  const handleToggle = () => {
    startTransition(() => {
      toggleHabitLog(habit.id, today, !isCompleted);
    });
  };

  const getStreakIcon = (s: number) => {
    if (s <= 0) return null;
    if (s < 3) return <span key="s1" className="text-emerald-500 opacity-60">🌱</span>;
    if (s < 7) return <span key="s2" className="text-orange-500">🔥</span>;
    if (s < 14) return <span key="s3" className="text-orange-600 drop-shadow-sm font-bold animate-pulse">🔥</span>;
    return (
       <div key="s4" className="relative streak-active">
          <span className="text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]">✨🔥</span>
       </div>
    );
  };

  return (
    <>
      <AnimatePresence>
        {isEditing && (
          <EditHabitModal key={`modal-${habit.id}`} habit={habit} onClose={() => setIsEditing(false)} />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03, duration: 0.3 }}
        className={`group relative flex items-center gap-3 p-2.5 rounded-[40px] transition-colors cursor-pointer select-none border border-transparent ${
          displayCompleted ? 'opacity-80' : 'hover:bg-[var(--bg-hover)]'
        }`}
        style={{ 
          backgroundColor: `${habit.color}15`,
          border: `1px solid ${displayCompleted ? 'transparent' : `${habit.color}30`}`
        }}
        onClick={handleToggle}
      >
        {/* Left Icon/Emoji Section */}
        {habit.emoji ? (
          <div className="shrink-0 w-[44px] h-[44px] flex items-center justify-center transition-opacity group-active:opacity-80">
             <Twemoji emoji={habit.emoji} className="w-[32px] h-[32px]" />
          </div>
        ) : (
          <div 
            className="shrink-0 w-[44px] h-[44px] rounded-full flex items-center justify-center text-white text-xl shadow-sm transition-opacity group-active:opacity-80"
            style={{ backgroundColor: habit.color }}
          >
            {habit.name.charAt(0).toUpperCase()}
          </div>
        )}

        {/* Text Area */}
        <div className="flex-1 min-w-0 pr-2">
          <p className={`font-black text-[15px] text-[var(--text-primary)] leading-tight truncate ${isQuit && isCompleted ? 'line-through text-[var(--text-muted)]' : ''}`}>
            {habit.name}
          </p>
          <p className="text-[11px] font-bold text-[var(--text-secondary)] mt-0.5 truncate opacity-70 tracking-tight leading-none">
            {habit.type === 'amount' 
              ? `${habit.target_value} ${habit.unit || 'units'}` 
              : habit.type === 'timer' 
                ? `${habit.target_value} mins` 
                : habit.description || 'Consistency is Key'}
          </p>
        </div>

        {/* Action / Streak Check */}
        <div className="flex items-center gap-2.5 shrink-0 pr-1" onClick={e => e.stopPropagation()}>
          {streak >= 1 && (
             <div className="flex items-center gap-1">
                {getStreakIcon(streak)}
                <span className="text-[11px] font-black text-[var(--text-secondary)] tabular-nums">{streak}</span>
             </div>
          )}
          
          <button
            onClick={() => setIsEditing(true)}
            className="opacity-0 group-hover:opacity-100 p-2 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all"
          >
            <Pencil size={18} />
          </button>

          <div
            onClick={handleToggle}
            className={`w-[36px] h-[36px] rounded-full border-2 flex items-center justify-center transition-all cursor-pointer ${isPending ? 'opacity-40 animate-pulse' : ''}`}
            style={{
              borderColor: habit.color,
              backgroundColor: displayCompleted ? habit.color : 'transparent',
              color: displayCompleted ? 'white' : habit.color
            }}
          >
            {isQuit ? (
              isCompleted ? <Trash2 size={18} /> : <Check size={18} />
            ) : (
              displayCompleted ? <Check size={20} strokeWidth={3.5} /> : <div className="w-2.5 h-2.5 rounded-full" style={{ background: habit.color }} />
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}
