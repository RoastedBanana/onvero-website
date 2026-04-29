'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
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

const PULSE_DURATION = 950;
const TOOL_PULSE_DURATION = 650;
const BREATHING_DURATION = 2200;
const TOOL_GLOW_DURATION = 1400;
/** Fire the next-agent pulse after this fraction of breathing has elapsed. */
const PULSE_LEAD = 0.6;

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

type Agent = {
  id: string;
  imageSrc: string;
  title: string;
  subtitle: string;
  tag: string;
  tools: string;
  left: number;
  top: number;
};

const agents: Agent[] = [
  { id: 'lead-scout',     imageSrc: '/agents/lead-scout.png',     title: 'Lead Scout',      subtitle: 'Prospecting Agent',   tag: 'Live', tools: 'Database · Enrichment',  left: 5,  top: 37 },
  { id: 'score-engine',   imageSrc: '/agents/score-engine.png',   title: 'Score Engine',    subtitle: 'Qualification Agent', tag: 'Auto', tools: 'Firecrawl · Vector DB',  left: 38, top: 16 },
  { id: 'outreach-writer',imageSrc: '/agents/outreach-writer.png',title: 'Outreach Writer', subtitle: 'Email Agent',         tag: 'AI',   tools: 'Resend · Templates',     left: 74, top: 38 },
  { id: 'business-agent', imageSrc: '/agents/business-agent.png', title: 'Business Agent',  subtitle: 'Orchestrator',        tag: 'Core', tools: 'Router · Memory',        left: 38, top: 60 },
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

type CardSide = 'left' | 'right' | 'top' | 'bottom';

type InterAgentLinkSpec = {
  id: string;
  fromId: string;
  toId: string;
  fromSide: CardSide;
  toSide: CardSide;
};

function getSideAnchor(b: CardBounds, side: CardSide) {
  switch (side) {
    case 'left':   return { x: b.left,  y: b.cy };
    case 'right':  return { x: b.right, y: b.cy };
    case 'top':    return { x: b.cx,    y: b.top };
    case 'bottom': return { x: b.cx,    y: b.bottom };
  }
}

function buildInterAgentPath(
  fromB: CardBounds,
  fromSide: CardSide,
  toB: CardBounds,
  toSide: CardSide,
): string {
  const start = getSideAnchor(fromB, fromSide);
  const end = getSideAnchor(toB, toSide);
  const midX = (start.x + end.x) / 2;
  return `M ${start.x} ${start.y} C ${midX} ${start.y}, ${midX} ${end.y}, ${end.x} ${end.y}`;
}

function buildToolPath(
  cardBottom: { x: number; y: number },
  ball: { x: number; y: number },
): string {
  const midY = (cardBottom.y + ball.y) / 2;
  return `M ${cardBottom.x} ${cardBottom.y} C ${cardBottom.x} ${midY}, ${ball.x} ${midY}, ${ball.x} ${ball.y - BALL_R}`;
}

const interAgentLinkSpecs: InterAgentLinkSpec[] = [
  { id: 'score-engine--lead-scout',       fromId: 'score-engine',    toId: 'lead-scout',      fromSide: 'left',  toSide: 'right' },
  { id: 'score-engine--outreach-writer',  fromId: 'score-engine',    toId: 'outreach-writer', fromSide: 'right', toSide: 'left'  },
  { id: 'lead-scout--business-agent',     fromId: 'lead-scout',      toId: 'business-agent',  fromSide: 'right', toSide: 'left'  },
  { id: 'outreach-writer--business-agent',fromId: 'outreach-writer', toId: 'business-agent',  fromSide: 'left',  toSide: 'right' },
];

const interAgentLinks = interAgentLinkSpecs.map((spec) => ({
  ...spec,
  d: buildInterAgentPath(
    cardBounds[spec.fromId],
    spec.fromSide,
    cardBounds[spec.toId],
    spec.toSide,
  ),
}));

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

type ChatMessage = { from: 'user' | 'agent'; text: string };

const agentChats: Record<
  string,
  { statusLabel: string; messages: ChatMessage[] }
> = {
  'lead-scout': {
    statusLabel: 'sucht aktiv',
    messages: [
      { from: 'user', text: 'Finde 50 SaaS-Gründer in Berlin, 10–50 Mitarbeiter.' },
      { from: 'agent', text: '47 Profile aus Apollo + LinkedIn. Reichere gerade Firmographics an.' },
    ],
  },
  'score-engine': {
    statusLabel: 'qualifiziert',
    messages: [
      { from: 'user', text: 'Welche Leads passen am besten zu unserem ICP?' },
      { from: 'agent', text: '23 Leads scoren über 80/100. Top-Match: B2B-Fintechs in Series A/B.' },
    ],
  },
  'outreach-writer': {
    statusLabel: 'schreibt Draft',
    messages: [
      { from: 'user', text: 'Erstansprache an Sarah, CTO bei Klima AI.' },
      { from: 'agent', text: 'Draft fertig. Hook: ihre Series-A-Ankündigung. Ton: technisch, kurz.' },
    ],
  },
  'business-agent': {
    statusLabel: 'orchestriert',
    messages: [
      { from: 'user', text: 'Starte einen Outbound-Workflow für AI/SaaS.' },
      { from: 'agent', text: 'Routing aktiv: Scout → Engine → Writer. ETA: 8 Min.' },
    ],
  },
};

const chatPlacement: Record<string, string> = {
  'lead-scout':      'left-full top-1/2 -translate-y-1/2 ml-3',
  'score-engine':    'top-full left-1/2 -translate-x-1/2 mt-3',
  'outreach-writer': 'right-full top-1/2 -translate-y-1/2 mr-3',
  'business-agent':  'bottom-full left-1/2 -translate-x-1/2 mb-3',
};

function AgentChat({ agent, visible }: { agent: Agent; visible: boolean }) {
  const chat = agentChats[agent.id];
  const placement = chatPlacement[agent.id];
  if (!chat) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.97 }}
          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          className={`pointer-events-none absolute z-50 w-[280px] ${placement}`}
        >
          <div className="rounded-2xl bg-white p-3 shadow-[0_18px_48px_-12px_rgba(13,13,43,0.45)] ring-1 ring-black/5">
            <div className="flex items-center gap-2 border-b border-black/5 pb-2">
              <img
                src={agent.imageSrc}
                alt=""
                className="size-8 shrink-0 rounded-full bg-[#e3e9f7] object-cover ring-1 ring-black/5"
                draggable={false}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-bold leading-tight text-[#0A2540]">
                  {agent.title}
                </p>
                <p className="mt-0.5 flex items-center gap-1 text-[10px] leading-tight text-[#697386]">
                  <span className="relative flex size-1.5 items-center justify-center">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#40BFB1] opacity-60" />
                    <span className="relative size-1.5 rounded-full bg-[#40BFB1]" />
                  </span>
                  {chat.statusLabel}
                </p>
              </div>
            </div>
            <div className="mt-2 flex flex-col gap-1.5">
              {chat.messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.1 + i * 0.13,
                    duration: 0.28,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className={`max-w-[88%] rounded-xl px-2.5 py-1.5 text-[11.5px] leading-snug ${
                    m.from === 'user'
                      ? 'self-end rounded-br-sm bg-[#4F46E5] text-white'
                      : 'self-start rounded-bl-sm bg-[#F1F2F6] text-[#0A2540]'
                  }`}
                >
                  {m.text}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function AgentCard({ agent }: { agent: Agent }) {
  return (
    <div
      data-agent-card-inner={agent.id}
      className="onv-card flex h-full w-full items-center gap-2 rounded-full pl-1.5 pr-3 ring-1 ring-white/15 backdrop-blur-xl"
      style={{
        backgroundImage:
          'linear-gradient(89deg, rgba(227,233,247,0.51) 0%, rgba(255,255,255,0.12) 100%)',
      }}
    >
      <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-b from-[#e3e9f7] to-[#e3e9f7]/80 ring-1 ring-white/20">
        <img
          src={agent.imageSrc}
          alt=""
          className="size-full object-cover"
          draggable={false}
        />
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

function useMagneticNetwork(
  panelRef: React.RefObject<HTMLDivElement | null>,
  svgRef: React.RefObject<SVGSVGElement | null>,
) {
  useEffect(() => {
    const panel = panelRef.current;
    const svg = svgRef.current;
    if (!panel || !svg) return;

    type Offset = { x: number; y: number; tx: number; ty: number };
    const makeOffset = (): Offset => ({ x: 0, y: 0, tx: 0, ty: 0 });

    const cardOffsets: Record<string, Offset> = {};
    agents.forEach((a) => {
      cardOffsets[a.id] = makeOffset();
    });

    const ballOffsets: Record<string, Offset> = {};
    toolConnections.forEach((conn) => {
      conn.balls.forEach((_b, i) => {
        ballOffsets[`${conn.agentId}-${i}`] = makeOffset();
      });
    });

    let mouseSvgX: number | null = null;
    let mouseSvgY: number | null = null;
    let raf = 0;

    /** Attraction radius in svg units. */
    const RADIUS = 220;
    const STRENGTH = 0.18;
    const DAMPING = 0.18;
    const SETTLE_EPSILON = 0.05;

    const updateMouse = (e: MouseEvent) => {
      const rect = panel.getBoundingClientRect();
      const scale = PANEL_W / rect.width;
      mouseSvgX = (e.clientX - rect.left) * scale;
      mouseSvgY = (e.clientY - rect.top) * scale;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const onLeave = () => {
      mouseSvgX = null;
      mouseSvgY = null;
    };

    const lerpToward = (state: Offset, naturalX: number, naturalY: number) => {
      let targetX = 0;
      let targetY = 0;
      if (mouseSvgX !== null && mouseSvgY !== null) {
        const dx = mouseSvgX - naturalX;
        const dy = mouseSvgY - naturalY;
        const dist = Math.hypot(dx, dy);
        if (dist < RADIUS) {
          const falloff = 1 - dist / RADIUS;
          const eased = falloff * falloff;
          targetX = dx * eased * STRENGTH;
          targetY = dy * eased * STRENGTH;
        }
      }
      state.tx = targetX;
      state.ty = targetY;
      state.x += (state.tx - state.x) * DAMPING;
      state.y += (state.ty - state.y) * DAMPING;
      return (
        Math.abs(state.x) > SETTLE_EPSILON ||
        Math.abs(state.y) > SETTLE_EPSILON
      );
    };

    const tick = () => {
      const rect = panel.getBoundingClientRect();
      const svgScale = rect.width / PANEL_W;
      let stillSettling = mouseSvgX !== null;

      for (const agent of agents) {
        const state = cardOffsets[agent.id];
        const base = cardBounds[agent.id];
        if (lerpToward(state, base.cx, base.cy)) stillSettling = true;
      }

      for (const conn of toolConnections) {
        for (let i = 0; i < conn.balls.length; i++) {
          const ball = conn.balls[i];
          const state = ballOffsets[`${conn.agentId}-${i}`];
          if (lerpToward(state, ball.x, ball.y)) stillSettling = true;
        }
      }

      const offsetCardBounds: Record<string, CardBounds> = {};
      for (const agent of agents) {
        const o = cardOffsets[agent.id];
        const b = cardBounds[agent.id];
        offsetCardBounds[agent.id] = {
          left: b.left + o.x,
          top: b.top + o.y,
          right: b.right + o.x,
          bottom: b.bottom + o.y,
          cx: b.cx + o.x,
          cy: b.cy + o.y,
        };
      }

      for (const agent of agents) {
        const card = panel.querySelector<HTMLElement>(
          `[data-agent-card="${agent.id}"]`,
        );
        if (!card) continue;
        const o = cardOffsets[agent.id];
        const dx = (o.x * svgScale).toFixed(2);
        const dy = (o.y * svgScale).toFixed(2);
        card.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
      }

      for (const conn of toolConnections) {
        const cb = offsetCardBounds[conn.agentId];
        const cardBottom = { x: cb.cx, y: cb.bottom };

        const anchor = svg.querySelector<SVGCircleElement>(
          `[data-anchor][data-agent="${conn.agentId}"]`,
        );
        if (anchor) {
          anchor.setAttribute('cx', cardBottom.x.toFixed(2));
          anchor.setAttribute('cy', cardBottom.y.toFixed(2));
        }

        for (let i = 0; i < conn.balls.length; i++) {
          const ballNatural = conn.balls[i];
          const o = ballOffsets[`${conn.agentId}-${i}`];
          const ballPos = { x: ballNatural.x + o.x, y: ballNatural.y + o.y };

          const ballGroup = svg.querySelector(
            `[data-ball][data-agent="${conn.agentId}"][data-ball-index="${i}"]`,
          );
          if (ballGroup) {
            const ballCircle = ballGroup.querySelector('[data-ball-circle]');
            const ballEllipse = ballGroup.querySelector('ellipse');
            ballCircle?.setAttribute('cx', ballPos.x.toFixed(2));
            ballCircle?.setAttribute('cy', ballPos.y.toFixed(2));
            ballEllipse?.setAttribute('cx', ballPos.x.toFixed(2));
            ballEllipse?.setAttribute('cy', (ballPos.y - 7).toFixed(2));
          }

          const path = svg.querySelector(
            `[data-connector][data-agent="${conn.agentId}"][data-ball-index="${i}"]`,
          );
          path?.setAttribute('d', buildToolPath(cardBottom, ballPos));
        }
      }

      for (const spec of interAgentLinkSpecs) {
        const fromB = offsetCardBounds[spec.fromId];
        const toB = offsetCardBounds[spec.toId];
        const path = svg.querySelector(
          `[data-from="${spec.fromId}"][data-to="${spec.toId}"]`,
        );
        path?.setAttribute(
          'd',
          buildInterAgentPath(fromB, spec.fromSide, toB, spec.toSide),
        );
      }

      if (stillSettling) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = 0;
      }
    };

    panel.addEventListener('mousemove', updateMouse);
    panel.addEventListener('mouseleave', onLeave);

    return () => {
      panel.removeEventListener('mousemove', updateMouse);
      panel.removeEventListener('mouseleave', onLeave);
      if (raf) cancelAnimationFrame(raf);

      for (const agent of agents) {
        const card = panel.querySelector<HTMLElement>(
          `[data-agent-card="${agent.id}"]`,
        );
        if (card) card.style.transform = '';
      }

      for (const conn of toolConnections) {
        const cb = cardBounds[conn.agentId];
        const cardBottom = { x: cb.cx, y: cb.bottom };
        const anchor = svg.querySelector<SVGCircleElement>(
          `[data-anchor][data-agent="${conn.agentId}"]`,
        );
        anchor?.setAttribute('cx', cardBottom.x.toFixed(2));
        anchor?.setAttribute('cy', cardBottom.y.toFixed(2));

        for (let i = 0; i < conn.balls.length; i++) {
          const ball = conn.balls[i];
          const ballGroup = svg.querySelector(
            `[data-ball][data-agent="${conn.agentId}"][data-ball-index="${i}"]`,
          );
          if (ballGroup) {
            const ballCircle = ballGroup.querySelector('[data-ball-circle]');
            const ballEllipse = ballGroup.querySelector('ellipse');
            ballCircle?.setAttribute('cx', ball.x.toFixed(2));
            ballCircle?.setAttribute('cy', ball.y.toFixed(2));
            ballEllipse?.setAttribute('cx', ball.x.toFixed(2));
            ballEllipse?.setAttribute('cy', (ball.y - 7).toFixed(2));
          }
          const path = svg.querySelector(
            `[data-connector][data-agent="${conn.agentId}"][data-ball-index="${i}"]`,
          );
          path?.setAttribute('d', buildToolPath(cardBottom, ball));
        }
      }

      for (const spec of interAgentLinkSpecs) {
        const fromB = cardBounds[spec.fromId];
        const toB = cardBounds[spec.toId];
        const path = svg.querySelector(
          `[data-from="${spec.fromId}"][data-to="${spec.toId}"]`,
        );
        path?.setAttribute(
          'd',
          buildInterAgentPath(fromB, spec.fromSide, toB, spec.toSide),
        );
      }
    };
  }, [panelRef, svgRef]);
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
        const pathLength = path.getTotalLength();
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

      const stepInterval = BREATHING_DURATION * PULSE_LEAD + PULSE_DURATION;

      for (let i = 0; i < order.length; i++) {
        const from = order[i];
        const to = order[(i + 1) % order.length];
        const link = getLinkBetween(from, to);
        if (!link) continue;

        const pulseFireTime = elapsed + BREATHING_DURATION * PULSE_LEAD;
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

        elapsed += stepInterval;
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
  const [hoveredAgent, setHoveredAgent] = useState<string | null>(null);
  useArchitectureChoreography(panelRef, svgRef);
  useMagneticNetwork(panelRef, svgRef);

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
                  zIndex: hoveredAgent === agent.id ? 40 : 10,
                }}
                data-agent-card={agent.id}
                onMouseEnter={() => setHoveredAgent(agent.id)}
                onMouseLeave={() =>
                  setHoveredAgent((current) =>
                    current === agent.id ? null : current,
                  )
                }
              >
                <AgentCard agent={agent} />
                <AgentChat agent={agent} visible={hoveredAgent === agent.id} />
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
          animation: onv-breathe 1.1s cubic-bezier(0.45, 0, 0.55, 1) 2;
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
          animation: onv-tool-glow 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </section>
  );
}
