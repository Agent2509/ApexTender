"use client";

import { useEffect, useState, useRef } from "react";
import { LucideIcon } from "lucide-react";

interface MetricCounterProps {
  value: number;
  label: string;
  prefix?: string;
  suffix?: string;
  icon?: LucideIcon;
  iconColor?: string;
  pulseDot?: boolean;
}

export default function MetricCounter({
  value,
  label,
  prefix = "",
  suffix = "",
  icon: Icon,
  iconColor = "text-amethyst-400",
  pulseDot = false,
}: MetricCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) {
      setDisplayValue(value);
      return;
    }
    hasAnimated.current = true;

    const duration = 1200;
    const steps = 40;
    const increment = value / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(Math.round(increment * step), value);
      setDisplayValue(current);
      if (step >= steps) {
        clearInterval(timer);
        setDisplayValue(value);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <div className="glass-card glass-card-hover purple-radial-glow p-6 relative overflow-hidden group">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">
          {label}
        </span>
        <div className="flex items-center gap-2">
          {pulseDot && (
            <span className="w-2 h-2 rounded-full bg-amethyst-500 animate-pulse-dot" />
          )}
          {Icon && (
            <div className={`p-2 rounded-lg bg-white/5 ${iconColor}`}>
              <Icon className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>
      <div className="font-mono text-3xl font-bold text-white tracking-tight animate-count-up">
        {prefix}{displayValue.toLocaleString()}{suffix}
      </div>
    </div>
  );
}
