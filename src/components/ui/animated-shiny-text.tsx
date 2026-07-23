"use client";

import { cn } from "@/lib/utils";

export const AnimatedShinyText = ({
  children,
  className,
  shimmerWidth = 200,
}: {
  children: React.ReactNode;
  className?: string;
  shimmerWidth?: number;
}) => {
  return (
    <span
      style={{
        "--shimmer-width": `${shimmerWidth}px`,
      } as React.CSSProperties}
      className={cn(
        "inline-block text-transparent bg-clip-text bg-no-repeat",
        "bg-[linear-gradient(110deg,rgba(255,255,255,0.4),45%,#ffffff,55%,rgba(255,255,255,0.4))]",
        "bg-[length:200%_100%] animate-shiny-text",
        className
      )}
    >
      {children}
    </span>
  );
};
