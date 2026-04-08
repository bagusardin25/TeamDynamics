"use client";

interface RadarChartProps {
  data: { label: string; value: number }[];
  size?: number;
  className?: string;
}

export function RadarChart({ data, size = 140, className = "" }: RadarChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const maxRadius = size / 2 - 16;
  const levels = 4;
  const angleStep = (2 * Math.PI) / data.length;

  // Generate points for a given radius
  const getPolygonPoints = (radius: number) =>
    data
      .map((_, i) => {
        const angle = angleStep * i - Math.PI / 2;
        return `${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`;
      })
      .join(" ");

  // Generate data polygon points
  const dataPoints = data
    .map((d, i) => {
      const angle = angleStep * i - Math.PI / 2;
      const r = (d.value / 100) * maxRadius;
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
    })
    .join(" ");

  // Generate label positions
  const labels = data.map((d, i) => {
    const angle = angleStep * i - Math.PI / 2;
    const labelR = maxRadius + 12;
    return {
      x: cx + labelR * Math.cos(angle),
      y: cy + labelR * Math.sin(angle),
      label: d.label,
      value: d.value,
    };
  });

  return (
    <svg width={size} height={size} className={className} viewBox={`0 0 ${size} ${size}`}>
      {/* Background grid */}
      {Array.from({ length: levels }, (_, i) => (
        <polygon
          key={`grid-${i}`}
          points={getPolygonPoints((maxRadius / levels) * (i + 1))}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth={0.5}
          opacity={0.5}
        />
      ))}

      {/* Axis lines */}
      {data.map((_, i) => {
        const angle = angleStep * i - Math.PI / 2;
        return (
          <line
            key={`axis-${i}`}
            x1={cx}
            y1={cy}
            x2={cx + maxRadius * Math.cos(angle)}
            y2={cy + maxRadius * Math.sin(angle)}
            stroke="hsl(var(--border))"
            strokeWidth={0.5}
            opacity={0.3}
          />
        );
      })}

      {/* Data area */}
      <polygon
        points={dataPoints}
        fill="hsl(var(--primary) / 0.15)"
        stroke="hsl(var(--primary))"
        strokeWidth={1.5}
      />

      {/* Data points */}
      {data.map((d, i) => {
        const angle = angleStep * i - Math.PI / 2;
        const r = (d.value / 100) * maxRadius;
        return (
          <circle
            key={`point-${i}`}
            cx={cx + r * Math.cos(angle)}
            cy={cy + r * Math.sin(angle)}
            r={2.5}
            fill="hsl(var(--primary))"
          />
        );
      })}

      {/* Labels */}
      {labels.map((l, i) => (
        <text
          key={`label-${i}`}
          x={l.x}
          y={l.y}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-muted-foreground"
          fontSize={8}
          fontWeight={500}
        >
          {l.label}
        </text>
      ))}
    </svg>
  );
}
