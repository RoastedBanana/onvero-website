'use client';

import Link from 'next/link';

const STEPS = [
  { icon: '🧠', label: 'KI-Analyse', done: true },
  { icon: '⚡', label: 'Apollo-Suche', active: true },
  { icon: '🌐', label: 'Website-Analyse', pending: true },
  { icon: '🤖', label: 'KI-Scoring', pending: true },
  { icon: '📊', label: 'Ergebnisse', pending: true },
];

export default function GeneratingState() {
  return (
    <div style={{ maxWidth: 500, margin: '0 auto' }}>
      <div
        style={{
          background: '#111',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 14,
          padding: 32,
          textAlign: 'center',
        }}
      >
        <style>{`@keyframes genPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.6;transform:scale(1.1)}}`}</style>
        <div style={{ fontSize: 36, marginBottom: 12, animation: 'genPulse 2s ease-in-out infinite' }}>⚡</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Lead-Generierung gestartet</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 28 }}>
          Die Pipeline läuft jetzt im Hintergrund
        </div>

        <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 28 }}>
          {STEPS.map((step, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 0',
                borderBottom: i < STEPS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              }}
            >
              <span style={{ fontSize: 16, width: 24, textAlign: 'center', flexShrink: 0 }}>{step.icon}</span>
              <span
                style={{
                  fontSize: 13,
                  color: step.done ? '#22C55E' : step.active ? '#fff' : 'rgba(255,255,255,0.25)',
                  fontWeight: step.active ? 600 : 400,
                  flex: 1,
                }}
              >
                {step.label}
              </span>
              {step.done && <span style={{ fontSize: 12, color: '#22C55E' }}>✓</span>}
              {step.active && (
                <span style={{ fontSize: 11, color: '#F59E0B', animation: 'genPulse 1.5s ease-in-out infinite' }}>
                  ⟳
                </span>
              )}
              {step.pending && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)' }}>○</span>}
            </div>
          ))}
        </div>

        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 20 }}>
          Leads erscheinen automatisch in deiner Lead-Übersicht.
        </div>

        <Link
          href="/dashboard/leads"
          style={{
            display: 'inline-block',
            padding: '10px 24px',
            borderRadius: 8,
            background: '#6B7AFF',
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          → Zu den Leads
        </Link>
      </div>
    </div>
  );
}
