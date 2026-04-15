'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Lock, Eye, EyeOff, User, Mail, Check, X, Loader2 } from 'lucide-react';
import { OnveroLogo } from '@/components/ui/onvero-logo';

function JoinForm() {
  const params = useSearchParams();
  const token = params.get('token') || '';

  type PageState =
    | { kind: 'loading' }
    | { kind: 'error'; message: string }
    | { kind: 'form'; tenant_name: string }
    | { kind: 'submitting'; tenant_name: string }
    | { kind: 'success'; tenant_name: string };

  const [state, setState] = useState<PageState>({ kind: 'loading' });
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
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
      .then((r) => r.json())
      .then((data) => {
        if (data.valid) {
          setState({ kind: 'form', tenant_name: data.tenant_name || 'Unternehmen' });
          // If invite has a preset email, prefill it
          if (data.email && data.email !== 'pending') setEmail(data.email);
        } else {
          const messages: Record<string, string> = {
            already_used: 'Dieser Einladungslink wurde bereits verwendet.',
            expired: 'Dieser Einladungslink ist abgelaufen. Bitte fordere einen neuen an.',
            not_found: 'Ungültiger Einladungslink.',
          };
          setState({ kind: 'error', message: messages[data.reason] || messages.not_found });
        }
      })
      .catch(() => {
        setState({ kind: 'error', message: 'Verbindungsfehler. Bitte erneut versuchen.' });
      });
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setFormError('Bitte gib eine gültige E-Mail ein.');
      return;
    }
    if (!name.trim()) {
      setFormError('Bitte gib deinen Namen ein.');
      return;
    }
    if (password.length < 8) {
      setFormError('Mindestens 8 Zeichen.');
      return;
    }
    if (password !== confirm) {
      setFormError('Passwörter stimmen nicht überein.');
      return;
    }
    if (state.kind !== 'form') return;

    const { tenant_name } = state;
    setState({ kind: 'submitting', tenant_name });

    try {
      const res = await fetch('/api/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, displayName: name.trim(), email: trimmedEmail }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Fehler beim Erstellen des Kontos.');
        setState({ kind: 'form', tenant_name });
        return;
      }

      // Auto-login
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, password, firstName: name.trim() }),
      });

      if (!loginRes.ok) {
        setFormError('Konto erstellt! Bitte logge dich manuell ein.');
        setState({ kind: 'form', tenant_name });
        return;
      }

      setState({ kind: 'success', tenant_name });
      setTimeout(() => {
        window.location.href = '/sales';
      }, 1500);
    } catch {
      setFormError('Netzwerkfehler. Bitte erneut versuchen.');
      setState({ kind: 'form', tenant_name: tenantName });
    }
  }

  const tenantName = 'tenant_name' in state ? state.tenant_name : '';
  const isSubmitting = state.kind === 'submitting';

  if (state.kind === 'loading') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080810] p-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4">
          <Loader2 className="h-7 w-7 animate-spin text-neutral-400" />
          <p className="text-sm text-neutral-500">Einladung wird geprüft...</p>
        </motion.div>
      </main>
    );
  }

  if (state.kind === 'error') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080810] p-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-4 text-center max-w-sm"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
            <X className="h-6 w-6 text-red-400" />
          </div>
          <p className="text-lg font-semibold text-white">Link ungültig</p>
          <p className="text-sm text-neutral-400">{state.message}</p>
          <a href="/login" className="text-sm text-indigo-400 hover:text-indigo-300 mt-2">
            Zum Login →
          </a>
        </motion.div>
      </main>
    );
  }

  if (state.kind === 'success') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080810] p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="flex flex-col items-center gap-4 text-center"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
            <Check className="h-7 w-7 text-emerald-400" />
          </div>
          <p className="text-xl font-semibold text-white">Willkommen bei {tenantName}!</p>
          <p className="text-sm text-neutral-400">Du wirst weitergeleitet...</p>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#080810] p-6">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <OnveroLogo className="h-10 w-auto" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="w-full max-w-md"
      >
        <Card className="rounded-2xl border-0 bg-[#111113] text-white shadow-2xl">
          <div className="p-6 sm:p-8">
            <div className="text-center mb-6">
              <h1 className="text-xl font-semibold">Konto erstellen</h1>
              <p className="text-sm text-neutral-400 mt-1">
                Tritt <span className="text-white font-medium">{tenantName}</span> bei
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex h-11 items-center gap-3 rounded-xl bg-white/10 px-4 border border-white/10">
                <Mail className="h-4 w-4 shrink-0 text-neutral-400" />
                <input
                  type="email"
                  placeholder="Deine E-Mail-Adresse"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent text-sm text-white placeholder-neutral-500 outline-none"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="flex h-11 items-center gap-3 rounded-xl bg-white/10 px-4 border border-white/10">
                <User className="h-4 w-4 shrink-0 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Dein Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-transparent text-sm text-white placeholder-neutral-500 outline-none"
                  autoComplete="name"
                  required
                />
              </div>

              <div className="flex h-11 items-center gap-3 rounded-xl bg-white/10 px-4 border border-white/10">
                <Lock className="h-4 w-4 shrink-0 text-neutral-400" />
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Passwort (min. 8 Zeichen)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent text-sm text-white placeholder-neutral-500 outline-none"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="shrink-0 text-neutral-500 hover:text-neutral-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <div className="flex h-11 items-center gap-3 rounded-xl bg-white/10 px-4 border border-white/10">
                <Lock className="h-4 w-4 shrink-0 text-neutral-400" />
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Passwort bestätigen"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full bg-transparent text-sm text-white placeholder-neutral-500 outline-none"
                  autoComplete="new-password"
                  required
                />
              </div>

              {formError && <p className="text-center text-sm text-red-400">{formError}</p>}

              <Button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  'h-11 w-full rounded-xl bg-white text-black font-semibold hover:bg-white/90 transition-all text-sm mt-2',
                  isSubmitting && 'opacity-70 cursor-not-allowed'
                )}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Wird erstellt...
                  </>
                ) : (
                  'Konto erstellen →'
                )}
              </Button>
            </form>
          </div>
        </Card>
      </motion.div>
    </main>
  );
}

export default function JoinPage() {
  return (
    <Suspense>
      <JoinForm />
    </Suspense>
  );
}
