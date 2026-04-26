import * as React from "react";
import { cn } from "@onvero/lib/utils";

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("rounded-2xl border border-white/10 bg-white/5 text-white shadow", className)}
      {...props}
    />
  )
);
Card.displayName = "Card";
