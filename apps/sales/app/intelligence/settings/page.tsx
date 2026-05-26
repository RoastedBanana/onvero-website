'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTheme, colors } from '../layout';

// ─── Konstanten ───────────────────────────────────────────────────────────────

const STORAGE_TAB = 'onvero.settings.activeTab.v1';
const STORAGE_ACTIVE_ANGEBOT = 'onvero.settings.activeAngebot.v1';
const STORAGE_ACTIVE_ABSENDER = 'onvero.settings.activeAbsender.v1';

// ─── API mapping ──────────────────────────────────────────────────────────────

type AngebotsProfileRow = {
  id: string;
  name: string;
  unternehmen: string;
  beschreibung: string;
  pain_points: string[];
  value_proposition: string;
  referenzen: string[];
};

function rowToProfile(row: AngebotsProfileRow): AngebotsProfile {
  return {
    id: row.id,
    name: row.name ?? '',
    unternehmen: row.unternehmen ?? '',
    beschreibung: row.beschreibung ?? '',
    painPoints: Array.isArray(row.pain_points) ? row.pain_points : [],
    valueProposition: row.value_proposition ?? '',
    referenzen: Array.isArray(row.referenzen) ? row.referenzen : [],
  };
}

function profilePatchToRow(patch: Partial<AngebotsProfile>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if ('name' in patch) out.name = patch.name;
  if ('unternehmen' in patch) out.unternehmen = patch.unternehmen;
  if ('beschreibung' in patch) out.beschreibung = patch.beschreibung;
  if ('painPoints' in patch) out.pain_points = patch.painPoints;
  if ('valueProposition' in patch) out.value_proposition = patch.valueProposition;
  if ('referenzen' in patch) out.referenzen = patch.referenzen;
  return out;
}

// ─── API mapping: Absender ────────────────────────────────────────────────────

type EmailTemplate = {
  name: string;
  subject: string;
  body: string;
  source: 'manual' | 'uploaded';
};

type AbsenderProfileRow = {
  id: string;
  profile_name: string | null;
  sender_first_name: string | null;
  sender_last_name: string | null;
  sender_role: string | null;
  sender_email: string | null;
  sender_linkedin_url: string | null;
  sender_photo_url: string | null;
  outreach_goal: string | null;
  writing_style: string | null;
  formality: string | null;
  greeting_style: string | null;
  max_email_words: number | null;
  language: string | null;
  angebots_profile_id: string | null;
  email_templates: EmailTemplate[] | null;
  email_signature_html: string | null;
  calendar_link: string | null;
  key_differentiators: string[] | null;
  forbidden_phrases: string[] | null;
  forbidden_claims: string[] | null;
};

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === 'string');
}

function absenderRowToProfile(row: AbsenderProfileRow): AbsenderProfile {
  return {
    id: row.id,
    profileName: row.profile_name ?? '',
    firstName: row.sender_first_name ?? '',
    lastName: row.sender_last_name ?? '',
    role: row.sender_role ?? '',
    fromEmail: row.sender_email ?? '',
    linkedinUrl: row.sender_linkedin_url ?? '',
    photoUrl: row.sender_photo_url ?? '',
    outreachGoal: row.outreach_goal ?? '',
    writingStyle: row.writing_style ?? '',
    formality: row.formality === 'du' ? 'du' : 'sie',
    greetingStyle: row.greeting_style ?? 'formal',
    maxEmailWords: row.max_email_words ?? 120,
    language: row.language ?? 'de',
    angebotsProfileId: row.angebots_profile_id,
    emailTemplates: Array.isArray(row.email_templates) ? row.email_templates : [],
    emailSignatureHtml: row.email_signature_html ?? '',
    calendarLink: row.calendar_link ?? '',
    keyDifferentiators: asStringArray(row.key_differentiators),
    forbiddenPhrases: asStringArray(row.forbidden_phrases),
    forbiddenClaims: asStringArray(row.forbidden_claims),
  };
}

function absenderPatchToRow(patch: Partial<AbsenderProfile>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if ('profileName' in patch) out.profile_name = patch.profileName;
  if ('firstName' in patch) out.sender_first_name = patch.firstName;
  if ('lastName' in patch) out.sender_last_name = patch.lastName;
  if ('role' in patch) out.sender_role = patch.role;
  if ('fromEmail' in patch) out.sender_email = patch.fromEmail;
  if ('linkedinUrl' in patch) out.sender_linkedin_url = patch.linkedinUrl;
  if ('photoUrl' in patch) out.sender_photo_url = patch.photoUrl;
  if ('outreachGoal' in patch) out.outreach_goal = patch.outreachGoal;
  if ('writingStyle' in patch) out.writing_style = patch.writingStyle;
  if ('formality' in patch) out.formality = patch.formality;
  if ('greetingStyle' in patch) out.greeting_style = patch.greetingStyle;
  if ('maxEmailWords' in patch) out.max_email_words = patch.maxEmailWords;
  if ('language' in patch) out.language = patch.language;
  if ('angebotsProfileId' in patch) out.angebots_profile_id = patch.angebotsProfileId;
  if ('emailTemplates' in patch) out.email_templates = patch.emailTemplates;
  if ('emailSignatureHtml' in patch) out.email_signature_html = patch.emailSignatureHtml;
  if ('calendarLink' in patch) out.calendar_link = patch.calendarLink;
  if ('keyDifferentiators' in patch) out.key_differentiators = patch.keyDifferentiators;
  if ('forbiddenPhrases' in patch) out.forbidden_phrases = patch.forbiddenPhrases;
  if ('forbiddenClaims' in patch) out.forbidden_claims = patch.forbiddenClaims;
  return out;
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'angebot' | 'absender';

type AngebotsProfile = {
  id: string;
  name: string;
  unternehmen: string;
  beschreibung: string;
  painPoints: string[];
  valueProposition: string;
  referenzen: string[];
};

type AbsenderProfile = {
  id: string;
  profileName: string;
  firstName: string;
  lastName: string;
  role: string;
  fromEmail: string;
  linkedinUrl: string;
  photoUrl: string;
  outreachGoal: string;
  writingStyle: string;
  formality: 'du' | 'sie';
  greetingStyle: string;
  maxEmailWords: number;
  language: string;
  angebotsProfileId: string | null;
  emailTemplates: EmailTemplate[];
  emailSignatureHtml: string;
  calendarLink: string;
  keyDifferentiators: string[];
  forbiddenPhrases: string[];
  forbiddenClaims: string[];
};

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

function emptyAngebot(): AngebotsProfile {
  return {
    id: uid(),
    name: 'Neues Angebots-Profil',
    unternehmen: '',
    beschreibung: '',
    painPoints: [],
    valueProposition: '',
    referenzen: [],
  };
}

function emptyAbsenderSeed(): Partial<AbsenderProfile> {
  return {
    profileName: 'Neues Absender-Profil',
    firstName: '',
    lastName: '',
    role: '',
    fromEmail: '',
    linkedinUrl: '',
    photoUrl: '',
    outreachGoal: '',
    writingStyle: '',
    formality: 'sie',
    greetingStyle: 'formal',
    maxEmailWords: 120,
    language: 'de',
    angebotsProfileId: null,
    emailTemplates: [],
    emailSignatureHtml: '',
    calendarLink: '',
    keyDifferentiators: [],
    forbiddenPhrases: [],
    forbiddenClaims: [],
  };
}

// ─── Atomare Inputs ───────────────────────────────────────────────────────────

function inputStyle(c: ReturnType<typeof colors>): React.CSSProperties {
  return {
    width: '100%',
    background: c.bgPage,
    border: `1px solid ${c.border}`,
    borderRadius: 8,
    padding: '9px 12px',
    fontSize: 13,
    color: c.text,
    fontFamily: 'var(--font-inter), sans-serif',
    outline: 'none',
    transition: 'border-color 0.15s',
  };
}

function Label({ children, c, sub }: { children: React.ReactNode; c: ReturnType<typeof colors>; sub?: string }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: c.text }}>{children}</div>
      {sub && <div style={{ fontSize: 11, color: c.textSub, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function TextField({
  value,
  onChange,
  placeholder,
  c,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  c: ReturnType<typeof colors>;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={inputStyle(c)}
      onFocus={(e) => (e.currentTarget.style.borderColor = c.accent)}
      onBlur={(e) => (e.currentTarget.style.borderColor = c.border)}
    />
  );
}

function TextArea({
  value,
  onChange,
  placeholder,
  rows = 4,
  c,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  c: ReturnType<typeof colors>;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{ ...inputStyle(c), resize: 'vertical', minHeight: rows * 22, lineHeight: 1.55 }}
      onFocus={(e) => (e.currentTarget.style.borderColor = c.accent)}
      onBlur={(e) => (e.currentTarget.style.borderColor = c.border)}
    />
  );
}

function TagInput({
  values,
  onChange,
  placeholder,
  c,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  c: ReturnType<typeof colors>;
}) {
  const [draft, setDraft] = useState('');

  function commit() {
    const v = draft.trim();
    if (!v) return;
    if (!values.includes(v)) onChange([...values, v]);
    setDraft('');
  }

  function remove(idx: number) {
    onChange(values.filter((_, i) => i !== idx));
  }

  return (
    <div
      style={{
        background: c.bgPage,
        border: `1px solid ${c.border}`,
        borderRadius: 8,
        padding: 6,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6,
        minHeight: 40,
        alignItems: 'center',
      }}
    >
      {values.map((tag, idx) => (
        <span
          key={`${tag}-${idx}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: c.bgCard,
            border: `1px solid ${c.border}`,
            color: c.text,
            borderRadius: 6,
            padding: '4px 4px 4px 10px',
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {tag}
          <button
            onClick={() => remove(idx)}
            aria-label={`${tag} entfernen`}
            style={{
              width: 18,
              height: 18,
              borderRadius: 4,
              border: 'none',
              background: 'transparent',
              color: c.textSub,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
            }}
          >
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            commit();
          } else if (e.key === 'Backspace' && draft === '' && values.length > 0) {
            onChange(values.slice(0, -1));
          }
        }}
        onBlur={commit}
        placeholder={values.length === 0 ? placeholder : ''}
        style={{
          flex: '1 0 140px',
          minWidth: 120,
          background: 'transparent',
          border: 'none',
          outline: 'none',
          fontSize: 13,
          color: c.text,
          padding: '4px 6px',
          fontFamily: 'var(--font-inter), sans-serif',
        }}
      />
    </div>
  );
}

// ─── Layout helpers ───────────────────────────────────────────────────────────

function Card({
  title,
  sub,
  children,
  c,
}: {
  title?: string;
  sub?: string;
  children: React.ReactNode;
  c: ReturnType<typeof colors>;
}) {
  return (
    <div style={{ background: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 14, overflow: 'hidden' }}>
      {title && (
        <div style={{ padding: '18px 22px', borderBottom: `1px solid ${c.border}` }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: c.text }}>{title}</div>
          {sub && <div style={{ fontSize: 12, color: c.textSub, marginTop: 3 }}>{sub}</div>}
        </div>
      )}
      <div style={{ padding: '20px 22px' }}>{children}</div>
    </div>
  );
}

function Field({
  label,
  sub,
  children,
  c,
}: {
  label: string;
  sub?: string;
  children: React.ReactNode;
  c: ReturnType<typeof colors>;
}) {
  return (
    <div>
      <Label c={c} sub={sub}>
        {label}
      </Label>
      {children}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { theme } = useTheme();
  const c = colors(theme);

  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState<Tab>('angebot');

  const [angebotsProfile, setAngebotsProfile] = useState<AngebotsProfile[]>([]);
  const [absenderProfile, setAbsenderProfile] = useState<AbsenderProfile[]>([]);
  const [activeAngebotId, setActiveAngebotId] = useState<string | null>(null);
  const [activeAbsenderId, setActiveAbsenderId] = useState<string | null>(null);

  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [dirtyAngebotIds, setDirtyAngebotIds] = useState<Set<string>>(() => new Set());
  const [savingAngebotId, setSavingAngebotId] = useState<string | null>(null);
  const [dirtyAbsenderIds, setDirtyAbsenderIds] = useState<Set<string>>(() => new Set());
  const [savingAbsenderId, setSavingAbsenderId] = useState<string | null>(null);

  // Load Angebots- + Absender-Profile from API, UI tab/active-id from localStorage
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const t = localStorage.getItem(STORAGE_TAB) as Tab | null;
        const aAng = localStorage.getItem(STORAGE_ACTIVE_ANGEBOT);
        const aAbs = localStorage.getItem(STORAGE_ACTIVE_ABSENDER);
        if (!cancelled && (t === 'angebot' || t === 'absender')) setTab(t);

        const [angRes, absRes] = await Promise.all([
          fetch('/api/angebots-profile', { cache: 'no-store' }),
          fetch('/api/absender-profile', { cache: 'no-store' }),
        ]);
        const angJson = await angRes.json();
        const absJson = await absRes.json();

        const angRows = Array.isArray(angJson?.profiles) ? (angJson.profiles as AngebotsProfileRow[]) : [];
        const absRows = Array.isArray(absJson?.profiles) ? (absJson.profiles as AbsenderProfileRow[]) : [];
        const ang = angRows.map(rowToProfile);
        const abs = absRows.map(absenderRowToProfile);

        if (cancelled) return;
        setAngebotsProfile(ang);
        setAbsenderProfile(abs);
        if (aAng && ang.some((p) => p.id === aAng)) setActiveAngebotId(aAng);
        else if (ang.length) setActiveAngebotId(ang[0].id);
        if (aAbs && abs.some((p) => p.id === aAbs)) setActiveAbsenderId(aAbs);
        else if (abs.length) setActiveAbsenderId(abs[0].id);
      } catch {
        // ignore — UI starts empty
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist tab + active ids in localStorage (UX state)
  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_TAB, tab);
  }, [tab, loaded]);
  useEffect(() => {
    if (loaded && activeAngebotId) localStorage.setItem(STORAGE_ACTIVE_ANGEBOT, activeAngebotId);
  }, [activeAngebotId, loaded]);
  useEffect(() => {
    if (loaded && activeAbsenderId) localStorage.setItem(STORAGE_ACTIVE_ABSENDER, activeAbsenderId);
  }, [activeAbsenderId, loaded]);

  async function createAngebot() {
    const seed = emptyAngebot();
    try {
      const res = await fetch('/api/angebots-profile', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(profilePatchToRow(seed)),
      });
      const json = await res.json();
      if (!res.ok || !json?.profile) return;
      const created = rowToProfile(json.profile as AngebotsProfileRow);
      setAngebotsProfile((prev) => [created, ...prev]);
      setActiveAngebotId(created.id);
      setSavedAt(new Date());
    } catch {
      // ignore
    }
  }

  async function createAbsender() {
    const seed = emptyAbsenderSeed();
    try {
      const res = await fetch('/api/absender-profile', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(absenderPatchToRow(seed)),
      });
      const json = await res.json();
      if (!res.ok || !json?.profile) return;
      const created = absenderRowToProfile(json.profile as AbsenderProfileRow);
      setAbsenderProfile((prev) => [created, ...prev]);
      setActiveAbsenderId(created.id);
      setSavedAt(new Date());
    } catch {
      // ignore
    }
  }

  function updateAngebot(id: string, patch: Partial<AngebotsProfile>) {
    setAngebotsProfile((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    setDirtyAngebotIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }

  async function saveAngebot(id: string) {
    const profile = angebotsProfile.find((p) => p.id === id);
    if (!profile) return;
    setSavingAngebotId(id);
    try {
      const res = await fetch(`/api/angebots-profile/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(profilePatchToRow(profile)),
      });
      if (res.ok) {
        setSavedAt(new Date());
        setDirtyAngebotIds((prev) => {
          if (!prev.has(id)) return prev;
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    } catch {
      // ignore — caller can retry
    } finally {
      setSavingAngebotId((curr) => (curr === id ? null : curr));
    }
  }

  async function deleteAngebot(id: string) {
    setDirtyAngebotIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setAngebotsProfile((prev) => {
      const next = prev.filter((p) => p.id !== id);
      if (activeAngebotId === id) setActiveAngebotId(next[0]?.id ?? null);
      return next;
    });
    try {
      await fetch(`/api/angebots-profile/${id}`, { method: 'DELETE' });
      setSavedAt(new Date());
    } catch {
      // ignore
    }
  }

  function updateAbsender(id: string, patch: Partial<AbsenderProfile>) {
    setAbsenderProfile((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    setDirtyAbsenderIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }

  // Server-applied changes (e.g. webhook flows) — update state without marking dirty
  function syncAbsenderFromServer(id: string, patch: Partial<AbsenderProfile>) {
    setAbsenderProfile((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    setSavedAt(new Date());
  }

  async function saveAbsender(id: string) {
    const profile = absenderProfile.find((p) => p.id === id);
    if (!profile) return;
    setSavingAbsenderId(id);
    try {
      const res = await fetch(`/api/absender-profile/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(absenderPatchToRow(profile)),
      });
      if (res.ok) {
        setSavedAt(new Date());
        setDirtyAbsenderIds((prev) => {
          if (!prev.has(id)) return prev;
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    } catch {
      // ignore — caller can retry
    } finally {
      setSavingAbsenderId((curr) => (curr === id ? null : curr));
    }
  }

  async function deleteAbsender(id: string) {
    setDirtyAbsenderIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setAbsenderProfile((prev) => {
      const next = prev.filter((p) => p.id !== id);
      if (activeAbsenderId === id) setActiveAbsenderId(next[0]?.id ?? null);
      return next;
    });
    try {
      await fetch(`/api/absender-profile/${id}`, { method: 'DELETE' });
      setSavedAt(new Date());
    } catch {
      // ignore
    }
  }

  const activeAngebot = useMemo(
    () => angebotsProfile.find((p) => p.id === activeAngebotId) ?? null,
    [angebotsProfile, activeAngebotId],
  );
  const activeAbsender = useMemo(
    () => absenderProfile.find((p) => p.id === activeAbsenderId) ?? null,
    [absenderProfile, activeAbsenderId],
  );

  if (!loaded) {
    return (
      <div
        style={{
          minHeight: '100%',
          background: c.bgPage,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-inter), sans-serif',
          color: c.textMuted,
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        Einstellungen werden geladen…
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100%',
        background: c.bgPage,
        fontFamily: 'var(--font-inter), sans-serif',
        color: c.text,
      }}
    >
      {/* Header */}
      <div
        style={{
          borderBottom: `1px solid ${c.border}`,
          padding: '24px 32px 0',
          background: c.bg,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 24,
            marginBottom: 20,
          }}
        >
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px', color: c.text, lineHeight: 1 }}>
              Einstellungen
            </h1>
            <p style={{ fontSize: 13, color: c.textSub, margin: 0 }}>
              Angebots- und Absender-Profile für Ihre Outreach-Kampagnen
            </p>
          </div>
          {savedAt && (
            <span style={{ fontSize: 11, color: c.success, fontWeight: 700 }}>
              Gespeichert {savedAt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        {/* Tab pills */}
        <div style={{ display: 'flex', gap: 4 }}>
          <TabPill active={tab === 'angebot'} onClick={() => setTab('angebot')} c={c}>
            Angebots-Profile
            <Counter n={angebotsProfile.length} active={tab === 'angebot'} c={c} />
          </TabPill>
          <TabPill active={tab === 'absender'} onClick={() => setTab('absender')} c={c}>
            Absender-Profile
            <Counter n={absenderProfile.length} active={tab === 'absender'} c={c} />
          </TabPill>
        </div>
      </div>

      {/* Body: two-column layout */}
      <div
        style={{
          padding: '24px 32px',
          display: 'grid',
          gridTemplateColumns: '280px 1fr',
          gap: 20,
          maxWidth: 1280,
          alignItems: 'start',
        }}
      >
        {/* Sidebar: profile list */}
        <ProfileSidebar
          tab={tab}
          angebotsProfile={angebotsProfile}
          absenderProfile={absenderProfile}
          activeAngebotId={activeAngebotId}
          activeAbsenderId={activeAbsenderId}
          onSelectAngebot={setActiveAngebotId}
          onSelectAbsender={setActiveAbsenderId}
          onCreateAngebot={createAngebot}
          onCreateAbsender={createAbsender}
          c={c}
        />

        {/* Main editor */}
        <div>
          {tab === 'angebot' ? (
            activeAngebot ? (
              <AngebotsEditor
                profile={activeAngebot}
                onChange={(patch) => updateAngebot(activeAngebot.id, patch)}
                onSave={() => saveAngebot(activeAngebot.id)}
                onDelete={() => deleteAngebot(activeAngebot.id)}
                dirty={dirtyAngebotIds.has(activeAngebot.id)}
                saving={savingAngebotId === activeAngebot.id}
                c={c}
              />
            ) : (
              <EmptyState
                title="Noch kein Angebots-Profil"
                hint="Lege ein Profil an, um zu definieren, was Du verkaufst und wen Du erreichen willst."
                cta="Profil erstellen"
                onCta={createAngebot}
                c={c}
              />
            )
          ) : activeAbsender ? (
            <AbsenderEditor
              profile={activeAbsender}
              angebotsProfile={angebotsProfile}
              onChange={(patch) => updateAbsender(activeAbsender.id, patch)}
              onServerSync={(patch) => syncAbsenderFromServer(activeAbsender.id, patch)}
              onSave={() => saveAbsender(activeAbsender.id)}
              onDelete={() => deleteAbsender(activeAbsender.id)}
              dirty={dirtyAbsenderIds.has(activeAbsender.id)}
              saving={savingAbsenderId === activeAbsender.id}
              c={c}
            />
          ) : (
            <EmptyState
              title="Noch kein Absender-Profil"
              hint="Lege einen Absender an, der die Outreach-Mails verschickt — mit Tonalität, Vorlagen und Kalenderlink."
              cta="Profil erstellen"
              onCta={createAbsender}
              c={c}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function ProfileSidebar({
  tab,
  angebotsProfile,
  absenderProfile,
  activeAngebotId,
  activeAbsenderId,
  onSelectAngebot,
  onSelectAbsender,
  onCreateAngebot,
  onCreateAbsender,
  c,
}: {
  tab: Tab;
  angebotsProfile: AngebotsProfile[];
  absenderProfile: AbsenderProfile[];
  activeAngebotId: string | null;
  activeAbsenderId: string | null;
  onSelectAngebot: (id: string) => void;
  onSelectAbsender: (id: string) => void;
  onCreateAngebot: () => void;
  onCreateAbsender: () => void;
  c: ReturnType<typeof colors>;
}) {
  const profiles =
    tab === 'angebot'
      ? angebotsProfile.map((p) => ({ id: p.id, label: p.name, hint: p.unternehmen || '—' }))
      : absenderProfile.map((p) => {
          const fullName = [p.firstName, p.lastName].filter(Boolean).join(' ').trim();
          return {
            id: p.id,
            label: p.profileName || fullName || '—',
            hint: p.role || fullName || '',
          };
        });
  const activeId = tab === 'angebot' ? activeAngebotId : activeAbsenderId;
  const onSelect = tab === 'angebot' ? onSelectAngebot : onSelectAbsender;
  const onCreate = tab === 'angebot' ? onCreateAngebot : onCreateAbsender;

  return (
    <div
      style={{
        background: c.bgCard,
        border: `1px solid ${c.border}`,
        borderRadius: 14,
        overflow: 'hidden',
        position: 'sticky',
        top: 20,
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          borderBottom: `1px solid ${c.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 700, color: c.textSub, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Profile
        </span>
        <button
          onClick={onCreate}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            background: c.accent,
            color: c.bg,
            border: 'none',
            borderRadius: 7,
            padding: '5px 10px',
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'var(--font-inter), sans-serif',
          }}
        >
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M8 3v10M3 8h10" />
          </svg>
          Neu
        </button>
      </div>
      <div style={{ padding: 6, maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' }}>
        {profiles.length === 0 ? (
          <div style={{ padding: '20px 14px', fontSize: 12, color: c.textMuted, textAlign: 'center' }}>
            Noch keine Profile
          </div>
        ) : (
          profiles.map((p) => {
            const active = p.id === activeId;
            return (
              <button
                key={p.id}
                onClick={() => onSelect(p.id)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  background: active ? c.bgHover : 'transparent',
                  border: `1px solid ${active ? c.borderStrong : 'transparent'}`,
                  borderRadius: 8,
                  padding: '9px 12px',
                  marginBottom: 2,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-inter), sans-serif',
                  display: 'block',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: c.text, lineHeight: 1.3 }}>{p.label || '—'}</div>
                {p.hint && (
                  <div
                    style={{
                      fontSize: 11,
                      color: c.textSub,
                      marginTop: 2,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {p.hint}
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Editor: Angebots-Profil ─────────────────────────────────────────────────

function AngebotsEditor({
  profile,
  onChange,
  onSave,
  onDelete,
  dirty,
  saving,
  c,
}: {
  profile: AngebotsProfile;
  onChange: (patch: Partial<AngebotsProfile>) => void;
  onSave: () => void;
  onDelete: () => void;
  dirty: boolean;
  saving: boolean;
  c: ReturnType<typeof colors>;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Identity card */}
      <Card title="Angebots-Profil" sub="Was Du verkaufst und für wen es wertvoll ist" c={c}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Name" sub="Interner Profilname" c={c}>
              <TextField
                value={profile.name}
                onChange={(v) => onChange({ name: v })}
                placeholder="z.B. SaaS Mittelstand"
                c={c}
              />
            </Field>
            <Field label="Unternehmen" c={c}>
              <TextField
                value={profile.unternehmen}
                onChange={(v) => onChange({ unternehmen: v })}
                placeholder="z.B. Onvero GmbH"
                c={c}
              />
            </Field>
          </div>

          <Field label="Beschreibung" sub="Was macht das Unternehmen?" c={c}>
            <TextArea
              value={profile.beschreibung}
              onChange={(v) => onChange({ beschreibung: v })}
              placeholder="Kurz und konkret: Produkt, Zielgruppe, Vertriebsmodell"
              rows={3}
              c={c}
            />
          </Field>

          <Field label="Pain Points" sub="Welche Probleme löst Du? Enter oder Komma bestätigt." c={c}>
            <TagInput
              values={profile.painPoints}
              onChange={(v) => onChange({ painPoints: v })}
              placeholder="z.B. lange Sales-Zyklen"
              c={c}
            />
          </Field>

          <Field label="Value Proposition" sub="Was ist euer konkreter Mehrwert?" c={c}>
            <TextArea
              value={profile.valueProposition}
              onChange={(v) => onChange({ valueProposition: v })}
              placeholder="z.B. 3x höhere Reply-Rate durch personalisierte Outreach in 60 Sekunden"
              rows={3}
              c={c}
            />
          </Field>

          <Field label="Referenzen" sub="Bekannte Kunden oder Cases — Enter bestätigt." c={c}>
            <TagInput
              values={profile.referenzen}
              onChange={(v) => onChange({ referenzen: v })}
              placeholder="z.B. Hermes, DPD, Siemens"
              c={c}
            />
          </Field>
        </div>
      </Card>

      {/* Action bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <button
          onClick={() => {
            if (confirm(`Profil "${profile.name}" wirklich löschen?`)) onDelete();
          }}
          style={{
            background: 'transparent',
            color: c.danger,
            border: `1px solid ${c.border}`,
            borderRadius: 8,
            padding: '7px 14px',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'var(--font-inter), sans-serif',
          }}
        >
          Profil löschen
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {dirty && !saving && (
            <span style={{ fontSize: 11, fontWeight: 600, color: c.textSub }}>
              Ungespeicherte Änderungen
            </span>
          )}
          <button
            onClick={onSave}
            disabled={!dirty || saving}
            style={{
              background: dirty && !saving ? c.accent : c.border,
              color: dirty && !saving ? (c.bgPage === '#FFFFFF' ? '#fff' : c.bgPage) : c.textSub,
              border: 'none',
              borderRadius: 8,
              padding: '8px 18px',
              fontSize: 12,
              fontWeight: 800,
              cursor: dirty && !saving ? 'pointer' : 'not-allowed',
              fontFamily: 'var(--font-inter), sans-serif',
              transition: 'background 0.12s, color 0.12s',
            }}
          >
            {saving ? 'Speichere…' : 'Speichern'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Editor: Absender-Profil ─────────────────────────────────────────────────

const LANGUAGE_OPTIONS = [
  { value: 'de', label: 'Deutsch' },
  { value: 'en', label: 'Englisch' },
  { value: 'fr', label: 'Französisch' },
  { value: 'es', label: 'Spanisch' },
  { value: 'it', label: 'Italienisch' },
];

function AbsenderEditor({
  profile,
  angebotsProfile,
  onChange,
  onServerSync,
  onSave,
  onDelete,
  dirty,
  saving,
  c,
}: {
  profile: AbsenderProfile;
  angebotsProfile: AngebotsProfile[];
  onChange: (patch: Partial<AbsenderProfile>) => void;
  onServerSync: (patch: Partial<AbsenderProfile>) => void;
  onSave: () => void;
  onDelete: () => void;
  dirty: boolean;
  saving: boolean;
  c: ReturnType<typeof colors>;
}) {
  const displayLabel = profile.profileName || [profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'Absender';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Identität + Rolle */}
      <Card title="Absender-Profil" sub="Wer schreibt, in welchem Stil, mit welchem Ziel" c={c}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Name" sub="Interner Profilname (nur für Dich)" c={c}>
            <TextField
              value={profile.profileName}
              onChange={(v) => onChange({ profileName: v })}
              placeholder="z.B. Hans — CEO Outreach"
              c={c}
            />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Vorname" c={c}>
              <TextField
                value={profile.firstName}
                onChange={(v) => onChange({ firstName: v })}
                placeholder="Hans"
                c={c}
              />
            </Field>
            <Field label="Nachname" c={c}>
              <TextField
                value={profile.lastName}
                onChange={(v) => onChange({ lastName: v })}
                placeholder="Lacher"
                c={c}
              />
            </Field>
          </div>

          <Field label="Rolle / Titel" sub="Wie der Absender unterzeichnet" c={c}>
            <TextField
              value={profile.role}
              onChange={(v) => onChange({ role: v })}
              placeholder="z.B. Gründer & CEO"
              c={c}
            />
          </Field>

          <Field label="From-Email" sub="Absender-Adresse für die Outreach-Kampagne" c={c}>
            <TextField
              value={profile.fromEmail}
              onChange={(v) => onChange({ fromEmail: v })}
              placeholder="hans@onvero.de"
              c={c}
            />
          </Field>

          <Field label="LinkedIn-URL" sub="Profil des Absenders" c={c}>
            <TextField
              value={profile.linkedinUrl}
              onChange={(v) => onChange({ linkedinUrl: v })}
              placeholder="https://www.linkedin.com/in/…"
              c={c}
            />
          </Field>

          <Field label="Foto" sub="PNG/JPG/WEBP/GIF, max 5 MB" c={c}>
            <PhotoUpload
              url={profile.photoUrl}
              onChange={(url) => onChange({ photoUrl: url })}
              c={c}
            />
          </Field>
        </div>
      </Card>

      {/* Outreach-Konfiguration */}
      <Card title="Outreach-Konfiguration" sub="Worum es geht und wie es klingen soll" c={c}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Ziel des Outreach" sub="Was soll der Empfänger tun?" c={c}>
            <TextArea
              value={profile.outreachGoal}
              onChange={(v) => onChange({ outreachGoal: v })}
              placeholder="z.B. 15-Min Discovery-Call buchen, um KI-gestützten Vertrieb für Mittelstand zu zeigen"
              rows={3}
              c={c}
            />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 12 }}>
            <Field label="Anrede" sub="Du oder Sie" c={c}>
              <SelectField
                value={profile.formality}
                onChange={(v) => onChange({ formality: v === 'du' ? 'du' : 'sie' })}
                options={[
                  { value: 'sie', label: 'Sie (formell)' },
                  { value: 'du', label: 'Du (locker)' },
                ]}
                c={c}
              />
            </Field>
            <Field label="Tonalität" sub="Wie soll der Stil klingen?" c={c}>
              <TextField
                value={profile.writingStyle}
                onChange={(v) => onChange({ writingStyle: v })}
                placeholder="z.B. direkt, freundlich, ohne Buzzwords, kurze Sätze"
                c={c}
              />
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 12 }}>
            <Field label="Sprache" sub="Sprache der Mails" c={c}>
              <SelectField
                value={profile.language}
                onChange={(v) => onChange({ language: v })}
                options={LANGUAGE_OPTIONS}
                c={c}
              />
            </Field>
            <Field label="Produktprofil" sub="Welches Angebots-Profil benutzt dieser Absender?" c={c}>
              <SelectField
                value={profile.angebotsProfileId ?? ''}
                onChange={(v) => onChange({ angebotsProfileId: v || null })}
                options={[
                  { value: '', label: '— Kein Produktprofil —' },
                  ...angebotsProfile.map((p) => ({ value: p.id, label: p.name || '(unbenannt)' })),
                ]}
                c={c}
              />
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: 12 }}>
            <Field label="Begrüßungsstil" sub="z.B. formal, casual, hi-firstname" c={c}>
              <TextField
                value={profile.greetingStyle}
                onChange={(v) => onChange({ greetingStyle: v })}
                placeholder="formal"
                c={c}
              />
            </Field>
            <Field label="Max. Wörter" sub="Maximale Mail-Länge" c={c}>
              <NumberField
                value={profile.maxEmailWords}
                onChange={(v) => onChange({ maxEmailWords: v })}
                min={20}
                max={500}
                c={c}
              />
            </Field>
          </div>
        </div>
      </Card>

      {/* Guardrails */}
      <Card title="Guardrails" sub="Was den Absender ausmacht und was er vermeiden soll" c={c}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Key Differentiators" sub="Was macht dieses Angebot einzigartig?" c={c}>
            <TagInput
              values={profile.keyDifferentiators}
              onChange={(v) => onChange({ keyDifferentiators: v })}
              placeholder="z.B. tiefe Recherche pro Lead"
              c={c}
            />
          </Field>
          <Field label="Verbotene Phrasen" sub="Buzzwords, die nicht in den Mails landen sollen" c={c}>
            <TagInput
              values={profile.forbiddenPhrases}
              onChange={(v) => onChange({ forbiddenPhrases: v })}
              placeholder="z.B. Game-Changer"
              c={c}
            />
          </Field>
          <Field label="Verbotene Claims" sub="Behauptungen, die nicht aufgestellt werden dürfen" c={c}>
            <TagInput
              values={profile.forbiddenClaims}
              onChange={(v) => onChange({ forbiddenClaims: v })}
              placeholder="z.B. Marktführer"
              c={c}
            />
          </Field>
        </div>
      </Card>

      {/* E-Mail-Vorlagen */}
      <Card
        title="E-Mail-Vorlagen"
        sub="Lade Beispiel-Mails (.eml/.txt/.html) hoch oder schreibe eine Vorlage manuell"
        c={c}
      >
        <EmailTemplatesEditor
          profileId={profile.id}
          templates={profile.emailTemplates}
          onChange={(next) => onChange({ emailTemplates: next })}
          onServerSync={(next) => onServerSync({ emailTemplates: next })}
          c={c}
        />
      </Card>

      {/* Signatur */}
      <Card title="E-Mail-Signatur" sub="HTML-Signatur, die unter jeder Mail eingefügt wird" c={c}>
        <Field label="Signatur (HTML)" c={c}>
          <TextArea
            value={profile.emailSignatureHtml}
            onChange={(v) => onChange({ emailSignatureHtml: v })}
            placeholder="<p>Beste Grüße<br/>Hans Lacher<br/>Onvero</p>"
            rows={5}
            c={c}
          />
        </Field>
      </Card>

      {/* Kalenderlink */}
      <Card title="Kalenderlink" sub="cal.com / Calendly-Link, der in Mails als Booking-CTA verwendet wird" c={c}>
        <Field label="Link" c={c}>
          <TextField
            value={profile.calendarLink}
            onChange={(v) => onChange({ calendarLink: v })}
            placeholder="https://cal.com/dein-handle/discovery"
            c={c}
          />
        </Field>
      </Card>

      {/* Action bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <button
          onClick={() => {
            if (confirm(`Profil "${displayLabel}" wirklich löschen?`)) onDelete();
          }}
          style={{
            background: 'transparent',
            color: c.danger,
            border: `1px solid ${c.border}`,
            borderRadius: 8,
            padding: '7px 14px',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'var(--font-inter), sans-serif',
          }}
        >
          Profil löschen
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {dirty && !saving && (
            <span style={{ fontSize: 11, fontWeight: 600, color: c.textSub }}>
              Ungespeicherte Änderungen
            </span>
          )}
          <button
            onClick={onSave}
            disabled={!dirty || saving}
            style={{
              background: dirty && !saving ? c.accent : c.border,
              color: dirty && !saving ? (c.bgPage === '#FFFFFF' ? '#fff' : c.bgPage) : c.textSub,
              border: 'none',
              borderRadius: 8,
              padding: '8px 18px',
              fontSize: 12,
              fontWeight: 800,
              cursor: dirty && !saving ? 'pointer' : 'not-allowed',
              fontFamily: 'var(--font-inter), sans-serif',
              transition: 'background 0.12s, color 0.12s',
            }}
          >
            {saving ? 'Speichere…' : 'Speichern'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Number field ────────────────────────────────────────────────────────────

function NumberField({
  value,
  onChange,
  min,
  max,
  c,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  c: ReturnType<typeof colors>;
}) {
  return (
    <input
      type="number"
      value={Number.isFinite(value) ? value : ''}
      min={min}
      max={max}
      onChange={(e) => {
        const n = e.target.value === '' ? 0 : Number(e.target.value);
        if (Number.isFinite(n)) onChange(n);
      }}
      style={inputStyle(c)}
      onFocus={(e) => (e.currentTarget.style.borderColor = c.accent)}
      onBlur={(e) => (e.currentTarget.style.borderColor = c.border)}
    />
  );
}

// ─── Photo upload ────────────────────────────────────────────────────────────

function PhotoUpload({
  url,
  onChange,
  c,
}: {
  url: string;
  onChange: (url: string) => void;
  c: ReturnType<typeof colors>;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | null) {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/absender-profile/upload-photo', { method: 'POST', body: form });
      const json = await res.json();
      if (!res.ok || !json?.url) {
        setError(json?.error ?? 'Upload fehlgeschlagen');
        return;
      }
      onChange(json.url as string);
    } catch {
      setError('Upload fehlgeschlagen');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: c.bgPage,
          border: `1px solid ${c.border}`,
          overflow: 'hidden',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={c.textSub} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: c.accent,
              color: c.bgPage === '#FFFFFF' ? '#fff' : c.bgPage,
              border: 'none',
              borderRadius: 7,
              padding: '7px 12px',
              fontSize: 12,
              fontWeight: 700,
              cursor: uploading ? 'wait' : 'pointer',
              fontFamily: 'var(--font-inter), sans-serif',
              opacity: uploading ? 0.6 : 1,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 12V3M4 7l4-4 4 4M3 13h10" />
            </svg>
            {uploading ? 'Lade hoch…' : url ? 'Foto ersetzen' : 'Foto hochladen'}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={(e) => {
                handleFile(e.target.files?.[0] ?? null);
                e.currentTarget.value = '';
              }}
              disabled={uploading}
              style={{ display: 'none' }}
            />
          </label>
          {url && (
            <button
              onClick={() => onChange('')}
              disabled={uploading}
              style={{
                background: 'transparent',
                color: c.textSub,
                border: `1px solid ${c.border}`,
                borderRadius: 7,
                padding: '7px 12px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'var(--font-inter), sans-serif',
              }}
            >
              Entfernen
            </button>
          )}
        </div>
        {error && <span style={{ fontSize: 11, color: c.danger, fontWeight: 600 }}>{error}</span>}
      </div>
    </div>
  );
}

// ─── Select field ────────────────────────────────────────────────────────────

function SelectField({
  value,
  onChange,
  options,
  c,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  c: ReturnType<typeof colors>;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        ...inputStyle(c),
        appearance: 'none',
        paddingRight: 32,
        backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 16 16' fill='none' stroke='${encodeURIComponent(
          c.textSub,
        )}' stroke-width='2' stroke-linecap='round'><path d='M4 6l4 4 4-4'/></svg>")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 10px center',
        backgroundSize: 12,
        cursor: 'pointer',
      }}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

// ─── E-Mail-Vorlagen Editor ──────────────────────────────────────────────────

function EmailTemplatesEditor({
  profileId,
  templates,
  onChange,
  onServerSync,
  c,
}: {
  profileId: string;
  templates: EmailTemplate[];
  onChange: (next: EmailTemplate[]) => void;
  onServerSync: (next: EmailTemplate[]) => void;
  c: ReturnType<typeof colors>;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  function addManual() {
    onChange([
      ...templates,
      { name: `Vorlage ${templates.length + 1}`, subject: '', body: '', source: 'manual' },
    ]);
  }

  function updateTemplate(idx: number, patch: Partial<EmailTemplate>) {
    onChange(templates.map((t, i) => (i === idx ? { ...t, ...patch } : t)));
  }

  function removeTemplate(idx: number) {
    onChange(templates.filter((_, i) => i !== idx));
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploadError(null);
    setUploading(true);
    try {
      const form = new FormData();
      for (const file of Array.from(files)) {
        form.append('files', file);
      }
      const res = await fetch(`/api/absender-profile/${profileId}/generate-template`, {
        method: 'POST',
        body: form,
      });
      const json = await res.json();
      if (!res.ok || !json?.template) {
        setUploadError(json?.error ?? 'Vorlagen-Generierung fehlgeschlagen');
        return;
      }
      // Server has already persisted — use server's authoritative list if returned
      if (Array.isArray(json.templates)) {
        onServerSync(json.templates as EmailTemplate[]);
      } else {
        onServerSync([...templates, json.template as EmailTemplate]);
      }
    } catch {
      setUploadError('Vorlagen-Generierung fehlgeschlagen');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Action row */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <label
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: c.bgPage,
            color: c.text,
            border: `1px solid ${c.border}`,
            borderRadius: 7,
            padding: '7px 12px',
            fontSize: 12,
            fontWeight: 700,
            cursor: uploading ? 'wait' : 'pointer',
            fontFamily: 'var(--font-inter), sans-serif',
            opacity: uploading ? 0.6 : 1,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 12V3M4 7l4-4 4 4M3 13h10" />
          </svg>
          {uploading ? 'Generiere Vorlage…' : 'Vorlagen hochladen'}
          <input
            type="file"
            accept=".eml,.txt,.html,.htm,message/rfc822,text/plain,text/html"
            multiple
            onChange={(e) => {
              handleFiles(e.target.files);
              e.currentTarget.value = '';
            }}
            disabled={uploading}
            style={{ display: 'none' }}
          />
        </label>
        <button
          onClick={addManual}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: c.accent,
            color: c.bgPage === '#FFFFFF' ? '#fff' : c.bgPage,
            border: 'none',
            borderRadius: 7,
            padding: '7px 12px',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'var(--font-inter), sans-serif',
          }}
        >
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M8 3v10M3 8h10" />
          </svg>
          Vorlage schreiben
        </button>
        <span style={{ fontSize: 11, color: c.textSub, marginLeft: 'auto' }}>
          Lade alle bestehenden Mails hoch — daraus wird eine Vorlage generiert (.eml · .txt · .html)
        </span>
      </div>

      {uploadError && (
        <div style={{ fontSize: 12, color: c.danger, fontWeight: 600 }}>{uploadError}</div>
      )}

      {/* Templates list */}
      {templates.length === 0 ? (
        <div
          style={{
            background: c.bgPage,
            border: `1px dashed ${c.borderStrong}`,
            borderRadius: 10,
            padding: 18,
            fontSize: 12,
            color: c.textSub,
            textAlign: 'center',
            lineHeight: 1.55,
          }}
        >
          Noch keine Vorlagen. Lade alle bestehenden Mails als Beispiel hoch — daraus wird eine Vorlage
          generiert. Oder schreibe eine Vorlage manuell.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {templates.map((tpl, idx) => (
            <TemplateRow
              key={idx}
              template={tpl}
              onChange={(patch) => updateTemplate(idx, patch)}
              onRemove={() => removeTemplate(idx)}
              c={c}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TemplateRow({
  template,
  onChange,
  onRemove,
  c,
}: {
  template: EmailTemplate;
  onChange: (patch: Partial<EmailTemplate>) => void;
  onRemove: () => void;
  c: ReturnType<typeof colors>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        background: c.bgPage,
        border: `1px solid ${c.border}`,
        borderRadius: 10,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 12px',
        }}
      >
        <button
          onClick={() => setOpen((v) => !v)}
          style={{
            width: 22,
            height: 22,
            background: 'transparent',
            border: 'none',
            color: c.textSub,
            cursor: 'pointer',
            padding: 0,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label={open ? 'Einklappen' : 'Aufklappen'}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.12s' }}
          >
            <path d="M6 4l4 4-4 4" />
          </svg>
        </button>
        <input
          value={template.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Vorlagen-Name"
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: 13,
            fontWeight: 700,
            color: c.text,
            fontFamily: 'var(--font-inter), sans-serif',
          }}
        />
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: c.textSub,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            background: c.bgCard,
            border: `1px solid ${c.border}`,
            borderRadius: 4,
            padding: '2px 6px',
          }}
        >
          {template.source === 'uploaded' ? 'Upload' : 'Manuell'}
        </span>
        <button
          onClick={onRemove}
          aria-label="Entfernen"
          style={{
            width: 24,
            height: 24,
            borderRadius: 5,
            border: 'none',
            background: 'transparent',
            color: c.textSub,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>
      </div>
      {open && (
        <div
          style={{
            padding: '12px 12px 14px',
            borderTop: `1px solid ${c.border}`,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <Field label="Betreff" c={c}>
            <TextField
              value={template.subject}
              onChange={(v) => onChange({ subject: v })}
              placeholder="z.B. Kurze Frage zu {{firma}}"
              c={c}
            />
          </Field>
          <Field label="Body" c={c}>
            <TextArea
              value={template.body}
              onChange={(v) => onChange({ body: v })}
              placeholder="Hallo {{vorname}}, …"
              rows={8}
              c={c}
            />
          </Field>
        </div>
      )}
    </div>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState({
  title,
  hint,
  cta,
  onCta,
  c,
}: {
  title: string;
  hint: string;
  cta: string;
  onCta: () => void;
  c: ReturnType<typeof colors>;
}) {
  return (
    <div
      style={{
        background: c.bgCard,
        border: `1px dashed ${c.borderStrong}`,
        borderRadius: 14,
        padding: '56px 32px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 15, fontWeight: 800, color: c.text, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13, color: c.textSub, marginBottom: 18, maxWidth: 380, margin: '0 auto 18px' }}>{hint}</div>
      <button
        onClick={onCta}
        style={{
          background: c.accent,
          color: c.bg,
          border: 'none',
          borderRadius: 8,
          padding: '9px 18px',
          fontSize: 13,
          fontWeight: 700,
          cursor: 'pointer',
          fontFamily: 'var(--font-inter), sans-serif',
        }}
      >
        {cta}
      </button>
    </div>
  );
}

// ─── Tab pill ─────────────────────────────────────────────────────────────────

function TabPill({
  active,
  onClick,
  children,
  c,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  c: ReturnType<typeof colors>;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 16px',
        background: 'transparent',
        border: 'none',
        borderBottom: `2px solid ${active ? c.accent : 'transparent'}`,
        color: active ? c.text : c.textSub,
        fontSize: 13,
        fontWeight: 700,
        cursor: 'pointer',
        marginBottom: -1,
        fontFamily: 'var(--font-inter), sans-serif',
      }}
    >
      {children}
    </button>
  );
}

function Counter({ n, active, c }: { n: number; active: boolean; c: ReturnType<typeof colors> }) {
  return (
    <span
      style={{
        background: active ? c.bgHover : c.bgCard,
        color: c.textSub,
        borderRadius: 99,
        padding: '1px 7px',
        fontSize: 11,
        fontWeight: 700,
        minWidth: 18,
        textAlign: 'center',
      }}
    >
      {n}
    </span>
  );
}
