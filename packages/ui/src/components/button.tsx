"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-md)] text-sm font-semibold tracking-wide transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)] disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--brand)] text-white hover:bg-[var(--brand-hover)] focus-visible:outline-[var(--brand)]",
        secondary:
          "bg-[var(--secondary)] text-white hover:bg-[var(--secondary-hover)]",
        outline:
          "border border-[var(--border-strong)] bg-transparent text-[var(--foreground)] hover:bg-[var(--surface-raised)]",
        ghost:
          "bg-transparent text-[var(--foreground)] hover:bg-[var(--surface-raised)]",
        danger:
          "bg-[var(--error)] text-white hover:opacity-90",
        link: "underline-offset-4 hover:underline text-[var(--brand)] p-0 h-auto",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-11 px-5 text-sm",
        lg: "h-12 px-7 text-base",
        icon: "h-9 w-9 p-0",
        "icon-sm": "h-7 w-7 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            {children}
          </span>
        ) : (
          children
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { buttonVariants };
