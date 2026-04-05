'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const MESSAGES = [
  { at: 0, text: 'Apollo durchsucht die Datenbank...' },
  { at: 15, text: 'Google Maps Daten werden abgerufen...' },
  { at: 40, text: 'KI analysiert jeden Lead...' },
  { at: 70, text: 'Fast fertig...' },
];

interface Step {
  icon: string;
  label: string;
  status: 'done' | 'active' | 'todo';
}

export default function GeneratingState() {
  const [elapsed, setElapsed] = useState(0);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          setShowButton(true);
          return 90;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const currentMsg = [...MESSAGES].reverse().find((m) => elapsed >= m.at)?.text ?? MESSAGES[0].text;

  const steps: Step[] = [
    { icon: '🧠', label: 'KI-Analyse', status: 'done' },
    { icon: '⚡', label: 'Apollo-Suche', status: elapsed < 15 ? 'active' : 'done' },
    { icon: '🌐', label: 'Website-Analyse', status: elapsed < 15 ? 'todo' : elapsed < 40 ? 'active' : 'done' },
    { icon: '🤖', label: 'KI-Scoring', status: elapsed < 40 ? 'todo' : elapsed < 70 ? 'active' : 'done' },
    { icon: '📊', label: 'Ergebnisse', status: elapsed < 70 ? 'todo' : elapsed < 90 ? 'active' : 'done' },
  ];

  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>
      <style>{`@keyframes gsPulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
      <div style={{ background: '#111', border: '0.5px solid #1a1a1a', borderRadius: 10, padding: 28 }}>
        {/* Progress bar */}
        <div style={{ height: 4, background: '#1a1a1a', borderRadius: 2, overflow: 'hidden', marginBottom: 20 }}>
          <div
            style={{
              height: '100%',
              width: `${(elapsed / 90) * 100}%`,
              background: '#e0e0e0',
              borderRadius: 2,
              transition: 'width 1s linear',
            }}
          />
        </div>

        {/* Status message */}
        <div style={{ fontSize: 13, color: '#888', marginBottom: 16, textAlign: 'center' }}>{currentMsg}</div>

        {/* Timer */}
        <div
          style={{
            fontSize: 11,
            color: '#444',
            textAlign: 'center',
            marginBottom: 20,
            fontFamily: 'var(--font-dm-mono)',
          }}
        >
          {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')} / 1:30
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {steps.map((step, i) => {
            const iconBg = step.status === 'done' ? '#1a2a1a' : step.status === 'active' ? '#2a2a1a' : '#151515';
            const textColor = step.status === 'done' ? '#ccc' : step.status === 'active' ? '#fff' : '#444';
            const subColor = step.status === 'done' ? '#4a7a4a' : step.status === 'active' ? '#857530' : '#333';
            return (
              <div key={i}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0' }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: iconBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      flexShrink: 0,
                      animation: step.status === 'active' ? 'gsPulse 2s ease-in-out infinite' : 'none',
                    }}
                  >
                    {step.status === 'done' ? (
                      <span style={{ color: '#4ade80', fontSize: 12 }}>✓</span>
                    ) : step.status === 'active' ? (
                      <span style={{ color: '#f59e0b' }}>{step.icon}</span>
                    ) : (
                      <span style={{ color: '#333', fontSize: 9 }}>○</span>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: textColor, fontWeight: step.status === 'active' ? 500 : 400 }}>
                      {step.label}
                    </div>
                    {step.status === 'done' && <div style={{ fontSize: 10, color: subColor }}>Abgeschlossen</div>}
                    {step.status === 'active' && <div style={{ fontSize: 10, color: subColor }}>Läuft...</div>}
                  </div>
                </div>
                {i < steps.length - 1 && <div style={{ borderTop: '0.5px solid #1a1a1a', marginLeft: 42 }} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: 20 }}>
        <div style={{ fontSize: 13, color: '#555', marginBottom: 14 }}>
          Leads erscheinen automatisch in deiner Übersicht
        </div>
        <div
          style={{
            opacity: showButton ? 1 : 0,
            transition: 'opacity 0.5s ease',
            pointerEvents: showButton ? 'auto' : 'none',
          }}
        >
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
    </div>
  );
}
