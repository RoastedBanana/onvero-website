"use client";

import React, { useEffect, useRef, ReactNode } from "react";

interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onMouseEnter?: React.MouseEventHandler<HTMLDivElement>;
  onMouseLeave?: React.MouseEventHandler<HTMLDivElement>;
  borderColor?: string;
  bgColor?: string;
}

const BEFORE_AFTER = `
  [data-spotlight]::before,
  [data-spotlight]::after {
    pointer-events: none;
    content: "";
    position: absolute;
    inset: calc(var(--border-size) * -1);
    border: var(--border-size) solid transparent;
    border-radius: calc(var(--radius) * 1px);
    background-attachment: fixed;
    background-size: calc(100% + (2 * var(--border-size))) calc(100% + (2 * var(--border-size)));
    background-repeat: no-repeat;
    background-position: 50% 50%;
    mask: linear-gradient(transparent, transparent), linear-gradient(white, white);
    mask-clip: padding-box, border-box;
    mask-composite: intersect;
  }
  [data-spotlight]::before {
    background-image: radial-gradient(
      calc(var(--spotlight-size) * 0.75) calc(var(--spotlight-size) * 0.75) at
      calc(var(--x, 0) * 1px) calc(var(--y, 0) * 1px),
      hsl(210 80% 88% / 0.9), transparent 100%
    );
    filter: brightness(1.6);
  }
  [data-spotlight]::after {
    background-image: radial-gradient(
      calc(var(--spotlight-size) * 0.5) calc(var(--spotlight-size) * 0.5) at
      calc(var(--x, 0) * 1px) calc(var(--y, 0) * 1px),
      hsl(0 0% 100% / 0.85), transparent 100%
    );
  }
  [data-spotlight] [data-spotlight] {
    position: absolute;
    inset: 0;
    will-change: filter;
    border-radius: calc(var(--radius) * 1px);
    filter: blur(calc(var(--border-size) * 10));
    background: none;
    pointer-events: none;
    border: none;
  }
  [data-spotlight] > [data-spotlight]::before {
    inset: -10px;
    border-width: 10px;
  }
`;

export function SpotlightCard({ children, className = "", style, onMouseEnter, onMouseLeave, borderColor, bgColor }: SpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sync = (e: PointerEvent) => {
      const el = cardRef.current;
      if (!el) return;
      el.style.setProperty("--x", e.clientX.toFixed(1));
      el.style.setProperty("--y", e.clientY.toFixed(1));
    };
    document.addEventListener("pointermove", sync);
    return () => document.removeEventListener("pointermove", sync);
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: BEFORE_AFTER }} />
      <div
        ref={cardRef}
        data-spotlight
        className={className}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        style={{
          ...style,
          "--border-size": "1px",
          "--spotlight-size": "200px",
          "--radius": "12",
          "--backdrop": bgColor ?? "rgba(255,255,255,0.03)",
          "--backup-border": borderColor ?? "rgba(255,255,255,0.08)",
          backgroundImage: `radial-gradient(
            200px 200px at
            calc(var(--x, 0) * 1px) calc(var(--y, 0) * 1px),
            hsl(210 80% 88% / 0.06), transparent
          )`,
          backgroundColor: "var(--backdrop)",
          backgroundSize: "calc(100% + 2px) calc(100% + 2px)",
          backgroundPosition: "50% 50%",
          backgroundAttachment: "fixed",
          border: "var(--border-size) solid var(--backup-border)",
          position: "relative",
        } as React.CSSProperties}
      >
        <div data-spotlight />
        {children}
      </div>
    </>
  );
}
