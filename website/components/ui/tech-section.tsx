"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { IntegrationMap } from "@/components/ui/integration-map";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" } as const,
  transition: { duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] as const },
});

const tools = [
  { logo: "/logos/N8n-logo-new.svg",         name: "n8n",         description: "Workflow-Automatisierung" },
  { logo: "/logos/Claude_AI_logo.svg",        name: "ClawdBot",    description: "KI-Chatbot Infrastruktur" },
  { logo: "/logos/Claude_AI_logo.svg",        name: "Claude Code", description: "KI-gestützte Entwicklung" },
  { logo: "/logos/ElevenLabs_Logo_01.svg",    name: "ElevenLabs",  description: "KI Voice & Audio"         },
  { logo: "/logos/idpcAHoHxC_logos.svg",      name: "Nano Banana", description: "Rapid App Deployment"     },
];

function ToolCard({ logo, name, description, delay = 0 }: (typeof tools)[number] & { delay?: number }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      {...fadeUp(delay)}
      className="flex flex-col gap-4 rounded-xl p-6 cursor-default"
      style={{
        border: `1px solid ${hovered ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.08)"}`,
        backgroundColor: hovered ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.03)",
        transition: "border-color 0.2s ease, background-color 0.2s ease",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logo}
        alt={name}
        style={{
          width: 36,
          height: 36,
          objectFit: "contain",
          filter: hovered ? "none" : "brightness(0) invert(1)",
          opacity: hovered ? 1 : 0.55,
          transition: "filter 0.25s ease, opacity 0.25s ease",
        }}
      />
      <div>
        <p className="text-sm font-medium text-white mb-1">{name}</p>
        <p className="text-xs leading-snug" style={{ color: "rgba(255,255,255,0.4)" }}>
          {description}
        </p>
      </div>
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

        {/* ── Integration subsection ── */}
        <div className="mt-24">
          {/* Headline + subline */}
          <motion.div className="max-w-6xl mx-auto mb-12" {...fadeUp(0)}>
            <h3
              className="font-bold text-white tracking-tight mb-2"
              style={{ fontSize: "clamp(1.2rem, 2vw, 1.5rem)" }}
            >
              Integriert in was du bereits nutzt.
            </h3>
            <p className="text-sm max-w-xl" style={{ color: "rgba(255,255,255,0.4)" }}>
              Egal welche Tools dein Unternehmen heute einsetzt — wir verbinden sie.
              Über 400 Integrationen verfügbar, kein technisches Setup nötig.
            </p>
          </motion.div>

          {/* Integration map — full-width within the section */}
          <IntegrationMap />

          <p
            className="text-center mt-4 text-sm"
            style={{ color: "rgba(255,255,255,0.3)" }}
          >
            und vieles mehr...
          </p>
        </div>

      </section>
    </>
  );
}
