"use client";

import { useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover3D?: boolean;
  glowOnHover?: boolean;
  onClick?: () => void;
}

export default function GlassCard({
  children,
  className = "",
  hover3D = false,
  glowOnHover = false,
  onClick,
}: GlassCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!hover3D || !cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      setRotateX(((y - centerY) / centerY) * -6);
      setRotateY(((x - centerX) / centerX) * 6);
    },
    [hover3D]
  );

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
  }, []);

  return (
    <motion.div
      ref={cardRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      whileHover={{ y: -5, transition: { duration: 0.3 } }}
      animate={{
        rotateX: hover3D ? rotateX : 0,
        rotateY: hover3D ? rotateY : 0,
        scale: hover3D && isHovered ? 1.02 : 1,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      style={{ perspective: 800, transformStyle: "preserve-3d" }}
      className={[
        "relative rounded-2xl bg-[#09090b] backdrop-blur-xl",
        "border border-white/10",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]",
        "transition-[border-color,box-shadow] duration-300 ease-out",
        glowOnHover
          ? "hover:border-amethyst-500/30 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_0_30px_rgba(168,85,247,0.08),inset_0_0_30px_rgba(168,85,247,0.02)]"
          : "",
        onClick ? "cursor-pointer" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Radial glow overlay on hover */}
      {glowOnHover && (
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-400 group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(168,85,247,0.12), transparent 70%)",
            opacity: isHovered ? 1 : 0,
          }}
        />
      )}

      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
