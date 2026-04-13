'use client';

import { useState, useSyncExternalStore, useCallback } from 'react';
import Link from 'next/link';

const CONSENT_KEY = 'onvero_cookie_consent';

type ConsentState = 'pending' | 'accepted' | 'rejected';

function getConsentSnapshot(): ConsentState {
  if (typeof window === 'undefined') return 'accepted';
  const stored = localStorage.getItem(CONSENT_KEY);
  if (!stored) return 'pending';
  return stored as ConsentState;
}

function getServerSnapshot(): ConsentState {
  return 'accepted'; // hidden on server
}

function subscribeToConsent(callback: () => void) {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

export function CookieConsent() {
  const state = useSyncExternalStore(subscribeToConsent, getConsentSnapshot, getServerSnapshot);
  const [, forceUpdate] = useState(0);

  const accept = useCallback(() => {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    forceUpdate((n) => n + 1);
    window.dispatchEvent(new Event('storage'));
  }, []);

  const reject = useCallback(() => {
    localStorage.setItem(CONSENT_KEY, 'rejected');
    forceUpdate((n) => n + 1);
    window.dispatchEvent(new Event('storage'));
  }, []);

  if (state !== 'pending') return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        padding: '1.25rem 1.5rem',
        background: 'rgba(15, 15, 15, 0.97)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        <div style={{ maxWidth: 680 }}>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.84rem', lineHeight: 1.6, margin: 0 }}>
            Wir verwenden technisch notwendige Cookies für die Grundfunktion der Website. Mit &quot;Alle
            akzeptieren&quot; erlauben Sie zusätzlich die Nutzung von{' '}
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Plausible Analytics</strong> zur anonymen Auswertung der
            Website-Nutzung (keine personenbezogenen Daten, keine Tracking-Cookies).
          </p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', margin: '0.4rem 0 0 0' }}>
            Mehr dazu in unserer{' '}
            <Link href="/datenschutz" style={{ color: '#818cf8', textDecoration: 'underline' }}>
              Datenschutzerklärung
            </Link>
            .
          </p>
        </div>
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
    </div>
  );
}

/** Check if the user has accepted cookies (for analytics etc.) */
export function hasConsent(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(CONSENT_KEY) === 'accepted';
}
