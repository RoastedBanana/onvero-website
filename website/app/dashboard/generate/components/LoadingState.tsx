'use client';

import { useState, useEffect } from 'react';

const MESSAGES = [
  'Suchkriterien werden analysiert...',
  'Suchanfrage wird verfeinert...',
  'Strategie wird entwickelt...',
  'Suchanfrage wird optimiert...',
];

export default function LoadingState() {
  const [idx, setIdx] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const t = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIdx((i) => (i + 1) % MESSAGES.length);
        setFade(true);
      }, 300);
    }, 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>
      <div
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '0.5px solid rgba(255,255,255,0.05)',
          borderRadius: 14,
          padding: 40,
          minHeight: 320,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
        }}
      >
        <style>{`
          @keyframes lsSpin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
        `}</style>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            border: '2.5px solid rgba(255,255,255,0.06)',
            borderTopColor: 'rgba(255,255,255,0.3)',
            animation: 'lsSpin 0.8s linear infinite',
          }}
        />
        <div
          style={{
            fontSize: 14,
            color: '#999',
            transition: 'opacity 0.3s ease',
            opacity: fade ? 1 : 0,
            textAlign: 'center',
            fontFamily: 'var(--font-dm-sans)',
          }}
        >
          {MESSAGES[idx]}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {MESSAGES.map((_, i) => (
            <div
              key={i}
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: i === idx ? '#888' : '#222',
                transition: 'background 0.3s ease',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
