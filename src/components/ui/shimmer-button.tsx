"use client";

import React from "react";
import { cn } from "@/lib/utils";

export const ShimmerButton = ({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  return (
    <button
      className={cn(
        "relative inline-flex h-12 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-[#0a0a0a] active:scale-[0.98] transition-transform",
        className
      )}
      {...props}
    >
      <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#000000_0%,#ffffff_50%,#000000_100%)]" />
      <span className="inline-flex h-full w-full items-center justify-center rounded-full bg-[#030303] hover:bg-[#0a0a0a] transition-colors px-8 py-1 text-sm font-medium text-white backdrop-blur-3xl gap-2">
        {children}
      </span>
    </button>
  );
};
