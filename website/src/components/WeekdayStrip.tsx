'use client';

import ProgressRing from './ProgressRing';
import { format, parseISO, isToday } from 'date-fns';

type DayItem = {
  date: string;
  dayLabel: string;   // 'Mon'
  dayNum: string;     // '14'
  pct: number;        // 0-1
  isToday: boolean;
};

export default function WeekdayStrip({ days }: { days: DayItem[] }) {
  return (
    <div className="flex justify-between items-center bg-[var(--bg-input)] p-1 rounded-[24px] border border-[var(--border-subtle)]">
      {days.map((d, i) => {
        const active = d.isToday;
        return (
          <div
            key={i}
            className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-[20px] transition-all duration-500 ${
              active ? 'bg-[var(--accent-color)] shadow-xl shadow-indigo-500/30' : 'hover:bg-[var(--bg-hover)]'
            }`}
          >
            <span className={`text-[9px] font-black uppercase tracking-tighter ${active ? 'text-white' : 'text-[var(--text-muted)]'}`}>
              {d.dayLabel.substring(0, 3)}
            </span>
            <div className={`w-[28px] h-[28px] rounded-full flex items-center justify-center transition-all ${active ? 'bg-white text-[var(--accent-color)] shadow-sm' : 'text-[var(--text-primary)] font-black'}`}>
              <span className="text-[14px]">{d.dayNum}</span>
            </div>
            
            {/* 5-Dot Progress Indicator */}
            <div className="flex gap-[2px] h-[3px] items-center mt-0.5">
              {[1, 2, 3, 4, 5].map((dot) => {
                const filled = d.pct >= (dot / 5);
                return (
                  <div 
                    key={dot} 
                    className={`w-[3px] h-[3px] rounded-full transition-all duration-700 ${
                      active 
                        ? (filled ? 'bg-white' : 'bg-white/30')
                        : (filled ? 'bg-[var(--accent-color)]' : 'bg-[var(--border-subtle)]')
                    }`} 
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
