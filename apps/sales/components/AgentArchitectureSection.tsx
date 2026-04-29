'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Gauge, Mail, Network, Search } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { OnveroGradient } from './OnveroGradient';

const PANEL_W = 1115;
const PANEL_H = 560;
const CARD_W_PCT = 21.5;
const CARD_W = (CARD_W_PCT / 100) * PANEL_W;
const CARD_H = 62;
const BALL_R = 15;
const BALL_CLUSTER_W = 208.5;
const BALL_CLUSTER_OFFSETS = [28, 104.5, 181] as const;
const BALL_CLUSTER_TOP_OFFSET = 60;

const PULSE_DURATION = 1100;
const TOOL_PULSE_DURATION = 750;
const BREATHING_DURATION = 3000;
const TOOL_GLOW_DURATION = 1800;

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

type Agent = {
  id: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  tag: string;
  tools: string;
  left: number;
  top: number;
};

const agents: Agent[] = [
  { id: 'lead-scout',     icon: Search,  title: 'Lead Scout',      subtitle: 'Prospecting Agent',   tag: 'Live', tools: 'Database · Enrichment',  left: 5,  top: 37 },
  { id: 'score-engine',   icon: Gauge,   title: 'Score Engine',    subtitle: 'Qualification Agent', tag: 'Auto', tools: 'Firecrawl · Vector DB',  left: 38, top: 16 },
  { id: 'outreach-writer',icon: Mail,    title: 'Outreach Writer', subtitle: 'Email Agent',         tag: 'AI',   tools: 'Resend · Templates',     left: 74, top: 38 },
  { id: 'business-agent', icon: Network, title: 'Business Agent',  subtitle: 'Orchestrator',        tag: 'Core', tools: 'Router · Memory',        left: 38, top: 60 },
];

type CardBounds = {
  left: number;
  top: number;
  right: number;
  bottom: number;
  cx: number;
  cy: number;
};

function getCardBounds(a: Agent): CardBounds {
  const left = (a.left / 100) * PANEL_W;
  const top = (a.top / 100) * PANEL_H;
  return {
    left,
    top,
    right: left + CARD_W,
    bottom: top + CARD_H,
    cx: left + CARD_W / 2,
    cy: top + CARD_H / 2,
  };
}

const cardBounds: Record<string, CardBounds> = Object.fromEntries(
  agents.map((a) => [a.id, getCardBounds(a)]),
);

type ToolConnection = {
  agentId: string;
  cardAnchor: { x: number; y: number };
  balls: { x: number; y: number }[];
};

const toolConnections: ToolConnection[] = agents.map((a) => {
  const b = cardBounds[a.id];
  const cardAnchor = { x: b.cx, y: b.bottom };
  const clusterLeftPx = cardAnchor.x - BALL_CLUSTER_W / 2;
  const clusterTopPx = b.bottom + BALL_CLUSTER_TOP_OFFSET;
  const balls = BALL_CLUSTER_OFFSETS.map((dx) => ({
    x: clusterLeftPx + dx,
    y: clusterTopPx,
  }));
  return { agentId: a.id, cardAnchor, balls };
});

type InterAgentLink = {
  id: string;
  fromId: string;
  toId: string;
  d: string;
};

const ls = cardBounds['lead-scout'];
const se = cardBounds['score-engine'];
const ow = cardBounds['outreach-writer'];
const ba = cardBounds['business-agent'];

const interAgentLinks: InterAgentLink[] = [
  {
    id: 'score-engine--lead-scout',
    fromId: 'score-engine',
    toId: 'lead-scout',
    d: `M ${se.left} ${se.cy} C ${(se.left + ls.right) / 2} ${se.cy}, ${(se.left + ls.right) / 2} ${ls.cy}, ${ls.right} ${ls.cy}`,
  },
  {
    id: 'score-engine--outreach-writer',
    fromId: 'score-engine',
    toId: 'outreach-writer',
    d: `M ${se.right} ${se.cy} C ${(se.right + ow.left) / 2} ${se.cy}, ${(se.right + ow.left) / 2} ${ow.cy}, ${ow.left} ${ow.cy}`,
  },
  {
    id: 'lead-scout--business-agent',
    fromId: 'lead-scout',
    toId: 'business-agent',
    d: `M ${ls.right} ${ls.cy} C ${(ls.right + ba.left) / 2} ${ls.cy}, ${(ls.right + ba.left) / 2} ${ba.cy}, ${ba.left} ${ba.cy}`,
  },
  {
    id: 'outreach-writer--business-agent',
    fromId: 'outreach-writer',
    toId: 'business-agent',
    d: `M ${ow.left} ${ow.cy} C ${(ow.left + ba.right) / 2} ${ow.cy}, ${(ow.left + ba.right) / 2} ${ba.cy}, ${ba.right} ${ba.cy}`,
  },
];

function getLinkBetween(
  from: string,
  to: string,
): { fromId: string; toId: string; direction: 'forward' | 'reverse' } | null {
  for (const link of interAgentLinks) {
    if (link.fromId === from && link.toId === to) {
      return { fromId: link.fromId, toId: link.toId, direction: 'forward' };
    }
    if (link.fromId === to && link.toId === from) {
      return { fromId: link.fromId, toId: link.toId, direction: 'reverse' };
    }
  }
  return null;
}

const CW_ORDER = ['lead-scout', 'business-agent', 'outreach-writer', 'score-engine'] as const;
const CCW_ORDER = ['lead-scout', 'score-engine', 'outreach-writer', 'business-agent'] as const;

function AgentCard({ agent }: { agent: Agent }) {
  const Icon = agent.icon;
  return (
    <div
      data-agent-card-inner={agent.id}
      className="onv-card flex h-full w-full items-center gap-2 rounded-full pl-1.5 pr-3 ring-1 ring-white/15 backdrop-blur-xl"
      style={{
        backgroundImage:
          'linear-gradient(89deg, rgba(227,233,247,0.51) 0%, rgba(255,255,255,0.12) 100%)',
      }}
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-[#e3e9f7] to-[#e3e9f7]/80">
        <Icon className="size-4 text-[#2D1B69]" strokeWidth={2.25} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11.26px] font-bold leading-tight text-white">
          {agent.title}
        </p>
        <p className="truncate text-[9.39px] font-semibold leading-tight text-white/70">
          {agent.subtitle}
        </p>
        <div className="mt-0.5 flex items-center gap-1.5">
          <span className="rounded-[2px] bg-[#C5E8E4] px-1 py-[1px] text-[9.39px] font-bold text-[#40BFB1]">
            {agent.tag}
          </span>
          <span className="truncate text-[9.39px] font-medium text-white">
            {agent.tools}
          </span>
        </div>
      </div>
      <ArrowUpRight className="size-4 shrink-0 text-white/85" />
    </div>
  );
}

function ArchitectureOverlay({
  svgRef,
}: {
  svgRef: React.RefObject<SVGSVGElement | null>;
}) {
  return (
    <svg
      ref={svgRef}
      aria-hidden="true"
      viewBox={`0 0 ${PANEL_W} ${PANEL_H}`}
      preserveAspectRatio="xMidYMid meet"
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      <defs>
        <radialGradient id="onv-glass-ball" cx="50%" cy="32%" r="65%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.92)" />
          <stop offset="55%" stopColor="rgba(231,237,250,0.55)" />
          <stop offset="100%" stopColor="rgba(180,195,225,0.18)" />
        </radialGradient>
        <linearGradient id="onv-connector" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.12)" />
        </linearGradient>
        <filter id="onv-pulse-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {interAgentLinks.map((link) => (
        <path
          key={link.id}
          d={link.d}
          stroke="url(#onv-connector)"
          strokeWidth="0.9"
          strokeLinecap="round"
          fill="none"
          data-inter-agent
          data-from={link.fromId}
          data-to={link.toId}
        />
      ))}

      {toolConnections.map((conn) => (
        <g key={conn.agentId} data-agent={conn.agentId}>
          {conn.balls.map((ball, i) => {
            const midY = (conn.cardAnchor.y + ball.y) / 2;
            const d = `M ${conn.cardAnchor.x} ${conn.cardAnchor.y} C ${conn.cardAnchor.x} ${midY}, ${ball.x} ${midY}, ${ball.x} ${ball.y - BALL_R}`;
            return (
              <path
                key={i}
                d={d}
                stroke="url(#onv-connector)"
                strokeWidth="0.9"
                strokeLinecap="round"
                fill="none"
                data-connector
                data-agent={conn.agentId}
                data-ball-index={i}
              />
            );
          })}

          <circle
            cx={conn.cardAnchor.x}
            cy={conn.cardAnchor.y}
            r="1.6"
            fill="rgba(255,255,255,0.75)"
            data-anchor
            data-agent={conn.agentId}
          />

          {conn.balls.map((ball, i) => (
            <g key={i} data-ball data-agent={conn.agentId} data-ball-index={i}>
              <circle
                cx={ball.x}
                cy={ball.y}
                r={BALL_R}
                fill="url(#onv-glass-ball)"
                stroke="rgba(255,255,255,0.35)"
                strokeWidth="0.6"
                data-ball-circle
              />
              <ellipse
                cx={ball.x}
                cy={ball.y - 7}
                rx="7"
                ry="2.6"
                fill="rgba(255,255,255,0.45)"
              />
            </g>
          ))}
        </g>
      ))}

      <g data-pulse-layer />
    </svg>
  );
}

function useArchitectureChoreography(
  panelRef: React.RefObject<HTMLDivElement | null>,
  svgRef: React.RefObject<SVGSVGElement | null>,
) {
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const onEnter = () => setHovering(true);
    const onLeave = () => setHovering(false);
    panel.addEventListener('mouseenter', onEnter);
    panel.addEventListener('mouseleave', onLeave);
    return () => {
      panel.removeEventListener('mouseenter', onEnter);
      panel.removeEventListener('mouseleave', onLeave);
    };
  }, [panelRef]);

  useEffect(() => {
    if (!hovering) return;
    const svg = svgRef.current;
    if (!svg) return;

    let cancelled = false;
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    const rafs: number[] = [];
    const ephemeralEls = new Set<SVGElement>();
    const breathingCleanups: Array<() => void> = [];
    const glowCleanups: Array<() => void> = [];

    const schedule = (fn: () => void, ms: number) => {
      const id = setTimeout(() => {
        if (!cancelled) fn();
      }, ms);
      timeouts.push(id);
    };

    const spawnPulse = (
      pathSelector: string,
      duration: number,
      direction: 'forward' | 'reverse',
      onArrive?: () => void,
    ) => {
      const path = svg.querySelector<SVGPathElement>(pathSelector);
      if (!path) return;
      const pathLength = path.getTotalLength();
      const layer = svg.querySelector<SVGGElement>('[data-pulse-layer]');
      if (!layer) return;

      const ns = 'http://www.w3.org/2000/svg';
      const dot = document.createElementNS(ns, 'circle');
      dot.setAttribute('r', '2.8');
      dot.setAttribute('fill', '#ffffff');
      dot.setAttribute('filter', 'url(#onv-pulse-glow)');
      dot.setAttribute('opacity', '0');
      layer.appendChild(dot);
      ephemeralEls.add(dot);

      const start = performance.now();
      const tick = (now: number) => {
        if (cancelled) {
          dot.remove();
          ephemeralEls.delete(dot);
          return;
        }
        const elapsed = now - start;
        const t = Math.min(1, elapsed / duration);
        const eased = easeInOutCubic(t);
        const len = (direction === 'forward' ? eased : 1 - eased) * pathLength;
        const p = path.getPointAtLength(len);
        dot.setAttribute('cx', String(p.x));
        dot.setAttribute('cy', String(p.y));

        const FADE = 0.18;
        let opacity = 1;
        if (t < FADE) opacity = t / FADE;
        else if (t > 1 - FADE) opacity = (1 - t) / FADE;
        dot.setAttribute('opacity', String(opacity));

        if (t < 1) {
          rafs.push(requestAnimationFrame(tick));
        } else {
          dot.remove();
          ephemeralEls.delete(dot);
          onArrive?.();
        }
      };
      rafs.push(requestAnimationFrame(tick));
    };

    const triggerBreathing = (agentId: string) => {
      const inner = document.querySelector<HTMLDivElement>(
        `[data-agent-card-inner="${agentId}"]`,
      );
      if (!inner) return;
      inner.classList.remove('onv-breathing');
      void inner.offsetWidth;
      inner.classList.add('onv-breathing');
      const t = setTimeout(() => inner.classList.remove('onv-breathing'), BREATHING_DURATION);
      timeouts.push(t);
      const cleanup = () => inner.classList.remove('onv-breathing');
      breathingCleanups.push(cleanup);
    };

    const triggerToolGlow = (agentId: string, ballIndex: number) => {
      const ball = svg.querySelector<SVGCircleElement>(
        `[data-ball][data-agent="${agentId}"][data-ball-index="${ballIndex}"] [data-ball-circle]`,
      );
      if (!ball) return;
      ball.classList.remove('onv-glowing');
      void (ball as unknown as { getBBox: () => DOMRect }).getBBox();
      ball.classList.add('onv-glowing');
      const t = setTimeout(() => ball.classList.remove('onv-glowing'), TOOL_GLOW_DURATION);
      timeouts.push(t);
      const cleanup = () => ball.classList.remove('onv-glowing');
      glowCleanups.push(cleanup);
    };

    const fireAgentTools = (agentId: string) => {
      for (let i = 0; i < 3; i++) {
        const sel = `[data-connector][data-agent="${agentId}"][data-ball-index="${i}"]`;
        spawnPulse(sel, TOOL_PULSE_DURATION, 'forward', () => {
          triggerToolGlow(agentId, i);
        });
      }
    };

    let directionToggle: 'cw' | 'ccw' = 'cw';

    const runCycle = () => {
      if (cancelled) return;

      const order = directionToggle === 'cw' ? CW_ORDER : CCW_ORDER;
      let elapsed = 0;

      schedule(() => {
        triggerBreathing(order[0]);
        fireAgentTools(order[0]);
      }, elapsed);

      for (let i = 0; i < order.length; i++) {
        const from = order[i];
        const to = order[(i + 1) % order.length];
        const link = getLinkBetween(from, to);
        if (!link) continue;

        const pulseFireTime = elapsed + BREATHING_DURATION;
        schedule(() => {
          spawnPulse(
            `[data-from="${link.fromId}"][data-to="${link.toId}"]`,
            PULSE_DURATION,
            link.direction,
            () => {
              triggerBreathing(to);
              fireAgentTools(to);
            },
          );
        }, pulseFireTime);

        elapsed += BREATHING_DURATION + PULSE_DURATION;
      }

      schedule(() => {
        directionToggle = directionToggle === 'cw' ? 'ccw' : 'cw';
        runCycle();
      }, elapsed);
    };

    runCycle();

    return () => {
      cancelled = true;
      timeouts.forEach(clearTimeout);
      rafs.forEach(cancelAnimationFrame);
      ephemeralEls.forEach((el) => el.remove());
      breathingCleanups.forEach((fn) => fn());
      glowCleanups.forEach((fn) => fn());
    };
  }, [hovering, svgRef]);
}

export function AgentArchitectureSection() {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  useArchitectureChoreography(panelRef, svgRef);

  return (
    <section className="bg-white font-[family-name:var(--font-nunito)] text-[#0A2540]">
      <div className="mx-auto max-w-7xl px-6 pb-24 pt-8 md:pb-32 md:px-8">
        <div className="mb-10 max-w-4xl md:mb-14">
          <h2 className="text-balance text-3xl font-bold leading-[1.2] tracking-[-0.01em] md:text-4xl lg:text-[40px] lg:leading-[1.2]">
            <span className="text-[#0A2540]">AI-First Architektur für jedes Unternehmen.</span>{' '}
            <span className="text-[#808080]">
              Spezialisierte AI-Agents, die parallel arbeiten, voneinander
              lernen und sich dynamisch an Ihre Aufgaben anpassen.
            </span>
          </h2>
        </div>

        <div
          ref={panelRef}
          className="relative overflow-hidden rounded-[15px] shadow-2xl shadow-[#0D0D2B]/30 ring-1 ring-black/5"
        >
          <OnveroGradient
            className="absolute inset-0"
            colors={['#0D0D2B', '#2D1B69', '#0EA5E9', '#6EE7B7']}
            style={{ width: '100%', height: '100%', borderRadius: 0 }}
          />

          <div className="relative hidden aspect-[1115/560] w-full lg:block">
            <ArchitectureOverlay svgRef={svgRef} />

            {agents.map((agent) => (
              <div
                key={agent.id}
                className="absolute"
                style={{
                  left: `${agent.left}%`,
                  top: `${agent.top}%`,
                  width: `${CARD_W_PCT}%`,
                  height: `${(CARD_H / PANEL_H) * 100}%`,
                }}
                data-agent-card={agent.id}
              >
                <AgentCard agent={agent} />
              </div>
            ))}

            <a
              href="#mehr"
              className="absolute right-[5%] bottom-[8%] inline-flex h-[51px] w-[207px] items-center justify-center rounded-[12px] bg-white text-[14px] font-semibold text-[#0A2540] shadow-lg transition-colors hover:bg-[#F8F8FC]"
            >
              Mehr erfahren
            </a>
          </div>

          <div className="relative grid gap-3 p-6 sm:p-8 lg:hidden">
            {agents.map((agent) => (
              <div key={agent.id} className="w-full">
                <AgentCard agent={agent} />
              </div>
            ))}
            <a
              href="#mehr"
              className="mt-4 inline-flex h-[51px] w-full items-center justify-center rounded-[12px] bg-white text-[14px] font-semibold text-[#0A2540] shadow-lg transition-colors hover:bg-[#F8F8FC]"
            >
              Mehr erfahren
            </a>
          </div>
        </div>
      </div>

      <style>{`
        .onv-card {
          box-shadow: 0 8px 32px -8px rgba(13,13,43,0.45);
          transition: box-shadow 600ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes onv-breathe {
          0% {
            box-shadow:
              0 8px 32px -8px rgba(13,13,43,0.45),
              0 0 0 0 rgba(255,255,255,0),
              0 0 0 0 rgba(255,255,255,0);
          }
          50% {
            box-shadow:
              0 8px 32px -8px rgba(13,13,43,0.45),
              0 0 0 4px rgba(255,255,255,0.5),
              0 0 18px 6px rgba(255,255,255,0.18);
          }
          100% {
            box-shadow:
              0 8px 32px -8px rgba(13,13,43,0.45),
              0 0 0 0 rgba(255,255,255,0),
              0 0 0 0 rgba(255,255,255,0);
          }
        }
        .onv-card.onv-breathing {
          animation: onv-breathe 0.75s cubic-bezier(0.45, 0, 0.55, 1) 4;
        }
        @keyframes onv-tool-glow {
          0% {
            stroke: rgba(255,255,255,0.95);
            stroke-width: 2.8;
          }
          18% {
            stroke: rgba(255,255,255,0.8);
            stroke-width: 2.4;
          }
          100% {
            stroke: rgba(255,255,255,0.35);
            stroke-width: 0.6;
          }
        }
        [data-ball-circle] {
          transition: stroke 400ms cubic-bezier(0.16, 1, 0.3, 1),
                      stroke-width 400ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        [data-ball-circle].onv-glowing {
          animation: onv-tool-glow 1.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </section>
  );
}
