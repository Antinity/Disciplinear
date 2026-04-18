'use client';

import { motion } from 'framer-motion';
import { X, Trophy, Target, TrendingUp, Calendar } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import Twemoji from './Twemoji';
import { calculateStreak } from '@/utils/analytics';

type HabitHistoryLog = {
  log_date: string;
  is_completed: boolean;
};

export default function HabitAnalyticsModal({
  habit,
  logs,
  onClose
}: {
  habit: any;
  logs: HabitHistoryLog[];
  onClose: () => void;
}) {
  // Calculate Streaks
  const sortedLogs = [...logs].filter(l => l.is_completed).sort((a, b) => b.log_date.localeCompare(a.log_date));
  
  const calculateBestStreak = () => {
    if (logs.length === 0) {
      if (habit.mode === 'quit') {
        const start = parseISO(habit.start_date);
        return Math.max(0, differenceInDays(new Date(), start));
      }
      return 0;
    }

    if (habit.mode === 'build') {
      const dates = logs.filter(l => l.is_completed).map(l => l.log_date).sort();
      if (dates.length === 0) return 0;
      let max = 0;
      let current = 0;
      for (let i = 0; i < dates.length; i++) {
        if (i > 0) {
          const diff = differenceInDays(parseISO(dates[i]), parseISO(dates[i - 1]));
          if (diff === 1) current++;
          else {
            max = Math.max(max, current);
            current = 1;
          }
        } else current = 1;
      }
      return Math.max(max, current);
    } else {
      // QUIT MODE: Consecutive days WITHOUT a log (relapse)
      const relapseDates = logs.filter(l => l.is_completed).map(l => l.log_date).sort();
      const start = parseISO(habit.start_date);
      const today = new Date();

      if (relapseDates.length === 0) {
        return Math.max(0, differenceInDays(today, start));
      }

      let max = 0;
      let lastRelapse = start;

      for (const rDate of relapseDates) {
        const relapse = parseISO(rDate);
        max = Math.max(max, differenceInDays(relapse, lastRelapse));
        lastRelapse = relapse;
      }

      // Check from last relapse to today
      max = Math.max(max, differenceInDays(today, lastRelapse));
      return max;
    }
  };

  const bestStreak = calculateBestStreak();
  const currentStreak = calculateStreak(logs.filter(l => l.is_completed).map(l => l.log_date), habit.mode, habit.start_date);
  const totalCompletions = habit.mode === 'build' 
    ? logs.filter(l => l.is_completed).length 
    : Math.max(0, differenceInDays(new Date(), parseISO(habit.start_date)) + 1 - logs.filter(l => l.is_completed).length);
  const daysSinceStart = differenceInDays(new Date(), parseISO(habit.start_date)) + 1;
  const consistency = Math.round((totalCompletions / Math.max(1, daysSinceStart)) * 100);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[1100]"
      />
      <div className="fixed inset-0 flex items-center justify-center z-[1101] p-4 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-zinc-900 border border-zinc-800 rounded-[40px] w-full max-w-2xl overflow-hidden pointer-events-auto shadow-2xl"
        >
          {/* Header */}
          <div className="p-8 pb-0 flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-3xl flex items-center justify-center text-3xl shadow-lg" style={{ backgroundColor: `${habit.color}20`, border: `1px solid ${habit.color}40` }}>
                {habit.emoji ? <Twemoji emoji={habit.emoji} className="w-10 h-10" /> : habit.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-3xl font-black text-white tracking-tight">{habit.name}</h2>
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-1">Deep Habit Analysis</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-800 text-zinc-500 transition-colors">
              <X size={24} />
            </button>
          </div>

          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Stats Cards */}
            <div className="space-y-4">
               <div className="bg-zinc-950/50 border border-zinc-800/50 rounded-3xl p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                     <Trophy size={24} />
                  </div>
                  <div>
                     <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">All-Time Best Streak</p>
                     <p className="text-2xl font-black text-white">{bestStreak} <span className="text-sm text-zinc-700">Days</span></p>
                  </div>
               </div>

               <div className="bg-zinc-950/50 border border-zinc-800/50 rounded-3xl p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                     <Target size={24} />
                  </div>
                  <div>
                     <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Completion Rate</p>
                     <p className="text-2xl font-black text-white">{consistency}% <span className="text-sm text-zinc-700">Accuracy</span></p>
                  </div>
               </div>

               <div className="bg-zinc-950/50 border border-zinc-800/50 rounded-3xl p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                     <Calendar size={24} />
                  </div>
                  <div>
                     <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Total Days Active</p>
                     <p className="text-2xl font-black text-white">{totalCompletions} <span className="text-sm text-zinc-700">Logs</span></p>
                  </div>
               </div>
            </div>

            {/* Visual Section */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-[32px] p-6 flex flex-col justify-center gap-6">
                <div>
                   <h3 className="text-white font-black text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                       <TrendingUp size={16} className="text-indigo-400" /> Progression
                   </h3>
                   <div className="flex gap-1 h-32 items-end">
                       {Array.from({ length: 14 }).map((_, i) => {
                           const date = format(subDays(new Date(), 13 - i), 'yyyy-MM-dd');
                           const dayLog = logs.find(l => l.log_date === date);
                           const isSuccess = dayLog ? (habit.mode === 'build' ? dayLog.is_completed : !dayLog.is_completed) : false;
                           
                           return (
                               <div 
                                   key={i} 
                                   className="flex-1 rounded-full group relative transition-all duration-500"
                                   style={{ 
                                       height: isSuccess ? '100%' : '20%', 
                                       backgroundColor: isSuccess ? habit.color : '#27272a',
                                       opacity: isSuccess ? 1 : 0.3
                                   }}
                               >
                                   <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-zinc-800 text-[8px] font-black py-1.5 px-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-xl border border-zinc-700 whitespace-nowrap z-30">
                                       {format(subDays(new Date(), 13-i), 'MMM d')}
                                   </div>
                               </div>
                           );
                       })}
                   </div>
                </div>

                <div className="pt-6 border-t border-zinc-800">
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-3">Behavioral Insight</p>
                    <p className="text-xs text-zinc-400 leading-relaxed italic">
                        "Your consistency with {habit.name} is {consistency > 80 ? 'exceptional' : consistency > 50 ? 'improving' : 'unstable'}. 
                        {currentStreak >= bestStreak 
                          ? ` You've just set a new personal record of ${currentStreak} days!` 
                          : ` Maintaining your current streak for ${bestStreak - currentStreak + 1} more days will set a new personal record.`}
                    </p>
                </div>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
