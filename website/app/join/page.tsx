'use client';

import { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { createBrowserClient } from '@supabase/ssr';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Clock, Lock, Eye, EyeOff, Pencil, Zap, Camera, Check, X, Loader2 } from 'lucide-react';
import { OnveroLogo } from '@/components/ui/onvero-logo';

/* ------------------------------------------------------------------ */
/*  Supabase client                                                    */
/* ------------------------------------------------------------------ */
function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
type PageState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'form'; email: string; tenant_id: string; tenant_name: string; tenant_logo: string | null }
  | { kind: 'submitting'; email: string; tenant_id: string; tenant_name: string; tenant_logo: string | null }
  | { kind: 'success' };

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */
function JoinForm() {
  const params = useSearchParams();
  const token = params.get('token') || '';

  const [state, setState] = useState<PageState>({ kind: 'loading' });
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formError, setFormError] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  const timeText = useMemo(() => {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes().toString().padStart(2, '0');
    const hour12 = ((h + 11) % 12) + 1;
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${hour12}:${m} ${ampm}`;
  }, []);

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
          setState({
            kind: 'form',
            email: data.email,
            tenant_id: data.tenant_id,
            tenant_name: data.tenant_name || 'Unternehmen',
            tenant_logo: data.tenant_logo || null,
          });
          setDisplayName(data.email.split('@')[0]);
          if (data.tenant_logo) setLogoPreview(data.tenant_logo);
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

  // Focus name input when editing
  useEffect(() => {
    if (editingName) nameRef.current?.focus();
  }, [editingName]);

  // Handle logo file pick
  function handleLogoPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  // Upload logo to Supabase storage and update tenant
  async function uploadLogo(tenantId: string) {
    if (!logoFile) return;
    const supabase = getSupabase();
    const ext = logoFile.name.split('.').pop();
    const path = `tenant-logos/${tenantId}.${ext}`;

    await supabase.storage.from('tenant-logos').upload(path, logoFile, { upsert: true });
    const { data } = supabase.storage.from('tenant-logos').getPublicUrl(path);

    if (data?.publicUrl) {
      await supabase.from('tenants').update({ logo_url: data.publicUrl }).eq('id', tenantId);
    }
  }

  // Submit
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

    const { email, tenant_id, tenant_name, tenant_logo } = state;
    setState({ kind: 'submitting', email, tenant_id, tenant_name, tenant_logo });

    try {
      const res = await fetch('/api/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, displayName }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || 'Fehler beim Erstellen des Kontos.');
        setState({ kind: 'form', email, tenant_id, tenant_name, tenant_logo });
        return;
      }

      // Auto-login
      const supabase = getSupabase();
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });

      if (loginError) {
        setFormError('Konto erstellt, aber Anmeldung fehlgeschlagen. Bitte manuell einloggen.');
        setState({ kind: 'form', email, tenant_id, tenant_name, tenant_logo });
        return;
      }

      // Upload logo if changed
      if (logoFile) {
        await uploadLogo(tenant_id);
      }

      setState({ kind: 'success' });
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1800);
    } catch {
      setFormError('Netzwerkfehler. Bitte erneut versuchen.');
      setState({ kind: 'form', email, tenant_id, tenant_name, tenant_logo });
    }
  }

  const tenantName = (state.kind === 'form' || state.kind === 'submitting') ? state.tenant_name : '';
  const initial = tenantName.charAt(0).toUpperCase() || 'O';
  const isSubmitting = state.kind === 'submitting';

  /* ---- LOADING ---- */
  if (state.kind === 'loading') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080810] p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="h-7 w-7 animate-spin text-neutral-400" />
          <p className="text-sm text-neutral-500">Einladung wird geprüft...</p>
        </motion.div>
      </main>
    );
  }

  /* ---- ERROR ---- */
  if (state.kind === 'error') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080810] p-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-4 text-center"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
            <X className="h-6 w-6 text-red-400" />
          </div>
          <p className="text-lg font-semibold text-white">Link ungültig</p>
          <p className="text-sm text-neutral-400">{state.message}</p>
        </motion.div>
      </main>
    );
  }

  /* ---- SUCCESS ---- */
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
          <p className="text-xl font-semibold text-white">Willkommen an Bord!</p>
          <p className="text-sm text-neutral-400">Du wirst zum Dashboard weitergeleitet...</p>
        </motion.div>
      </main>
    );
  }

  /* ---- FORM (profile-card style) ---- */
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#080810] p-6">
      {/* Onvero Logo */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="mb-8"
      >
        <OnveroLogo className="h-10 w-auto" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
        className="relative w-full max-w-xl"
      >
        {/* Blue-purple glow underneath */}
        <div className="pointer-events-none absolute inset-x-0 -bottom-10 top-[72%] z-0 rounded-[28px] bg-indigo-500/80 blur-0 shadow-[0_40px_80px_-16px_rgba(99,102,241,0.75)]" />

        {/* Glow text below card */}
        <div className="absolute inset-x-0 -bottom-10 z-0 mx-auto w-full">
          <div className="flex items-center justify-center gap-2 bg-transparent py-3 text-center text-sm font-medium text-white">
            <Zap className="h-4 w-4" /> enjoy your ai - Business Journey
          </div>
        </div>

        <Card className="relative z-10 mx-auto w-full overflow-visible rounded-[28px] border-0 bg-[radial-gradient(120%_120%_at_30%_10%,#1a1a1a_0%,#0f0f10_60%,#0b0b0c_100%)] text-white shadow-2xl">
          <div className="p-6 sm:p-8">
            {/* Status bar */}
            <div className="mb-6 flex items-center justify-between text-sm text-neutral-300">
              <div className="flex items-center gap-2">
                <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-indigo-400" />
                <span className="select-none">Einladung aktiv</span>
              </div>
              <div className="flex items-center gap-2 opacity-80">
                <Clock className="h-4 w-4" />
                <span className="tabular-nums">{timeText}</span>
              </div>
            </div>

            {/* Avatar + Company name */}
            <div className="flex flex-wrap items-center gap-5">
              {/* Company avatar — initial letter or uploaded logo */}
              <div className="group relative">
                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full ring-2 ring-white/10">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt={`${tenantName} logo`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-600 to-violet-600 text-xl font-bold text-white">
                      {initial}
                    </div>
                  )}
                  {/* Upload overlay */}
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label="Logo hochladen"
                  >
                    <Camera className="h-5 w-5 text-white" />
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoPick}
                  />
                </div>
              </div>

              <div className="min-w-0">
                <h3 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">
                  {tenantName}
                </h3>
                {/* Editable display name */}
                <div className="mt-0.5 flex items-center gap-1.5">
                  {editingName ? (
                    <input
                      ref={nameRef}
                      type="text"
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      onBlur={() => setEditingName(false)}
                      onKeyDown={e => { if (e.key === 'Enter') setEditingName(false); }}
                      className="w-full bg-transparent text-sm text-neutral-400 outline-none ring-0 border-b border-neutral-600 focus:border-indigo-400 transition-colors"
                      placeholder="Dein Name"
                    />
                  ) : (
                    <>
                      <p className="text-sm text-neutral-400">{displayName || 'Dein Name'}</p>
                      <button
                        type="button"
                        onClick={() => setEditingName(true)}
                        className="text-neutral-500 hover:text-neutral-300 transition-colors"
                        aria-label="Namen bearbeiten"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Password fields */}
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {/* Email (read-only) */}
              <div className="flex h-12 items-center gap-3 rounded-2xl bg-white/5 px-4">
                <span className="text-sm text-neutral-500 select-none">E-Mail</span>
                <span className="text-sm text-neutral-300">{state.email}</span>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Password */}
                <div className="relative">
                  <div className="flex h-12 items-center gap-3 rounded-2xl bg-white/10 px-4">
                    <Lock className="h-4 w-4 shrink-0 text-neutral-400" />
                    <input
                      type={showPw ? 'text' : 'password'}
                      placeholder="Passwort"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full bg-transparent text-sm text-white placeholder-neutral-500 outline-none"
                      autoComplete="new-password"
                      minLength={8}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(v => !v)}
                      className="shrink-0 text-neutral-500 hover:text-neutral-300 transition-colors"
                      tabIndex={-1}
                    >
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm */}
                <div className="relative">
                  <div className="flex h-12 items-center gap-3 rounded-2xl bg-white/10 px-4">
                    <Lock className="h-4 w-4 shrink-0 text-neutral-400" />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Bestätigen"
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      className="w-full bg-transparent text-sm text-white placeholder-neutral-500 outline-none"
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(v => !v)}
                      className="shrink-0 text-neutral-500 hover:text-neutral-300 transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Error */}
              {formError && (
                <p className="text-center text-sm text-red-400">{formError}</p>
              )}

              {/* Submit */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  'h-12 w-full rounded-2xl bg-white text-black font-semibold hover:bg-white/90 transition-all text-sm',
                  isSubmitting && 'opacity-70 cursor-not-allowed',
                )}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Konto wird erstellt...
                  </>
                ) : (
                  'Konto aktivieren \u2192'
                )}
              </Button>

              <p className="text-center text-xs text-neutral-600">
                Dieser Link ist 24 Stunden gültig.
              </p>
            </form>
          </div>
        </Card>
      </motion.div>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/*  Export                                                              */
/* ------------------------------------------------------------------ */
export default function JoinPage() {
  return (
    <Suspense>
      <JoinForm />
    </Suspense>
  );
}
