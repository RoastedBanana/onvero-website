'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DottedSurface } from '@/components/ui/dotted-surface';
import { OnboardingProgress } from '@/components/ui/OnboardingProgress';
import { TextShimmer } from '@/components/ui/text-shimmer';
import { DashboardWidgets } from '@/components/ui/DashboardWidgets';
import { Users, BarChart2, Zap, Calendar, Search, Sparkles, ArrowUp, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const WEBHOOK = process.env.NEXT_PUBLIC_N8N_WEBHOOK_DASHBOARD_CHAT || '';

const quickActions = [
  { label: 'Was steht an?', icon: Calendar },
  { label: 'Übersicht zeigen', icon: BarChart2 },
  { label: 'Kampagne starten', icon: Zap },
  { label: 'Meeting vorbereiten', icon: FileText },
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
  const [inputFocused, setInputFocused] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const hasMessages = messages.length > 0;

  useEffect(() => {
    setTimeout(() => setMounted(true), 50);
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

  const cards = [
    {
      title: 'Leads',
      icon: Users,
      iconColor: '#6B7AFF',
      stat: String(stats.hot),
      statLabel: 'HOT Leads',
      tags: [`${stats.total} Total`, `${stats.warm} Warm`, `${stats.avg} Avg`],
      colSpan: 2,
      onClick: () => router.push('/dashboard/leads'),
    },
    {
      title: 'Meetings',
      icon: Calendar,
      iconColor: '#38bdf8',
      stat: '--',
      statLabel: 'Aufnahmen',
      tags: ['Transkription', 'KI'],
      colSpan: 1,
      onClick: () => router.push('/dashboard/meetings'),
    },
    {
      title: 'Analytics',
      icon: BarChart2,
      iconColor: '#22C55E',
      stat: String(stats.avg),
      statLabel: 'Avg Score',
      tags: ['Trends', 'Reports'],
      colSpan: 1,
      onClick: () => router.push('/dashboard/analytics'),
    },
    {
      title: 'Generate',
      icon: Zap,
      iconColor: '#F59E0B',
      stat: '\u2192',
      statLabel: 'Jetzt starten',
      tags: ['KI-Suche', 'Apollo'],
      colSpan: 2,
      onClick: () => router.push('/dashboard/generate'),
    },
    {
      title: 'Business AI',
      icon: Sparkles,
      iconColor: '#a78bfa',
      stat: 'Live',
      statLabel: 'Assistent',
      tags: ['Chat', 'Analyse'],
      colSpan: 1,
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
        @keyframes meshDrift {
          0% { background-position: 20% 20%, 80% 80%, 50% 40%; }
          33% { background-position: 30% 30%, 70% 70%, 45% 50%; }
          66% { background-position: 15% 25%, 85% 75%, 55% 35%; }
          100% { background-position: 20% 20%, 80% 80%, 50% 40%; }
        }
        @keyframes heroBlurIn {
          from { opacity: 0; filter: blur(8px); transform: translateY(12px); }
          to { opacity: 1; filter: blur(0px); transform: translateY(0); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pillEnter {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes cardEnter {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes sendBtnIn {
          from { opacity: 0; transform: scale(0.7); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {/* Ambient Mesh Gradient Background */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          background: [
            'radial-gradient(ellipse 600px 400px at 20% 20%, rgba(107,122,255,0.07) 0%, transparent 70%)',
            'radial-gradient(ellipse 500px 500px at 80% 80%, rgba(34,197,94,0.04) 0%, transparent 70%)',
            'radial-gradient(ellipse 800px 300px at 50% 40%, rgba(255,255,255,0.02) 0%, transparent 60%)',
          ].join(', '),
          backgroundSize: '100% 100%, 100% 100%, 100% 100%',
          animation: 'meshDrift 20s ease-in-out infinite',
        }}
      />

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
                      maxWidth: '75%',
                      padding: '12px 18px',
                      borderRadius: 16,
                      fontSize: 14,
                      lineHeight: 1.6,
                      background: msg.role === 'user' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                      color: msg.role === 'user' ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.7)',
                      border: msg.role === 'ai' ? '1px solid rgba(255,255,255,0.06)' : 'none',
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
                      padding: '12px 18px',
                      borderRadius: 16,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
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
                paddingTop: '14vh',
                paddingBottom: 16,
              }}
            >
              {/* Hero Title */}
              <h1
                style={{
                  fontSize: 48,
                  fontWeight: 700,
                  letterSpacing: '-0.04em',
                  marginBottom: 8,
                  background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.5) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  animation: mounted ? 'heroBlurIn 0.8s cubic-bezier(0.32,0.72,0,1) 0ms both' : 'none',
                }}
              >
                Wie kann ich helfen?
              </h1>

              {/* Subtitle */}
              <p
                style={{
                  fontSize: 14,
                  color: 'rgba(255,255,255,0.25)',
                  letterSpacing: '0.02em',
                  marginBottom: 28,
                  animation: mounted ? 'heroBlurIn 0.8s cubic-bezier(0.32,0.72,0,1) 100ms both' : 'none',
                }}
              >
                Dein BusinessOS — alles an einem Ort
              </p>
            </div>
          )}

          {/* Command-Style Input Bar */}
          <div
            style={{
              paddingBottom: hasMessages ? 20 : 12,
              flexShrink: 0,
              animation: !hasMessages && mounted ? 'fadeSlideUp 0.7s cubic-bezier(0.32,0.72,0,1) 200ms both' : 'none',
            }}
          >
            <div
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${inputFocused ? 'rgba(107,122,255,0.15)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 16,
                padding: 3,
                transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                boxShadow: inputFocused
                  ? '0 0 0 1px rgba(107,122,255,0.1), 0 8px 40px rgba(0,0,0,0.3)'
                  : '0 4px 20px rgba(0,0,0,0.2)',
              }}
            >
              <div
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: 14,
                  display: 'flex',
                  alignItems: 'center',
                  minHeight: 56,
                }}
              >
                {/* Left icon */}
                <div
                  style={{
                    paddingLeft: 18,
                    display: 'flex',
                    alignItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Search size={16} style={{ color: 'rgba(255,255,255,0.15)' }} />
                </div>

                {/* Textarea */}
                <textarea
                  ref={textareaRef}
                  value={input}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
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
                  placeholder="Stell eine Frage an dein BusinessOS..."
                  style={{
                    flex: 1,
                    padding: '16px 14px',
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

                {/* Send button */}
                <div style={{ paddingRight: 10, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  {input.trim() ? (
                    <button
                      onClick={() => handleSend()}
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        background: '#fff',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#080808',
                        transition: 'transform 0.15s ease',
                        animation: 'sendBtnIn 0.2s cubic-bezier(0.32,0.72,0,1) both',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <ArrowUp size={16} />
                    </button>
                  ) : (
                    <div style={{ width: 34, height: 34 }} />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action Pills */}
          {!hasMessages && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: 8,
                paddingBottom: 28,
              }}
            >
              {quickActions.map((qa, i) => {
                const Icon = qa.icon;
                return (
                  <button
                    key={i}
                    onClick={() => handleSend(qa.label)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 12,
                      fontSize: 12,
                      cursor: 'pointer',
                      border: '1px solid rgba(255,255,255,0.06)',
                      background: 'rgba(255,255,255,0.03)',
                      color: 'rgba(255,255,255,0.45)',
                      transition: 'all 0.25s cubic-bezier(0.32,0.72,0,1)',
                      fontFamily: 'inherit',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      animation: mounted ? `pillEnter 0.5s cubic-bezier(0.32,0.72,0,1) ${300 + i * 60}ms both` : 'none',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                      e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                      e.currentTarget.style.color = 'rgba(255,255,255,0.45)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <Icon size={13} style={{ opacity: 0.6 }} />
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
              padding: '0 20px 16px',
              maxWidth: 1100,
              margin: '0 auto',
              width: '100%',
              animation: mounted ? 'fadeSlideUp 0.7s cubic-bezier(0.32,0.72,0,1) 400ms both' : 'none',
            }}
          >
            <DashboardWidgets />
          </div>
        )}

        {/* Onboarding Progress */}
        {!hasMessages && (
          <div
            style={{
              padding: '0 20px 16px',
              maxWidth: 1100,
              margin: '0 auto',
              width: '100%',
              animation: mounted ? 'fadeSlideUp 0.7s cubic-bezier(0.32,0.72,0,1) 450ms both' : 'none',
            }}
          >
            <OnboardingProgress />
          </div>
        )}

        {/* Asymmetric Bento Grid */}
        {!hasMessages && (
          <div
            style={{
              padding: '0 20px 48px',
              maxWidth: 1100,
              margin: '0 auto',
              width: '100%',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 14,
              }}
            >
              {cards.map((card, i) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.title}
                    onClick={card.onClick}
                    style={{
                      gridColumn: card.colSpan === 2 ? 'span 2' : 'span 1',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      borderRadius: 16,
                      padding: 3,
                      cursor: 'pointer',
                      transition: 'all 0.6s cubic-bezier(0.32,0.72,0,1)',
                      animation: mounted ? `cardEnter 0.7s cubic-bezier(0.32,0.72,0,1) ${500 + i * 80}ms both` : 'none',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div
                      style={{
                        background:
                          card.colSpan === 2
                            ? `linear-gradient(135deg, ${card.iconColor}08 0%, rgba(255,255,255,0.03) 60%)`
                            : 'rgba(255,255,255,0.03)',
                        borderRadius: 'calc(1rem - 3px)',
                        padding: 24,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 20,
                      }}
                    >
                      {/* Card Header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 20,
                              background: 'rgba(255,255,255,0.06)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Icon size={18} style={{ color: card.iconColor }} />
                          </div>
                          <span style={{ fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
                            {card.title}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: 12,
                            color: 'rgba(255,255,255,0.25)',
                            transition: 'color 0.2s',
                          }}
                        >
                          View All &rarr;
                        </span>
                      </div>

                      {/* Big Stat */}
                      <div>
                        <div
                          style={{
                            fontSize: 36,
                            fontWeight: 600,
                            fontFamily: 'var(--font-dm-mono, monospace)',
                            color: card.iconColor,
                            lineHeight: 1,
                            marginBottom: 4,
                          }}
                        >
                          {card.stat}
                        </div>
                        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>{card.statLabel}</div>
                      </div>

                      {/* Tags */}
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 'auto' }}>
                        {card.tags.map((tag) => (
                          <span
                            key={tag}
                            style={{
                              fontSize: 11,
                              padding: '4px 10px',
                              borderRadius: 8,
                              background: 'rgba(255,255,255,0.04)',
                              border: '1px solid rgba(255,255,255,0.06)',
                              color: 'rgba(255,255,255,0.35)',
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
