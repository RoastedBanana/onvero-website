'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const CONSENT_KEY = 'onvero_cookie_consent';

type ConsentState = 'pending' | 'accepted' | 'rejected';

export function CookieConsent() {
  const [state, setState] = useState<ConsentState>('accepted'); // default hidden
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) {
      setState('pending');
    } else {
      setState(stored as ConsentState);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    setState('accepted');
  };

  const reject = () => {
    localStorage.setItem(CONSENT_KEY, 'rejected');
    setState('rejected');
  };

  if (!mounted || state !== 'pending') return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        padding: '1rem 1.5rem',
        background: 'rgba(15, 15, 15, 0.97)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
      }}
    >
      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem', lineHeight: 1.5, maxWidth: 680, margin: 0 }}>
        Wir verwenden technisch notwendige Cookies, um die Website funktionsfähig zu halten.
        Weitere Informationen findest du in unserer{' '}
        <Link href="/datenschutz" style={{ color: '#818cf8', textDecoration: 'underline' }}>
          Datenschutzerklärung
        </Link>.
      </p>
      <div style={{ display: 'flex', gap: '0.6rem', flexShrink: 0 }}>
        <button
          onClick={reject}
          style={{
            background: 'none',
            border: '1px solid rgba(255,255,255,0.12)',
            color: 'rgba(255,255,255,0.5)',
            borderRadius: 8,
            padding: '0.5rem 1rem',
            fontSize: '0.82rem',
            cursor: 'pointer',
          }}
        >
          Nur notwendige
        </button>
        <button
          onClick={accept}
          style={{
            background: '#fff',
            border: 'none',
            color: '#0f0f0f',
            borderRadius: 8,
            padding: '0.5rem 1.2rem',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Alle akzeptieren
        </button>
      </div>
    </div>
  );
}

/** Check if the user has accepted cookies (for analytics etc.) */
export function hasConsent(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(CONSENT_KEY) === 'accepted';
}
