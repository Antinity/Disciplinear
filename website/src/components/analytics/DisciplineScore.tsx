'use client';

import { motion } from 'framer-motion';

export default function DisciplineScore({ score }: { score: number }) {
  // Determine color based on score
  const getColor = (s: number) => {
    if (s >= 80) return '#34c759'; // Apple Green
    if (s >= 50) return '#ffcc00'; // Apple Yellow
    return '#ff3b30'; // Apple Red
  };

  const color = getColor(score);

  return (
    <div className="relative group overflow-hidden bg-zinc-900 border border-zinc-800 rounded-3xl p-8 flex flex-col items-center justify-center min-h-[220px]">
      {/* Background Glow */}
      <div 
        className="absolute inset-0 opacity-10 blur-[60px] transition-all duration-700 group-hover:opacity-20"
        style={{ background: `radial-gradient(circle at center, ${color}, transparent)` }}
      />

      <div className="relative z-10 text-center">
        <h3 className="text-zinc-500 text-xs font-black uppercase tracking-[0.2em] mb-4">Discipline Score</h3>
        
        <div className="relative inline-flex items-center justify-center">
          <svg className="w-32 h-32 transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="58"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="10"
              fill="transparent"
            />
            <motion.circle
              cx="64"
              cy="64"
              r="58"
              stroke={color}
              strokeWidth="10"
              fill="transparent"
              strokeDasharray="364.4"
              initial={{ strokeDashoffset: 364.4 }}
              animate={{ strokeDashoffset: 364.4 - (364.4 * score) / 100 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span 
              className="text-4xl font-black text-white"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {score}
            </motion.span>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Points</span>
          </div>
        </div>

        <motion.p 
          className="mt-6 text-sm font-medium text-zinc-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          {score >= 90 ? 'Legendary Consistency' : 
           score >= 70 ? 'High Performance' : 
           score >= 40 ? 'Steady Progress' : 'Time to focus'}
        </motion.p>
      </div>
    </div>
  );
}
