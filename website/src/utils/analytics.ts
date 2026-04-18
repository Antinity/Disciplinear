import { format, parseISO, differenceInDays, subDays, eachDayOfInterval } from 'date-fns';

export type Habit = {
  id: string;
  name: string;
  mode: 'build' | 'quit';
  start_date: string;
  color: string;
  emoji?: string;
};

export type HabitLog = {
  habit_id: string;
  log_date: string;
  is_completed: boolean;
};

/**
 * Calculates the Discipline Score (0-100)
 * Logic: Rolling 30-day consistency vs targets.
 * Weight long streaks higher. Penalize misses.
 */
export function calculateDisciplineScore(habits: Habit[], allLogs: HabitLog[]): number {
  if (habits.length === 0) return 0;

  const today = new Date();
  const thirtyDaysAgo = subDays(today, 30);
  const relevantLogs = allLogs.filter(l => parseISO(l.log_date) >= thirtyDaysAgo);

  let totalPossiblepoints = 0;
  let earnedPoints = 0;

  habits.forEach(habit => {
    // For simplicity, assuming daily habits for now.
    // In a real app, we'd check habit.frequency
    const daysSinceStart = Math.min(30, differenceInDays(today, parseISO(habit.start_date)) + 1);
    totalPossiblepoints += daysSinceStart;

    const habitLogs = relevantLogs.filter(l => l.habit_id === habit.id && l.is_completed);
    
    if (habit.mode === 'build') {
      earnedPoints += habitLogs.length;
    } else {
      // For quit habits, every day WITHOUT a log is a success
      const relapses = habitLogs.length;
      earnedPoints += Math.max(0, daysSinceStart - relapses);
    }
  });

  if (totalPossiblepoints === 0) return 0;
  return Math.round((earnedPoints / totalPossiblepoints) * 100);
}

/**
 * Calculates the Resilience / Bounce-Back Rate
 * Logic: Average days taken to resume habit after a failure (or get back on track after relapse)
 */
export function calculateResilienceScore(habits: Habit[], allLogs: HabitLog[]): number {
  let totalBounces = 0;
  let totalRecoveryDays = 0;

  habits.forEach(habit => {
    const habitLogs = [...allLogs]
      .filter(l => l.habit_id === habit.id)
      .sort((a, b) => a.log_date.localeCompare(b.log_date));

    if (habitLogs.length < 2) return;

    if (habit.mode === 'build') {
      for (let i = 0; i < habitLogs.length - 1; i++) {
        const current = parseISO(habitLogs[i].log_date);
        const next = parseISO(habitLogs[i+1].log_date);
        const diff = differenceInDays(next, current);

        if (diff > 1) {
          totalBounces++;
          // We recovered after 'diff' days
          totalRecoveryDays += diff - 1;
        }
      }
    } else {
      // For quit habits, relapses are the "failures"
      const relapses = habitLogs.filter(l => l.is_completed); // Assuming is_completed means relapse for 'quit'
      if (relapses.length < 2) return;

      for (let i = 0; i < relapses.length - 1; i++) {
        const current = parseISO(relapses[i].log_date);
        const next = parseISO(relapses[i+1].log_date);
        const diff = differenceInDays(next, current);
        
        if (diff > 1) {
          totalBounces++;
          totalRecoveryDays += diff - 1;
        }
      }
    }
  });

  if (totalBounces === 0) return 100; // Perfect resilience (never failed long enough to "recover")
  
  // Average recovery time. 1 day = 100%, 7 days = 0% (arbitrary scale)
  const avgRecovery = totalRecoveryDays / totalBounces;
  return Math.max(0, Math.min(100, Math.round(100 - (avgRecovery * 10))));
}

/**
 * Finds correlations between habits (The Domino Effect)
 * Returns pairs like: { leadHabit, followerHabit, probability }
 */
export function calculateCorrelations(habits: Habit[], allLogs: HabitLog[]) {
  const correlations: { lead: Habit; follower: Habit; probability: number }[] = [];
  
  if (habits.length < 2) return [];

  habits.forEach(lead => {
    habits.forEach(follower => {
      if (lead.id === follower.id) return;

      const leadSuccessDates = new Set(
        allLogs.filter(l => l.habit_id === lead.id && l.is_completed === (lead.mode === 'build')).map(l => l.log_date)
      );

      if (leadSuccessDates.size === 0) return;

      const followerSuccessDates = allLogs.filter(l => 
        l.habit_id === follower.id && 
        l.is_completed === (follower.mode === 'build') &&
        leadSuccessDates.has(l.log_date)
      );

      const probability = (followerSuccessDates.length / leadSuccessDates.size) * 100;

      if (probability > 60 && leadSuccessDates.size > 2) {
        correlations.push({ lead, follower, probability: Math.round(probability) });
      }
    });
  });


  return correlations.sort((a, b) => b.probability - a.probability).slice(0, 3);
}

export function calculateStreak(logs: string[], mode: 'build' | 'quit', startDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (mode === 'build') {
    if (!logs.length) return 0;
    const sorted = [...logs].sort((a, b) => b.localeCompare(a));
    let streak = 0;
    let cursor = new Date(today);

    for (const dateStr of sorted) {
      const d = new Date(dateStr);
      d.setHours(0, 0, 0, 0);
      const diffDays = Math.round((cursor.getTime() - d.getTime()) / 86400000);
      if (diffDays === 0) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
      } else if (diffDays === 1) {
        streak++;
        cursor = d;
        cursor.setDate(cursor.getDate() - 1);
      } else break;
    }
    return streak;
  } else {
    // QUIT MODE: Consecutive days WITHOUT a log (relapse)
    const sortedRelapses = [...logs].sort((a, b) => b.localeCompare(a));
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    // If never relapsed, streak is days since start
    if (sortedRelapses.length === 0) {
      return Math.max(0, Math.round((today.getTime() - start.getTime()) / 86400000));
    }

    const lastRelapseStr = sortedRelapses[0];
    const lastRelapse = new Date(lastRelapseStr);
    lastRelapse.setHours(0, 0, 0, 0);

    if (lastRelapse.getTime() === today.getTime()) return 0; // Relapsed today

    return Math.max(0, Math.round((today.getTime() - lastRelapse.getTime()) / 86400000));
  }
}

export function calculatePerfectDays(habits: Habit[], allLogs: HabitLog[]): number {
  if (habits.length === 0) return 0;

  const logsByDate = allLogs.reduce((acc: any, log) => {
    if (!acc[log.log_date]) acc[log.log_date] = [];
    acc[log.log_date].push(log);
    return acc;
  }, {});

  // Find earliest start date
  const earliestStartStr = habits.reduce((min, h) => h.start_date < min ? h.start_date : min, habits[0].start_date);
  const startDate = parseISO(earliestStartStr);
  const today = new Date();

  const days = eachDayOfInterval({ start: startDate, end: today });
  let perfectDays = 0;

  days.forEach(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const dailyLogs = logsByDate[dateStr] || [];
    
    // Only check habits that had already started
    const activeHabits = habits.filter(h => h.start_date <= dateStr);
    if (activeHabits.length === 0) return;

    const buildHabits = activeHabits.filter(h => h.mode === 'build');
    const quitHabits = activeHabits.filter(h => h.mode === 'quit');

    const buildCompleted = dailyLogs.filter((l: any) => buildHabits.some(h => h.id === l.habit_id)).length;
    const quitRelapsed = dailyLogs.filter((l: any) => quitHabits.some(h => h.id === l.habit_id)).length;

    // A day is perfect if all build habits are done AND no quit habits relapsed
    // Also require at least one build habit completed OR it's a "clean" quit day
    if (buildCompleted === buildHabits.length && quitRelapsed === 0) {
      perfectDays++;
    }
  });

  return perfectDays;
}

export function calculateLongestStreak(habits: Habit[], allLogs: HabitLog[]): number {
  if (habits.length === 0) return 0;

  const logsByDate = allLogs.reduce((acc: any, log) => {
    if (!acc[log.log_date]) acc[log.log_date] = [];
    acc[log.log_date].push(log);
    return acc;
  }, {});

  const earliestStartStr = habits.reduce((min, h) => h.start_date < min ? h.start_date : min, habits[0].start_date);
  const startDate = parseISO(earliestStartStr);
  const today = new Date();

  const days = eachDayOfInterval({ start: startDate, end: today });

  let maxStreak = 0;
  let currentStreak = 0;

  days.forEach(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const dailyLogs = logsByDate[dateStr] || [];
    
    const activeHabits = habits.filter(h => h.start_date <= dateStr);
    if (activeHabits.length === 0) {
      currentStreak = 0;
      return;
    }

    const buildHabits = activeHabits.filter(h => h.mode === 'build');
    const quitHabits = activeHabits.filter(h => h.mode === 'quit');

    const buildCompleted = dailyLogs.filter((l: any) => buildHabits.some(h => h.id === l.habit_id)).length;
    const quitRelapsed = dailyLogs.filter((l: any) => quitHabits.some(h => h.id === l.habit_id)).length;

    const isPerfect = (buildHabits.length > 0 ? buildCompleted === buildHabits.length : true) && quitRelapsed === 0;

    if (isPerfect) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  });

  return maxStreak;
}

export function calculateMostDisciplinedDay(allLogs: HabitLog[]): string {
  const dayStats: any = {
    'Sunday': { completed: 0, total: 0 },
    'Monday': { completed: 0, total: 0 },
    'Tuesday': { completed: 0, total: 0 },
    'Wednesday': { completed: 0, total: 0 },
    'Thursday': { completed: 0, total: 0 },
    'Friday': { completed: 0, total: 0 },
    'Saturday': { completed: 0, total: 0 },
  };

  allLogs.forEach(log => {
    const dayName = format(parseISO(log.log_date), 'EEEE');
    dayStats[dayName].total++;
    if (log.is_completed) {
      dayStats[dayName].completed++;
    }
  });

  let bestDay = 'N/A';
  let bestRate = -1;

  Object.keys(dayStats).forEach(day => {
    const rate = dayStats[day].total > 0 ? dayStats[day].completed / dayStats[day].total : 0;
    if (rate > bestRate) {
      bestRate = rate;
      bestDay = day;
    }
  });

  return bestDay;
}

