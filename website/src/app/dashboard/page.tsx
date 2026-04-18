import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { format } from 'date-fns';
import OptimisticDashboard from '@/components/OptimisticDashboard';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const today = format(new Date(), 'yyyy-MM-dd');
  const currentYear = new Date().getFullYear();

  const startOfThisYear = format(new Date(currentYear, 0, 1), 'yyyy-MM-dd');
  const endOfThisYear = format(new Date(currentYear, 11, 31), 'yyyy-MM-dd');

  // Fetch all needed data in parallel
  const [habitsRes, todayLogsRes, allLogsRes] = await Promise.all([
    supabase.from('habits').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('habit_logs').select('*').eq('user_id', user.id).eq('log_date', today),
    supabase.from('habit_logs').select('habit_id,log_date,is_completed').eq('user_id', user.id).gte('log_date', startOfThisYear).lte('log_date', endOfThisYear).eq('is_completed', true),
  ]);

  const habits = habitsRes.data || [];
  const todayLogs = todayLogsRes.data || [];
  const allLogs = allLogsRes.data || [];

  return (
    <OptimisticDashboard 
      habits={habits}
      initialTodayLogs={todayLogs}
      initialAllLogs={allLogs}
      today={today}
      currentYear={currentYear}
    />
  );
}
