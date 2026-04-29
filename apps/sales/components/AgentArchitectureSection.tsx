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

type Agent = {
  id: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  tag: string;
  tools: string;
  /** Card top-left position in % of panel. */
  left: number;
  top: number;
};

const agents: Agent[] = [
  { id: 'lead-scout',     icon: Search,  title: 'Lead Scout',      subtitle: 'Prospecting Agent',   tag: 'Live', tools: 'Database · Enrichment',  left: 5,  top: 37 },
  { id: 'score-engine',   icon: Gauge,   title: 'Score Engine',    subtitle: 'Qualification Agent', tag: 'Auto', tools: 'Firecrawl · Vector DB',  left: 38, top: 16 },
  { id: 'outreach-writer',icon: Mail,    title: 'Outreach Writer', subtitle: 'Email Agent',         tag: 'AI',   tools: 'Resend · Templates',     left: 74, top: 38 },
  { id: 'business-agent', icon: Network, title: 'Business Agent',  subtitle: 'Orchestrator',        tag: 'Core', tools: 'Router · Memory',        left: 38, top: 60 },
];

type Connection = {
  agentId: string;
  cardAnchor: { x: number; y: number };
  balls: { x: number; y: number }[];
};

const connections: Connection[] = agents.map((a) => {
  const cardLeftPx = (a.left / 100) * PANEL_W;
  const cardTopPx = (a.top / 100) * PANEL_H;
  const cardAnchor = {
    x: cardLeftPx + CARD_W / 2,
    y: cardTopPx + CARD_H,
  };

  const clusterLeftPx = cardAnchor.x - BALL_CLUSTER_W / 2;
  const clusterTopPx = cardTopPx + CARD_H + BALL_CLUSTER_TOP_OFFSET;
  const balls = BALL_CLUSTER_OFFSETS.map((dx) => ({
    x: clusterLeftPx + dx,
    y: clusterTopPx,
  }));

  return { agentId: a.id, cardAnchor, balls };
});

function AgentCard({ agent }: { agent: Agent }) {
  const Icon = agent.icon;
  return (
    <div
      className="flex w-full items-center gap-2 rounded-full pl-1.5 pr-3 py-1.5 ring-1 ring-white/15 shadow-[0_8px_32px_-8px_rgba(13,13,43,0.45)] backdrop-blur-xl"
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

function ArchitectureOverlay() {
  return (
    <svg
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
      </defs>

      {connections.map((conn) => (
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
    </svg>
  );
}

export function AgentArchitectureSection() {
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

        <div className="relative overflow-hidden rounded-[15px] shadow-2xl shadow-[#0D0D2B]/30 ring-1 ring-black/5">
          <OnveroGradient
            className="absolute inset-0"
            colors={['#0D0D2B', '#2D1B69', '#0EA5E9', '#6EE7B7']}
            style={{ width: '100%', height: '100%', borderRadius: 0 }}
          />

          <div className="relative hidden aspect-[1115/560] w-full lg:block">
            <ArchitectureOverlay />

            {agents.map((agent) => (
              <div
                key={agent.id}
                className="absolute"
                style={{
                  left: `${agent.left}%`,
                  top: `${agent.top}%`,
                  width: `${CARD_W_PCT}%`,
                  minWidth: '210px',
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
    </section>
  );
}
