import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { subDays, format, eachDayOfInterval } from 'date-fns';
import StatsChart from '@/components/StatsChart';

export default async function StatsPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch last 7 days of logs
  const sevenDaysAgo = format(subDays(new Date(), 6), 'yyyy-MM-dd');
  
  const { data: logs } = await supabase
    .from('habit_logs')
    .select('log_date, is_completed')
    .eq('user_id', user.id)
    .gte('log_date', sevenDaysAgo)
    .eq('is_completed', true);

  const logCounts = (logs || []).reduce((acc: any, log: any) => {
    acc[log.log_date] = (acc[log.log_date] || 0) + 1;
    return acc;
  }, {});

  // Build sequential array for graph
  const days = eachDayOfInterval({
    start: subDays(new Date(), 6),
    end: new Date()
  });

  const chartData = days.map(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return {
      day: format(day, 'EEE'), // Mon, Tue, etc.
      completions: logCounts[dateStr] || 0,
    };
  });

  // Calculate some simple metrics
  const totalThisWeek = chartData.reduce((sum, d) => sum + d.completions, 0);
  const bestDay = [...chartData].sort((a,b) => b.completions - a.completions)[0];

  return (
    <div className="w-full">
      <header className="mb-10">
        <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">Stats</h1>
        <p className="text-zinc-400 text-lg font-medium">Your performance over the last 7 days.</p>
      </header>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <p className="text-zinc-500 text-sm font-medium mb-1">Weekly Completions</p>
          <div className="text-4xl font-bold text-white">{totalThisWeek}</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <p className="text-zinc-500 text-sm font-medium mb-1">A-Game Day</p>
          <div className="text-4xl font-bold text-white">
            {bestDay.completions > 0 ? bestDay.day : 'N/A'}
          </div>
        </div>
      </div>

      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 pt-10">
        <h2 className="text-xl font-bold text-white mb-8">Activity Flow</h2>
        <StatsChart data={chartData} />
      </section>
    </div>
  );
}
