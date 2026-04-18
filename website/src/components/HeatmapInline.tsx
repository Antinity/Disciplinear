'use client';

import { useState, useRef, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

type DayData = {
  date: string;       // yyyy-MM-dd
  count: number;      // Successful Build habits
  relapsed: number;   // Relapsed Quit habits
  totalBuild: number;
  totalQuit: number;
};

type TooltipState = {
  x: number;
  y: number;
  data: DayData;
} | null;

// 7-row (Sun→Sat) heatmap that fills columns left→right
export default function HeatmapInline({ days }: { days: DayData[] }) {
  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Group into columns of 7 (weeks)
  const weeks: (DayData | null)[][] = [];
  let week: (DayData | null)[] = [];

  const firstDay = days[0] ? parseISO(days[0].date) : new Date();
  const startDow = firstDay.getDay(); 
  for (let p = 0; p < startDow; p++) week.push(null);

  for (const day of days) {
    week.push(day);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  const getColor = (d: DayData | null) => {
    if (!d || !d.date) return 'transparent';
    const { count, relapsed } = d;
    
    if (count === 0 && relapsed === 0) return 'var(--border-subtle)';
    
    // BOTH = Yellow
    if (count > 0 && relapsed > 0) {
      return '#ffcc00'; // Apple Yellow
    }
    
    // Bad over Good (or just Bad if Good is 0)
    if (relapsed > count) {
       return '#ff3b30'; // Apple Red
    }
    
    // Good over Bad
    if (count > relapsed) {
       return '#34c759'; // Apple Green
    }

    return 'var(--border-subtle)';
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
            className="heatmap-tooltip p-3 min-w-[140px]"
            style={{ left: tooltip.x, top: tooltip.y }}
            initial={{ opacity: 0, scale: 0.9, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 5 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            <div className="font-bold text-[var(--text-primary)] mb-2 border-b border-[var(--border-subtle)] pb-1.5 text-[12px]">
              {format(parseISO(tooltip.data.date), 'MMM d, yyyy')}
            </div>
            
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Completed</span>
                <span className="text-[11px] font-black text-emerald-500 tabular-nums">
                   {tooltip.data.count}/{tooltip.data.totalBuild}
                </span>
              </div>
              
              <div className="flex items-center justify-between gap-4">
                <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Relapsed</span>
                <span className={`text-[11px] font-black tabular-nums ${tooltip.data.relapsed > 0 ? 'text-red-500 animate-pulse' : 'text-[var(--text-muted)]'}`}>
                   {tooltip.data.relapsed}/{tooltip.data.totalQuit}
                </span>
              </div>
            </div>

            {/* Dynamic Status Tag */}
            <div className="mt-2.5 pt-2 border-t border-[var(--border-subtle)]">
                {tooltip.data.relapsed === 0 && tooltip.data.count > 0 && (
                   <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500/80">✨ Perfect Day</span>
                )}
                {tooltip.data.relapsed > 0 && tooltip.data.count > 0 && (
                   <span className="text-[10px] font-black uppercase tracking-widest text-[#ffcc00]/80">⚠️ Mixed Results</span>
                )}
                {tooltip.data.relapsed > 0 && tooltip.data.count === 0 && (
                   <span className="text-[10px] font-black uppercase tracking-widest text-red-500/80">🚫 Failed</span>
                )}
                {tooltip.data.relapsed === 0 && tooltip.data.count === 0 && (
                   <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">No Logs</span>
                )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="flex items-center justify-end gap-3 text-[10px] font-bold text-[var(--text-secondary)] mt-2 uppercase tracking-widest opacity-60">
        <div className="flex items-center gap-1">
          <div className="w-[10px] h-[10px] rounded-[2px] bg-[var(--border-subtle)]" />
          <span>Empty</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-[10px] h-[10px] rounded-[2px] bg-[#34c759]" />
          <span>Success</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-[10px] h-[10px] rounded-[2px] bg-[#ffcc00]" />
          <span>Mixed</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-[10px] h-[10px] rounded-[2px] bg-[#ff3b30]" />
          <span>Relapse</span>
        </div>
      </div>
    </div>
  );
}
