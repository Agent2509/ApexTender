"use client";

import { useEffect, useRef, useState } from "react";

export default function PerspectiveGrid() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouse({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      });
    };

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const rotateX = (mouse.y - 0.5) * 15;
  const rotateY = (mouse.x - 0.5) * -15;
  const translateZ = Math.min(scrollY * 0.3, 100);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ perspective: "1200px" }}
    >
      <div
        className="absolute inset-[-50%] w-[200%] h-[200%]"
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(${translateZ}px)`,
          transition: "transform 0.15s ease-out",
          willChange: "transform",
        }}
      >
        {/* Horizontal lines */}
        <svg
          className="absolute inset-0 w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="grid-fade" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="white" stopOpacity="1" />
              <stop offset="70%" stopColor="white" stopOpacity="0.3" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
            <mask id="grid-mask">
              <rect width="100%" height="100%" fill="url(#grid-fade)" />
            </mask>
          </defs>
          <g mask="url(#grid-mask)">
            {Array.from({ length: 40 }).map((_, i) => (
              <line
                key={`h-${i}`}
                x1="0%"
                y1={`${(i / 40) * 100}%`}
                x2="100%"
                y2={`${(i / 40) * 100}%`}
                stroke="rgba(88, 28, 135, 0.2)"
                strokeWidth="0.5"
              />
            ))}
            {Array.from({ length: 40 }).map((_, i) => (
              <line
                key={`v-${i}`}
                x1={`${(i / 40) * 100}%`}
                y1="0%"
                x2={`${(i / 40) * 100}%`}
                y2="100%"
                stroke="rgba(88, 28, 135, 0.2)"
                strokeWidth="0.5"
              />
            ))}
          </g>
        </svg>

        {/* Center glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(168, 85, 247, 0.12) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
      </div>
    </div>
  );
}
