interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
}

export default function BentoGrid({ children, className = "" }: BentoGridProps) {
  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-auto ${className}`}
    >
      {children}
    </div>
  );
}

interface BentoItemProps {
  children: React.ReactNode;
  colSpan?: 1 | 2 | 3 | 4;
  rowSpan?: 1 | 2;
  className?: string;
}

export function BentoItem({
  children,
  colSpan = 1,
  rowSpan = 1,
  className = "",
}: BentoItemProps) {
  const colSpanClass = {
    1: "",
    2: "md:col-span-2",
    3: "lg:col-span-3",
    4: "lg:col-span-4",
  }[colSpan];

  const rowSpanClass = rowSpan === 2 ? "row-span-2" : "";

  return (
    <div className={`${colSpanClass} ${rowSpanClass} ${className}`}>
      {children}
    </div>
  );
}
