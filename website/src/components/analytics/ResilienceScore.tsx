'use client';

import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

export default function ResilienceScore({ score }: { score: number }) {
  const getColor = (s: number) => {
    if (s >= 80) return '#5856d6'; // Apple Purple
    if (s >= 50) return '#007aff'; // Apple Blue
    return '#ff9500'; // Apple Orange
  };

  const color = getColor(score);

  return (
    <div className="relative group overflow-hidden bg-zinc-900 border border-zinc-800 rounded-3xl p-8 min-h-[220px]">
      <div 
        className="absolute bottom-0 right-0 w-32 h-32 opacity-10 blur-3xl transform translate-x-10 translate-y-10"
        style={{ backgroundColor: color }}
      />

      <div className="relative z-10 h-full flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-zinc-500 text-xs font-black uppercase tracking-[0.2em]">Resilience Rate</h3>
            <Shield size={14} className="text-zinc-600" />
          </div>
          <div className="text-4xl font-black text-white mt-2 flex items-baseline gap-1">
            {score}<span className="text-lg text-zinc-600">%</span>
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">
            <span>Recovery Speed</span>
            <span>{score >= 80 ? 'Fast' : score >= 50 ? 'Moderate' : 'Slow'}</span>
          </div>
          <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
            <motion.div 
              className="h-full rounded-full"
              style={{ backgroundColor: color }}
              initial={{ width: 0 }}
              animate={{ width: `${score}%` }}
              transition={{ duration: 1, ease: "circOut" }}
            />
          </div>
          <p className="mt-4 text-[11px] font-medium text-zinc-500 leading-relaxed uppercase tracking-tight">
            The truest test of discipline isn't a long streak, but how quickly you recovery from a failure.
          </p>
        </div>
      </div>
    </div>
  );
}
