"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface MetricCounterProps {
  value: number;
  label: string;
  prefix?: string;
  suffix?: string;
  icon?: LucideIcon;
  iconColor?: string;
  pulseDot?: boolean;
  index?: number;
}

export default function MetricCounter({
  value,
  label,
  prefix = "",
  suffix = "",
  icon: Icon,
  iconColor = "text-amethyst-400",
  pulseDot = false,
  index = 0,
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
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={{ y: -5, transition: { duration: 0.3 } }}
      className="relative overflow-hidden rounded-2xl bg-[#09090b] backdrop-blur-xl border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] p-6 group transition-[border-color,box-shadow] duration-300 hover:border-amethyst-500/30 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_0_30px_rgba(168,85,247,0.08),inset_0_0_30px_rgba(168,85,247,0.02)]"
    >
      {/* Radial glow overlay */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-400 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(168,85,247,0.12), transparent 70%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">
            {label}
          </span>
          <div className="flex items-center gap-2">
            {pulseDot && (
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amethyst-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amethyst-500" />
              </span>
            )}
            {Icon && (
              <div className={`p-2 rounded-lg bg-white/5 ${iconColor}`}>
                <Icon className="w-4 h-4" />
              </div>
            )}
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
          className="font-mono text-3xl font-bold text-white tracking-tight"
        >
          {prefix}
          {displayValue.toLocaleString()}
          {suffix}
        </motion.div>
      </div>
    </motion.div>
  );
}
