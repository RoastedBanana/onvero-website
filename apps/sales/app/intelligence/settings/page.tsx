'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTheme, colors } from '../layout';

// ─── Konstanten ───────────────────────────────────────────────────────────────

const STORAGE_ABSENDER = 'onvero.settings.absenderProfile.v1';
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
  name: string;
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

function emptyAbsender(): AbsenderProfile {
  return {
    id: uid(),
    name: 'Neues Absender-Profil',
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

  // Load Angebots-Profile from API, Absender + UI state from localStorage
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const abs = JSON.parse(localStorage.getItem(STORAGE_ABSENDER) ?? '[]') as AbsenderProfile[];
        const t = localStorage.getItem(STORAGE_TAB) as Tab | null;
        const aAng = localStorage.getItem(STORAGE_ACTIVE_ANGEBOT);
        const aAbs = localStorage.getItem(STORAGE_ACTIVE_ABSENDER);

        if (!cancelled) {
          setAbsenderProfile(Array.isArray(abs) ? abs : []);
          if (t === 'angebot' || t === 'absender') setTab(t);
          if (aAbs && abs.some((p) => p.id === aAbs)) setActiveAbsenderId(aAbs);
          else if (abs.length) setActiveAbsenderId(abs[0].id);
        }

        const res = await fetch('/api/angebots-profile', { cache: 'no-store' });
        const json = await res.json();
        const rows = Array.isArray(json?.profiles) ? (json.profiles as AngebotsProfileRow[]) : [];
        const ang = rows.map(rowToProfile);

        if (cancelled) return;
        setAngebotsProfile(ang);
        if (aAng && ang.some((p) => p.id === aAng)) setActiveAngebotId(aAng);
        else if (ang.length) setActiveAngebotId(ang[0].id);
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

  const persistAbsender = useCallback((next: AbsenderProfile[]) => {
    setAbsenderProfile(next);
    localStorage.setItem(STORAGE_ABSENDER, JSON.stringify(next));
    setSavedAt(new Date());
  }, []);

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

  function createAbsender() {
    const p = emptyAbsender();
    persistAbsender([...absenderProfile, p]);
    setActiveAbsenderId(p.id);
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
    persistAbsender(absenderProfile.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  function deleteAbsender(id: string) {
    const next = absenderProfile.filter((p) => p.id !== id);
    persistAbsender(next);
    if (activeAbsenderId === id) setActiveAbsenderId(next[0]?.id ?? null);
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
              onChange={(patch) => updateAbsender(activeAbsender.id, patch)}
              onDelete={() => deleteAbsender(activeAbsender.id)}
              c={c}
            />
          ) : (
            <EmptyState
              title="Noch kein Absender-Profil"
              hint="Hier kannst Du gleich Deine Absender konfigurieren — Felder folgen."
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
      : absenderProfile.map((p) => ({ id: p.id, label: p.name, hint: '' }));
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

// ─── Editor: Absender-Profil (Platzhalter) ───────────────────────────────────

function AbsenderEditor({
  profile,
  onChange,
  onDelete,
  c,
}: {
  profile: AbsenderProfile;
  onChange: (patch: Partial<AbsenderProfile>) => void;
  onDelete: () => void;
  c: ReturnType<typeof colors>;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card title="Absender-Profil" sub="Definiere im nächsten Schritt die Felder für dieses Profil" c={c}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Name" sub="Interner Profilname" c={c}>
            <TextField
              value={profile.name}
              onChange={(v) => onChange({ name: v })}
              placeholder="z.B. Max Mustermann — Sales"
              c={c}
            />
          </Field>
          <div
            style={{
              background: c.bgPage,
              border: `1px dashed ${c.borderStrong}`,
              borderRadius: 10,
              padding: 18,
              fontSize: 12,
              color: c.textSub,
              lineHeight: 1.55,
            }}
          >
            Felder für Absender-Profile sind noch nicht definiert. Sobald Du sagst, welche Felder dieses Profil
            haben soll (z.B. E-Mail, Rolle, Signatur, Tonalität …), erweitere ich diesen Editor.
          </div>
        </div>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
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
      </div>
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
