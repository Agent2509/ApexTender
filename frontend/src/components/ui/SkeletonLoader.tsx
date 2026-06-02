interface SkeletonLoaderProps {
  variant?: "card" | "text" | "metric" | "table-row";
  count?: number;
  className?: string;
}

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
          <div
            key={i}
            className="shimmer-skeleton h-4"
            style={{ width: `${75 + Math.random() * 25}%` }}
          />
        ))}
      </div>
    );
  }

  if (variant === "metric") {
    return (
      <div className={`glass-card p-6 space-y-3 ${className}`}>
        <div className="shimmer-skeleton h-4 w-24" />
        <div className="shimmer-skeleton h-10 w-32" />
        <div className="shimmer-skeleton h-3 w-20" />
      </div>
    );
  }

  if (variant === "table-row") {
    return (
      <div className={`space-y-2 ${className}`}>
        {items.map((_, i) => (
          <div key={i} className="shimmer-skeleton h-14 w-full" />
        ))}
      </div>
    );
  }

  // card variant
  return (
    <div className={`space-y-4 ${className}`}>
      {items.map((_, i) => (
        <div key={i} className="glass-card p-6 space-y-3">
          <div className="shimmer-skeleton h-5 w-3/4" />
          <div className="shimmer-skeleton h-4 w-full" />
          <div className="shimmer-skeleton h-4 w-5/6" />
        </div>
      ))}
    </div>
  );
}
