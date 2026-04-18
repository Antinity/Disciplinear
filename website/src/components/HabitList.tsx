'use client';

import { useState, useTransition, useRef, useEffect, useOptimistic } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Pencil, Trash2, BarChart2 } from 'lucide-react';
import { toggleHabitLog, updateHabit, deleteHabit } from '@/app/dashboard/actions';
import { HabitForm } from './AddHabitModal';
import Twemoji from './Twemoji';
import Sparkline from './Sparkline';
import { subDays, format } from 'date-fns';
import HabitAnalyticsModal from './HabitAnalyticsModal';
import { calculateStreak } from '@/utils/analytics';

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
  start_date: string;
};

export type HabitLog = {
  habit_id: string;
  is_completed: boolean;
  value?: number;
};


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
  onToggle,
}: {
  habits: Habit[];
  logs: HabitLog[];
  today: string;
  allLogs: { habit_id: string; log_date: string; is_completed: boolean }[];
  onToggle: (habitId: string, newVal: boolean) => Promise<void>;
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
      <AnimatePresence mode="popLayout">
        {habits.map((habit, i) => {
          const log = logs.find(l => l.habit_id === habit.id);
          const isCompleted = !!log?.is_completed;
          const habitAllLogs = allLogs.filter(l => l.habit_id === habit.id && l.is_completed).map(l => l.log_date);
          const streak = calculateStreak(habitAllLogs, habit.mode, habit.start_date);

          // Calculate 7-day history for sparkline
          const history = Array.from({ length: 7 }, (_, i) => {
            const date = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
            const hasLog = allLogs.some(l => l.habit_id === habit.id && l.log_date === date && l.is_completed);
            if (habit.mode === 'build') return hasLog ? 1 : 0;
            return hasLog ? 0 : 1; // For quit mode, no log = 1 (success)
          });

          return (
            <HabitCard
              key={habit.id}
              habit={habit}
              isCompleted={isCompleted}
              today={today}
              index={i}
              streak={streak}
              history={history}
              allLogs={allLogs}
              onToggle={async (newVal) => {
                await onToggle(habit.id, newVal);
              }}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function HabitCard({
  habit,
  isCompleted,
  today,
  index,
  streak,
  history,
  allLogs,
  onToggle,
}: {
  habit: Habit;
  isCompleted: boolean;
  today: string;
  index: number;
  streak: number;
  history: number[];
  allLogs: { habit_id: string; log_date: string; is_completed: boolean }[];
  onToggle: (newVal: boolean) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const isQuit = habit.mode === 'quit';
  const displayCompleted = isQuit ? !isCompleted : isCompleted;

  const handleToggle = () => {
    startTransition(async () => {
      await onToggle(!isCompleted);
    });
  };

  const getStreakIcon = (s: number, mode: 'build' | 'quit') => {
    if (s <= 0) return null;
    const emoji = mode === 'quit' ? '🛡️' : '🔥';
    const colorClass = mode === 'quit' ? 'text-blue-500' : 'text-orange-500';

    if (s < 3) return <span key="s1" className="text-emerald-500 opacity-60">🌱</span>;
    if (s < 7) return <span key="s2" className={colorClass}>{emoji}</span>;
    if (s < 14) return <span key="s3" className={`${colorClass} drop-shadow-sm font-bold animate-pulse`}>{emoji}</span>;
    return (
      <div key="s4" className="relative streak-active">
        <span className="text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]">✨{emoji}</span>
      </div>
    );
  };

  return (
    <>
      <AnimatePresence>
        {isEditing && (
          <EditHabitModal key={`modal-${habit.id}`} habit={habit} onClose={() => setIsEditing(false)} />
        )}
        {showAnalytics && (
          <HabitAnalyticsModal 
            key={`analytics-${habit.id}`} 
            habit={habit} 
            logs={allLogs.filter(l => l.habit_id === habit.id)} 
            onClose={() => setShowAnalytics(false)} 
          />
        )}
      </AnimatePresence>

      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ 
          layout: { type: "spring", stiffness: 300, damping: 30 },
          opacity: { duration: 0.2 },
          scale: { duration: 0.2 }
        }}
        className={`group relative flex items-center gap-3 p-2.5 rounded-[40px] transition-colors cursor-pointer select-none border border-transparent ${displayCompleted ? 'opacity-80' : 'hover:bg-[var(--bg-hover)]'
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
          <p className="font-black text-[15px] text-[var(--text-primary)] leading-tight truncate">
            {habit.name}
          </p>
          <p className="text-[11px] font-bold text-[var(--text-secondary)] mt-0.5 truncate opacity-70 tracking-tight leading-none">
            {habit.type === 'amount'
              ? `${habit.target_value} ${habit.unit || 'units'}`
              : habit.type === 'timer'
                ? `${habit.target_value} mins`
                : habit.description || (isQuit ? 'Clean Streak' : 'Building...')}
          </p>
        </div>

        <div className="hidden md:block mr-4 opacity-40 group-hover:opacity-100 transition-opacity">
          <Sparkline data={history} color={habit.color} />
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
          className="opacity-0 group-hover:opacity-100 p-2 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all"
        >
          <Pencil size={18} />
        </button>

        {/* Action / Streak Check */}
        <div className="flex items-center gap-1.5 shrink-0 pr-1" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setShowAnalytics(true)}
            className="opacity-0 group-hover:opacity-100 p-2 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all"
          >
            <BarChart2 size={18} />
          </button>

          {streak >= 1 && (
            <div className="flex items-center gap-1">
              {getStreakIcon(streak, habit.mode)}
              <span className="text-[11px] font-black text-[var(--text-secondary)] tabular-nums">{streak}</span>
            </div>
          )}

          <div
            onClick={handleToggle}
            className={`w-[36px] h-[36px] rounded-full border-2 flex items-center justify-center transition-all cursor-pointer ${isPending ? 'opacity-40 animate-pulse' : ''}`}
            style={{
              borderColor: isQuit ? (isCompleted ? '#ef4444' : habit.color) : habit.color,
              backgroundColor: isCompleted ? (isQuit ? '#ef4444' : habit.color) : 'transparent',
              color: isCompleted ? 'white' : (isQuit ? '#ef4444' : habit.color)
            }}
          >
            {isQuit ? (
              isCompleted && <X size={20} strokeWidth={3} />
            ) : (
              isCompleted && <Check size={20} strokeWidth={3.5} />
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}
