'use client';

import { useEffect, useRef } from 'react';

interface ProgressRingProps {
  pct: number;       // 0–1
  color: string;
  size?: number;
  stroke?: number;
}

export default function ProgressRing({ pct, color, size = 36, stroke = 3 }: ProgressRingProps) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(pct, 1));

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0 -rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border-color)" strokeWidth={stroke} />
      <circle
        cx={size/2} cy={size/2} r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        className="progress-ring__circle"
      />
    </svg>
  );
}
