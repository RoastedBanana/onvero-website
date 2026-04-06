'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DottedSurface } from '@/components/ui/dotted-surface';
import { TextShimmer } from '@/components/ui/text-shimmer';
import { BentoGrid } from '@/components/ui/bento-grid';
import type { BentoItem } from '@/components/ui/bento-grid';
import { HowItWorks } from '@/components/ui/how-it-works';
import { Users, BarChart2, Zap, Target, Mail, TrendingUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const WEBHOOK = 'https://n8n.srv1223027.hstgr.cloud/webhook/6c419e39-f35c-49a8-abb8-51b2de160070/chat';

const modes = [
  { key: 'search', label: 'Suchen', icon: '⌕' },
  { key: 'ask', label: 'Fragen', icon: '○' },
  { key: 'create', label: 'Erstellen', icon: '✦' },
];

interface LiveStats {
  total: number;
  hot: number;
  warm: number;
  cold: number;
  avg: number;
  recent: number;
  topLeads: { name: string; score: number }[];
  weeklyData: number[];
}

interface Message {
  role: 'user' | 'ai';
  text: string;
}

// ── Mini SVG Visualizations ──

function MiniDonut({ hot, warm, cold, accent }: { hot: number; warm: number; cold: number; accent: string }) {
  const total = hot + warm + cold || 1;
  const r = 36;
  const c = 2 * Math.PI * r;
  const hotLen = (hot / total) * c;
  const warmLen = (warm / total) * c;
  const coldLen = (cold / total) * c;
  return (
    <svg width="100" height="100" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="8" />
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke="#FF5C2E"
        strokeWidth="8"
        strokeDasharray={`${hotLen} ${c}`}
        strokeDashoffset="0"
        transform="rotate(-90 50 50)"
        strokeLinecap="round"
      />
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke="#F59E0B"
        strokeWidth="8"
        strokeDasharray={`${warmLen} ${c}`}
        strokeDashoffset={`${-hotLen}`}
        transform="rotate(-90 50 50)"
        strokeLinecap="round"
      />
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke={accent}
        strokeWidth="8"
        strokeDasharray={`${coldLen} ${c}`}
        strokeDashoffset={`${-(hotLen + warmLen)}`}
        transform="rotate(-90 50 50)"
        strokeLinecap="round"
        opacity="0.5"
      />
      <text
        x="50"
        y="47"
        textAnchor="middle"
        fill="#fff"
        fontSize="18"
        fontWeight="700"
        fontFamily="var(--font-dm-mono)"
      >
        {hot + warm + cold}
      </text>
      <text x="50" y="62" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="8">
        LEADS
      </text>
    </svg>
  );
}

function MiniBarChart({ data, accent }: { data: number[]; accent: string }) {
  const max = Math.max(...data, 1);
  const w = 14;
  const gap = 4;
  const h = 70;
  return (
    <svg width={data.length * (w + gap)} height={h + 16} viewBox={`0 0 ${data.length * (w + gap)} ${h + 16}`}>
      {data.map((v, i) => {
        const barH = Math.max((v / max) * h, 2);
        return (
          <g key={i}>
            <rect
              x={i * (w + gap)}
              y={h - barH}
              width={w}
              height={barH}
              rx="3"
              fill={i === data.length - 1 ? accent : `${accent}40`}
            />
          </g>
        );
      })}
      {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].slice(0, data.length).map((d, i) => (
        <text
          key={d}
          x={i * (w + gap) + w / 2}
          y={h + 12}
          textAnchor="middle"
          fill="rgba(255,255,255,0.15)"
          fontSize="7"
        >
          {d}
        </text>
      ))}
    </svg>
  );
}

function MiniPipeline({ accent }: { accent: string }) {
  const steps = [
    { label: 'KI', pct: 100 },
    { label: 'Apollo', pct: 85 },
    { label: 'Score', pct: 60 },
    { label: 'E-Mail', pct: 40 },
  ];
  return (
    <svg width="130" height="80" viewBox="0 0 130 80">
      {steps.map((s, i) => {
        const y = i * 19;
        const w = (s.pct / 100) * 110;
        return (
          <g key={i}>
            <rect x="0" y={y} width="110" height="14" rx="3" fill="rgba(255,255,255,0.03)" />
            <rect x="0" y={y} width={w} height="14" rx="3" fill={`${accent}${i === 0 ? '' : '60'}`} />
            <text x="115" y={y + 11} fill="rgba(255,255,255,0.25)" fontSize="8" fontFamily="var(--font-dm-mono)">
              {s.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function DashboardPage() {
  const [mode, setMode] = useState('ask');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<LiveStats>({
    total: 0,
    hot: 0,
    warm: 0,
    cold: 0,
    avg: 0,
    recent: 0,
    topLeads: [],
    weeklyData: [3, 5, 2, 8, 4, 1, 6],
  });
  const [sessionId] = useState(() => crypto.randomUUID());
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const hasMessages = messages.length > 0;

  useEffect(() => {
    fetch('/api/leads')
      .then((r) => r.json())
      .then((d) => {
        const leads = d.leads ?? [];
        const hot = leads.filter((l: Record<string, number>) => (l.score ?? 0) >= 70).length;
        const warm = leads.filter((l: Record<string, number>) => (l.score ?? 0) >= 45 && (l.score ?? 0) < 70).length;
        const cold = leads.filter((l: Record<string, number>) => (l.score ?? 0) < 45).length;
        const total = leads.length;
        const avg =
          total > 0
            ? Math.round(leads.reduce((s: number, l: Record<string, number>) => s + (l.score ?? 0), 0) / total)
            : 0;
        const now7d = Date.now() - 7 * 86400000;
        const recent = leads.filter((l: Record<string, string>) => new Date(l.created_at).getTime() > now7d).length;
        const top = leads
          .sort((a: Record<string, number>, b: Record<string, number>) => (b.score ?? 0) - (a.score ?? 0))
          .slice(0, 3)
          .map((l: Record<string, string | number>) => ({ name: String(l.company_name), score: Number(l.score ?? 0) }));
        // Fake weekly breakdown from recent data
        const days = [0, 0, 0, 0, 0, 0, 0];
        leads.forEach((l: Record<string, string>) => {
          const d = new Date(l.created_at).getDay();
          days[d === 0 ? 6 : d - 1]++;
        });
        setStats({ total, hot, warm, cold, avg, recent, topLeads: top, weeklyData: days });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const adjustHeight = () => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = '0';
      ta.style.height = Math.min(ta.scrollHeight, 150) + 'px';
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = '56px';
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setLoading(true);
    try {
      const form = new FormData();
      form.append('chatInput', text);
      form.append('sessionId', sessionId);
      const res = await fetch(WEBHOOK, { method: 'POST', body: form });
      const json = await res.json();
      setMessages((prev) => [...prev, { role: 'ai', text: json.output ?? 'Keine Antwort erhalten.' }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'ai', text: 'Verbindung fehlgeschlagen.' }]);
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = (s: number) => (s >= 70 ? '#FF5C2E' : s >= 45 ? '#F59E0B' : '#6B7AFF');

  const bentoItems: BentoItem[] = [
    {
      title: 'Leads',
      meta: `${stats.total} gesamt`,
      description:
        stats.topLeads.length > 0
          ? stats.topLeads.map((l) => `${l.name} — ${l.score}`).join(' · ')
          : 'KI-qualifizierte B2B-Kontakte mit Score-Bewertung',
      icon: <Users className="w-4 h-4 text-[#6B7AFF]" />,
      status: `${stats.hot} HOT`,
      tags: [`${stats.hot} HOT`, `${stats.warm} WARM`, `Ø ${stats.avg}`],
      cta: 'Leads öffnen →',
      colSpan: 2,
      hasPersistentHover: true,
      onClick: () => router.push('/dashboard/leads'),
    },
    {
      title: 'Analytics',
      meta: `Ø ${stats.avg}`,
      description: 'Echtzeit-Kennzahlen, Pipeline-Analyse und KI-Performance auf einen Blick',
      icon: <BarChart2 className="w-4 h-4 text-emerald-500" />,
      status: `${stats.recent} neue`,
      tags: ['Pipeline', 'Score', 'Traffic'],
      cta: 'Dashboard öffnen →',
      onClick: () => router.push('/dashboard/analytics'),
    },
    {
      title: 'Generate',
      meta: 'KI-Pipeline',
      description: 'Beschreibe deine Zielkunden — die KI findet, analysiert und bewertet passende Leads',
      icon: <Zap className="w-4 h-4 text-amber-500" />,
      status: 'Bereit',
      tags: ['Freitext', 'Apollo', 'Google Maps'],
      cta: 'Leads generieren →',
      colSpan: 2,
      onClick: () => router.push('/dashboard/generate'),
    },
    {
      title: 'Business AI',
      meta: 'Chat',
      description: 'Dein persönlicher KI-Assistent für Geschäftsfragen, Analysen und Automatisierung',
      icon: <span className="text-purple-400 text-sm">✦</span>,
      status: 'Live',
      tags: ['Fragen', 'Suchen', 'Erstellen'],
      cta: 'Chat starten →',
      onClick: () => router.push('/dashboard/business-ai'),
    },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#080808',
        fontFamily: 'var(--font-dm-sans)',
        color: '#fff',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {!hasMessages && <DottedSurface />}

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* ── Chat ── */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            maxWidth: 720,
            width: '100%',
            margin: '0 auto',
            padding: '0 20px',
          }}
        >
          {hasMessages ? (
            <div style={{ flex: 1, overflowY: 'auto', paddingTop: 32, paddingBottom: 8 }}>
              {messages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      maxWidth: '80%',
                      padding: '10px 16px',
                      borderRadius: 16,
                      fontSize: 14,
                      lineHeight: 1.6,
                      background: msg.role === 'user' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
                      color: msg.role === 'user' ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.7)',
                      border: msg.role === 'ai' ? '1px solid rgba(255,255,255,0.07)' : 'none',
                    }}
                  >
                    {msg.role === 'ai' ? (
                      <div className="prose prose-invert prose-sm max-w-none [&_p]:mb-2 [&_p:last-child]:mb-0 [&_strong]:text-white [&_a]:text-blue-400 [&_code]:bg-white/10 [&_code]:px-1 [&_code]:rounded [&_code]:text-xs">
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>
                    ) : (
                      <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 12 }}>
                  <div
                    style={{
                      padding: '10px 16px',
                      borderRadius: 16,
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.07)',
                    }}
                  >
                    <TextShimmer className="text-sm font-medium" duration={1}>
                      Denkt nach…
                    </TextShimmer>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                paddingTop: '15vh',
                paddingBottom: 16,
              }}
            >
              <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.02em' }}>
                Wie kann ich helfen?
              </h1>
              <div style={{ display: 'flex', gap: 6 }}>
                {modes.map((m) => (
                  <button
                    key={m.key}
                    onClick={() => setMode(m.key)}
                    style={{
                      padding: '6px 16px',
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: 'pointer',
                      border: mode === m.key ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.07)',
                      background: mode === m.key ? 'rgba(255,255,255,0.08)' : 'transparent',
                      color: mode === m.key ? '#fff' : 'rgba(255,255,255,0.35)',
                      transition: 'all 0.15s',
                      fontFamily: 'inherit',
                    }}
                  >
                    {m.icon} {m.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div style={{ paddingBottom: hasMessages ? 20 : 16, flexShrink: 0 }}>
            <div
              style={{
                background: '#111',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 14,
                overflow: 'hidden',
              }}
            >
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  adjustHeight();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={
                  mode === 'search'
                    ? 'Leads, Firmen, Kennzahlen suchen...'
                    : mode === 'create'
                      ? 'Neue Kampagne, Report oder Task...'
                      : 'Stell eine Frage an dein BusinessOS…'
                }
                style={{
                  width: '100%',
                  padding: '16px 18px',
                  resize: 'none',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#fff',
                  fontSize: 14,
                  fontFamily: 'inherit',
                  lineHeight: 1.5,
                  minHeight: 56,
                  overflow: 'hidden',
                }}
              />
              <div
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 12px 12px' }}
              >
                <button
                  onClick={handleSend}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: input.trim() ? '#fff' : 'rgba(255,255,255,0.06)',
                    border: 'none',
                    cursor: input.trim() ? 'pointer' : 'default',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: input.trim() ? '#080808' : 'rgba(255,255,255,0.2)',
                    fontSize: 14,
                    transition: 'all 0.15s',
                  }}
                >
                  ▸
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Feature Cards (BentoGrid) ── */}
        {!hasMessages && (
          <>
            <div style={{ padding: '0 20px 24px', maxWidth: 1100, margin: '0 auto', width: '100%' }}>
              <BentoGrid items={bentoItems} />
            </div>
            <div style={{ padding: '0 20px 48px', maxWidth: 1100, margin: '0 auto', width: '100%' }}>
              <HowItWorks
                storageKey="home"
                title="Erste Schritte"
                subtitle="In 3 Schritten zu deinen ersten qualifizierten Leads"
                compact
                steps={[
                  {
                    icon: <Target className="w-5 h-5 text-[#F59E0B]" />,
                    title: 'Zielkunden beschreiben',
                    description: 'Gehe zu "Generate" und beschreibe in eigenen Worten welche Kunden du suchst.',
                    benefits: [
                      'Freitext oder strukturierte Suche',
                      'KI optimiert deine Anfrage',
                      'Apollo + Google Maps als Quellen',
                    ],
                  },
                  {
                    icon: <Mail className="w-5 h-5 text-[#6B7AFF]" />,
                    title: 'Leads prüfen & kontaktieren',
                    description: 'Öffne deine Leads, prüfe den KI-Score und nutze die vorbereitete E-Mail.',
                    benefits: [
                      'HOT Leads (≥70) zuerst kontaktieren',
                      'E-Mail-Draft per Klick kopieren',
                      'KI-Analyse erklärt warum der Lead passt',
                    ],
                  },
                  {
                    icon: <TrendingUp className="w-5 h-5 text-[#22C55E]" />,
                    title: 'Pipeline aufbauen',
                    description: 'Tracke deinen Fortschritt in Analytics und generiere regelmäßig neue Leads.',
                    benefits: [
                      'Status-Tracking pro Lead',
                      'Analytics zeigt Konversion',
                      'Profil in Settings verfeinern',
                    ],
                  },
                ]}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
