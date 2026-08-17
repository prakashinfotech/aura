"use client";

import * as React from "react";
import { cn } from "../lib/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, startIcon, endIcon, id, ...props }, ref) => {
    const inputId = id ?? React.useId();
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[var(--foreground)]"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {startIcon && (
            <span className="pointer-events-none absolute left-3 text-[var(--foreground-muted)]">
              {startIcon}
            </span>
          )}
          <input
            id={inputId}
            ref={ref}
            aria-describedby={
              [error && errorId, hint && hintId].filter(Boolean).join(" ") || undefined
            }
            aria-invalid={!!error}
            className={cn(
              "h-11 w-full rounded-[var(--radius-md)] border bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] transition-colors",
              "focus:outline-2 focus:outline-[var(--brand)] focus:outline-offset-0",
              "disabled:cursor-not-allowed disabled:opacity-50",
              error
                ? "border-[var(--error)] focus:outline-[var(--error)]"
                : "border-[var(--border)] focus:border-[var(--brand)]",
              startIcon && "pl-10",
              endIcon && "pr-10",
              className
            )}
            {...props}
          />
          {endIcon && (
            <span className="absolute right-3 text-[var(--foreground-muted)]">
              {endIcon}
            </span>
          )}
        </div>
        {error && (
          <p id={errorId} role="alert" className="text-xs text-[var(--error)]">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={hintId} className="text-xs text-[var(--foreground-muted)]">
            {hint}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
