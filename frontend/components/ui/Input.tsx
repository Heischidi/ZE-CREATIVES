"use client";

import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-[#171526] uppercase tracking-wider mb-1.5">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-[#777386]">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              "w-full rounded-2xl bg-white border border-[#EEEAF5] px-4 py-3 text-sm text-[#171526] placeholder-[#777386]/60 transition-all duration-200 outline-none",
              "focus:border-[#7957F5] focus:ring-4 focus:ring-[#7957F5]/10",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              error && "border-red-500 focus:border-red-500 focus:ring-red-500/10",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 flex items-center text-[#777386]">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="mt-1.5 text-xs text-red-500 font-medium">{error}</p>}
        {helperText && !error && <p className="mt-1.5 text-xs text-[#777386]">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
