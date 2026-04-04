'use client';

import Link from 'next/link';

interface Step {
  icon: string;
  label: string;
  status: 'done' | 'active' | 'todo';
  sub: string;
}

const STEPS: Step[] = [
  { icon: '🧠', label: 'KI-Analyse', status: 'done', sub: 'Abgeschlossen' },
  { icon: '⚡', label: 'Apollo-Suche', status: 'active', sub: 'Läuft...' },
  { icon: '🌐', label: 'Website-Analyse', status: 'todo', sub: '' },
  { icon: '🤖', label: 'KI-Scoring', status: 'todo', sub: '' },
  { icon: '📊', label: 'Ergebnisse', status: 'todo', sub: '' },
];

export default function GeneratingState() {
  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>
      <style>{`@keyframes gsPulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
      <div style={{ background: '#111', border: '0.5px solid #1a1a1a', borderRadius: 10, padding: 28 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {STEPS.map((step, i) => {
            const iconBg = step.status === 'done' ? '#1a2a1a' : step.status === 'active' ? '#2a2a1a' : '#151515';
            const iconColor = step.status === 'done' ? '#4ade80' : step.status === 'active' ? '#f59e0b' : '#333';
            const textColor = step.status === 'done' ? '#ccc' : step.status === 'active' ? '#fff' : '#444';
            const subColor = step.status === 'done' ? '#4a7a4a' : step.status === 'active' ? '#857530' : '#333';
            return (
              <div key={i}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0' }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: iconBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      flexShrink: 0,
                      animation: step.status === 'active' ? 'gsPulse 2s ease-in-out infinite' : 'none',
                    }}
                  >
                    {step.status === 'done' ? (
                      <span style={{ color: '#4ade80', fontSize: 13 }}>✓</span>
                    ) : step.status === 'active' ? (
                      <span style={{ color: iconColor }}>{step.icon}</span>
                    ) : (
                      <span style={{ color: iconColor, fontSize: 10 }}>○</span>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: textColor, fontWeight: step.status === 'active' ? 500 : 400 }}>
                      {step.label}
                    </div>
                    {step.sub && <div style={{ fontSize: 11, color: subColor, marginTop: 1 }}>{step.sub}</div>}
                  </div>
                </div>
                {i < STEPS.length - 1 && <div style={{ borderTop: '0.5px solid #1a1a1a', marginLeft: 46 }} />}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: 20 }}>
        <div style={{ fontSize: 13, color: '#555', marginBottom: 14 }}>
          Leads erscheinen automatisch in deiner Übersicht
        </div>
        <Link
          href="/dashboard/leads"
          style={{
            display: 'inline-block',
            padding: '10px 24px',
            borderRadius: 8,
            background: '#e0e0e0',
            color: '#080808',
            fontSize: 13,
            fontWeight: 500,
            textDecoration: 'none',
            fontFamily: 'var(--font-dm-sans)',
          }}
        >
          → Zu den Leads
        </Link>
      </div>
    </div>
  );
}
