'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

/* ------------------------------------------------------------------ */
/*  Supabase client (browser)                                         */
/* ------------------------------------------------------------------ */
function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

/* ------------------------------------------------------------------ */
/*  Inline Onvero logo (white, matches OnveroLogo component)          */
/* ------------------------------------------------------------------ */
function Logo({ className = '' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 542.48 138.5"
      className={className}
      aria-label="Onvero"
      fill="white"
    >
      <circle cx="45.26" cy="112.99" r="9.05" />
      <circle cx="9.2" cy="76.63" r="9.2" />
      <line x1="38.88" y1="106.37" x2="15.56" y2="83.27" fill="none" stroke="white" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="8" />
      <line x1="56.82" y1="28.62" x2="15.43" y2="69.87" fill="none" stroke="white" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="8" />
      <path d="M84.75,12.19c-5.44-1.79-9.74-6.09-11.54-11.53-.13-.39-.5-.66-.91-.66h0c-.41,0-.78.26-.91.66-1.79,5.43-6.07,9.72-11.49,11.52-.27.09-.5.27-.61.53-.23.54.05,1.14.56,1.31,5.44,1.79,9.74,6.09,11.54,11.53.13.39.5.66.91.66h0c.41,0-.78-.26.91-.66,1.79-5.43,6.07-9.72,11.49-11.52.27-.09.5-.27.61-.53.23-.54-.05-1.14-.56-1.31Z" />
      <circle cx="532.31" cy="91.53" r="10.17" />
      <text
        style={{ fontFamily: "TimesNewRomanPSMT, 'Times New Roman', Times, serif", fontSize: '120px', letterSpacing: '0.04em', isolation: 'isolate' }}
        transform="translate(121.88 101.7)"
      >
        Onvero
      </text>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  CSS keyframes (injected once via <style>)                         */
/* ------------------------------------------------------------------ */
const animationCSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap');

@keyframes joinFadeUp {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes joinScale {
  from { opacity: 0; transform: scale(0.92); }
  to   { opacity: 1; transform: scale(1); }
}
@keyframes joinSparkle {
  0%, 100% { opacity: 0.3; transform: scale(0.8) rotate(0deg); }
  50%      { opacity: 1;   transform: scale(1.1) rotate(8deg); }
}
@keyframes joinGlow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(240,239,234,0); }
  50%      { box-shadow: 0 0 40px 4px rgba(240,239,234,0.06); }
}
@keyframes joinSpin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
@keyframes joinCheckmark {
  from { stroke-dashoffset: 24; }
  to   { stroke-dashoffset: 0; }
}
`;

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */
type PageState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'form'; email: string; tenant_id: string }
  | { kind: 'submitting'; email: string; tenant_id: string }
  | { kind: 'success' };

/* ------------------------------------------------------------------ */
/*  Main form component                                               */
/* ------------------------------------------------------------------ */
function JoinForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') || '';

  const [state, setState] = useState<PageState>({ kind: 'loading' });
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [formError, setFormError] = useState('');

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setState({ kind: 'error', message: 'Kein Einladungs-Token gefunden.' });
      return;
    }

    fetch('/api/validate-invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.valid) {
          setState({ kind: 'form', email: data.email, tenant_id: data.tenant_id });
        } else {
          const messages: Record<string, string> = {
            already_used: 'Dieser Link wurde bereits verwendet.',
            expired: 'Dieser Link ist abgelaufen.',
            not_found: 'Ungültiger Einladungslink.',
          };
          setState({ kind: 'error', message: messages[data.reason] || messages.not_found });
        }
      })
      .catch(() => {
        setState({ kind: 'error', message: 'Verbindungsfehler. Bitte erneut versuchen.' });
      });
  }, [token]);

  // Submit handler
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');

    if (password.length < 8) {
      setFormError('Mindestens 8 Zeichen.');
      return;
    }
    if (password !== confirm) {
      setFormError('Passwörter stimmen nicht überein.');
      return;
    }

    if (state.kind !== 'form') return;
    const { email, tenant_id } = state;
    setState({ kind: 'submitting', email, tenant_id });

    try {
      const res = await fetch('/api/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || 'Fehler beim Erstellen des Kontos.');
        setState({ kind: 'form', email, tenant_id });
        return;
      }

      // Auto-login
      const supabase = getSupabase();
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });

      if (loginError) {
        setFormError('Konto erstellt, aber Anmeldung fehlgeschlagen. Bitte manuell einloggen.');
        setState({ kind: 'form', email, tenant_id });
        return;
      }

      setState({ kind: 'success' });
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1500);
    } catch {
      setFormError('Netzwerkfehler. Bitte erneut versuchen.');
      setState({ kind: 'form', email, tenant_id });
    }
  }

  /* ---- Shared styles ---- */
  const colors = {
    bg: '#080810',
    card: '#111119',
    border: '#1f1f2e',
    text: '#f0efea',
    muted: '#9898a8',
    error: '#ff6b6b',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${colors.border}`,
    borderRadius: 10,
    color: colors.text,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '0.9rem',
    padding: '0.75rem 1rem',
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  /* ---- Render ---- */
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: animationCSS }} />

      <main
        style={{
          minHeight: '100vh',
          background: colors.bg,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {/* Card */}
        <div
          style={{
            width: '100%',
            maxWidth: 440,
            background: colors.card,
            border: `1px solid ${colors.border}`,
            borderRadius: 20,
            padding: '2.5rem',
            animation: 'joinScale 0.6s ease-out both',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle glow pulse */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 20,
              animation: 'joinGlow 4s ease-in-out infinite',
              pointerEvents: 'none',
            }}
          />

          {/* Logo */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '1.75rem',
              animation: 'joinFadeUp 0.6s ease-out 0.1s both',
            }}
          >
            <Logo className="h-8 w-auto" />
          </div>

          {/* ---- LOADING STATE ---- */}
          {state.kind === 'loading' && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1rem',
                padding: '2rem 0',
                animation: 'joinFadeUp 0.4s ease-out both',
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  border: `2px solid ${colors.border}`,
                  borderTopColor: colors.text,
                  borderRadius: '50%',
                  animation: 'joinSpin 0.8s linear infinite',
                }}
              />
              <p style={{ color: colors.muted, fontSize: '0.85rem' }}>Einladung wird geprüft...</p>
            </div>
          )}

          {/* ---- ERROR STATE ---- */}
          {state.kind === 'error' && (
            <div
              style={{
                textAlign: 'center',
                padding: '1.5rem 0',
                animation: 'joinFadeUp 0.5s ease-out both',
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'rgba(255,107,107,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem',
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={colors.error} strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </div>
              <p style={{ color: colors.text, fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                Link ungültig
              </p>
              <p style={{ color: colors.muted, fontSize: '0.85rem' }}>{state.message}</p>
            </div>
          )}

          {/* ---- SUCCESS STATE ---- */}
          {state.kind === 'success' && (
            <div
              style={{
                textAlign: 'center',
                padding: '1.5rem 0',
                animation: 'joinFadeUp 0.5s ease-out both',
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: 'rgba(74,222,128,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem',
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline
                    points="20 6 9 17 4 12"
                    style={{ strokeDasharray: 24, animation: 'joinCheckmark 0.4s ease-out 0.2s both' }}
                  />
                </svg>
              </div>
              <p
                style={{
                  color: colors.text,
                  fontFamily: "'DM Serif Display', serif",
                  fontSize: '1.25rem',
                  marginBottom: '0.5rem',
                }}
              >
                Willkommen an Bord!
              </p>
              <p style={{ color: colors.muted, fontSize: '0.85rem' }}>Du wirst weitergeleitet...</p>
            </div>
          )}

          {/* ---- FORM STATE ---- */}
          {(state.kind === 'form' || state.kind === 'submitting') && (
            <div style={{ animation: 'joinFadeUp 0.6s ease-out 0.2s both' }}>
              {/* Headline */}
              <h1
                style={{
                  color: colors.text,
                  fontFamily: "'DM Serif Display', serif",
                  fontWeight: 400,
                  fontSize: '1.5rem',
                  textAlign: 'center',
                  marginBottom: '0.35rem',
                  lineHeight: 1.3,
                }}
              >
                Willkommen bei{' '}
                <em style={{ fontStyle: 'italic' }}>BusinessOS.</em>
              </h1>
              <p
                style={{
                  color: colors.muted,
                  fontSize: '0.85rem',
                  textAlign: 'center',
                  marginBottom: '2rem',
                  lineHeight: 1.5,
                }}
              >
                Lege jetzt dein Passwort fest, um deinen Zugang zu aktivieren.
              </p>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {/* Email (read-only) */}
                <div>
                  <label style={{ display: 'block', color: colors.muted, fontSize: '0.75rem', marginBottom: '0.35rem' }}>
                    E-Mail
                  </label>
                  <input
                    type="email"
                    value={state.email}
                    readOnly
                    style={{ ...inputStyle, opacity: 0.6, cursor: 'not-allowed' }}
                    tabIndex={-1}
                  />
                </div>

                {/* Password */}
                <div>
                  <label style={{ display: 'block', color: colors.muted, fontSize: '0.75rem', marginBottom: '0.35rem' }}>
                    Passwort
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPw ? 'text' : 'password'}
                      placeholder="Mindestens 8 Zeichen"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      style={{ ...inputStyle, paddingRight: '2.75rem' }}
                      onFocus={e => (e.currentTarget.style.borderColor = 'rgba(240,239,234,0.25)')}
                      onBlur={e => (e.currentTarget.style.borderColor = colors.border)}
                      autoComplete="new-password"
                      minLength={8}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(v => !v)}
                      style={{
                        position: 'absolute',
                        right: 10,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: colors.muted,
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        padding: '0.25rem',
                      }}
                      tabIndex={-1}
                      aria-label={showPw ? 'Passwort verbergen' : 'Passwort anzeigen'}
                    >
                      {showPw ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                          <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm password */}
                <div>
                  <label style={{ display: 'block', color: colors.muted, fontSize: '0.75rem', marginBottom: '0.35rem' }}>
                    Passwort bestätigen
                  </label>
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="Passwort wiederholen"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = 'rgba(240,239,234,0.25)')}
                    onBlur={e => (e.currentTarget.style.borderColor = colors.border)}
                    autoComplete="new-password"
                    required
                  />
                </div>

                {/* Error */}
                {formError && (
                  <p style={{ color: colors.error, fontSize: '0.8rem', textAlign: 'center' }}>{formError}</p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={state.kind === 'submitting'}
                  style={{
                    marginTop: '0.5rem',
                    width: '100%',
                    background: colors.text,
                    color: '#0a0a0f',
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    border: 'none',
                    borderRadius: 10,
                    padding: '0.8rem',
                    cursor: state.kind === 'submitting' ? 'not-allowed' : 'pointer',
                    opacity: state.kind === 'submitting' ? 0.7 : 1,
                    transition: 'opacity 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                  }}
                >
                  {state.kind === 'submitting' ? (
                    <>
                      <div
                        style={{
                          width: 16,
                          height: 16,
                          border: '2px solid rgba(10,10,15,0.3)',
                          borderTopColor: '#0a0a0f',
                          borderRadius: '50%',
                          animation: 'joinSpin 0.8s linear infinite',
                        }}
                      />
                      Konto wird erstellt...
                    </>
                  ) : (
                    'Konto aktivieren \u2192'
                  )}
                </button>
              </form>

              {/* Footer note */}
              <p
                style={{
                  color: colors.muted,
                  fontSize: '0.72rem',
                  textAlign: 'center',
                  marginTop: '1.25rem',
                  opacity: 0.7,
                }}
              >
                Dieser Link ist 24 Stunden gültig.
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Page export (Suspense boundary for useSearchParams)               */
/* ------------------------------------------------------------------ */
export default function JoinPage() {
  return (
    <Suspense>
      <JoinForm />
    </Suspense>
  );
}
