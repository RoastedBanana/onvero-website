"use client";

import React from "react";
import { motion } from "framer-motion";
import { useTranslation } from "@/lib/language-context";
import {
  Globe,
  GitBranch,
  BarChart3,
  MessageSquare,
  Target,
  Mic,
  GraduationCap,
  Sparkles,
  Layers,
  Zap,
  TrendingUp,
} from "lucide-react";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" } as const,
  transition: { duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] as const },
});

// ─── Grid geometry ───────────────────────────────────────────────────────────
const VW = 460;
const VH = 340;
const CX = 230;   // center pill x
const CY = 170;   // center pill y
// column / row cell centers
const COL = [77, 230, 383];
const ROW = [57, 170, 283];
const NW = 112;   // node width
const NH = 52;    // node height
const PULSE = 10; // visible pulse length (px)
const DUR = 0.8;  // pulse travel duration (s)

// Icons & labels must match 1:1 with cybernetic-bento-grid.tsx
const nodes = [
  { col: 0, row: 0, icon: Globe,         label: "Website"   },
  { col: 1, row: 0, icon: GitBranch,     label: "Workflows" },
  { col: 2, row: 0, icon: BarChart3,     label: "Analyse"   },
  { col: 0, row: 1, icon: MessageSquare, label: "Support"   },
  { col: 2, row: 1, icon: Target,        label: "Leads"     },
  { col: 0, row: 2, icon: Mic,           label: "Meetings"  },
  { col: 1, row: 2, icon: GraduationCap, label: "Schulung"  },
  { col: 2, row: 2, icon: Sparkles,      label: "Custom"    },
];

const BULLETS_DE = [
  { icon: Layers,     textDe: "Alle Systeme verbunden",          textEn: "All systems connected"         },
  { icon: Zap,        textDe: "Daten fließen automatisch",       textEn: "Data flows automatically"      },
  { icon: TrendingUp, textDe: "Skaliert mit deinem Unternehmen", textEn: "Scales with your business"     },
];

// ─── Component ───────────────────────────────────────────────────────────────
export function BusinessOS() {
  const { t } = useTranslation();

  return (
    <section
      className="w-full py-32 px-8 md:px-16 lg:px-24 relative overflow-hidden"
      style={{ backgroundColor: "#0f0f0f" }}
    >
      {/* Subtle grid background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 lg:gap-32 items-center">

          {/* ── LEFT: Text ── */}
          <motion.div {...fadeUp(0)}>
            {/* Eyebrow */}
            <p
              className="text-xs font-semibold tracking-[0.2em] uppercase mb-5"
              style={{ color: "rgba(255,255,255,0.28)" }}
            >
              {t("Infrastruktur · Vernetzung · Skalierung", "Infrastructure · Integration · Scaling")}
            </p>

            {/* Headline — serif only on the key word */}
            <h2
              className="text-white mb-6 font-bold tracking-tight"
              style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)", lineHeight: 1.1 }}
            >
              {t("Dein", "Your")}{" "}
              <em
                style={{
                  fontFamily: "TimesNewRomanPSMT,'Times New Roman',Times,serif",
                  fontStyle: "italic",
                  letterSpacing: "0.02em",
                  fontWeight: "normal",
                }}
              >
                BusinessOS
              </em>
            </h2>

            {/* Body copy */}
            <div className="space-y-4 mb-12" style={{ color: "rgba(255,255,255,0.48)" }}>
              <p className="text-base leading-relaxed">
                {t("Jede Lösung, die wir bauen, ist darauf ausgelegt, mit den anderen zu kommunizieren.", "Every solution we build is designed to communicate with the others.")}
              </p>
              <p className="text-base leading-relaxed">
                {t("Kein Tool-Chaos, kein Datenverlust zwischen Systemen. Alles läuft in eine zentrale Infrastruktur — dein BusinessOS.", "No tool chaos, no data loss between systems. Everything flows into one central infrastructure — your BusinessOS.")}
              </p>
            </div>

            {/* Bullet points */}
            <ul className="space-y-5">
              {BULLETS_DE.map(({ icon: Icon, textDe, textEn }) => (
                <li key={textDe} className="flex items-center gap-3">
                  <div
                    className="shrink-0 p-1.5 rounded-lg"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <Icon style={{ width: 14, height: 14, color: "rgba(255,255,255,0.6)" }} />
                  </div>
                  <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.65)" }}>
                    {t(textDe, textEn)}
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* ── RIGHT: SVG Diagram ── */}
          <motion.div className="flex items-center justify-center" {...fadeUp(0.15)}>
            <svg
              viewBox={`0 0 ${VW} ${VH}`}
              className="w-full max-w-[480px]"
              style={{ overflow: "visible" }}
            >
              <defs>
                {/* Strong glow for pulses */}
                <filter id="bos-glow" x="-150%" y="-150%" width="400%" height="400%">
                  <feGaussianBlur stdDeviation="3.5" result="blur1" />
                  <feGaussianBlur stdDeviation="1.5" result="blur2" in="SourceGraphic" />
                  <feMerge>
                    <feMergeNode in="blur1" />
                    <feMergeNode in="blur2" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                {/* Pill gradient */}
                <linearGradient id="bos-pill" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0.06" />
                </linearGradient>
              </defs>

              {/* ─ Lines + pulses ─ */}
              {nodes.map(({ col, row, label }, i) => {
                const nx = COL[col];
                const ny = ROW[row];
                const dx = CX - nx;
                const dy = CY - ny;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const delay = i * 0.1;

                return (
                  <g key={`line-${label}`}>
                    {/* Static track */}
                    <line
                      x1={nx} y1={ny} x2={CX} y2={CY}
                      stroke="rgba(255,255,255,0.07)"
                      strokeWidth="1"
                    />
                    {/* Animated pulse — travels from node → center */}
                    <line
                      x1={nx} y1={ny} x2={CX} y2={CY}
                      stroke="rgba(255,255,255,0.95)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeDasharray={`${PULSE} ${dist + PULSE + 60}`}
                      filter="url(#bos-glow)"
                    >
                      <animate
                        attributeName="stroke-dashoffset"
                        from={`${dist + PULSE}`}
                        to={`${-PULSE}`}
                        dur={`${DUR}s`}
                        begin={`${delay}s`}
                        repeatCount="indefinite"
                        calcMode="linear"
                      />
                    </line>
                  </g>
                );
              })}

              {/* ─ Nodes ─ */}
              {nodes.map(({ col, row, icon: Icon, label }) => {
                const nx = COL[col];
                const ny = ROW[row];
                return (
                  <g key={`node-${label}`} transform={`translate(${nx - NW / 2},${ny - NH / 2})`}>
                    {/* Card background */}
                    <rect
                      width={NW} height={NH} rx="8"
                      fill="#1a1a1a"
                      stroke="rgba(255,255,255,0.09)"
                      strokeWidth="1"
                    />
                    {/* Icon */}
                    <foreignObject x="9" y="9" width="34" height="34">
                      <div
                        style={{
                          width: "100%", height: "100%",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          borderRadius: "6px",
                          backgroundColor: "rgba(255,255,255,0.05)",
                        }}
                      >
                        <Icon style={{ width: 13, height: 13, color: "rgba(255,255,255,0.6)" }} />
                      </div>
                    </foreignObject>
                    {/* Label */}
                    <text
                      x="50" y={NH / 2 + 4}
                      fill="rgba(255,255,255,0.72)"
                      fontSize="10.5"
                      fontFamily="system-ui,sans-serif"
                      fontWeight="600"
                    >
                      {label}
                    </text>
                    {/* Junction dot */}
                    <circle
                      cx={NW / 2} cy={NH / 2}
                      r="2.5"
                      fill="rgba(255,255,255,0)"
                    />
                  </g>
                );
              })}

              {/* ─ Center Pill ─ */}
              <g>
                <rect
                  x={CX - 72} y={CY - 22}
                  width="144" height="44"
                  rx="22"
                  fill="url(#bos-pill)"
                  stroke="rgba(255,255,255,0.18)"
                  strokeWidth="1"
                  filter="url(#bos-glow)"
                />
                <text
                  x={CX} y={CY + 5}
                  textAnchor="middle"
                  fill="white"
                  fontSize="12.5"
                  fontFamily="system-ui,sans-serif"
                  fontWeight="700"
                  letterSpacing="0.8"
                >
                  BusinessOS
                </text>
              </g>
            </svg>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
