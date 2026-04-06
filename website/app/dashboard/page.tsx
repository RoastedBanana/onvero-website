'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const modes = ['Suchen', 'Fragen', 'Erstellen'];

interface CardData {
  key: string;
  title: string;
  subtitle: string;
  href: string;
  stat: string;
  statLabel: string;
  items: string[];
  accent: string;
  icon: string;
}

const defaultCards: CardData[] = [
  {
    key: 'leads',
    title: 'Leads',
    subtitle: 'KI-qualifizierte Kontakte',
    href: '/dashboard/leads',
    stat: '—',
    statLabel: 'HOT Leads',
    items: [],
    accent: '#6B7AFF',
    icon: '◈',
  },
  {
    key: 'analytics',
    title: 'Analytics',
    subtitle: 'Kennzahlen & Performance',
    href: '/dashboard/analytics',
    stat: '—',
    statLabel: 'Leads diese Woche',
    items: [],
    accent: '#22C55E',
    icon: '▦',
  },
  {
    key: 'generate',
    title: 'Generate',
    subtitle: 'KI-Lead-Kampagnen',
    href: '/dashboard/generate',
    stat: '—',
    statLabel: 'Letzte Kampagne',
    items: [],
    accent: '#F59E0B',
    icon: '✦',
  },
];

export default function DashboardPage() {
  const [mode, setMode] = useState('Fragen');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [cards, setCards] = useState<CardData[]>(defaultCards);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  // Load real stats
  useEffect(() => {
    fetch('/api/leads')
      .then((r) => r.json())
      .then((d) => {
        const leads = d.leads ?? [];
        const hot = leads.filter((l: { score: number }) => (l.score ?? 0) >= 70).length;
        const total = leads.length;
        const avgScore =
          total > 0 ? Math.round(leads.reduce((s: number, l: { score: number }) => s + (l.score ?? 0), 0) / total) : 0;
        const now24h = Date.now() - 24 * 60 * 60 * 1000;
        const recent = leads.filter((l: { created_at: string }) => new Date(l.created_at).getTime() > now24h);
        const topLeads = leads
          .sort((a: { score: number }, b: { score: number }) => (b.score ?? 0) - (a.score ?? 0))
          .slice(0, 3)
          .map((l: { company_name: string; score: number }) => `${l.company_name} · ${l.score ?? 0}`);

        setCards((prev) =>
          prev.map((c) => {
            if (c.key === 'leads')
              return { ...c, stat: String(hot), statLabel: `HOT von ${total} Leads`, items: topLeads };
            if (c.key === 'analytics')
              return {
                ...c,
                stat: String(recent.length),
                statLabel: 'Neue Leads (24h)',
                items: [`Ø Score ${avgScore}`, `${total} gesamt`, `${hot} HOT`],
              };
            if (c.key === 'generate')
              return { ...c, items: ['Freitext-KI-Suche', 'Apollo + Google Maps', 'Profil-gesteuert'] };
            return c;
          })
        );
      })
      .catch(() => {});
  }, []);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: 'Diese Funktion wird in Kürze verbunden. Dein BusinessOS KI-Assistent antwortet bald hier.',
        },
      ]);
      setLoading(false);
    }, 800);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
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
      {/* Subtle background glow */}
      <div
        style={{
          position: 'absolute',
          top: -200,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 800,
          height: 500,
          borderRadius: '50%',
          background:
            'radial-gradient(ellipse, rgba(107,122,255,0.06) 0%, rgba(107,122,255,0.02) 40%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -300,
          right: -200,
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(34,197,94,0.03) 0%, transparent 60%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative', padding: '48px 40px 60px', maxWidth: 1000, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1
            style={{
              fontSize: 32,
              fontWeight: 600,
              letterSpacing: '-0.03em',
              marginBottom: 8,
              background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Willkommen zurück
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>Onvero BusinessOS</p>
        </div>

        {/* Mode Pills */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 16 }}>
          {modes.map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                padding: '6px 18px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                border: m === mode ? '1px solid rgba(107,122,255,0.5)' : '1px solid rgba(255,255,255,0.08)',
                background: m === mode ? 'rgba(107,122,255,0.1)' : 'transparent',
                color: m === mode ? '#a5b4fc' : 'rgba(255,255,255,0.35)',
                transition: 'all 0.2s',
                fontFamily: 'inherit',
              }}
            >
              {m === 'Suchen' ? '⌕ ' : m === 'Fragen' ? '○ ' : '✦ '}
              {m}
            </button>
          ))}
        </div>

        {/* Chat Box */}
        <div
          style={{
            maxWidth: 640,
            margin: '0 auto 48px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 16,
            overflow: 'hidden',
            backdropFilter: 'blur(12px)',
          }}
        >
          {messages.length > 0 && (
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                maxHeight: 240,
                overflowY: 'auto',
              }}
            >
              {messages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    marginBottom: 10,
                    display: 'flex',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div
                    style={{
                      maxWidth: '80%',
                      padding: '8px 14px',
                      borderRadius: 12,
                      fontSize: 13,
                      lineHeight: 1.5,
                      background: msg.role === 'user' ? 'rgba(107,122,255,0.15)' : 'rgba(255,255,255,0.04)',
                      color: msg.role === 'user' ? '#a5b4fc' : 'rgba(255,255,255,0.75)',
                    }}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', padding: '4px 0' }}>
                  <style>{`@keyframes homeDots{0%,20%{content:''}40%{content:'.'}60%{content:'..'}80%,100%{content:'...'}}`}</style>
                  KI denkt
                  <span style={{ display: 'inline-block', width: 20 }}>
                    <span style={{ animation: 'homeDots 1.2s steps(1) infinite' }} />
                  </span>
                </div>
              )}
            </div>
          )}

          <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'flex-end', gap: 12 }}>
            <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.15)', flexShrink: 0, marginBottom: 2 }}>+</div>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                mode === 'Suchen'
                  ? 'Leads, Firmen, Kennzahlen suchen...'
                  : mode === 'Erstellen'
                    ? 'Neue Kampagne, Report oder Task erstellen...'
                    : 'Frag dein BusinessOS...'
              }
              rows={1}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                resize: 'none',
                fontSize: 14,
                color: '#fff',
                fontFamily: 'inherit',
                lineHeight: 1.5,
              }}
            />
            <button
              onClick={handleSend}
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: input.trim() ? '#6B7AFF' : 'rgba(255,255,255,0.06)',
                border: 'none',
                cursor: input.trim() ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 15,
                color: input.trim() ? '#fff' : 'rgba(255,255,255,0.2)',
                flexShrink: 0,
                transition: 'all 0.2s',
              }}
            >
              ▸
            </button>
          </div>
        </div>

        {/* Feature Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 18,
          }}
        >
          {cards.map((card) => {
            const isHovered = hoveredCard === card.key;
            return (
              <div
                key={card.key}
                onClick={() => router.push(card.href)}
                onMouseEnter={() => setHoveredCard(card.key)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  background: isHovered ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isHovered ? card.accent + '35' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: 16,
                  padding: 24,
                  cursor: 'pointer',
                  transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                  transform: isHovered ? 'translateY(-3px)' : 'translateY(0)',
                  boxShadow: isHovered ? `0 8px 32px ${card.accent}10` : 'none',
                }}
              >
                {/* Header */}
                <div
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: `${card.accent}12`,
                        border: `1px solid ${card.accent}20`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 16,
                        color: card.accent,
                      }}
                    >
                      {card.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>{card.title}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>{card.subtitle}</div>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      color: isHovered ? card.accent : 'rgba(255,255,255,0.15)',
                      transition: 'color 0.2s',
                      fontWeight: 500,
                    }}
                  >
                    View All →
                  </span>
                </div>

                {/* Stat */}
                <div style={{ marginBottom: 20 }}>
                  <div
                    style={{
                      fontSize: 36,
                      fontWeight: 700,
                      color: card.accent,
                      letterSpacing: '-0.04em',
                      fontFamily: 'var(--font-dm-mono)',
                      lineHeight: 1,
                    }}
                  >
                    {card.stat}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>{card.statLabel}</div>
                </div>

                {/* Items */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 14 }}>
                  {card.items.length > 0 ? (
                    card.items.map((item, j) => (
                      <div
                        key={j}
                        style={{
                          fontSize: 12,
                          color: 'rgba(255,255,255,0.4)',
                          padding: '4px 0',
                          borderBottom: j < card.items.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <span
                          style={{
                            width: 4,
                            height: 4,
                            borderRadius: '50%',
                            background: `${card.accent}40`,
                            flexShrink: 0,
                          }}
                        />
                        {item}
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)', padding: '4px 0' }}>Laden...</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
