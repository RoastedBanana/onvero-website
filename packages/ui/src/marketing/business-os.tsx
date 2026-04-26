"use client";

import React, { useEffect, useRef } from "react";
import { useTranslation } from "@/lib/language-context";
import { IntegrationMap } from "../marketing/integration-map";
import { MetricsSection } from "../marketing/metrics-section";
import { ProjectsSection } from "../marketing/projects-section";
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

// ─── Grid geometry ────────────────────────────────────────────────────────────
const VW      = 460;
const VH      = 340;
const CX      = 230;   // center pill x
const CY      = 170;   // center pill y
const COL     = [77, 230, 383];
const ROW     = [57, 170, 283];
const NW      = 112;   // node width
const NH      = 52;    // node height
const PULSE   = 10;    // visible pulse length (px)
const DUR     = 0.8;   // pulse travel duration (s)
const SCATTER = 120;   // initial outward displacement (px)

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

const BULLETS = [
  { icon: Layers,     textDe: "Alle Systeme verbunden",          textEn: "All systems connected"     },
  { icon: Zap,        textDe: "Daten fließen automatisch",       textEn: "Data flows automatically"  },
  { icon: TrendingUp, textDe: "Skaliert mit deinem Unternehmen", textEn: "Scales with your business" },
];

// Pre-compute unit vectors (direction from center → node = outward displacement axis)
const nodeVec = nodes.map(({ col, row }) => {
  const nx   = COL[col];
  const ny   = ROW[row];
  const dx   = nx - CX;
  const dy   = ny - CY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  return { nx, ny, ux: dx / dist, uy: dy / dist, dist };
});

// Outer corner nodes (dist > 160px) start moving earlier — stagger offset 0
// Inner edge nodes start slightly later — stagger offset 0.06
const NODE_STAGGER = nodeVec.map(({ dist }) => (dist > 160 ? 0.0 : 0.06));

// ─── Component ────────────────────────────────────────────────────────────────
export function BusinessOS() {
  const { t } = useTranslation();

  // Outer tall wrapper reserves 200vh of scroll space (100vh pinned distance)
  const wrapperRef  = useRef<HTMLDivElement>(null);
  // Inner panel — toggled between absolute / fixed / absolute to simulate sticky
  // without relying on CSS sticky (which breaks under overflow:hidden ancestors)
  const panelRef    = useRef<HTMLElement>(null);
  const nodeRefs    = useRef<(SVGGElement | null)[]>([]);
  const lineRefs    = useRef<(SVGGElement | null)[]>([]);
  // SMIL animation refs for the radar-ping pulse
  const pulseAnimR  = useRef<SVGAnimateElement>(null);
  const pulseAnimOp = useRef<SVGAnimateElement>(null);
  const pulseFired  = useRef(false);
  // Text auto-animation fires once when section pins — not scroll-driven
  const textFired   = useRef(false);
  const textRefs    = useRef<(HTMLElement | null)[]>([null, null, null, null]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const panel   = panelRef.current;
    if (!wrapper || !panel) return;
    let rafId = 0;
    let isVisible = false;

    // Only run scroll-driven animation when section is near the viewport
    const io = new IntersectionObserver(
      ([entry]) => { isVisible = entry.isIntersecting; if (isVisible) onScroll(); },
      { rootMargin: "200px" },
    );
    io.observe(wrapper);

    const tick = () => {
      rafId = 0;
      const rect       = wrapper.getBoundingClientRect();
      const viewH      = window.innerHeight;
      const scrollDist = Math.max(1, wrapper.offsetHeight - viewH);

      // ── JS-driven sticky: fixed while wrapper straddles the viewport ──────
      if (rect.top > 0) {
        panel.style.position = "absolute";
        panel.style.top      = "0";
        panel.style.bottom   = "";
      } else if (rect.bottom >= viewH) {
        panel.style.position = "fixed";
        panel.style.top      = "0";
        panel.style.bottom   = "";
      } else {
        panel.style.position = "absolute";
        panel.style.top      = "";
        panel.style.bottom   = "0";
      }

      // Progress 0 → 1 across the pinned scroll distance
      const progress = Math.max(0, Math.min(1, -rect.top / scrollDist));

      // ── Effect 3: Text blur-in — fires as section enters view, before pin ───
      if (rect.top < viewH && !textFired.current) {
        textFired.current = true;
        textRefs.current.forEach((el, i) => {
          if (!el) return;
          el.style.transition = `opacity 700ms ease-out ${i * 160}ms, filter 700ms ease-out ${i * 160}ms`;
          el.style.opacity    = "1";
          el.style.filter     = "blur(0px)";
        });
      }

      // ── Effect 1 & 2: Node convergence + line fade-in ─────────────────────
      for (let i = 0; i < nodes.length; i++) {
        const { nx, ny, ux, uy } = nodeVec[i];
        const s       = NODE_STAGGER[i];
        const raw     = s < 1 ? (progress - s) / (1 - s) : 0;
        const clamped = Math.max(0, Math.min(1, raw));
        const eased   = 1 - (1 - clamped) * (1 - clamped);
        const disp    = SCATTER * (1 - eased);

        const ng = nodeRefs.current[i];
        if (ng) {
          ng.setAttribute(
            "transform",
            `translate(${nx - NW / 2 + ux * disp},${ny - NH / 2 + uy * disp})`,
          );
        }

        const lg = lineRefs.current[i];
        if (lg) {
          lg.style.opacity = String(Math.max(0, Math.min(1, (20 - disp) / 20)));
        }
      }

      // ── Effect 4: Center pulse — fires once at 90% ────────────────────────
      if (progress >= 0.9 && !pulseFired.current) {
        pulseFired.current = true;
        pulseAnimR.current?.beginElement();
        pulseAnimOp.current?.beginElement();
      }
    };

    const onScroll = () => {
      if (!rafId && isVisible) rafId = requestAnimationFrame(tick);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    // Set initial state based on current scroll position
    requestAnimationFrame(tick);

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
    {/* Outer wrapper is 200vh tall — panel pins for 100vh of scroll */}
    <div ref={wrapperRef} style={{ height: "200vh", position: "relative" }}>
    <section
      ref={panelRef}
      className="w-full px-8 md:px-16 lg:px-24 overflow-hidden"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "100vh",
        display: "flex",
        alignItems: "center",
        backgroundColor: "#0f0f0f",
      }}
    >
      {/* Subtle grid background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: [
            "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)",
            "linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          ].join(","),
          backgroundSize: "40px 40px",
        }}
      />

      <div className="w-full max-w-6xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 lg:gap-32 items-center">

          {/* ── LEFT: Text (scroll-driven blur-in) ── */}
          <div>
            {/* Eyebrow */}
            <p
              ref={el => { textRefs.current[0] = el as HTMLElement | null; }}
              className="text-xs font-semibold tracking-[0.2em] uppercase mb-5"
              style={{ color: "rgba(255,255,255,0.28)", opacity: 0.3, filter: "blur(6px)" }}
            >
              {t("Infrastruktur · Vernetzung · Skalierung", "Infrastructure · Integration · Scaling")}
            </p>

            {/* Headline */}
            <h2
              ref={el => { textRefs.current[1] = el as HTMLElement | null; }}
              className="text-white mb-6 font-bold tracking-tight"
              style={{
                fontSize: "clamp(2rem, 4vw, 3.25rem)",
                lineHeight: 1.1,
                opacity: 0.3,
                filter: "blur(6px)",
              }}
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
            <div
              ref={el => { textRefs.current[2] = el as HTMLElement | null; }}
              className="space-y-4 mb-12"
              style={{ color: "rgba(255,255,255,0.48)", opacity: 0.3, filter: "blur(6px)" }}
            >
              <p className="text-base leading-relaxed">
                {t(
                  "Jede Lösung, die wir bauen, ist darauf ausgelegt, mit den anderen zu kommunizieren.",
                  "Every solution we build is designed to communicate with the others.",
                )}
              </p>
              <p className="text-base leading-relaxed">
                {t(
                  "Kein Tool-Chaos, kein Datenverlust zwischen Systemen. Alles läuft in eine zentrale Infrastruktur — dein BusinessOS.",
                  "No tool chaos, no data loss between systems. Everything flows into one central infrastructure — your BusinessOS.",
                )}
              </p>
            </div>

            {/* Bullets */}
            <ul
              ref={el => { textRefs.current[3] = el as HTMLElement | null; }}
              className="space-y-5"
              style={{ opacity: 0.3, filter: "blur(6px)" }}
            >
              {BULLETS.map(({ icon: Icon, textDe, textEn }) => (
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
          </div>

          {/* ── RIGHT: SVG Diagram (scroll-driven convergence) ── */}
          <div className="flex items-center justify-center">
            <svg
              viewBox={`0 0 ${VW} ${VH}`}
              className="w-full max-w-[480px]"
              style={{ overflow: "visible" }}
            >
              <defs>
                {/* Glow for animated pulses */}
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

              {/* ── Connection lines ── initially hidden, fade in on node arrival */}
              {nodes.map(({ label }, i) => {
                const { nx, ny, dist } = nodeVec[i];
                const delay = i * 0.1;
                return (
                  <g
                    key={`line-${label}`}
                    ref={el => { lineRefs.current[i] = el; }}
                    style={{ opacity: 0, transition: "opacity 200ms ease-out" }}
                  >
                    {/* Static track */}
                    <line
                      x1={nx} y1={ny} x2={CX} y2={CY}
                      stroke="rgba(255,255,255,0.07)"
                      strokeWidth="1"
                    />
                    {/* Animated data-pulse traveling node → center */}
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

              {/* ── Nodes ── initial transform = displaced outward by SCATTER */}
              {nodes.map(({ icon: Icon, label }, i) => {
                const { nx, ny, ux, uy } = nodeVec[i];
                return (
                  <g
                    key={`node-${label}`}
                    ref={el => { nodeRefs.current[i] = el; }}
                    transform={`translate(${nx - NW / 2 + ux * SCATTER},${ny - NH / 2 + uy * SCATTER})`}
                  >
                    {/* Card background */}
                    <rect
                      width={NW} height={NH} rx="8"
                      fill="#1a1a1a"
                      stroke="rgba(255,255,255,0.09)"
                      strokeWidth="1"
                    />
                    {/* Icon box */}
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
                    <circle cx={NW / 2} cy={NH / 2} r="2.5" fill="rgba(255,255,255,0)" />
                  </g>
                );
              })}

              {/* ── Center Pill + radar-ping pulse ring ── */}
              <g>
                {/* Pulse ring — SMIL animations fired once at 90% scroll */}
                <circle
                  cx={CX} cy={CY} r="36"
                  fill="none"
                  stroke="rgba(255,255,255,0.55)"
                  strokeWidth="1.5"
                  opacity="0"
                >
                  <animate
                    ref={pulseAnimR}
                    attributeName="r"
                    from="36"
                    to={`${Math.round(36 * 2.2)}`}
                    dur="0.9s"
                    begin="indefinite"
                    fill="freeze"
                    calcMode="spline"
                    keyTimes="0;1"
                    keySplines="0.25 0 0.5 1"
                  />
                  <animate
                    ref={pulseAnimOp}
                    attributeName="opacity"
                    from="0.5"
                    to="0"
                    dur="0.9s"
                    begin="indefinite"
                    fill="freeze"
                    calcMode="spline"
                    keyTimes="0;1"
                    keySplines="0.25 0 0.5 1"
                  />
                </circle>

                {/* Pill */}
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
          </div>

        </div>
      </div>
      {/* Scroll indicator — bottom center of the pinned panel */}
      <style>{`
        @keyframes bos-scroll-drop {
          0%   { top: -100%; height: 50%; }
          100% { top: 200%; height: 50%; }
        }
      `}</style>
      <div
        style={{
          position: "absolute",
          bottom: "1.75rem",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <span
          style={{
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.3)",
          }}
        >
          scroll
        </span>
        <div
          style={{
            width: 1,
            height: 40,
            backgroundColor: "rgba(255,255,255,0.1)",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              backgroundColor: "rgba(255,255,255,0.55)",
              animation: "bos-scroll-drop 1.6s cubic-bezier(0.4,0,0.6,1) infinite",
            }}
          />
        </div>
      </div>
    </section>
    </div>

    {/* ── IntegrationMap — self-contained sticky section, grid continues ── */}
    <IntegrationMap />

    {/* ── Was konkret bei dir rauskommt — plain bg, no grid ── */}
    <MetricsSection />

    {/* ── Unsere Produkte ── */}
    <div id="projekte" style={{ paddingTop: "2rem" }}>
      <ProjectsSection />
    </div>

    </>
  );
}
