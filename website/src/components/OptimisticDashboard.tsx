'use client';

import { useOptimistic, useTransition } from 'react';
import { format, subDays, eachDayOfInterval, startOfDay } from 'date-fns';
import AddHabitModal from '@/components/AddHabitModal';
import HabitList from '@/components/HabitList';
import WeekdayStrip from '@/components/WeekdayStrip';
import HeatmapInline from '@/components/HeatmapInline';
import { toggleHabitLog } from '@/app/dashboard/actions';

export default function OptimisticDashboard({
  habits,
  initialTodayLogs,
  initialAllLogs,
  today,
  currentYear,
}: {
  habits: any[];
  initialTodayLogs: any[];
  initialAllLogs: any[];
  today: string;
  currentYear: number;
}) {
  const [isPending, startTransition] = useTransition();

  const [allLogs, addOptimisticLog] = useOptimistic(
    initialAllLogs,
    (state, { habitId, isCompleted, date }) => {
      const existingIdx = state.findIndex(l => l.habit_id === habitId && l.log_date === date);
      if (isCompleted) {
        if (existingIdx > -1) return state; // Already exists
        return [...state, { habit_id: habitId, log_date: date, is_completed: true }];
      } else {
        if (existingIdx === -1) return state; // Doesn't exist
        return state.filter((_, i) => i !== existingIdx);
      }
    }
  );

  const habitCount = habits.length;

  const handleToggle = async (habitId: string, isCompleted: boolean) => {
    startTransition(async () => {
      addOptimisticLog({ habitId, isCompleted, date: today });
      await toggleHabitLog(habitId, today, isCompleted);
    });
  };

  // Recalculate everything based on optimistic logs
  const todayLogs = allLogs.filter(l => l.log_date === today);

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    const dateStr = format(d, 'yyyy-MM-dd');
    const completedCount = allLogs.filter(l => l.log_date === dateStr).length;
    return { 
      date: dateStr, 
      dayLabel: format(d, 'EEE'), 
      dayNum: format(d, 'd'), 
      pct: habitCount > 0 ? completedCount / habitCount : 0, 
      isToday: dateStr === today 
    };
  });

  const buildHabits = habits.filter(h => h.mode === 'build');
  const quitHabits = habits.filter(h => h.mode === 'quit');

  const startOfThisYear = startOfDay(new Date(currentYear, 0, 1));
  const endOfThisYear = startOfDay(new Date(currentYear, 11, 31));

  const daysYear = eachDayOfInterval({ 
    start: startOfThisYear, 
    end: endOfThisYear 
  }).map(d => {
    const dateStr = format(d, 'yyyy-MM-dd');
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const isFuture = dateStr > todayStr;
    const logsForDay = allLogs.filter(l => l.log_date === dateStr);

    const activeBuildHabits = buildHabits.filter(h => h.start_date <= dateStr);
    const activeQuitHabits = quitHabits.filter(h => h.start_date <= dateStr);

    if (activeBuildHabits.length === 0 && activeQuitHabits.length === 0 || isFuture) {
      return { date: dateStr, count: 0, relapsed: 0, totalBuild: 0, totalQuit: 0 };
    }

    const buildCompleted = logsForDay.filter(l => activeBuildHabits.some(h => h.id === l.habit_id)).length;
    const quitRelapsed = logsForDay.filter(l => activeQuitHabits.some(h => h.id === l.habit_id)).length;

    return { 
      date: dateStr, 
      count: buildCompleted, 
      relapsed: quitRelapsed,
      totalBuild: activeBuildHabits.length,
      totalQuit: activeQuitHabits.length
    };
  });

  const formattedDate = format(new Date(), 'EEEE, MMMM do');
  const totalCompletedToday = todayLogs.length;
  const todayPct = habitCount > 0 ? Math.round((totalCompletedToday / habitCount) * 100) : 0;

  return (
    <div className="w-full space-y-6">
      <section className="glass-panel p-4 sm:p-6 rounded-[28px] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-0.5">
            <h1 className="text-[32px] font-black text-[var(--text-primary)] tracking-tight leading-none">Today</h1>
            <div className="flex items-center gap-2">
              <p className="text-[14px] text-[var(--text-secondary)] font-bold">{formattedDate}</p>
              {habitCount > 0 && <div className="h-3 w-[1.5px] bg-[var(--border-subtle)]" />}
              {habitCount > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-black text-[var(--accent-color)] uppercase tracking-wider">{todayPct}%</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {habitCount > 0 && (
              <div className="hidden lg:flex flex-col items-end gap-1">
                <div className="w-24 h-1.5 rounded-full bg-[var(--bg-input)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[var(--accent-color)] transition-all duration-[1000ms]"
                    style={{ width: `${todayPct}%` }}
                  />
                </div>
                <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">{totalCompletedToday}/{habitCount} Habits</span>
              </div>
            )}
            <AddHabitModal />
          </div>
        </div>
        <WeekdayStrip days={last7} />
      </section>

      <section>
        <HabitList
          habits={habits}
          logs={todayLogs}
          today={today}
          allLogs={allLogs}
          onToggle={handleToggle}
        />
      </section>

      {habitCount > 0 && (
        <section className="mt-8 p-6 rounded-[20px] glass-panel transition-all duration-300 w-full overflow-hidden">
          <h2 className="text-[13px] font-bold text-[var(--text-secondary)] mb-5 uppercase tracking-widest pl-1">Yearly Activity ({currentYear})</h2>
          <div className="w-full">
            <HeatmapInline days={daysYear} totalHabits={habitCount} />
          </div>
        </section>
      )}
    </div>
  );
}
