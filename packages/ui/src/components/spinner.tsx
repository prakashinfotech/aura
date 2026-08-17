import * as React from "react";
import { cn } from "../lib/cn";

interface SpinnerProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: "sm" | "md" | "lg";
}

const sizes = { sm: "h-4 w-4", md: "h-6 w-6", lg: "h-8 w-8" };

export function Spinner({ size = "md", className, ...props }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        "inline-block animate-spin rounded-full border-2 border-current border-t-transparent",
        sizes[size],
        className
      )}
      {...props}
    />
  );
}
