'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DottedSurface } from '@/components/ui/dotted-surface';
import { OnboardingProgress } from '@/components/ui/OnboardingProgress';
import { TextShimmer } from '@/components/ui/text-shimmer';
import { BentoGrid } from '@/components/ui/bento-grid';
import type { BentoItem } from '@/components/ui/bento-grid';
import { HowItWorks } from '@/components/ui/how-it-works';
import { DashboardWidgets } from '@/components/ui/DashboardWidgets';
import { Users, BarChart2, Zap, Calendar, Search, PenLine, Sparkles, MessageCircle, ArrowUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// Suppress unused import warnings — kept per spec
void HowItWorks;

const WEBHOOK = 'https://n8n.srv1223027.hstgr.cloud/webhook/6c419e39-f35c-49a8-abb8-51b2de160070/chat';

const EASE = 'cubic-bezier(0.32,0.72,0,1)';

const modes = [
  { key: 'search', label: 'Suchen', icon: <Search size={12} style={{ opacity: 0.7 }} /> },
  { key: 'ask', label: 'Fragen', icon: <MessageCircle size={12} style={{ opacity: 0.7 }} /> },
  { key: 'create', label: 'Erstellen', icon: <Sparkles size={12} style={{ opacity: 0.7 }} /> },
];

const quickActions = [
  { label: 'Was steht diese Woche an?', lucide: Calendar },
  { label: 'Zeig mir eine Uebersicht', lucide: Search },
  { label: 'Neue Kampagne starten', lucide: Zap },
  { label: 'Meeting zusammenfassen', lucide: PenLine },
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
    weeklyData: [0, 0, 0, 0, 0, 0, 0],
  });
  const [mounted, setMounted] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const hasMessages = messages.length > 0;

  useEffect(() => {
    setTimeout(() => setMounted(true), 100);
  }, []);

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

  const handleSend = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = '56px';
    setMessages((prev) => [...prev, { role: 'user', text: msg }]);
    setLoading(true);
    try {
      const form = new FormData();
      form.append('chatInput', msg);
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

  const bentoItems: BentoItem[] = [
    {
      title: 'Leads',
      meta: stats.total > 0 ? `${stats.total} Kontakte` : undefined,
      description: 'Kontakte verwalten, KI-Bewertungen pruefen und personalisierte E-Mails versenden',
      icon: <Users className="w-4 h-4 text-[#6B7AFF]" />,
      status: 'Aktiv',
      tags: ['Kontakte', 'Scoring', 'E-Mail'],
      cta: 'Oeffnen',
      colSpan: 2,
      hasPersistentHover: true,
      onClick: () => router.push('/dashboard/leads'),
    },
    {
      title: 'Meetings',
      meta: 'Aufnahmen',
      description: 'Meetings aufnehmen, transkribieren und KI-Zusammenfassungen erstellen',
      icon: <Calendar className="w-4 h-4 text-sky-400" />,
      status: 'Bereit',
      tags: ['Transkription', 'Zusammenfassung'],
      cta: 'Oeffnen',
      onClick: () => router.push('/dashboard/meetings'),
    },
    {
      title: 'Analytics',
      description: 'Kennzahlen, Trends und Performance deines gesamten BusinessOS auf einen Blick',
      icon: <BarChart2 className="w-4 h-4 text-emerald-500" />,
      status: 'Live',
      tags: ['Kennzahlen', 'Trends', 'Reports'],
      cta: 'Dashboard oeffnen',
      onClick: () => router.push('/dashboard/analytics'),
    },
    {
      title: 'Generate',
      meta: 'KI-Pipeline',
      description: 'Beschreibe deine Zielgruppe -- die KI recherchiert, analysiert und bewertet automatisch',
      icon: <Zap className="w-4 h-4 text-amber-500" />,
      status: 'Bereit',
      tags: ['KI-Suche', 'Automatisierung'],
      cta: 'Starten',
      colSpan: 2,
      onClick: () => router.push('/dashboard/generate'),
    },
    {
      title: 'Business AI',
      meta: 'Assistent',
      description: 'Dein persoenlicher KI-Assistent fuer Geschaeftsfragen, Analysen und Aufgaben',
      icon: <Sparkles className="w-4 h-4 text-purple-400" />,
      status: 'Live',
      tags: ['Chat', 'Analyse', 'Automatisierung'],
      cta: 'Chat starten',
      onClick: () => router.push('/dashboard/business-ai'),
    },
  ];

  const stagger = (index: number) => ({
    opacity: mounted ? 1 : 0,
    filter: mounted ? 'blur(0px)' : 'blur(4px)',
    transform: mounted ? 'translateY(0)' : 'translateY(12px)',
    transition: `all 600ms ${EASE} ${index * 80}ms`,
  });

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#050505',
        fontFamily: 'var(--font-dm-sans)',
        color: '#e8e8e8',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes blurFadeIn{from{opacity:0;filter:blur(4px);transform:translateY(12px)}to{opacity:1;filter:blur(0px);transform:translateY(0)}}
        @keyframes chipSlide{from{opacity:0;filter:blur(4px);transform:translateY(8px) scale(0.97)}to{opacity:1;filter:blur(0px);transform:translateY(0) scale(1)}}
        .glass-card{background:rgba(255,255,255,0.03);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.06);transition:all 500ms ${EASE}}
        .glass-card:hover{border-color:rgba(255,255,255,0.12);transform:translateY(-2px)}
      `}</style>

      {!hasMessages && <DottedSurface />}

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Chat Section */}
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
                      fontFamily: 'var(--font-dm-sans)',
                      background: msg.role === 'user' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                      color: msg.role === 'user' ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.65)',
                      border:
                        msg.role === 'ai' ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(255,255,255,0.08)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
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
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                    }}
                  >
                    <TextShimmer className="text-sm font-medium" duration={1}>
                      Denkt nach...
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
                paddingTop: '12vh',
                paddingBottom: 12,
              }}
            >
              {/* Heading */}
              <h1
                style={{
                  ...stagger(0),
                  fontSize: 32,
                  fontWeight: 600,
                  marginBottom: 6,
                  letterSpacing: '-0.03em',
                  color: '#e8e8e8',
                }}
              >
                Wie kann ich helfen?
              </h1>

              {/* Subtitle */}
              <p
                style={{
                  ...stagger(1),
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.25)',
                  marginBottom: 14,
                  margin: 0,
                  marginTop: 0,
                  paddingBottom: 14,
                }}
              >
                Dein BusinessOS -- alles an einem Ort
              </p>

              {/* Mode pills */}
              <div style={{ ...stagger(2), display: 'flex', gap: 6 }}>
                {modes.map((m) => (
                  <button
                    key={m.key}
                    onClick={() => setMode(m.key)}
                    style={{
                      padding: '6px 16px',
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: 'pointer',
                      border: mode === m.key ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(255,255,255,0.06)',
                      background: mode === m.key ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      color: mode === m.key ? '#e8e8e8' : 'rgba(255,255,255,0.35)',
                      transition: `all 500ms ${EASE}`,
                      fontFamily: 'var(--font-dm-sans)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                    }}
                  >
                    {m.icon} {m.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input — double bezel */}
          <div
            style={{
              ...(!hasMessages ? stagger(3) : {}),
              paddingBottom: hasMessages ? 20 : 8,
              flexShrink: 0,
            }}
          >
            {/* Outer bezel */}
            <div
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: 16,
                padding: 2,
              }}
            >
              {/* Inner bezel */}
              <div
                style={{
                  background: 'rgba(255,255,255,0.04)',
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
                        : 'Stell eine Frage an dein BusinessOS...'
                  }
                  style={{
                    width: '100%',
                    padding: '16px 18px',
                    resize: 'none',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#e8e8e8',
                    fontSize: 14,
                    fontFamily: 'var(--font-dm-sans)',
                    lineHeight: 1.5,
                    minHeight: 56,
                    overflow: 'hidden',
                  }}
                />
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    padding: '0 12px 12px',
                  }}
                >
                  <button
                    onClick={() => handleSend()}
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
                      color: input.trim() ? '#050505' : 'rgba(255,255,255,0.2)',
                      fontSize: 14,
                      transition: `all 300ms ${EASE}`,
                      transform: 'scale(1)',
                    }}
                    onMouseDown={(e) => {
                      if (input.trim()) e.currentTarget.style.transform = 'scale(0.98)';
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <ArrowUp size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick action chips */}
          {!hasMessages && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: 8,
                paddingBottom: 24,
              }}
            >
              {quickActions.map((qa, i) => {
                const Icon = qa.lucide;
                return (
                  <button
                    key={i}
                    onClick={() => handleSend(qa.label)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 12,
                      fontSize: 12,
                      cursor: 'pointer',
                      border: '1px solid rgba(255,255,255,0.05)',
                      background: 'rgba(255,255,255,0.03)',
                      color: 'rgba(255,255,255,0.4)',
                      transition: `all 500ms ${EASE}`,
                      fontFamily: 'var(--font-dm-sans)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      animation: mounted ? `chipSlide 500ms ${EASE} ${500 + i * 80}ms both` : 'none',
                    }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.transform = 'scale(0.98)';
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                      e.currentTarget.style.color = 'rgba(255,255,255,0.65)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                      e.currentTarget.style.color = 'rgba(255,255,255,0.4)';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <Icon size={13} strokeWidth={1.5} style={{ opacity: 0.6 }} />
                    {qa.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Dashboard Widgets */}
        {!hasMessages && (
          <div
            style={{
              ...stagger(5),
              padding: '0 20px 16px',
              maxWidth: 1100,
              margin: '0 auto',
              width: '100%',
            }}
          >
            <DashboardWidgets />
          </div>
        )}

        {/* Onboarding + BentoGrid */}
        {!hasMessages && (
          <>
            <div
              style={{
                ...stagger(6),
                padding: '0 20px 16px',
                maxWidth: 1100,
                margin: '0 auto',
                width: '100%',
              }}
            >
              <OnboardingProgress />
            </div>
            <div
              style={{
                ...stagger(7),
                padding: '0 20px 48px',
                maxWidth: 1100,
                margin: '0 auto',
                width: '100%',
              }}
            >
              <BentoGrid items={bentoItems} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
