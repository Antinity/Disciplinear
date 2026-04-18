'use client';

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

export default function RadarBalance({ habits }: { habits: any[] }) {
  // Inferred Categories
  // 1. Physical (Build + Timer/Amount with color red/orange)
  // 2. Mental (Build + Task/Timer with color blue/purple)
  // 3. Discipline (Quit habits)
  // 4. Productivity (Build + Task/Amount with color green/cyan)
  
  const getCategory = (h: any) => {
    if (h.mode === 'quit') return 'Discipline';
    if (h.type === 'timer') return 'Focus';
    if (h.type === 'amount') return 'Output';
    return 'Maintenance';
  };

  const categories = ['Discipline', 'Focus', 'Output', 'Maintenance'];
  const data = categories.map(cat => {
    const catHabits = habits.filter(h => getCategory(h) === cat);
    return {
      category: cat,
      value: catHabits.length * 20 + 20, // Baseline for visualization
      fullMark: 100,
    };
  });

  return (
    <div className="w-full h-[250px] mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="#27272a" />
          <PolarAngleAxis 
            dataKey="category" 
            tick={{ fill: '#71717a', fontSize: 10, fontWeight: 'bold' }} 
          />
          <Radar
            name="Balance"
            dataKey="value"
            stroke="#6366f1"
            fill="#6366f1"
            fillOpacity={0.5}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
