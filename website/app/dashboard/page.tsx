'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DottedSurface } from '@/components/ui/dotted-surface';
import { OnboardingProgress } from '@/components/ui/OnboardingProgress';
import { TextShimmer } from '@/components/ui/text-shimmer';
import { BentoGrid } from '@/components/ui/bento-grid';
import type { BentoItem } from '@/components/ui/bento-grid';
import { HowItWorks } from '@/components/ui/how-it-works';
import { Users, BarChart2, Zap, Target, Mail, TrendingUp, Calendar, Search, PenLine, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const WEBHOOK = 'https://n8n.srv1223027.hstgr.cloud/webhook/6c419e39-f35c-49a8-abb8-51b2de160070/chat';

const modes = [
  { key: 'search', label: 'Suchen', icon: '⌕' },
  { key: 'ask', label: 'Fragen', icon: '○' },
  { key: 'create', label: 'Erstellen', icon: '✦' },
];

const quickActions = [
  { label: 'Was steht diese Woche an?', lucide: Calendar },
  { label: 'Zeig mir eine Übersicht', lucide: Search },
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
      description: 'Kontakte verwalten, KI-Bewertungen prüfen und personalisierte E-Mails versenden',
      icon: <Users className="w-4 h-4 text-[#6B7AFF]" />,
      status: 'Aktiv',
      tags: ['Kontakte', 'Scoring', 'E-Mail'],
      cta: 'Öffnen →',
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
      cta: 'Öffnen →',
      onClick: () => router.push('/dashboard/meetings'),
    },
    {
      title: 'Analytics',
      description: 'Kennzahlen, Trends und Performance deines gesamten BusinessOS auf einen Blick',
      icon: <BarChart2 className="w-4 h-4 text-emerald-500" />,
      status: 'Live',
      tags: ['Kennzahlen', 'Trends', 'Reports'],
      cta: 'Dashboard öffnen →',
      onClick: () => router.push('/dashboard/analytics'),
    },
    {
      title: 'Generate',
      meta: 'KI-Pipeline',
      description: 'Beschreibe deine Zielgruppe — die KI recherchiert, analysiert und bewertet automatisch',
      icon: <Zap className="w-4 h-4 text-amber-500" />,
      status: 'Bereit',
      tags: ['KI-Suche', 'Automatisierung'],
      cta: 'Starten →',
      colSpan: 2,
      onClick: () => router.push('/dashboard/generate'),
    },
    {
      title: 'Business AI',
      meta: 'Assistent',
      description: 'Dein persönlicher KI-Assistent für Geschäftsfragen, Analysen und Aufgaben',
      icon: <Sparkles className="w-4 h-4 text-purple-400" />,
      status: 'Live',
      tags: ['Chat', 'Analyse', 'Automatisierung'],
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
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes glowPulse{0%,100%{opacity:0.4}50%{opacity:0.8}}
        @keyframes borderGlow{0%{border-color:rgba(255,255,255,0.08)}50%{border-color:rgba(107,122,255,0.2)}100%{border-color:rgba(255,255,255,0.08)}}
        @keyframes chipSlide{from{opacity:0;transform:translateY(8px) scale(0.95)}to{opacity:1;transform:translateY(0) scale(1)}}
      `}</style>

      {!hasMessages && <DottedSurface />}

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* ── Chat Section ── */}
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
                paddingTop: '12vh',
                paddingBottom: 12,
              }}
            >
              {/* Animated heading */}
              <h1
                style={{
                  fontSize: 34,
                  fontWeight: 700,
                  marginBottom: 6,
                  letterSpacing: '-0.03em',
                  animation: mounted ? 'fadeUp 0.6s ease forwards' : 'none',
                  opacity: mounted ? 1 : 0,
                }}
              >
                Wie kann ich helfen?
              </h1>

              {/* Subtitle */}
              <p
                style={{
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.25)',
                  marginBottom: 14,
                  animation: mounted ? 'fadeUp 0.6s ease 0.15s both' : 'none',
                }}
              >
                Dein BusinessOS — alles an einem Ort
              </p>

              {/* Mode pills */}
              <div style={{ display: 'flex', gap: 6, animation: mounted ? 'fadeUp 0.6s ease 0.25s both' : 'none' }}>
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
                      transition: 'all 0.2s',
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
          <div
            style={{
              paddingBottom: hasMessages ? 20 : 8,
              flexShrink: 0,
              animation: !hasMessages && mounted ? 'fadeUp 0.6s ease 0.35s both' : 'none',
            }}
          >
            <div
              style={{
                background: '#111',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 14,
                overflow: 'hidden',
                animation: !hasMessages ? 'borderGlow 4s ease-in-out infinite' : 'none',
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
                    color: input.trim() ? '#080808' : 'rgba(255,255,255,0.2)',
                    fontSize: 14,
                    transition: 'all 0.2s',
                  }}
                >
                  ▸
                </button>
              </div>
            </div>
          </div>

          {/* Quick action chips — only on welcome */}
          {!hasMessages && (
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 6, paddingBottom: 24 }}>
              {quickActions.map((qa, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(qa.label)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 20,
                    fontSize: 11,
                    cursor: 'pointer',
                    border: '1px solid rgba(255,255,255,0.06)',
                    background: 'rgba(255,255,255,0.02)',
                    color: 'rgba(255,255,255,0.4)',
                    transition: 'all 0.2s',
                    fontFamily: 'inherit',
                    animation: mounted ? `chipSlide 0.4s ease ${0.5 + i * 0.08}s both` : 'none',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.4)';
                  }}
                >
                  <qa.lucide size={12} style={{ opacity: 0.6 }} /> {qa.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Onboarding + Feature Cards + Getting Started ── */}
        {!hasMessages && (
          <>
            <div
              style={{
                padding: '0 20px 16px',
                maxWidth: 1100,
                margin: '0 auto',
                width: '100%',
                animation: mounted ? 'fadeUp 0.6s ease 0.55s both' : 'none',
              }}
            >
              <OnboardingProgress />
            </div>
            <div
              style={{
                padding: '0 20px 24px',
                maxWidth: 1100,
                margin: '0 auto',
                width: '100%',
                animation: mounted ? 'fadeUp 0.6s ease 0.6s both' : 'none',
              }}
            >
              <BentoGrid items={bentoItems} />
            </div>
            <div
              style={{
                padding: '0 20px 48px',
                maxWidth: 1100,
                margin: '0 auto',
                width: '100%',
                animation: mounted ? 'fadeUp 0.6s ease 0.7s both' : 'none',
              }}
            >
              <HowItWorks
                storageKey="home"
                title="Erste Schritte"
                subtitle="So holst du das meiste aus deinem BusinessOS"
                compact
                steps={[
                  {
                    icon: <Target className="w-5 h-5 text-[#F59E0B]" />,
                    title: 'Profil einrichten',
                    description: 'Gehe zu Settings und beschreibe dein Unternehmen, deine Zielkunden und dein Angebot.',
                    benefits: [
                      'KI-Profil in den Einstellungen',
                      'Beschreibt wer du bist',
                      'Verbessert alle KI-Ergebnisse',
                    ],
                  },
                  {
                    icon: <Zap className="w-5 h-5 text-[#6B7AFF]" />,
                    title: 'Tools erkunden',
                    description: 'Nutze Generate, Meetings und Analytics um dein Business zu automatisieren.',
                    benefits: ['KI-gestützte Kampagnen', 'Meeting-Zusammenfassungen', 'Echtzeit-Kennzahlen'],
                  },
                  {
                    icon: <TrendingUp className="w-5 h-5 text-[#22C55E]" />,
                    title: 'KI-Assistent fragen',
                    description:
                      'Nutze die Business AI auf dieser Seite um Fragen zu stellen oder Aufgaben zu erledigen.',
                    benefits: ['Fragen in natürlicher Sprache', 'Zugriff auf alle Daten', 'Arbeitet mit deinem Profil'],
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
