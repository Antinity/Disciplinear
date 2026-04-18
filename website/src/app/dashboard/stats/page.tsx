import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { subDays, format, eachDayOfInterval } from 'date-fns';
import StatsChart from '@/components/StatsChart';
import DisciplineScore from '@/components/analytics/DisciplineScore';
import ResilienceScore from '@/components/analytics/ResilienceScore';
import HabitCorrelations from '@/components/analytics/HabitCorrelations';
import RadarBalance from '@/components/analytics/RadarBalance';
import { calculateDisciplineScore, calculateResilienceScore, calculateCorrelations, calculatePerfectDays, calculateLongestStreak, calculateMostDisciplinedDay } from '@/utils/analytics';
import { Trophy, Star, Zap, Flame } from 'lucide-react';

export default async function StatsPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch ALL habits
  const { data: habits } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', user.id);

  // Fetch ALL logs for metrics calculation
  const { data: allLogsRaw } = await supabase
    .from('habit_logs')
    .select('habit_id, log_date, is_completed')
    .eq('user_id', user.id);

  const allLogs = (allLogsRaw || []).map(l => ({
    habit_id: l.habit_id,
    log_date: l.log_date,
    is_completed: l.is_completed
  }));

  // Fetch last 7 days for the basic chart
  const sevenDaysAgo = format(subDays(new Date(), 6), 'yyyy-MM-dd');
  const recentLogs = allLogs.filter(l => l.log_date >= sevenDaysAgo && l.is_completed);

  const logCounts = recentLogs.reduce((acc: any, log: any) => {
    acc[log.log_date] = (acc[log.log_date] || 0) + 1;
    return acc;
  }, {});

  const days = eachDayOfInterval({
    start: subDays(new Date(), 6),
    end: new Date()
  });

  const chartData = days.map(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return {
      day: format(day, 'EEE'),
      completions: logCounts[dateStr] || 0,
    };
  });

  // Calculate Advanced Metrics
  const disciplineScore = calculateDisciplineScore(habits || [], allLogs);
  const resilienceScore = calculateResilienceScore(habits || [], allLogs);
  const correlations = calculateCorrelations(habits || [], allLogs);
  const perfectDays = calculatePerfectDays(habits || [], allLogs);
  const longestStreak = calculateLongestStreak(habits || [], allLogs);
  const mostDisciplinedDay = calculateMostDisciplinedDay(allLogs);

  return (
    <div className="w-full max-w-7xl mx-auto pb-20">
      <header className="mb-12">
        <div className="flex items-center gap-3 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-widest border border-indigo-500/20">Pro Analytics</span>
        </div>
        <h1 className="text-5xl font-black text-white tracking-tighter mb-4">Deep Intelligence</h1>
        <p className="text-zinc-500 text-lg font-medium max-w-2xl">
          Moving beyond checkboxes. Disciplinear analyzes your behavioral patterns to find what fuels your consistency and how you bounce back.
        </p>
      </header>

      {/* Top Layer: Macro Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="md:col-span-1">
            <DisciplineScore score={disciplineScore} />
        </div>
        <div className="md:col-span-1">
            <ResilienceScore score={resilienceScore} />
        </div>
        <div className="md:col-span-1">
            <HabitCorrelations correlations={correlations} />
        </div>
      </div>

      {/* Second Layer: Activity Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <section className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-[32px] p-10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5">
                <div className="text-8xl font-black text-white">01</div>
            </div>
            
            <div className="flex items-center justify-between mb-10 relative z-10">
                <div>
                   <h2 className="text-2xl font-black text-white tracking-tight uppercase">Momentum Flow</h2>
                   <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">7-Day Completion Velocity</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Active</span>
                </div>
            </div>
            
            <div className="h-[300px] w-full">
                <StatsChart data={chartData} />
            </div>
        </section>

        <section className="bg-zinc-950 border border-zinc-900 rounded-[32px] p-8 flex flex-col justify-between group overflow-hidden relative">
             <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
             
             <div className="relative z-10">
                <h3 className="text-zinc-500 text-xs font-black uppercase tracking-[0.2em] mb-4">Life Balance</h3>
                <RadarBalance habits={habits || []} />
                
                <div className="space-y-6 mt-8">
                    <div>
                        <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest mb-1">Consistency</p>
                        <p className="text-3xl font-black text-emerald-500 tabular-nums">
                            {Math.round((chartData.filter(d => d.completions > 0).length / 7) * 100)}%
                        </p>
                    </div>
                </div>
             </div>

             <div className="mt-8 p-5 bg-zinc-900 rounded-2xl border border-zinc-800 relative z-10 transition-transform group-hover:scale-[1.02] duration-300">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 font-mono">Expert Tip</p>
                <p className="text-xs text-zinc-500 leading-relaxed font-medium italic">
                    "Your {correlations[0]?.follower.name || 'habit'} consistency usually peaks on {correlations[0]?.lead.name ? 'days you do ' + correlations[0].lead.name : 'Tuesdays'}. Focus on morning rituals."
                </p>
             </div>
        </section>
      </div>

      {/* Monthly Wrapped Style Section */}
      <section className="mt-20">
         <div className="flex items-center gap-4 mb-10">
            <h2 className="text-4xl font-black text-white tracking-tighter">The Monthly Wrap</h2>
            <div className="h-px flex-1 bg-zinc-900" />
            <span className="text-zinc-700 text-xs font-black uppercase tracking-[0.3em]">{format(new Date(), 'MMMM yyyy')}</span>
         </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/0 border border-emerald-500/10 rounded-3xl p-8 flex flex-col justify-between min-h-[180px] group hover:border-emerald-500/30 transition-all">
                <Star className="text-emerald-500 mb-4 group-hover:scale-110 transition-transform" size={24} />
                <div>
                   <p className="text-2xl font-black text-white">{perfectDays}</p>
                   <p className="text-[10px] font-black text-emerald-500/60 uppercase tracking-widest">Perfect Days</p>
                </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-500/10 to-indigo-500/0 border border-indigo-500/10 rounded-3xl p-8 flex flex-col justify-between min-h-[180px] group hover:border-indigo-500/30 transition-all">
                <Flame className="text-indigo-500 mb-4 group-hover:scale-110 transition-transform" size={24} />
                <div>
                   <p className="text-2xl font-black text-white">{longestStreak} Days</p>
                   <p className="text-[10px] font-black text-indigo-500/60 uppercase tracking-widest">Longest Streak</p>
                </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500/10 to-orange-500/0 border border-orange-500/10 rounded-3xl p-8 flex flex-col justify-between min-h-[180px] group hover:border-orange-500/30 transition-all">
                <Zap className="text-orange-500 mb-4 group-hover:scale-110 transition-transform" size={24} />
                <div>
                   <p className="text-2xl font-black text-white">{mostDisciplinedDay}</p>
                   <p className="text-[10px] font-black text-orange-500/60 uppercase tracking-widest">Most Disciplined</p>
                </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 flex flex-col justify-center items-center text-center group cursor-pointer hover:bg-zinc-800 transition-colors">
                <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mb-3 border border-zinc-700 group-hover:bg-zinc-700">
                    <Trophy size={20} className="text-zinc-500 group-hover:text-yellow-500 transition-colors" />
                </div>
                <p className="text-[10px] font-black text-white uppercase tracking-widest">Share Results</p>
            </div>
         </div>
      </section>

      {/* Footer Insight */}
      <footer className="mt-20 pt-10 border-t border-zinc-900 flex flex-col md:flex-row items-center justify-between gap-6 opacity-60">
        <div className="text-[11px] font-black text-zinc-600 uppercase tracking-[0.3em]">Disciplinear Analytics Engine v2.0</div>
        <div className="flex gap-4">
            {['Consistency', 'Balance', 'Resilience'].map(item => (
                <span key={item} className="text-[10px] font-black text-zinc-700 uppercase tracking-widest px-3 py-1 border border-zinc-900 rounded-full">{item}</span>
            ))}
        </div>
      </footer>
    </div>
  );
}

