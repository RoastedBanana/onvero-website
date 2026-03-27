"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface FlippingCardProps {
  className?: string;
  height?: number;
  frontContent?: React.ReactNode;
  backContent?: React.ReactNode;
}

export function FlippingCard({
  className,
  frontContent,
  backContent,
  height = 420,
}: FlippingCardProps) {
  const [tapped, setTapped] = useState(false);

  return (
    <div
      className="group/flipping-card [perspective:1000px] w-full cursor-pointer"
      onClick={() => setTapped((p) => !p)}
    >
      <div
        className={cn(
          "relative w-full rounded-2xl transition-all duration-700 [transform-style:preserve-3d]",
          // desktop: CSS hover; mobile: tap state
          tapped
            ? "[transform:rotateY(180deg)]"
            : "group-hover/flipping-card:[transform:rotateY(180deg)]",
          className
        )}
        style={{
          height,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14)",
        }}
      >
        {/* Front Face */}
        <div
          className="absolute inset-0 h-full w-full rounded-[inherit] [transform-style:preserve-3d] [backface-visibility:hidden] [transform:rotateY(0deg)]"
          style={{ backgroundColor: "#141414" }}
        >
          <div className="h-full w-full">{frontContent}</div>
        </div>

        {/* Back Face */}
        <div
          className="absolute inset-0 h-full w-full rounded-[inherit] [transform-style:preserve-3d] [backface-visibility:hidden] [transform:rotateY(180deg)]"
          style={{ backgroundColor: "#141414" }}
        >
          <div className="h-full w-full">{backContent}</div>
        </div>
      </div>
    </div>
  );
}
