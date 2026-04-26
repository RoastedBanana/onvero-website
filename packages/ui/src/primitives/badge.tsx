import * as React from "react";
import { cn } from "@onvero/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variant === "default" && "border-transparent bg-white text-black",
        variant === "secondary" && "border-transparent bg-white/10 text-white hover:bg-white/20",
        variant === "destructive" && "border-transparent bg-red-500 text-white",
        variant === "outline" && "text-white border-white/20",
        className
      )}
      {...props}
    />
  );
}
