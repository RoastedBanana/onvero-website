"use client";

import { cn } from "@/lib/utils";

interface DisplayCardProps {
  className?: string;
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  date?: string;
}

export function DisplayCard({
  className,
  icon,
  title = "Projekt",
  description = "Beschreibung",
  date = "2024",
}: DisplayCardProps) {
  return (
    <div
      className={cn(
        "relative flex h-52 w-[34rem] -skew-y-[8deg] select-none flex-col justify-between rounded-xl border px-6 py-5 transition-all duration-700",
        "after:absolute after:-right-1 after:top-[-5%] after:h-[110%] after:w-[20rem] after:bg-gradient-to-l after:from-[#0f0f0f] after:to-transparent after:content-['']",
        "[&>*]:flex [&>*]:items-center [&>*]:gap-2",
        className
      )}
      style={{
        backgroundColor: "#1a1a1a",
        border: "1px solid rgba(255,255,255,0.09)",
      }}
    >
      <div>
        <span
          className="relative inline-flex items-center justify-center rounded-full p-1.5"
          style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
        >
          {icon}
        </span>
        <p className="text-base font-semibold text-white">{title}</p>
      </div>
      <p className="whitespace-nowrap text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>
        {description}
      </p>
      <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
        {date}
      </p>
    </div>
  );
}

interface DisplayCardsProps {
  cards: DisplayCardProps[];
}

export default function DisplayCards({ cards }: DisplayCardsProps) {
  // Each card is offset by 48 px (12 Tailwind units) in both X and Y.
  // Hover lifts each card 40 px up from its rest position.
  const stackClasses = [
    // Card 0 – back, most dimmed
    "[grid-area:stack] hover:-translate-y-10 before:absolute before:w-full before:rounded-xl before:h-full before:content-[''] before:bg-[#0f0f0f]/75 before:backdrop-blur-[1px] grayscale-[90%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0 before:z-10",
    // Card 1
    "[grid-area:stack] translate-x-12 translate-y-12 hover:translate-y-2 before:absolute before:w-full before:rounded-xl before:h-full before:content-[''] before:bg-[#0f0f0f]/58 grayscale-[68%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0 before:z-10",
    // Card 2
    "[grid-area:stack] translate-x-24 translate-y-24 hover:translate-y-14 before:absolute before:w-full before:rounded-xl before:h-full before:content-[''] before:bg-[#0f0f0f]/38 grayscale-[46%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0 before:z-10",
    // Card 3
    "[grid-area:stack] translate-x-36 translate-y-36 hover:translate-y-[104px] before:absolute before:w-full before:rounded-xl before:h-full before:content-[''] before:bg-[#0f0f0f]/18 grayscale-[22%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0 before:z-10",
    // Card 4 – front, no overlay
    "[grid-area:stack] translate-x-48 translate-y-48 hover:translate-y-[152px]",
  ];

  return (
    <div className="grid [grid-template-areas:'stack'] place-items-start animate-in fade-in-0 duration-700">
      {cards.map((cardProps, index) => (
        <DisplayCard
          key={index}
          {...cardProps}
          className={cn(stackClasses[index], cardProps.className)}
        />
      ))}
    </div>
  );
}
