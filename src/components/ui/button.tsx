import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all outline-none disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/80 hover:bg-white/[0.06] hover:text-white",
        primary: "rounded-xl bg-white text-black shadow-lg shadow-white/10 hover:shadow-white/20 hover:brightness-90",
        destructive: "rounded-xl bg-white/10 text-white hover:bg-red-700",
        ghost: "rounded-lg text-white/50 hover:bg-white/[0.04] hover:text-white",
        icon: "rounded-full text-white/50 hover:bg-white/[0.06] hover:text-white",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-11 px-6",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
