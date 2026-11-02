"use client";

import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "gradient";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-200 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-primary/40 disabled:opacity-50 disabled:cursor-not-allowed select-none";

    const variants = {
      primary: "bg-[#7957F5] hover:bg-[#6842e8] text-white shadow-md hover:shadow-lg hover:-translate-y-0.5",
      secondary: "bg-[#E9DFFF] hover:bg-[#ded1fc] text-[#7957F5] font-semibold",
      outline: "border border-[#EEEAF5] hover:border-[#7957F5] text-[#171526] hover:text-[#7957F5] bg-white",
      ghost: "text-[#777386] hover:text-[#171526] hover:bg-black/[0.04]",
      danger: "bg-red-500 hover:bg-red-600 text-white",
      gradient: "bg-gradient-to-r from-[#7957F5] to-[#a380f9] text-white shadow-md hover:shadow-lg hover:-translate-y-0.5",
    };

    const sizes = {
      sm: "text-xs px-3 py-1.5 gap-1.5",
      md: "text-sm px-5 py-2.5 gap-2",
      lg: "text-base px-7 py-3.5 gap-2.5 font-semibold",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
