"use client";

import React, { useState } from "react";
import { ClipboardList, CreditCard, Send } from "lucide-react";
import type { LucideProps } from "lucide-react";

// ── Node data ─────────────────────────────────────────────────────────────────
type NodeDef = {
  id: string;
  label: string;
  logo?: string;                        // path under /logos/
  FallbackIcon?: React.FC<LucideProps>; // only when no logo
  left: number; // %
  top: number;  // %
};

const NODES: NodeDef[] = [
  // Cluster 1 — top left
  { id: "slack",      label: "Slack",           logo: "/logos/Slack_Technologies_2023_logo.svg",      left: 8,  top: 12 },
  { id: "gmail",      label: "Gmail",           logo: "/logos/Gmail_icon_(2020).svg",                 left: 5,  top: 28 },
  { id: "gsheets",    label: "Google Sheets",   logo: "/logos/Google_Sheets_logo_(2014-2020).svg",    left: 12, top: 44 },
  { id: "notion",     label: "Notion",          logo: "/logos/Notion-logo.svg",                       left: 3,  top: 60 },
  // Cluster 2 — top center/right
  { id: "hubspot",    label: "HubSpot",         logo: "/logos/hubspot-icon.svg",                      left: 28, top: 8  },
  { id: "typeform",   label: "Typeform",        FallbackIcon: ClipboardList,                          left: 38, top: 22 },
  { id: "airtable",   label: "Airtable",        logo: "/logos/airtable-icon.svg",                     left: 32, top: 38 },
  { id: "calendly",   label: "Calendly",        logo: "/logos/calendly-icon.svg",                     left: 24, top: 54 },
  { id: "webhooks",   label: "Webhooks",        logo: "/logos/webhooks-svgrepo-com.svg",              left: 18, top: 70 },
  // Cluster 3 — center
  { id: "stripe",     label: "Stripe",          FallbackIcon: CreditCard,                             left: 52, top: 14 },
  { id: "shopify",    label: "Shopify",         logo: "/logos/shopify-icon.svg",                      left: 58, top: 30 },
  { id: "openai",     label: "OpenAI",          logo: "/logos/openai-icon.svg",                       left: 48, top: 46 },
  { id: "postgres",   label: "PostgreSQL",      logo: "/logos/Postgresql_elephant.svg",               left: 55, top: 62 },
  { id: "github",     label: "GitHub",          logo: "/logos/Octicons-mark-github.svg",              left: 50, top: 76 },
  // Cluster 4 — right
  { id: "whatsapp",   label: "WhatsApp",        logo: "/logos/WhatsApp.svg",                          left: 72, top: 10 },
  { id: "salesforce", label: "Salesforce",      logo: "/logos/Salesforce.com_logo.svg",               left: 78, top: 24 },
  { id: "monday",     label: "Monday",          logo: "/logos/monday-icon-svgrepo-com.svg",            left: 68, top: 40 },
  { id: "zoom",       label: "Zoom",            logo: "/logos/zoom-meetings-icon.svg",                 left: 76, top: 55 },
  { id: "twilio",     label: "Twilio",          logo: "/logos/twilio-icon-svgrepo-com.svg",            left: 70, top: 68 },
  { id: "mailchimp",  label: "Mailchimp",       logo: "/logos/mailchimp-svgrepo-com.svg",              left: 82, top: 36 },
  { id: "jira",       label: "Jira",            logo: "/logos/Jira.svg",                               left: 86, top: 52 },
  { id: "discord",    label: "Discord",         logo: "/logos/discord-svgrepo-com.svg",                left: 88, top: 18 },
  { id: "telegram",   label: "Telegram",        FallbackIcon: Send,                                   left: 84, top: 70 },
  { id: "teams",      label: "Microsoft Teams", logo: "/logos/Microsoft_Office_Teams_(2019–2025).svg", left: 74, top: 82 },
];

// ── Connection data ───────────────────────────────────────────────────────────
type Connection = { id: string; from: string; to: string; delay: number; dur: number };

const CONNECTIONS: Connection[] = [
  { id: "c1",  from: "slack",      to: "hubspot",    delay: 0,   dur: 2.2 },
  { id: "c2",  from: "gmail",      to: "typeform",   delay: 0.3, dur: 2.5 },
  { id: "c3",  from: "gsheets",    to: "airtable",   delay: 0.6, dur: 2.8 },
  { id: "c4",  from: "hubspot",    to: "stripe",     delay: 0.9, dur: 2.3 },
  { id: "c5",  from: "typeform",   to: "notion",     delay: 1.2, dur: 2.6 },
  { id: "c6",  from: "stripe",     to: "slack",      delay: 1.5, dur: 2.9 },
  { id: "c7",  from: "shopify",    to: "mailchimp",  delay: 1.8, dur: 2.1 },
  { id: "c8",  from: "openai",     to: "hubspot",    delay: 2.1, dur: 2.4 },
  { id: "c9",  from: "calendly",   to: "zoom",       delay: 2.4, dur: 2.7 },
  { id: "c10", from: "github",     to: "postgres",   delay: 2.7, dur: 2.0 },
  { id: "c11", from: "whatsapp",   to: "twilio",     delay: 3.0, dur: 2.3 },
  { id: "c12", from: "salesforce", to: "monday",     delay: 3.3, dur: 2.6 },
  { id: "c13", from: "jira",       to: "slack",      delay: 3.6, dur: 3.0 },
  { id: "c14", from: "discord",    to: "webhooks",   delay: 3.9, dur: 2.8 },
  { id: "c15", from: "telegram",   to: "openai",     delay: 4.2, dur: 2.5 },
];

// ── Coordinate helpers ────────────────────────────────────────────────────────
function cx(node: NodeDef): number { return node.left * 10 + 50; }
function cy(node: NodeDef): number { return node.top * 5.2 + 20; }
function getNode(id: string): NodeDef { return NODES.find((n) => n.id === id)!; }

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

// ── Component ─────────────────────────────────────────────────────────────────
export function IntegrationMap() {
  const [activeNode, setActiveNode] = useState<string | null>(null);

  function isConnected(connId: string, nodeId: string): boolean {
    const c = CONNECTIONS.find((c) => c.id === connId)!;
    return c.from === nodeId || c.to === nodeId;
  }

  return (
    <>
      <style>{`
        @keyframes integrationPulse {
          from { stroke-dashoffset: 440; }
          to   { stroke-dashoffset: 0; }
        }
        .int-logo {
          width: 16px;
          height: 16px;
          object-fit: contain;
          flex-shrink: 0;
          filter: brightness(0) invert(1);
          opacity: 0.5;
          transition: filter 0.25s ease, opacity 0.25s ease;
        }
        .int-node:hover .int-logo,
        .int-node[data-active="true"] .int-logo {
          filter: none;
          opacity: 1;
        }
        .int-fallback-icon {
          opacity: 0.5;
          transition: opacity 0.25s ease;
        }
        .int-node:hover .int-fallback-icon,
        .int-node[data-active="true"] .int-fallback-icon {
          opacity: 0.9;
        }
      `}</style>

      <div
        style={{
          height: 520,
          overflow: "hidden",
          position: "relative",
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          maskImage: "radial-gradient(ellipse 90% 85% at 50% 50%, black 40%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 90% 85% at 50% 50%, black 40%, transparent 100%)",
        }}
      >
        {/* ── SVG connection lines ── */}
        <svg
          viewBox="0 0 1000 520"
          preserveAspectRatio="none"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", overflow: "visible" }}
        >
          <defs>
            <filter id="intGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {CONNECTIONS.map((conn) => {
            const d = pathD(conn.from, conn.to);
            const highlighted = activeNode !== null && isConnected(conn.id, activeNode);
            return (
              <g key={conn.id}>
                <path d={d} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1"
                  style={{ transition: "stroke-opacity 0.2s ease", strokeOpacity: highlighted ? 3 : 1 }} />
                <path d={d} fill="none" stroke="rgba(200,200,220,0.55)" strokeWidth="1.5"
                  strokeLinecap="round" strokeDasharray="40 400" filter="url(#intGlow)"
                  style={{
                    animation: `integrationPulse ${conn.dur}s linear infinite`,
                    animationDelay: `${conn.delay}s`,
                    strokeOpacity: highlighted ? 1 : 0.6,
                    transition: "stroke-opacity 0.2s ease",
                  }} />
              </g>
            );
          })}
        </svg>

        {/* ── App nodes ── */}
        {NODES.map(({ id, label, logo, FallbackIcon, left, top }) => {
          const isActive = activeNode === id;
          return (
            <div
              key={id}
              className="int-node"
              data-active={isActive ? "true" : "false"}
              onMouseEnter={() => setActiveNode(id)}
              onMouseLeave={() => setActiveNode(null)}
              style={{
                position: "absolute",
                left: `${left}%`,
                top: `${top}%`,
                height: 40,
                padding: "0 12px",
                borderRadius: 10,
                background: isActive ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)",
                border: isActive ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(255,255,255,0.08)",
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
                fontWeight: 500,
                color: isActive ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.7)",
                whiteSpace: "nowrap",
                cursor: "default",
                transition: "all 0.2s ease",
                userSelect: "none",
                zIndex: isActive ? 2 : 1,
              }}
            >
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt={label} className="int-logo" />
              ) : FallbackIcon ? (
                <FallbackIcon className="int-fallback-icon" style={{ width: 16, height: 16, flexShrink: 0 }} />
              ) : null}
              {label}
            </div>
          );
        })}
      </div>
    </>
  );
}
