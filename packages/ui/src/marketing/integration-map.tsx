"use client";

import React, { useEffect, useRef } from "react";
import { ClipboardList, CreditCard, Send, Command } from "lucide-react";
import type { LucideProps } from "lucide-react";
import { useTranslation } from "@onvero/lib/language-context";

// ── Node data ─────────────────────────────────────────────────────────────────
type NodeDef = {
  id: string;
  label: string;
  logo?: string;
  FallbackIcon?: React.FC<LucideProps>;
  left: number; // %
  top: number;  // %
};

const NODES: NodeDef[] = [
  { id: "slack",      label: "Slack",           logo: "/logos/Slack_Technologies_2023_logo.svg",      left: 8,  top: 12 },
  { id: "gmail",      label: "Gmail",           logo: "/logos/Gmail_icon_(2020).svg",                 left: 5,  top: 28 },
  { id: "gsheets",    label: "Google Sheets",   logo: "/logos/Google_Sheets_logo_(2014-2020).svg",    left: 12, top: 44 },
  { id: "notion",     label: "Notion",          logo: "/logos/Notion-logo.svg",                       left: 3,  top: 60 },
  { id: "hubspot",    label: "HubSpot",         logo: "/logos/hubspot-icon.svg",                      left: 28, top: 8  },
  { id: "typeform",   label: "Typeform",        FallbackIcon: ClipboardList,                          left: 38, top: 22 },
  { id: "airtable",   label: "Airtable",        logo: "/logos/airtable-icon.svg",                     left: 32, top: 38 },
  { id: "calendly",   label: "Calendly",        logo: "/logos/calendly-icon.svg",                     left: 24, top: 54 },
  { id: "webhooks",   label: "Webhooks",        logo: "/logos/webhooks-svgrepo-com.svg",              left: 18, top: 70 },
  { id: "stripe",     label: "Stripe",          FallbackIcon: CreditCard,                             left: 52, top: 14 },
  { id: "shopify",    label: "Shopify",         logo: "/logos/shopify-icon.svg",                      left: 58, top: 30 },
  { id: "businessos", label: "BusinessOS",      FallbackIcon: Command,                                left: 48, top: 46 },
  { id: "postgres",   label: "PostgreSQL",      logo: "/logos/Postgresql_elephant.svg",               left: 55, top: 62 },
  { id: "github",     label: "GitHub",          logo: "/logos/Octicons-mark-github.svg",              left: 50, top: 76 },
  { id: "whatsapp",   label: "WhatsApp",        logo: "/logos/WhatsApp.svg",                          left: 72, top: 10 },
  { id: "salesforce", label: "Salesforce",      logo: "/logos/Salesforce.com_logo.svg",               left: 78, top: 24 },
  { id: "monday",     label: "Monday",          logo: "/logos/monday-icon-svgrepo-com.svg",            left: 68, top: 40 },
  { id: "zoom",       label: "Zoom",            logo: "/logos/zoom-meetings-icon.svg",                left: 76, top: 55 },
  { id: "twilio",     label: "Twilio",          logo: "/logos/twilio-icon-svgrepo-com.svg",           left: 70, top: 68 },
  { id: "mailchimp",  label: "Mailchimp",       logo: "/logos/mailchimp-svgrepo-com.svg",             left: 82, top: 36 },
  { id: "jira",       label: "Jira",            logo: "/logos/Jira.svg",                              left: 86, top: 52 },
  { id: "discord",    label: "Discord",         logo: "/logos/discord-svgrepo-com.svg",               left: 88, top: 18 },
  { id: "telegram",   label: "Telegram",        FallbackIcon: Send,                                   left: 84, top: 70 },
  { id: "teams",      label: "Microsoft Teams", logo: "/logos/Microsoft_Office_Teams_(2019–2025).svg", left: 74, top: 82 },
];

// ── Phase node assignments ────────────────────────────────────────────────────
// Phase 1: BusinessOS (center hub)
// Phase 2: inner ring — closest visually to BusinessOS
const PHASE2_IDS = ["airtable", "gsheets", "typeform", "shopify", "postgres"];
// Phase 3: all remaining outer nodes
const PHASE3_IDS = NODES
  .filter((n) => n.id !== "businessos" && !PHASE2_IDS.includes(n.id))
  .map((n) => n.id);

// ── Hub connections (every node → BusinessOS) ─────────────────────────────────
const HUB_CONNS = NODES
  .filter((n) => n.id !== "businessos")
  .map((n) => ({ id: `hub-${n.id}`, from: n.id, to: "businessos" }));

// ── Cross-connections between outer nodes (Phase 4) ───────────────────────────
const CROSS_CONNS = [
  { id: "cx1",  from: "slack",      to: "hubspot"   },
  { id: "cx2",  from: "gmail",      to: "typeform"  },
  { id: "cx3",  from: "gsheets",    to: "airtable"  },
  { id: "cx4",  from: "hubspot",    to: "stripe"    },
  { id: "cx5",  from: "typeform",   to: "notion"    },
  { id: "cx6",  from: "stripe",     to: "slack"     },
  { id: "cx7",  from: "shopify",    to: "mailchimp" },
  { id: "cx8",  from: "calendly",   to: "zoom"      },
  { id: "cx9",  from: "github",     to: "postgres"  },
  { id: "cx10", from: "whatsapp",   to: "twilio"    },
  { id: "cx11", from: "salesforce", to: "monday"    },
  { id: "cx12", from: "jira",       to: "slack"     },
  { id: "cx13", from: "discord",    to: "webhooks"  },
];

// ── SVG coordinate helpers ────────────────────────────────────────────────────
// viewBox "0 0 1000 520" — matches the node left/top % positions
function getNode(id: string): NodeDef { return NODES.find((n) => n.id === id)!; }
function cx(n: NodeDef): number { return n.left * 10 + 50; }
function cy(n: NodeDef): number { return n.top * 5.2 + 20; }

function pathD(fromId: string, toId: string): string {
  const a = getNode(fromId), b = getNode(toId);
  const x1 = cx(a), y1 = cy(a), x2 = cx(b), y2 = cy(b);
  const dx = x2 - x1, dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  const offset = Math.min(dist * 0.18, 80);
  const px = (-dy / dist) * offset, py = (dx / dist) * offset;
  const cp1x = x1 + dx * 0.35 + px, cp1y = y1 + dy * 0.35 + py;
  const cp2x = x1 + dx * 0.65 + px, cp2y = y1 + dy * 0.65 + py;
  return `M ${x1.toFixed(1)} ${y1.toFixed(1)} C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)}`;
}

// ── Animation helpers ─────────────────────────────────────────────────────────
function easeOut(t: number): number { return 1 - (1 - t) * (1 - t); }
function activT(progress: number, start: number, dur: number): number {
  return Math.max(0, Math.min(1, (progress - start) / Math.max(0.001, dur)));
}

// ── Component ─────────────────────────────────────────────────────────────────
export function IntegrationMap() {
  const { t } = useTranslation();

  const wrapperRef    = useRef<HTMLDivElement>(null);
  const panelRef      = useRef<HTMLDivElement>(null);
  const counterWrapperRef = useRef<HTMLDivElement>(null);
  const counterFgRef      = useRef<HTMLParagraphElement>(null);
  // node card elements keyed by node id
  const nodeRefs      = useRef<Record<string, HTMLDivElement | null>>({});
  // hub path elements keyed by the non-openai node id
  const hubRefs       = useRef<Record<string, SVGPathElement | null>>({});
  // cross-connection path elements keyed by connection id
  const crossRefs     = useRef<Record<string, SVGPathElement | null>>({});
  const hubLengths    = useRef<Record<string, number>>({});
  const pulseFired    = useRef(false);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const panel   = panelRef.current;
    if (!wrapper || !panel) return;
    let isVisible = false;

    // Only run scroll-driven animation when section is near the viewport
    const io = new IntersectionObserver(
      ([entry]) => { isVisible = entry.isIntersecting; if (isVisible) onScroll(); },
      { rootMargin: "200px" },
    );
    io.observe(wrapper);

    const mobile = window.innerWidth < 768;
    if (mobile) wrapper.style.height = "200vh";

    // ── Measure hub path lengths and set initial hidden state ────────────────
    Object.entries(hubRefs.current).forEach(([nodeId, path]) => {
      if (!path) return;
      const len = path.getTotalLength();
      hubLengths.current[nodeId] = len;
      path.style.strokeDasharray  = `${len}`;
      path.style.strokeDashoffset = `${len}`;
      path.style.opacity = "0";
    });
    Object.values(crossRefs.current).forEach((path) => {
      if (path) path.style.opacity = "0";
    });

    // ── Set all nodes to initial muted state ─────────────────────────────────
    Object.values(nodeRefs.current).forEach((el) => {
      if (!el) return;
      el.style.opacity = "0.2";
      el.style.filter  = "grayscale(100%) brightness(0.4)";
    });

    // ── Hover: track hovered nodes explicitly (el.matches(":hover") is unreliable) ──
    const lastT: Record<string, number> = {};
    const hoveredSet = new Set<string>();

    function restoreNode(id: string) {
      const el = nodeRefs.current[id];
      if (!el) return;
      const t = lastT[id] ?? 0;
      const e = easeOut(t);
      el.style.opacity         = String(0.2 + 0.8 * e);
      el.style.filter          = `grayscale(${((1 - e) * 100).toFixed(0)}%) brightness(${(0.4 + 0.6 * e).toFixed(2)})`;
      el.style.backgroundColor = "rgba(255,255,255,0.04)";
      el.style.borderColor     = "rgba(255,255,255,0.08)";
      el.style.boxShadow       = e > 0.5 ? `0 0 ${(8 * e).toFixed(1)}px rgba(255,255,255,${(0.3 * e).toFixed(2)})` : "";
      const img = el.querySelector<HTMLImageElement>("img");
      if (img) { img.style.filter = "brightness(0) invert(1)"; img.style.opacity = "0.8"; }
    }

    type ListenerEntry = { el: HTMLDivElement; enter: () => void; leave: () => void };
    const hoverListeners: ListenerEntry[] = [];

    NODES.forEach(({ id }) => {
      const el = nodeRefs.current[id];
      if (!el) return;
      const enter = () => {
        hoveredSet.add(id);
        el.style.opacity         = "1";
        el.style.filter          = "grayscale(0%) brightness(1)";
        el.style.backgroundColor = "rgba(255,255,255,0.07)";
        el.style.borderColor     = "rgba(255,255,255,0.2)";
        el.style.boxShadow       = "0 0 12px rgba(255,255,255,0.25)";
        const img = el.querySelector<HTMLImageElement>("img");
        if (img) { img.style.filter = "none"; img.style.opacity = "1"; }
      };
      const leave = () => {
        hoveredSet.delete(id);
        restoreNode(id);
      };
      el.addEventListener("mouseenter", enter);
      el.addEventListener("mouseleave", leave);
      hoverListeners.push({ el, enter, leave });
    });

    // ── Per-element updaters ─────────────────────────────────────────────────
    function applyNode(id: string, t: number) {
      lastT[id] = t;
      const el = nodeRefs.current[id];
      if (!el || hoveredSet.has(id)) return; // don't override hover state
      const e = easeOut(t);
      el.style.opacity    = String(0.2 + 0.8 * e);
      el.style.filter     = `grayscale(${((1 - e) * 100).toFixed(0)}%) brightness(${(0.4 + 0.6 * e).toFixed(2)})`;
      el.style.boxShadow  = e > 0.5
        ? `0 0 ${(8 * e).toFixed(1)}px rgba(255,255,255,${(0.3 * e).toFixed(2)})`
        : "";
    }

    function applyHub(nodeId: string, t: number) {
      const path = hubRefs.current[nodeId];
      if (!path) return;
      const len = hubLengths.current[nodeId] ?? 0;
      const e   = easeOut(t);
      path.style.strokeDashoffset = String(len * (1 - e));
      path.style.opacity          = String(0.25 * e);
    }

    function applyCross(id: string, t: number) {
      const path = crossRefs.current[id];
      if (path) path.style.opacity = String(0.4 * easeOut(t));
    }

    // ── Main tick ────────────────────────────────────────────────────────────
    let rafId = 0;
    const tick = () => {
      rafId = 0;
      const rect     = wrapper.getBoundingClientRect();
      const viewH    = window.innerHeight;
      const scrollDist = Math.max(1, wrapper.offsetHeight - viewH);

      // JS-driven sticky (immune to overflow:hidden on ancestors)
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

      const p      = Math.max(0, Math.min(1, -rect.top / scrollDist));
      const isMob  = window.innerWidth < 768;

      if (isMob) {
        // ── Mobile: 2 phases ────────────────────────────────────────────────
        const centerIds = ["businessos", ...PHASE2_IDS];
        centerIds.forEach((id, i) => {
          const t = activT(p, i * (0.5 / centerIds.length), 0.08);
          applyNode(id, t);
          if (id !== "businessos") applyHub(id, t);
        });
        PHASE3_IDS.forEach((id, i) => {
          const t = activT(p, 0.5 + i * (0.5 / PHASE3_IDS.length), 0.06);
          applyNode(id, t);
          applyHub(id, t);
        });
      } else {
        // ── Phase 1 (0–20%): OpenAI activates ───────────────────────────────
        applyNode("businessos", activT(p, 0, 0.2));

        // ── Phase 2 (20–45%): inner ring + hub lines ─────────────────────────
        const p2step = 0.25 / PHASE2_IDS.length;
        PHASE2_IDS.forEach((id, i) => {
          const t = activT(p, 0.2 + i * p2step, 0.04);
          applyNode(id, t);
          applyHub(id, t);
        });

        // ── Phase 3 (45–70%): outer ring + hub lines ─────────────────────────
        const p3step = 0.25 / PHASE3_IDS.length;
        PHASE3_IDS.forEach((id, i) => {
          const t = activT(p, 0.45 + i * p3step, 0.04);
          applyNode(id, t);
          applyHub(id, t);
        });

        // ── Phase 4 (70–90%): cross-connections ──────────────────────────────
        CROSS_CONNS.forEach((conn, i) => {
          const t = activT(p, 0.7 + i * (0.2 / CROSS_CONNS.length), 0.04);
          applyCross(conn.id, t);
        });

        // ── Phase 5 (90–100%): simultaneous pulse ────────────────────────────
        if (p >= 0.9 && !pulseFired.current) {
          pulseFired.current = true;
          Object.values(nodeRefs.current).forEach((el) => {
            if (!el) return;
            el.style.transition = "transform 200ms ease-out";
            el.style.transform  = "scale(1.08)";
            setTimeout(() => {
              el.style.transition = "transform 200ms ease-in";
              el.style.transform  = "scale(1)";
              setTimeout(() => { el.style.transition = ""; }, 210);
            }, 200);
          });
        }
      }

    };

    const onScroll = () => { if (!rafId && isVisible) rafId = requestAnimationFrame(tick); };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    requestAnimationFrame(tick);

    // ── Counter reveal — independent viewport-based scroll listener ───────────
    const onCounterScroll = () => {
      const wrapperEl = counterWrapperRef.current;
      const fg        = counterFgRef.current;
      if (!wrapperEl || !fg) return;
      const rect    = wrapperEl.getBoundingClientRect();
      const viewH   = window.innerHeight;
      const start   = viewH * 0.8;
      const end     = viewH * 0.2;
      const progress = Math.min(1, Math.max(0, (start - rect.top) / (start - end)));
      fg.style.clipPath = `inset(0 ${(100 - progress * 100).toFixed(1)}% 0 0)`;
    };
    window.addEventListener("scroll", onCounterScroll, { passive: true });
    window.addEventListener("resize", onCounterScroll, { passive: true });
    onCounterScroll(); // init

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onCounterScroll);
      window.removeEventListener("resize", onCounterScroll);
      hoverListeners.forEach(({ el, enter, leave }) => {
        el.removeEventListener("mouseenter", enter);
        el.removeEventListener("mouseleave", leave);
      });
    };
  }, []);

  return (
    <>
    {/* 300vh wrapper (200vh on mobile, set via JS after mount) */}
    <div ref={wrapperRef} style={{ height: "300vh", position: "relative" }}>
      <div
        ref={panelRef}
        style={{
          position: "absolute",
          top: 0, left: 0, right: 0,
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#0f0f0f",
          backgroundImage: [
            "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)",
            "linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          ].join(","),
          backgroundSize: "40px 40px",
        }}
      >
        {/* ── Heading ── */}
        <div className="max-w-6xl mx-auto w-full px-8 md:px-16 lg:px-24 pt-16 pb-8 text-center">
          <h3
            className="font-bold text-white tracking-tight mb-2"
            style={{ fontSize: "clamp(1.2rem, 2vw, 1.5rem)" }}
          >
            {t("Integriert in was du bereits nutzt.", "Integrated with what you already use.")}
          </h3>
          <p className="text-sm mx-auto max-w-xl" style={{ color: "rgba(255,255,255,0.4)" }}>
            {t(
              "Egal welche Tools dein Unternehmen heute einsetzt — wir verbinden sie. Über 400 Integrationen verfügbar, kein technisches Setup nötig.",
              "No matter what tools your business uses today — we connect them. Over 400 integrations available, no technical setup needed.",
            )}
          </p>
        </div>

        {/* ── Network canvas ── */}
        <div
          style={{
            flex: 1,
            position: "relative",
            maskImage: "radial-gradient(ellipse 90% 85% at 50% 50%, black 30%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(ellipse 90% 85% at 50% 50%, black 30%, transparent 100%)",
          }}
        >
          <style>{`
            .int-logo { width: 16px; height: 16px; object-fit: contain; flex-shrink: 0;
                        filter: brightness(0) invert(1); opacity: 0.8; }
          `}</style>

          {/* SVG connection lines */}
          <svg
            viewBox="0 0 1000 520"
            preserveAspectRatio="none"
            style={{
              position: "absolute", inset: 0,
              width: "100%", height: "100%",
              pointerEvents: "none",
            }}
          >
            <defs>
              <filter id="intGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Hub paths — draw-in on node activation */}
            {HUB_CONNS.map(({ id, from, to }) => (
              <path
                key={id}
                ref={(el) => { hubRefs.current[from] = el; }}
                d={pathD(from, to)}
                fill="none"
                stroke="white"
                strokeWidth="1"
                strokeLinecap="round"
                filter="url(#intGlow)"
                style={{ opacity: 0 }}
              />
            ))}

            {/* Cross-connection paths — fade in during Phase 4 */}
            {CROSS_CONNS.map(({ id, from, to }) => (
              <path
                key={id}
                ref={(el) => { crossRefs.current[id] = el; }}
                d={pathD(from, to)}
                fill="none"
                stroke="rgba(255,255,255,0.7)"
                strokeWidth="0.75"
                strokeLinecap="round"
                style={{ opacity: 0 }}
              />
            ))}
          </svg>

          {/* Node cards */}
          {NODES.map(({ id, label, logo, FallbackIcon, left, top }) => (
            <div
              key={id}
              ref={(el) => { nodeRefs.current[id] = el; }}
              style={{
                position: "absolute",
                left: `${left}%`,
                top: `${top}%`,
                height: 40,
                padding: "0 12px",
                borderRadius: 10,
                backgroundColor: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
                fontWeight: 500,
                color: "rgba(255,255,255,0.9)",
                whiteSpace: "nowrap",
                userSelect: "none",
                cursor: "default",
                opacity: 0.2,
                filter: "grayscale(100%) brightness(0.4)",
                willChange: "opacity, filter, box-shadow",
              }}
            >
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt={label} className="int-logo" />
              ) : FallbackIcon ? (
                <FallbackIcon style={{ width: 16, height: 16, flexShrink: 0, color: "white", opacity: 0.8 }} />
              ) : null}
              {label}
            </div>
          ))}

        </div>

      </div>
    </div>

    {/* ── Counter headline — normal flow, below the sticky network section ── */}
    <style>{`
      .integration-counter-wrapper {
        position: relative;
        width: 100%;
        padding: 4rem 2rem 2rem;
        background-color: #0f0f0f;
        background-image:
          linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
        background-size: 40px 40px;
      }
      .integration-counter-bg,
      .integration-counter-fg {
        margin: 0;
        font-size: clamp(1.2rem, 2vw, 1.5rem);
        font-weight: 700;
        white-space: nowrap;
        line-height: 1.1;
        width: 100%;
        text-align: center;
      }
      .integration-counter-bg {
        color: rgba(255, 255, 255, 0.2);
      }
      .integration-counter-fg {
        position: absolute;
        inset: 0;
        padding: 4rem 2rem 2rem;
        color: white;
        clip-path: inset(0 100% 0 0);
      }
    `}</style>
    <div ref={counterWrapperRef} className="integration-counter-wrapper">
      <p className="integration-counter-bg">{t("Über 400 weitere Integrationen.", "Over 400 more integrations.")}</p>
      <p ref={counterFgRef} className="integration-counter-fg">{t("Über 400 weitere Integrationen.", "Over 400 more integrations.")}</p>
    </div>
    </>
  );
}
