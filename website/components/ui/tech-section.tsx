"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { SpotlightCard } from "@/components/ui/spotlight-card";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" } as const,
  transition: { duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] as const },
});

const tools = [
  { logo: "/logos/n8n-color.svg",             name: "n8n",         description: "Workflow-Automatisierung", color: "#EA4B71" },
  { logo: "/logos/claude-color.svg",           name: "Claude Code", description: "KI-gestützte Entwicklung", color: "#D97757" },
  { logo: "/logos/elevenlabs-symbol.svg",      name: "ElevenLabs",  description: "KI Voice & Audio",         color: "#ffffff", iconSize: 52, iconFilter: "brightness(0) invert(1)" },
  { logo: "/logos/supabase-icon.svg",          name: "Supabase",    description: "Sichere Datenverwaltung",  color: "#3ECF8E" },
  { logo: "/logos/higgsfield-logo.svg",        name: "Higgsfield",  description: "KI Video-Generierung",     color: "#D1FE17" },
];

function ToolCard({ logo, name, description, color, iconSize, iconFilter, delay = 0 }: (typeof tools)[number] & { delay?: number }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div {...fadeUp(delay)}>
      <SpotlightCard
        className="flex flex-col gap-4 rounded-xl p-6 cursor-default h-full"
        borderColor={hovered ? `${color}90` : `${color}40`}
        bgColor={hovered ? `${color}15` : "rgba(255,255,255,0.03)"}
        style={{ transition: "background-color 0.25s ease, border-color 0.25s ease" } as React.CSSProperties}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logo}
          alt={name}
          style={{
            width: iconSize ?? 36,
            height: iconSize ?? 36,
            objectFit: "contain",
            filter: iconFilter,
            opacity: hovered ? 1 : 0.8,
            transition: "opacity 0.25s ease",
          }}
        />
        <div>
          <p className="text-sm font-medium text-white mb-1">{name}</p>
          <p className="text-xs leading-snug" style={{ color: "rgba(255,255,255,0.4)" }}>
            {description}
          </p>
        </div>
      </SpotlightCard>
    </motion.div>
  );
}

export function TechSection() {
  return (
    <>
      <style>{`
        .tech-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        /* Last card spans both columns and is capped to half-width, centered */
        .tech-grid > :last-child {
          grid-column: 1 / -1;
          max-width: calc(50% - 6px);
          margin-left: auto;
          margin-right: auto;
          width: 100%;
        }
        @media (min-width: 1024px) {
          .tech-grid {
            grid-template-columns: repeat(5, 1fr);
          }
          .tech-grid > :last-child {
            grid-column: auto;
            max-width: none;
            margin-left: 0;
            margin-right: 0;
          }
        }
      `}</style>

      <section
        className="w-full py-32 px-8 md:px-16 lg:px-24"
        style={{ backgroundColor: "#0f0f0f" }}
      >
        <div className="max-w-6xl mx-auto">

          {/* ── Headline ── */}
          <motion.div className="mb-14" {...fadeUp(0)}>
            <h2
              className="font-bold tracking-tight"
              style={{ fontSize: "clamp(1.9rem, 3.8vw, 3rem)", lineHeight: 1.1 }}
            >
              <span className="block text-white">Gebaut mit den</span>
              <span className="block" style={{ color: "rgba(255,255,255,0.45)" }}>neuesten Tools.</span>
            </h2>
            <p
              className="mt-4 text-sm leading-relaxed max-w-xl"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              Wir arbeiten ausschließlich mit den fortschrittlichsten KI-Tools — damit deine
              Infrastruktur immer auf dem neuesten Stand ist.
            </p>
          </motion.div>

          {/* ── Tool cards ── */}
          <div className="tech-grid">
            {tools.map((tool, i) => (
              <ToolCard key={tool.name} {...tool} delay={0.07 + i * 0.07} logo={tool.logo} />
            ))}
          </div>

        </div>

      </section>
    </>
  );
}
