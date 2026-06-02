"use client";

import { motion } from "framer-motion";

interface SkeletonLoaderProps {
  variant?: "card" | "text" | "metric" | "table-row";
  count?: number;
  className?: string;
}

const pulseVariants = {
  hidden: { opacity: 0 },
  visible: (i: number) => ({
    opacity: 1,
    transition: { delay: i * 0.08, duration: 0.4 },
  }),
};

export default function SkeletonLoader({
  variant = "card",
  count = 1,
  className = "",
}: SkeletonLoaderProps) {
  const items = Array.from({ length: count });

  if (variant === "text") {
    return (
      <div className={`space-y-3 ${className}`}>
        {items.map((_, i) => (
          <motion.div
            key={i}
            custom={i}
            variants={pulseVariants}
            initial="hidden"
            animate="visible"
            className="shimmer-skeleton h-4"
            style={{ width: `${75 + Math.random() * 25}%` }}
          />
        ))}
      </div>
    );
  }

  if (variant === "metric") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className={`rounded-2xl bg-[#09090b] backdrop-blur-xl border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] p-6 space-y-3 ${className}`}
      >
        <div className="shimmer-skeleton h-4 w-24 rounded-lg" />
        <div className="shimmer-skeleton h-10 w-32 rounded-lg" />
        <div className="shimmer-skeleton h-3 w-20 rounded-lg" />
      </motion.div>
    );
  }

  if (variant === "table-row") {
    return (
      <div className={`space-y-2 ${className}`}>
        {items.map((_, i) => (
          <motion.div
            key={i}
            custom={i}
            variants={pulseVariants}
            initial="hidden"
            animate="visible"
            className="shimmer-skeleton h-14 w-full rounded-xl"
          />
        ))}
      </div>
    );
  }

  // card variant
  return (
    <div className={`space-y-4 ${className}`}>
      {items.map((_, i) => (
        <motion.div
          key={i}
          custom={i}
          variants={pulseVariants}
          initial="hidden"
          animate="visible"
          className="rounded-2xl bg-[#09090b] backdrop-blur-xl border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] p-6 space-y-3"
        >
          <div className="shimmer-skeleton h-5 w-3/4 rounded-lg" />
          <div className="shimmer-skeleton h-4 w-full rounded-lg" />
          <div className="shimmer-skeleton h-4 w-5/6 rounded-lg" />
        </motion.div>
      ))}
    </div>
  );
}
