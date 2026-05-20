import React from "react";
import { cn } from "@/lib/utils";
import { VariantProps, cva } from "class-variance-authority";

const buttonVariants = cva(
  "relative group border text-center rounded-full font-semibold transition-all duration-200 cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-blue-500/5 hover:bg-blue-500/0 border-blue-400/30 text-blue-700",
        solid:
          "bg-blue-600 hover:bg-blue-700 text-white border-transparent hover:border-blue-400/50",
        ghost:
          "border-white/30 bg-white/10 hover:bg-white/20 hover:border-white/50 text-white",
        outline:
          "border-blue-300 bg-transparent hover:bg-blue-50 text-blue-700 hover:border-blue-400",
      },
      size: {
        sm:      "px-4 py-1.5 text-sm",
        default: "px-7 py-2.5 text-sm",
        lg:      "px-9 py-3.5 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  neon?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, neon = true, size, variant, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      >
        {/* Top neon line */}
        <span
          className={cn(
            "absolute h-px opacity-0 group-hover:opacity-100 transition-all duration-500 ease-in-out inset-x-0 top-0 bg-gradient-to-r w-3/4 mx-auto from-transparent via-blue-400 to-transparent hidden",
            neon && "block"
          )}
        />
        {children}
        {/* Bottom neon line */}
        <span
          className={cn(
            "absolute group-hover:opacity-40 opacity-0 transition-all duration-500 ease-in-out inset-x-0 h-px -bottom-px bg-gradient-to-r w-3/4 mx-auto from-transparent via-blue-400 to-transparent hidden",
            neon && "block"
          )}
        />
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
