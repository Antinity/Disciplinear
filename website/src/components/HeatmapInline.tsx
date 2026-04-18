'use client';

import { useState, useRef, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

type DayData = {
  date: string;       // yyyy-MM-dd
  count: number;
  total: number;
};

type TooltipState = {
  x: number;
  y: number;
  data: DayData;
} | null;

// 7-row (Sun→Sat) heatmap that fills columns left→right
export default function HeatmapInline({ days, totalHabits }: { days: DayData[]; totalHabits: number }) {
  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Group into columns of 7 (weeks). Sunday = 0
  const weeks: (DayData | null)[][] = [];
  let week: (DayData | null)[] = [];

  // Pad start so first day is correctly aligned (blank space for preceding weekdays)
  const firstDay = days[0] ? parseISO(days[0].date) : new Date();
  const startDow = firstDay.getDay(); // 0=Sun
  for (let p = 0; p < startDow; p++) week.push(null);

  for (const day of days) {
    week.push(day);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  // Fill the rest of the last week with blank spaces if any
  if (week.length) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  const getColor = (d: DayData | null) => {
    if (!d || !d.date) return 'transparent'; // Truly blank
    if (d.total === 0) return 'var(--border-subtle)';
    const pct = d.count / d.total;
    if (pct === 0) return 'var(--border-subtle)';
    if (pct < 0.25) return 'rgba(52, 199, 89, 0.3)';
    if (pct < 0.5) return 'rgba(52, 199, 89, 0.6)';
    if (pct < 0.75) return 'rgba(52, 199, 89, 0.85)';
    return '#34c759'; // Full Apple Green
  };

  const handleMouseMove = useCallback((e: React.MouseEvent, d: DayData | null) => {
    if (!d || !d.date) return;
    setTooltip({ x: e.clientX + 4, y: e.clientY + 4, data: d });
  }, []);

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden">
      <div 
        className="grid gap-[2px] w-full pt-[2px]"
        style={{ 
          gridTemplateColumns: `auto repeat(${weeks.length}, 1fr)`,
          gridTemplateRows: 'repeat(7, auto)'
        }}
      >
        {/* Row Headers (Weekdays) */}
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, ri) => (
          <div 
            key={ri} 
            className="text-[8px] font-black text-[var(--text-primary)] opacity-40 flex items-center justify-center pr-1.5"
            style={{ gridRow: ri + 1, gridColumn: 1, height: '100%' }}
          >
            {d}
          </div>
        ))}

        {/* Data Cells */}
        {weeks.map((weekData, wi) => (
          weekData.map((d, di) => (
            <div
              key={`${wi}-${di}`}
              onMouseMove={e => handleMouseMove(e, d)}
              onMouseLeave={() => setTooltip(null)}
              className={`relative rounded-[3px] transition-colors duration-200 ${d ? 'hover:brightness-90' : ''}`}
              style={{
                gridRow: di + 1,
                gridColumn: wi + 2,
                backgroundColor: getColor(d),
                cursor: d?.date ? 'crosshair' : 'default',
                width: '100%',
                aspectRatio: '1/1',
                border: d?.date ? '1px solid rgba(255,255,255,0.02)' : 'none'
              }}
            >
              {d && (
                <div className="absolute inset-0 bg-black/20 dark:bg-white/20 opacity-0 hover:opacity-100 transition-opacity duration-200 rounded-[3px]" />
              )}
            </div>
          ))
        ))}
      </div>

      {/* Floating Tooltip */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            className="heatmap-tooltip"
            style={{ left: tooltip.x, top: tooltip.y }}
            initial={{ opacity: 0, scale: 0.9, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 5 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            <div className="font-bold text-[var(--text-primary)] mb-1">
              {format(parseISO(tooltip.data.date), 'MMM d, yyyy')}
            </div>
            <div className="text-[var(--text-secondary)] font-medium">
              {tooltip.data.count} / {tooltip.data.total} habits
            </div>
            {tooltip.data.total > 0 && (
              <div className="mt-2 h-1.5 rounded-full bg-[var(--border-subtle)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#34c759] transition-all duration-300"
                  style={{ width: `${Math.round((tooltip.data.count / tooltip.data.total) * 100)}%` }}
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1.5 text-[11px] font-semibold text-[var(--text-secondary)] mt-1">
        <span>Less</span>
        {['var(--border-subtle)', 'rgba(52, 199, 89, 0.3)', 'rgba(52, 199, 89, 0.6)', 'rgba(52, 199, 89, 0.85)', '#34c759'].map(c => (
          <div key={c} className="w-[12px] h-[12px] rounded-[3px]" style={{ backgroundColor: c }} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
