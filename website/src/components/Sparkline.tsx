'use client';

export default function Sparkline({ data, color }: { data: number[], color: string }) {
  const width = 100;
  const height = 30;
  const padding = 2;
  
  if (data.length === 0) return null;

  const max = Math.max(...data, 1);
  const getPathData = () => {
    if (data.length < 2) return '';
    
    const coords = data.map((d, i) => ({
      x: (i / (data.length - 1)) * (width - padding * 2) + padding,
      y: height - ((d / max) * (height - padding * 2) + padding)
    }));

    let d = `M ${coords[0].x},${coords[0].y}`;
    
    for (let i = 0; i < coords.length - 1; i++) {
      const curr = coords[i];
      const next = coords[i + 1];
      const cp1x = curr.x + (next.x - curr.x) / 2;
      const cp1y = curr.y;
      const cp2x = curr.x + (next.x - curr.x) / 2;
      const cp2y = next.y;
      d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${next.x},${next.y}`;
    }
    return d;
  };

  const pathData = getPathData();

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <path
        d={`${pathData} L ${width - padding},${height} L ${padding},${height} Z`}
        fill={`url(#gradient-${color})`}
        className="opacity-30"
      />
      <path
        d={pathData}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
