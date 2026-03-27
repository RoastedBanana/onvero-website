'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { OnveroLogo } from '@/components/ui/onvero-logo';

function LoginForm() {
  const searchParams = useSearchParams();

  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // Note: "already logged in" redirect is handled server-side in proxy.ts

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.email || !form.password || !form.firstName || !form.lastName) {
      setError('Bitte alle Felder ausfüllen.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Anmeldung fehlgeschlagen.');
        setLoading(false);
        return;
      }

      const dest = searchParams.get('from') || '/dashboard';
      // Hard navigation: forces a fresh HTTP request so the proxy sees
      // the newly set onvero_jwt cookie correctly.
      // Do NOT reset loading state — keep spinner until the page unloads.
      window.location.href = dest;
    } catch {
      setError('Netzwerkfehler. Bitte erneut versuchen.');
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 10,
    color: '#fff',
    fontSize: '0.9rem',
    padding: '0.75rem 1rem',
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: '#0f0f0f',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      {/* Card */}
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 18,
          padding: '2.5rem',
        }}
      >
        {/* Logo */}
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
          <Link href="/">
            <OnveroLogo className="h-8 w-auto" />
          </Link>
        </div>

        <h1
          style={{
            color: '#fff',
            fontWeight: 700,
            fontSize: '1.4rem',
            marginBottom: '0.35rem',
            textAlign: 'center',
          }}
        >
          Anmelden
        </h1>
        <p
          style={{
            color: 'rgba(255,255,255,0.35)',
            fontSize: '0.85rem',
            textAlign: 'center',
            marginBottom: '2rem',
          }}
        >
          Melde dich an, um das Dashboard zu nutzen.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {/* Row: Vorname + Nachname */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginBottom: '0.35rem' }}>
                Vorname
              </label>
              <input
                type="text"
                placeholder="Jan"
                value={form.firstName}
                onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)')}
                autoComplete="given-name"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginBottom: '0.35rem' }}>
                Nachname
              </label>
              <input
                type="text"
                placeholder="Fahlbusch"
                value={form.lastName}
                onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)')}
                autoComplete="family-name"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginBottom: '0.35rem' }}>
              E-Mail
            </label>
            <input
              type="email"
              placeholder="info@onvero.de"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              style={inputStyle}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)')}
              autoComplete="email"
            />
          </div>

          {/* Password */}
          <div>
            <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginBottom: '0.35rem' }}>
              Passwort
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              style={inputStyle}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)')}
              autoComplete="current-password"
            />
          </div>

          {/* Error */}
          {error && (
            <p style={{ color: '#ff6b6b', fontSize: '0.8rem', textAlign: 'center' }}>{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '0.5rem',
              width: '100%',
              background: '#fff',
              color: '#0f0f0f',
              fontWeight: 700,
              fontSize: '0.9rem',
              border: 'none',
              borderRadius: 10,
              padding: '0.8rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'opacity 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            {loading ? (
              <>
                <svg
                  style={{ animation: 'spin 0.8s linear infinite', width: 16, height: 16 }}
                  viewBox="0 0 24 24" fill="none"
                >
                  <circle cx="12" cy="12" r="10" stroke="rgba(0,0,0,0.2)" strokeWidth="3" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="#0f0f0f" strokeWidth="3" strokeLinecap="round" />
                </svg>
                Anmelden…
              </>
            ) : (
              'Anmelden →'
            )}
          </button>
        </form>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
