'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Zap } from 'lucide-react';
import Twemoji from '@/components/Twemoji';

type Correlation = {
  lead: { name: string; emoji?: string; color: string };
  follower: { name: string; emoji?: string; color: string };
  probability: number;
};

export default function HabitCorrelations({ correlations }: { correlations: Correlation[] }) {
  if (correlations.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 flex flex-col items-center justify-center text-center opacity-50">
        <Zap size={24} className="text-zinc-700 mb-3" />
        <h3 className="text-zinc-500 text-xs font-black uppercase tracking-[0.2em] mb-2">The Domino Effect</h3>
        <p className="text-xs text-zinc-600 font-medium px-4">Keep logging habits to discover correlations.</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
      <h3 className="text-zinc-500 text-xs font-black uppercase tracking-[0.2em] mb-6">The Domino Effect</h3>
      
      <div className="space-y-4">
        {correlations.map((c, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center justify-between p-4 rounded-2xl bg-zinc-950 border border-zinc-900 group hover:border-zinc-800 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-zinc-900">
                {c.lead.emoji ? <Twemoji emoji={c.lead.emoji} className="w-6 h-6" /> : <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.lead.color }} />}
              </div>
              <ArrowRight size={14} className="text-zinc-700" />
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-zinc-900">
                {c.follower.emoji ? <Twemoji emoji={c.follower.emoji} className="w-6 h-6" /> : <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.follower.color }} />}
              </div>
            </div>

            <div className="text-right">
              <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-0.5">Confidence</div>
              <div className="text-lg font-black text-emerald-500 tabular-nums">{c.probability}%</div>
            </div>

            {/* Tooltip-like text on hover or just below */}
            <div className="absolute inset-x-0 -bottom-12 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 px-4">
               <div className="bg-zinc-800 text-[10px] font-bold text-white p-2 rounded-lg shadow-xl text-center">
                  Completing <span style={{ color: c.lead.color }}>{c.lead.name}</span> makes you {c.probability}% more likely to do <span style={{ color: c.follower.color }}>{c.follower.name}</span>.
               </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
