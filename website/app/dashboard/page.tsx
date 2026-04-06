'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

const modes = ['Suchen', 'Fragen', 'Erstellen'];

const featureCards = [
  {
    key: 'leads',
    title: 'Leads',
    subtitle: 'KI-qualifizierte Kontakte',
    href: '/dashboard/leads',
    stat: '—',
    statLabel: 'HOT Leads heute',
    preview: ['Müller GmbH', 'TechVision AG', 'Bauwerk Solutions'],
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
    preview: ['Score-Ø 68', 'Pipeline +12%', 'Konversion 4.2%'],
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
    preview: ['Web-Design Hamburg', '47 Leads', '12. April'],
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
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

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
        fontFamily: 'DM Sans, sans-serif',
        padding: '40px 40px 60px',
        color: '#fff',
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.03em', marginBottom: 6 }}>Willkommen zurück</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
          Übersicht & Kennzahlen · {new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      {/* Mode Pills */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 16 }}>
        {modes.map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              padding: '5px 16px',
              borderRadius: 20,
              fontSize: 12,
              fontFamily: 'DM Sans, sans-serif',
              cursor: 'pointer',
              border: m === mode ? '1px solid rgba(107,122,255,0.6)' : '1px solid rgba(255,255,255,0.1)',
              background: m === mode ? 'rgba(107,122,255,0.12)' : 'transparent',
              color: m === mode ? '#a5b4fc' : 'rgba(255,255,255,0.4)',
              transition: 'all 0.15s',
            }}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Chat Box */}
      <div
        style={{
          maxWidth: 680,
          margin: '0 auto 40px',
          background: '#111',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 14,
          overflow: 'hidden',
        }}
      >
        {messages.length > 0 && (
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              maxHeight: 220,
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
                    padding: '8px 12px',
                    borderRadius: 10,
                    fontSize: 13,
                    background: msg.role === 'user' ? 'rgba(107,122,255,0.2)' : 'rgba(255,255,255,0.05)',
                    color: msg.role === 'user' ? '#a5b4fc' : 'rgba(255,255,255,0.8)',
                  }}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>KI denkt...</div>}
          </div>
        )}

        <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'flex-end', gap: 10 }}>
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
              fontSize: 13,
              color: '#fff',
              fontFamily: 'DM Sans, sans-serif',
              lineHeight: 1.5,
            }}
          />
          <button
            onClick={handleSend}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: input.trim() ? '#6B7AFF' : 'rgba(255,255,255,0.08)',
              border: 'none',
              cursor: input.trim() ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              color: '#fff',
              flexShrink: 0,
              transition: 'background 0.15s',
            }}
          >
            →
          </button>
        </div>
      </div>

      {/* Feature Cards */}
      <div
        style={{
          maxWidth: 900,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
        }}
      >
        {featureCards.map((card) => (
          <div
            key={card.key}
            onClick={() => router.push(card.href)}
            onMouseEnter={() => setHoveredCard(card.key)}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              background: '#111',
              border: `1px solid ${hoveredCard === card.key ? card.accent + '40' : 'rgba(255,255,255,0.07)'}`,
              borderRadius: 14,
              padding: 20,
              cursor: 'pointer',
              transition: 'all 0.2s',
              transform: hoveredCard === card.key ? 'translateY(-2px)' : 'translateY(0)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    background: card.accent + '18',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    color: card.accent,
                  }}
                >
                  {card.icon}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{card.title}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>{card.subtitle}</div>
                </div>
              </div>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>→</span>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 26, fontWeight: 600, color: card.accent, letterSpacing: '-0.03em' }}>
                {card.stat}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{card.statLabel}</div>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 12 }}>
              {card.preview.map((item, j) => (
                <div
                  key={j}
                  style={{
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.4)',
                    padding: '3px 0',
                    borderBottom: j < card.preview.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
