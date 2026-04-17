"use client";

import { motion } from "framer-motion";

interface RadialGaugeProps {
  value: number;
  max?: number;
  label: string;
  icon?: React.ReactNode;
  color?: string;
  size?: number;
}

export function RadialGauge({
  value,
  max = 100,
  label,
  icon,
  color = "text-primary",
  size = 110,
}: RadialGaugeProps) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const safeValue = Math.min(Math.max(value, 0), max);
  const percent = safeValue / max;
  const strokeDashoffset = circumference - percent * circumference;

  return (
    <div className={`flex flex-col items-center justify-center relative ${color}`} style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className="stroke-secondary"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <motion.circle
          className="stroke-current z-10"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{ strokeDasharray: circumference }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        {icon && <div className="mb-1 opacity-70">{icon}</div>}
        <span className="text-2xl font-bold tracking-tighter text-foreground leading-none">
          {safeValue}<span className="text-xs text-muted-foreground font-normal ml-0.5">%</span>
        </span>
      </div>
      <div className="absolute -bottom-6 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center w-[120px] truncate">
        {label}
      </div>
    </div>
  );
}
