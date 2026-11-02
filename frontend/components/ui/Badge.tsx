import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "primary" | "secondary" | "subtle" | "success" | "warning" | "danger" | "neutral";
  size?: "sm" | "md";
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = "subtle",
  size = "md",
  children,
  ...props
}) => {
  const base = "inline-flex items-center font-medium rounded-full transition-colors";

  const variants = {
    primary: "bg-[#7957F5] text-white",
    secondary: "bg-[#E9DFFF] text-[#7957F5]",
    subtle: "bg-[#F8E7F0] text-[#8C3A69]",
    success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border border-amber-200",
    danger: "bg-rose-50 text-rose-700 border border-rose-200",
    neutral: "bg-zinc-100 text-zinc-700 border border-zinc-200",
  };

  const sizes = {
    sm: "text-xs px-2.5 py-0.5",
    md: "text-xs px-3 py-1 font-medium",
  };

  return (
    <span className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </span>
  );
};
