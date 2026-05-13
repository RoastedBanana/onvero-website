'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Bitte E-Mail und Passwort eingeben.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Anmeldung fehlgeschlagen.');
        setLoading(false);
        return;
      }

      const raw = searchParams.get('from') || '/intelligence';
      const dest = raw.startsWith('/') && !raw.startsWith('//') ? raw : '/intelligence';
      window.location.href = dest;
    } catch {
      setError('Netzwerkfehler. Bitte erneut versuchen.');
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 10,
    color: '#fff',
    fontSize: '0.9rem',
    padding: '0.75rem 1rem',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: '#0A2540',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        fontFamily: 'var(--font-nunito), -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 400,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 18,
          padding: '2.5rem',
        }}
      >
        {/* Logo */}
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>onvero</div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: '#818CF8',
              marginTop: 2,
            }}
          >
            Intelligence
          </div>
        </div>

        <h1
          style={{
            color: '#fff',
            fontWeight: 700,
            fontSize: '1.3rem',
            marginBottom: '0.25rem',
            textAlign: 'center',
          }}
        >
          Anmelden
        </h1>
        <p
          style={{
            color: 'rgba(255,255,255,0.4)',
            fontSize: '0.85rem',
            textAlign: 'center',
            marginBottom: '2rem',
          }}
        >
          Willkommen zurück
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label
              style={{
                display: 'block',
                color: 'rgba(255,255,255,0.5)',
                fontSize: '0.75rem',
                fontWeight: 600,
                marginBottom: '0.4rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              E-Mail
            </label>
            <input
              type="email"
              placeholder="name@firma.de"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(129,140,248,0.6)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}
              autoComplete="email"
              autoFocus
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                color: 'rgba(255,255,255,0.5)',
                fontSize: '0.75rem',
                fontWeight: 600,
                marginBottom: '0.4rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Passwort
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(129,140,248,0.6)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p
              style={{
                color: '#FCA5A5',
                fontSize: '0.8rem',
                textAlign: 'center',
                margin: 0,
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 8,
                padding: '0.5rem 0.75rem',
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '0.25rem',
              width: '100%',
              background: loading ? 'rgba(79,70,229,0.6)' : '#4F46E5',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.9rem',
              border: 'none',
              borderRadius: 10,
              padding: '0.85rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
              fontFamily: 'inherit',
            }}
          >
            {loading ? 'Anmelden…' : 'Anmelden →'}
          </button>

          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', textAlign: 'center', margin: 0 }}>
            Passwort vergessen? Kontaktiere deinen Admin.
          </p>
        </form>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
