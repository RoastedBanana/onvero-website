import { ArrowUpRight, Gauge, Mail, Network, Search } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { OnveroGradient } from './OnveroGradient';

type Agent = {
  id: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  tag: string;
  tools: string;
  position: { left: string; top: string };
  toolsPosition?: { left: string; top: string };
};

const agents: Agent[] = [
  {
    id: 'lead-scout',
    icon: Search,
    title: 'Lead Scout',
    subtitle: 'Prospecting Agent',
    tag: 'Live',
    tools: 'Database · Enrichment',
    position: { left: '5%', top: '37%' },
    toolsPosition: { left: '5%', top: '48%' },
  },
  {
    id: 'score-engine',
    icon: Gauge,
    title: 'Score Engine',
    subtitle: 'Qualification Agent',
    tag: 'Auto',
    tools: 'Firecrawl · Vector DB',
    position: { left: '38%', top: '16%' },
    toolsPosition: { left: '38%', top: '27%' },
  },
  {
    id: 'outreach-writer',
    icon: Mail,
    title: 'Outreach Writer',
    subtitle: 'Email Agent',
    tag: 'AI',
    tools: 'Resend · Templates',
    position: { left: '74%', top: '38%' },
    toolsPosition: { left: '74%', top: '49%' },
  },
  {
    id: 'business-agent',
    icon: Network,
    title: 'Business Agent',
    subtitle: 'Orchestrator',
    tag: 'Core',
    tools: 'Router · Memory',
    position: { left: '38%', top: '60%' },
    toolsPosition: { left: '38%', top: '71%' },
  },
];

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

function ToolCircles() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 209 121"
      fill="none"
      className="block h-full w-full"
    >
      <line x1="104.5" y1="0" x2="104.5" y2="40" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
      <line x1="40" y1="40" x2="169" y2="40" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
      <line x1="40" y1="40" x2="40" y2="80" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
      <line x1="104.5" y1="40" x2="104.5" y2="80" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
      <line x1="169" y1="40" x2="169" y2="80" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
      {[40, 104.5, 169].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy={95} r="14" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
          <circle cx={cx} cy={95} r="5" fill="rgba(255,255,255,0.4)" />
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
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="absolute w-[21.5%] min-w-[210px]"
                style={agent.position}
              >
                <AgentCard agent={agent} />
              </div>
            ))}

            {agents.map((agent) =>
              agent.toolsPosition ? (
                <div
                  key={`${agent.id}-tools`}
                  className="absolute w-[18.7%] min-w-[180px]"
                  style={{ ...agent.toolsPosition, height: '21.5%' }}
                >
                  <ToolCircles />
                </div>
              ) : null,
            )}

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
