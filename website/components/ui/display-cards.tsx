"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface DisplayCardProps {
  className?: string;
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  date?: string;
  href?: string;
}

export function DisplayCard({
  className,
  icon,
  title = "Projekt",
  description = "Beschreibung",
  date = "2024",
  href,
}: DisplayCardProps) {
  const inner = (
    <div
      className={cn(
        "relative flex h-52 w-[34rem] -skew-y-[8deg] select-none flex-col justify-start gap-2 rounded-xl border px-6 py-5 transition-all duration-700",
        "after:absolute after:-right-1 after:top-[-5%] after:h-[110%] after:w-[20rem] after:bg-gradient-to-l after:from-[#0f0f0f] after:to-transparent after:content-['']",
        "[&>*]:flex [&>*]:items-center [&>*]:gap-2",
        href && "cursor-pointer hover:border-white/20",
        className
      )}
      style={{
        backgroundColor: "#1a1a1a",
        border: "1px solid rgba(255,255,255,0.09)",
        pointerEvents: "auto",
      }}
    >
      <div>
        <span
          className="relative inline-flex items-center justify-center rounded-full p-1.5"
          style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
        >
          {icon}
        </span>
        <p className="text-xs sm:text-base font-semibold text-white">{title}</p>
      </div>
      <p className="whitespace-nowrap text-[11px] sm:text-sm !items-start" style={{ color: "rgba(255,255,255,0.75)" }}>
        {description}
      </p>
      <p className="text-[10px] sm:text-xs !items-start mt-auto" style={{ color: "rgba(255,255,255,0.3)" }}>
        {date}
      </p>
    </div>
  );

  return href ? <Link href={href} className="block">{inner}</Link> : inner;
}

interface DisplayCardsProps {
  cards: DisplayCardProps[];
}

export default function DisplayCards({ cards }: DisplayCardsProps) {
  const wrapperRefs = useRef<(HTMLDivElement | null)[]>([]);
  const gridRef     = useRef<HTMLDivElement>(null);

  const stackClasses = [
    "[grid-area:stack] relative hover:z-[100] hover:-translate-y-10 before:absolute before:w-full before:rounded-xl before:h-full before:content-[''] before:bg-[#0f0f0f]/75 before:backdrop-blur-[1px] grayscale-[90%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0 before:z-10",
    "[grid-area:stack] relative hover:z-[100] translate-x-12 translate-y-12 hover:translate-y-2 before:absolute before:w-full before:rounded-xl before:h-full before:content-[''] before:bg-[#0f0f0f]/58 grayscale-[68%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0 before:z-10",
    "[grid-area:stack] relative hover:z-[100] translate-x-24 translate-y-24 hover:translate-y-14 before:absolute before:w-full before:rounded-xl before:h-full before:content-[''] before:bg-[#0f0f0f]/38 grayscale-[46%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0 before:z-10",
    "[grid-area:stack] relative hover:z-[100] translate-x-36 translate-y-36 hover:translate-y-[104px] before:absolute before:w-full before:rounded-xl before:h-full before:content-[''] before:bg-[#0f0f0f]/18 grayscale-[22%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0 before:z-10",
    "[grid-area:stack] relative hover:z-[100] translate-x-48 translate-y-48 hover:translate-y-[152px]",
  ];

  useEffect(() => {
    const wrappers = wrapperRefs.current.filter(Boolean) as HTMLDivElement[];
    // Set initial hidden state — shifted down 60px
    wrappers.forEach((el) => {
      el.style.opacity   = "0";
      el.style.transform = "translateY(60px)";
    });

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        wrappers.forEach((el, i) => {
          el.style.transition = `opacity 600ms cubic-bezier(0.16,1,0.3,1) ${i * 90}ms, transform 600ms cubic-bezier(0.16,1,0.3,1) ${i * 90}ms`;
          el.style.opacity    = "1";
          el.style.transform  = "translateY(0px)";
        });
      },
      { threshold: 0.15 },
    );

    if (gridRef.current) observer.observe(gridRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={gridRef} className="grid [grid-template-areas:'stack'] place-items-start">
      {cards.map((cardProps, index) => (
        <div key={index} ref={(el) => { wrapperRefs.current[index] = el; }} style={{ gridArea: "stack", pointerEvents: "none" }}>
          <DisplayCard
            {...cardProps}
            className={cn(stackClasses[index], cardProps.className)}
          />
        </div>
      ))}
    </div>
  );
}
