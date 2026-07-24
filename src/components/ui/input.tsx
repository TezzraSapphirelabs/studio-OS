import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            "h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] text-sm text-white placeholder:text-white/25 outline-none transition-all focus:border-white/20 focus:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-50",
            icon ? "pl-10 pr-4" : "px-4",
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
