import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { format, subDays, eachDayOfInterval, startOfDay } from 'date-fns';
import AddHabitModal from '@/components/AddHabitModal';
import HabitList from '@/components/HabitList';
import WeekdayStrip from '@/components/WeekdayStrip';
import HeatmapInline from '@/components/HeatmapInline';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const today = format(new Date(), 'yyyy-MM-dd');
  const currentYear = new Date().getFullYear();
  const startOfThisYear = startOfDay(new Date(currentYear, 0, 1));
  const endOfThisYear = startOfDay(new Date(currentYear, 11, 31));

  const jan1 = format(startOfThisYear, 'yyyy-MM-dd');
  const dec31 = format(endOfThisYear, 'yyyy-MM-dd');

  // Fetch all needed data in parallel
  const [habitsRes, todayLogsRes, allLogsRes] = await Promise.all([
    supabase.from('habits').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('habit_logs').select('*').eq('user_id', user.id).eq('log_date', today),
    supabase.from('habit_logs').select('habit_id,log_date,is_completed').eq('user_id', user.id).gte('log_date', jan1).lte('log_date', dec31).eq('is_completed', true),
  ]);

  const habits = habitsRes.data || [];
  const todayLogs = todayLogsRes.data || [];
  const allLogs = allLogsRes.data || [];

  const habitCount = habits.length;

  // Build last-7-days data for weekday strip
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

  // Build current year heatmap data (Jan 1 to Dec 31)
  const daysYear = eachDayOfInterval({ 
    start: startOfThisYear, 
    end: endOfThisYear 
  }).map(d => {
    const dateStr = format(d, 'yyyy-MM-dd');
    const logsForDay = allLogs.filter(l => l.log_date === dateStr);
    return { date: dateStr, count: logsForDay.length, total: habitCount };
  });

  const formattedDate = format(new Date(), 'EEEE, MMMM do');
  const totalCompletedToday = todayLogs.filter(l => l.is_completed).length;
  const todayPct = habitCount > 0 ? Math.round((totalCompletedToday / habitCount) * 100) : 0;

  return (
    <div className="w-full space-y-6">
      {/* Integrated Header & Progress Section */}
      <section className="glass-panel p-4 sm:p-6 rounded-[28px] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-0.5">
            <h1 className="text-[32px] font-black text-[var(--text-primary)] tracking-tight leading-none">Today</h1>
            <div className="flex items-center gap-2">
              <p className="text-[14px] text-[var(--text-secondary)] font-bold">{formattedDate}</p>
              {habitCount > 0 && (
                <div className="h-3 w-[1.5px] bg-[var(--border-subtle)]" />
              )}
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

        {/* Weekday Strip inside the same panel */}
        <WeekdayStrip days={last7} />
      </section>

      {/* Habit Cards */}
      <section>
        <HabitList
          habits={habits}
          logs={todayLogs}
          today={today}
          allLogs={allLogs}
        />
      </section>

      {/* Inline Heatmap */}
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
