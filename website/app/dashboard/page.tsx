'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DottedSurface } from '@/components/ui/dotted-surface';
import { TextShimmer } from '@/components/ui/text-shimmer';
import ReactMarkdown from 'react-markdown';

const WEBHOOK = 'https://n8n.srv1223027.hstgr.cloud/webhook/6c419e39-f35c-49a8-abb8-51b2de160070/chat';

const modes = [
  { key: 'search', label: 'Suchen', icon: '⌕' },
  { key: 'ask', label: 'Fragen', icon: '○' },
  { key: 'create', label: 'Erstellen', icon: '✦' },
];

interface CardData {
  key: string;
  title: string;
  subtitle: string;
  href: string;
  stat: string;
  statLabel: string;
  tags: string[];
  accent: string;
}

const defaultCards: CardData[] = [
  {
    key: 'leads',
    title: 'Leads',
    subtitle: 'KI-qualifizierte Kontakte',
    href: '/dashboard/leads',
    stat: '—',
    statLabel: 'HOT Leads',
    tags: [],
    accent: '#6B7AFF',
  },
  {
    key: 'analytics',
    title: 'Analytics',
    subtitle: 'Kennzahlen & Performance',
    href: '/dashboard/analytics',
    stat: '—',
    statLabel: 'Leads diese Woche',
    tags: [],
    accent: '#22C55E',
  },
  {
    key: 'generate',
    title: 'Generate',
    subtitle: 'KI-Lead-Kampagnen',
    href: '/dashboard/generate',
    stat: '—',
    statLabel: 'Letzte Kampagne',
    tags: [],
    accent: '#F59E0B',
  },
];

interface Message {
  role: 'user' | 'ai';
  text: string;
}

export default function DashboardPage() {
  const [mode, setMode] = useState('ask');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState(defaultCards);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [sessionId] = useState(() => crypto.randomUUID());
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const hasMessages = messages.length > 0;

  // Load live stats
  useEffect(() => {
    fetch('/api/leads')
      .then((r) => r.json())
      .then((d) => {
        const leads = d.leads ?? [];
        const hot = leads.filter((l: Record<string, number>) => (l.score ?? 0) >= 70).length;
        const total = leads.length;
        const avg =
          total > 0
            ? Math.round(leads.reduce((s: number, l: Record<string, number>) => s + (l.score ?? 0), 0) / total)
            : 0;
        const now24h = Date.now() - 86400000;
        const recent = leads.filter((l: Record<string, string>) => new Date(l.created_at).getTime() > now24h).length;
        setCards((prev) =>
          prev.map((c) => {
            if (c.key === 'leads')
              return {
                ...c,
                stat: String(hot),
                statLabel: `HOT von ${total}`,
                tags: ['Score-Ø ' + avg, total + ' gesamt', hot + ' HOT'],
              };
            if (c.key === 'analytics')
              return {
                ...c,
                stat: String(recent),
                statLabel: 'Neue (24h)',
                tags: ['Ø ' + avg, total + ' Leads', hot + ' HOT'],
              };
            if (c.key === 'generate')
              return { ...c, stat: '→', statLabel: 'Jetzt starten', tags: ['KI-Analyse', 'Apollo', 'Google Maps'] };
            return c;
          })
        );
      })
      .catch(() => {});
  }, []);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Auto-resize textarea
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
      setMessages((prev) => [...prev, { role: 'ai', text: 'Verbindung fehlgeschlagen. Bitte versuche es erneut.' }]);
    } finally {
      setLoading(false);
    }
  };

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
      {/* Dotted background — only when no messages */}
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
            /* Messages */
            <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', paddingTop: 32, paddingBottom: 8 }}>
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
            /* Welcome */
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                paddingBottom: 20,
              }}
            >
              <h1 style={{ fontSize: 32, fontWeight: 700, color: '#fff', marginBottom: 12, letterSpacing: '-0.02em' }}>
                Wie kann ich helfen?
              </h1>

              {/* Mode Pills */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 0 }}>
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

          {/* ── Input Bar ── */}
          <div style={{ paddingBottom: hasMessages ? 20 : 32, flexShrink: 0 }}>
            <div
              style={{
                background: '#111',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 14,
                overflow: 'hidden',
              }}
            >
              <div style={{ overflowY: 'auto' }}>
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
              </div>
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

        {/* ── Feature Cards (below chat, reference-style) ── */}
        {!hasMessages && (
          <div style={{ padding: '0 40px 48px', maxWidth: 1100, margin: '0 auto', width: '100%' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {cards.map((card) => {
                const hovered = hoveredCard === card.key;
                return (
                  <div
                    key={card.key}
                    onClick={() => router.push(card.href)}
                    onMouseEnter={() => setHoveredCard(card.key)}
                    onMouseLeave={() => setHoveredCard(null)}
                    style={{
                      background: hovered ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${hovered ? card.accent + '30' : 'rgba(255,255,255,0.06)'}`,
                      borderRadius: 16,
                      padding: '20px 22px',
                      cursor: 'pointer',
                      transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                      transform: hovered ? 'translateY(-2px)' : 'none',
                      boxShadow: hovered ? `0 6px 24px ${card.accent}08` : 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 14,
                    }}
                  >
                    {/* Title row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{card.title}</div>
                      <span
                        style={{
                          fontSize: 11,
                          color: hovered ? card.accent : 'rgba(255,255,255,0.15)',
                          transition: 'color 0.2s',
                        }}
                      >
                        View All →
                      </span>
                    </div>

                    {/* Stat */}
                    <div>
                      <div
                        style={{
                          fontSize: 40,
                          fontWeight: 700,
                          color: card.accent,
                          fontFamily: 'var(--font-dm-mono)',
                          letterSpacing: '-0.04em',
                          lineHeight: 1,
                        }}
                      >
                        {card.stat}
                      </div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{card.statLabel}</div>
                    </div>

                    {/* Tags */}
                    {card.tags.length > 0 && (
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 5,
                          borderTop: '1px solid rgba(255,255,255,0.05)',
                          paddingTop: 12,
                        }}
                      >
                        {card.tags.map((tag, j) => (
                          <span
                            key={j}
                            style={{
                              fontSize: 10,
                              padding: '3px 10px',
                              borderRadius: 20,
                              background: 'rgba(255,255,255,0.04)',
                              border: '1px solid rgba(255,255,255,0.07)',
                              color: 'rgba(255,255,255,0.45)',
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
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
