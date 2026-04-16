'use client';

import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useRouter } from 'next/navigation';
import LeadAvatar from '@/components/ui/LeadAvatar';
import {
  C,
  SvgIcon,
  ICONS,
  Breadcrumbs,
  GlowButton,
  GhostButton,
  StatusBadge,
  ProgressRing,
  Sparkline,
  showToast,
  PageHeader,
} from '../../_shared';
import { getLeadStats, ACCOUNT } from '../../_lead-data';
import type { Lead } from '../../_lead-data';
import { writeActivity, updateLeadStatus } from '../../_activities';
import { useLeads } from '../../_use-leads';
import { CareerSection, CollapsibleTimeline } from '../../_career-timeline';
import Link from 'next/link';

// ─── STATUS OPTIONS ──────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: Lead['status']; color: string }[] = [
  { value: 'Neu', color: 'rgba(255,255,255,0.3)' },
  { value: 'In Kontakt', color: '#A5B4FC' },
  { value: 'Qualifiziert', color: '#34D399' },
  { value: 'Verloren', color: '#F87171' },
];

function DetailStatusDropdown({
  status,
  statusOpen,
  setStatusOpen,
  onChangeStatus,
}: {
  status: Lead['status'];
  statusOpen: boolean;
  setStatusOpen: (v: boolean) => void;
  onChangeStatus: (opt: (typeof STATUS_OPTIONS)[number]) => void;
}) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ top: 0, right: 0 });

  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    setStatusOpen(!statusOpen);
  };

  return (
    <div>
      <button
        ref={btnRef}
        onClick={handleOpen}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 14px',
          borderRadius: 8,
          background: 'rgba(255,255,255,0.03)',
          border: `1px solid ${C.border}`,
          color: C.text2,
          fontSize: 12,
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        <StatusBadge status={status} />
        <svg
          width={10}
          height={10}
          viewBox="0 0 24 24"
          fill="none"
          stroke={C.text3}
          strokeWidth={2}
          strokeLinecap="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {statusOpen &&
        createPortal(
          <>
            <div onClick={() => setStatusOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 99998 }} />
            <div
              style={{
                position: 'fixed',
                top: pos.top,
                right: pos.right,
                zIndex: 99999,
                background: '#131530',
                border: `1px solid ${C.borderLight}`,
                borderRadius: 10,
                padding: 4,
                minWidth: 160,
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                animation: 'scaleIn 0.15s ease both',
              }}
            >
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onChangeStatus(opt)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 7,
                    border: 'none',
                    background: status === opt.value ? 'rgba(99,102,241,0.08)' : 'transparent',
                    color: C.text1,
                    fontSize: 12,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ width: 6, height: 6, borderRadius: 2, background: opt.color }} />
                  {opt.value}
                </button>
              ))}
            </div>
          </>,
          document.body
        )}
    </div>
  );
}

// ─── SECTION CARD ────────────────────────────────────────────────────────────

function Section({
  title,
  icon,
  color,
  children,
  actions,
}: {
  title: string;
  icon: string;
  color: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        overflow: 'hidden',
        boxShadow: '0 2px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 22px',
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              background: `${color}12`,
              border: `1px solid ${color}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SvgIcon d={icon} size={13} color={color} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 500, color: C.text1 }}>{title}</span>
        </div>
        {actions}
      </div>
      <div style={{ padding: '20px 22px' }}>{children}</div>
    </div>
  );
}

// ─── INFO ROW ────────────────────────────────────────────────────────────────

function InfoRow({
  label,
  value,
  href,
  mono,
}: {
  label: string;
  value?: string | null;
  href?: string;
  mono?: boolean;
}) {
  if (!value) return null;
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        padding: '8px 0',
        borderBottom: '1px solid rgba(255,255,255,0.03)',
      }}
    >
      <span style={{ fontSize: 12, color: C.text3 }}>{label}</span>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 12,
            color: C.accent,
            textDecoration: 'none',
            fontFamily: mono ? 'ui-monospace, SFMono-Regular, monospace' : 'inherit',
          }}
        >
          {value} <span style={{ fontSize: 9, opacity: 0.5 }}>↗</span>
        </a>
      ) : (
        <span
          style={{
            fontSize: 12,
            color: C.text2,
            fontFamily: mono ? 'ui-monospace, SFMono-Regular, monospace' : 'inherit',
            textAlign: 'right',
            maxWidth: '60%',
          }}
        >
          {value}
        </span>
      )}
    </div>
  );
}

// ─── SCORE BREAKDOWN BAR ─────────────────────────────────────────────────────

function ScoreBreakdownBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = (value / max) * 100;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 11.5, color: C.text2 }}>{label}</span>
        <span
          style={{
            fontSize: 11,
            color: C.text3,
            fontFamily: 'ui-monospace, SFMono-Regular, monospace',
          }}
        >
          {value}/{max}
        </span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            borderRadius: 3,
            background: `linear-gradient(90deg, ${color}80, ${color})`,
            boxShadow: `0 0 8px ${color}25`,
            transition: 'width 0.8s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />
      </div>
    </div>
  );
}

// ─── DEEP RESEARCH PANEL ────────────────────────────────────────────────────

const FIELD_LABELS: Record<string, string> = {
  company_description: 'Unternehmensbeschreibung',
  usp: 'USP',
  core_services: 'Kernleistungen',
  target_customers: 'Zielkunden',
  pain_points: 'Pain Points',
  growth_signals: 'Wachstumssignale',
  tech_stack: 'Tech Stack',
  automation_potential: 'Automatisierungspotenzial',
  automation_opportunities: 'Automatisierungsmöglichkeiten',
  personalization_hooks: 'Personalisierungsansätze',
  website_highlights: 'Website-Highlights',
  tone_of_voice: 'Tone of Voice',
  company_size_signals: 'Unternehmensgröße',
  partner_customer_urls: 'Partner & Kunden URLs',
  scraped_at: 'Analysiert am',
  cloudflare_blocked: 'Cloudflare blockiert',
};

const FIELD_ORDER = [
  'company_description', 'usp', 'core_services', 'target_customers',
  'pain_points', 'growth_signals', 'tech_stack', 'automation_potential',
  'automation_opportunities', 'personalization_hooks', 'website_highlights',
  'tone_of_voice', 'company_size_signals',
];

function DeepResearchPanel({ data }: { data: Record<string, unknown> }) {
  const [open, setOpen] = useState(false);

  const sortedEntries = useMemo(() => {
    const entries = Object.entries(data).filter(
      ([k]) => k !== 'scraped_at' && k !== 'cloudflare_blocked' && k !== 'partner_customer_urls'
    );
    return entries.sort((a, b) => {
      const ia = FIELD_ORDER.indexOf(a[0]);
      const ib = FIELD_ORDER.indexOf(b[0]);
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });
  }, [data]);

  const scrapedAt = data.scraped_at
    ? new Date(data.scraped_at as string).toLocaleDateString('de-DE', {
        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : null;

  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        padding: '16px 18px',
        boxShadow: '0 2px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)',
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          fontFamily: 'inherit',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <SvgIcon d={ICONS.spark} size={12} color={C.accent} />
          <span style={{ fontSize: 10, color: C.text3, letterSpacing: '0.06em', fontWeight: 500 }}>
            DEEP RESEARCH
          </span>
        </div>
        <span
          style={{
            fontSize: 10,
            color: C.text3,
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
            display: 'inline-block',
          }}
        >
          ▼
        </span>
      </button>

      {open && (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {scrapedAt && (
            <div style={{ fontSize: 10, color: C.text3, fontStyle: 'italic' }}>
              Analysiert: {scrapedAt}
            </div>
          )}

          {sortedEntries.map(([key, value]) => {
            const label = FIELD_LABELS[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

            if (value == null || (Array.isArray(value) && value.length === 0)) return null;
            if (typeof value === 'string' && !value.trim()) return null;

            return (
              <div key={key}>
                <div
                  style={{
                    fontSize: 10,
                    color: C.accent,
                    letterSpacing: '0.04em',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    marginBottom: 6,
                  }}
                >
                  {label}
                </div>

                {typeof value === 'string' && (
                  <div style={{ fontSize: 12, color: C.text2, lineHeight: 1.6 }}>
                    {value}
                  </div>
                )}

                {Array.isArray(value) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {(value as string[]).map((item, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 8,
                          fontSize: 12,
                          color: C.text2,
                          lineHeight: 1.55,
                        }}
                      >
                        <span style={{ color: C.text3, flexShrink: 0, marginTop: 1 }}>•</span>
                        <span>{String(item)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── PEOPLE FINDER MODAL ────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Person = Record<string, any>;

function SkeletonRow() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.04)', flexShrink: 0, animation: 'pulse-skel 1.5s ease infinite' }} />
      <div style={{ flex: 1 }}>
        <div style={{ height: 12, width: '45%', borderRadius: 4, background: 'rgba(255,255,255,0.05)', marginBottom: 6, animation: 'pulse-skel 1.5s ease infinite 0.1s' }} />
        <div style={{ height: 10, width: '30%', borderRadius: 4, background: 'rgba(255,255,255,0.03)', animation: 'pulse-skel 1.5s ease infinite 0.2s' }} />
      </div>
      <div style={{ height: 10, width: 80, borderRadius: 4, background: 'rgba(255,255,255,0.04)', animation: 'pulse-skel 1.5s ease infinite 0.15s' }} />
    </div>
  );
}

function PeopleFinderModal({
  open,
  onClose,
  companyName,
  companyDomain,
  leadId,
}: {
  open: boolean;
  onClose: () => void;
  companyName: string;
  companyDomain: string | null;
  leadId: string;
}) {
  const [loading, setLoading] = useState(false);
  const [people, setPeople] = useState<Person[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [fetched, setFetched] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [getEmail, setGetEmail] = useState(true);
  const [getTelephone, setGetTelephone] = useState(true);
  const [generateEmail, setGenerateEmail] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [enrichResult, setEnrichResult] = useState<{ success: boolean; message?: string } | null>(null);

  const fetchPeople = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPeople([]);
    setFetched(false);
    setSelectedId(null);
    try {
      const res = await fetch('/api/generate/apollo-people', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_name: companyName, company_domain: companyDomain, lead_id: leadId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      setPeople(data.persons ?? []);
      setFetched(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unbekannter Fehler');
    } finally {
      setLoading(false);
    }
  }, [companyName, companyDomain, leadId]);

  useEffect(() => {
    if (open && !fetched && !loading) fetchPeople();
  }, [open, fetched, loading, fetchPeople]);

  useEffect(() => {
    if (!open) { setPeople([]); setFetched(false); setSearch(''); setError(null); setSelectedId(null); setEnriching(false); setEnrichResult(null); }
  }, [open]);

  const filtered = useMemo(() => {
    if (!search.trim()) return people;
    const q = search.toLowerCase();
    return people.filter((p) => {
      const raw = p.raw_apollo_person;
      const lastName = p.last_name ?? raw?.last_name_obfuscated ?? '';
      const name = `${p.first_name ?? ''} ${lastName} ${p.full_name ?? ''}`.toLowerCase();
      const title = (p.title ?? '').toLowerCase();
      return name.includes(q) || title.includes(q);
    });
  }, [people, search]);

  const selectedPerson = people.find((p) => p.apollo_person_id === selectedId);

  const handleEnrich = useCallback(async () => {
    if (!selectedId) return;
    setEnriching(true);
    try {
      const res = await fetch('/api/generate/person-enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: leadId,
          apollo_person_id: selectedId,
          get_email: getEmail,
          get_telephone: getTelephone,
          generate_email: generateEmail,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
      const result = await res.json();
      setEnrichResult({ success: true, message: result.message ?? 'Enrichment abgeschlossen' });
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Fehler', 'error');
    } finally {
      setEnriching(false);
    }
  }, [selectedId, leadId, getEmail, getTelephone, generateEmail, onClose]);

  if (!open || typeof document === 'undefined') return null;

  const checkboxStyle = (checked: boolean): React.CSSProperties => ({
    width: 16, height: 16, borderRadius: 4, cursor: 'pointer',
    accentColor: C.accent,
  });

  return createPortal(
    <>
      <style>{`@keyframes pulse-skel { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
      <div style={{ position: 'fixed', inset: 0, zIndex: 99990, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />

        {/* Modal + bottom panel wrapper — keeps them aligned */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 80px)', width: 640, maxWidth: 'calc(100vw - 48px)' }}>

          {/* Main modal */}
          <div style={{
            background: C.surface,
            border: `1px solid ${C.borderLight}`,
            borderRadius: selectedId ? '16px 16px 0 0' : 16,
            display: 'flex', flexDirection: 'column',
            boxShadow: '0 24px 80px rgba(0,0,0,0.5), 0 0 0 0.5px rgba(255,255,255,0.04)',
            animation: 'scaleIn 0.2s cubic-bezier(0.22, 1, 0.36, 1) both',
            overflow: 'hidden', flex: 1, minHeight: 0,
          }}>
            {/* Header */}
            <div style={{ padding: '18px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.text1 }}>Ansprechpartner finden</div>
                <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>{companyName}</div>
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.text3, cursor: 'pointer', fontSize: 18, padding: '4px 8px', borderRadius: 6, lineHeight: 1 }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}>×</button>
            </div>

            {/* Search */}
            {fetched && people.length > 0 && (
              <div style={{ padding: '12px 24px 0', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 9, background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}` }}>
                  <SvgIcon d={ICONS.search} size={13} color={C.text3} />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name oder Titel suchen..."
                    style={{ flex: 1, background: 'transparent', border: 'none', fontSize: 12, color: C.text1, outline: 'none', fontFamily: 'inherit' }} />
                  {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: C.text3, cursor: 'pointer', fontSize: 12, padding: 0 }}>✕</button>}
                </div>
              </div>
            )}

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 24px 16px', minHeight: 200 }}>
              {loading && <div>{Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}</div>}

              {error && (
                <div style={{ padding: '32px 0', textAlign: 'center' }}>
                  <div style={{ fontSize: 13, color: '#F87171', marginBottom: 12 }}>{error}</div>
                  <button onClick={fetchPeople} style={{ fontSize: 12, color: C.accent, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 7, padding: '6px 16px', cursor: 'pointer', fontFamily: 'inherit' }}>Erneut versuchen</button>
                </div>
              )}

              {fetched && people.length === 0 && !loading && !error && (
                <div style={{ padding: '40px 0', textAlign: 'center' }}>
                  <SvgIcon d={ICONS.users} size={24} color={C.text3} />
                  <div style={{ fontSize: 13, color: C.text3, marginTop: 10 }}>Keine Ansprechpartner gefunden</div>
                </div>
              )}

              {fetched && filtered.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, color: C.text3, letterSpacing: '0.06em', fontWeight: 500, padding: '12px 0 8px' }}>
                    {filtered.length === people.length ? `${people.length} ANSPRECHPARTNER` : `${filtered.length} VON ${people.length} ANSPRECHPARTNERN`}
                  </div>
                  {filtered.map((p, i) => {
                    const raw = p.raw_apollo_person;
                    const lastName = p.last_name ?? raw?.last_name_obfuscated ?? '';
                    const name = p.full_name && p.full_name !== p.first_name ? p.full_name : [p.first_name, lastName].filter(Boolean).join(' ') || 'Unbekannt';
                    const title = p.title ?? null;
                    const email = p.email ?? null;
                    const phone = p.phone ?? null;
                    const linkedin = p.linkedin_url ?? null;
                    const city = p.city ?? null;
                    const photo = p.photo_url ?? null;
                    const hasEmail = raw?.has_email === true;
                    const hasPhone = raw?.has_direct_phone === 'Yes';
                    const personId = p.apollo_person_id ?? `idx-${i}`;
                    const isSelected = selectedId === personId;

                    return (
                      <div
                        key={personId}
                        onClick={() => setSelectedId(personId)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '12px 14px', margin: '0 -14px',
                          borderRadius: 10, cursor: 'pointer',
                          background: isSelected ? 'rgba(99,102,241,0.06)' : 'transparent',
                          border: isSelected ? '1px solid rgba(99,102,241,0.15)' : '1px solid transparent',
                          transition: 'all 0.15s ease',
                          animation: 'fadeIn 0.25s ease both',
                          animationDelay: `${i * 0.03}s`,
                          marginBottom: 4,
                        }}
                      >
                        {/* Radio */}
                        <input
                          type="radio"
                          name="person-select"
                          checked={isSelected}
                          onChange={() => setSelectedId(personId)}
                          style={{ accentColor: C.accent, width: 16, height: 16, cursor: 'pointer', flexShrink: 0 }}
                        />

                        {/* Avatar */}
                        {photo ? (
                          <img src={photo} alt={name} style={{ width: 36, height: 36, borderRadius: 9, objectFit: 'cover', border: `1px solid ${C.border}`, flexShrink: 0 }} />
                        ) : (
                          <div style={{
                            width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                            background: isSelected ? 'rgba(99,102,241,0.15)' : 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(99,102,241,0.04))',
                            border: `1px solid rgba(99,102,241,0.15)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 12, fontWeight: 500, color: C.accent,
                          }}>
                            {name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                        )}

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: C.text1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                          {title && <div style={{ fontSize: 11, color: C.accent, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>}
                          <div style={{ display: 'flex', gap: 6, marginTop: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                            {email ? (
                              <span style={{ fontSize: 10, color: C.text3, fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}>{email}</span>
                            ) : hasEmail ? (
                              <span style={{ fontSize: 9, color: '#34D399', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.15)', padding: '1px 6px', borderRadius: 4, fontWeight: 500 }}>E-Mail verfügbar</span>
                            ) : null}
                            {phone ? (
                              <span style={{ fontSize: 10, color: C.text3, fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}>{phone}</span>
                            ) : hasPhone ? (
                              <span style={{ fontSize: 9, color: '#38BDF8', background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.15)', padding: '1px 6px', borderRadius: 4, fontWeight: 500 }}>Telefon verfügbar</span>
                            ) : null}
                            {city && <span style={{ fontSize: 10, color: C.text3 }}>{city}</span>}
                          </div>
                        </div>

                        {/* LinkedIn */}
                        {linkedin && (
                          <a href={linkedin} target="_blank" rel="noopener noreferrer" title="LinkedIn" onClick={(e) => e.stopPropagation()}
                            style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(99,102,241,0.06)', border: `1px solid rgba(99,102,241,0.12)`, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', flexShrink: 0 }}>
                            <SvgIcon d={ICONS.globe} size={12} color={C.accent} />
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {fetched && people.length > 0 && filtered.length === 0 && search && (
                <div style={{ padding: '32px 0', textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: C.text3 }}>Keine Treffer für &quot;{search}&quot;</div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom action panel — flush with modal bottom */}
          {selectedId && (
            <div style={{
              background: C.surface,
              borderTop: `1px solid ${C.border}`,
              border: `1px solid ${C.borderLight}`,
              borderRadius: '0 0 16px 16px',
              padding: '16px 24px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              animation: 'fadeInUp 0.2s ease both',
              flexShrink: 0,
            }}>
              {enrichResult ? (
                /* ── Success state ── */
                <div style={{ textAlign: 'center', padding: '8px 0' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text1, marginBottom: 4 }}>Erledigt</div>
                  <div style={{ fontSize: 12, color: C.text3, marginBottom: 16, lineHeight: 1.5 }}>{enrichResult.message}</div>
                  <button
                    onClick={onClose}
                    className="s-primary-glow"
                    style={{
                      width: '100%', padding: '11px 0', borderRadius: 9,
                      background: 'linear-gradient(135deg, #059669, #34D399)', border: 'none',
                      color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                      boxShadow: '0 2px 16px rgba(52,211,153,0.25), inset 0 1px 0 rgba(255,255,255,0.15)',
                    }}
                  >
                    Okay
                  </button>
                </div>
              ) : (
                /* ── Selection + options state ── */
                <>
                  {/* Selected person summary */}
                  <div style={{ fontSize: 11, color: C.text3, marginBottom: 12 }}>
                    Ausgewählt: <span style={{ color: C.text1, fontWeight: 500 }}>
                      {(() => {
                        const p = selectedPerson;
                        if (!p) return '';
                        const raw = p.raw_apollo_person;
                        const lastName = p.last_name ?? raw?.last_name_obfuscated ?? '';
                        return [p.first_name, lastName].filter(Boolean).join(' ');
                      })()}
                    </span>
                    {selectedPerson?.title && <span style={{ color: C.text3 }}> — {selectedPerson.title}</span>}
                  </div>

                  {/* Checkboxes */}
                  <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, color: C.text2 }}>
                      <input type="checkbox" checked={getEmail} onChange={(e) => setGetEmail(e.target.checked)} style={checkboxStyle(getEmail)} />
                      Get E-Mail
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, color: C.text2 }}>
                      <input type="checkbox" checked={getTelephone} onChange={(e) => setGetTelephone(e.target.checked)} style={checkboxStyle(getTelephone)} />
                      Get Telephone
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, color: C.text2 }}>
                      <input type="checkbox" checked={generateEmail} onChange={(e) => setGenerateEmail(e.target.checked)} style={checkboxStyle(generateEmail)} />
                      Generate E-Mail
                    </label>
                  </div>

                  {/* Submit */}
                  <button
                    className="s-primary-glow"
                    onClick={handleEnrich}
                    disabled={enriching}
                    style={{
                      width: '100%', padding: '11px 0', borderRadius: 9,
                      background: enriching ? C.surface2 : 'linear-gradient(135deg, #6366F1, #818CF8)',
                      border: enriching ? `1px solid ${C.border}` : 'none',
                      color: enriching ? C.text3 : '#fff',
                      fontSize: 13, fontWeight: 600,
                      cursor: enriching ? 'default' : 'pointer',
                      fontFamily: 'inherit',
                      boxShadow: enriching ? 'none' : '0 2px 16px rgba(99,102,241,0.25), inset 0 1px 0 rgba(255,255,255,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}
                  >
                    {enriching ? (
                      <>
                        <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.15)', borderTopColor: 'rgba(255,255,255,0.5)', animation: 'pulse-skel 0.8s linear infinite' }} />
                        Wird gesucht...
                      </>
                    ) : (
                      <>
                        <SvgIcon d={ICONS.search} size={14} />
                        Finden
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}

// ─── CONTACT ENRICHMENT CARDS ────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Enrichment = Record<string, any>;

function ContactCard({ contact }: { contact: Enrichment }) {
  const [open, setOpen] = useState(false);
  const name = contact.full_name ?? [contact.first_name, contact.last_name].filter(Boolean).join(' ');
  const title = contact.title ?? contact.headline ?? null;
  const photo = contact.photo_url ?? null;
  const email = contact.email ?? null;
  const phone = contact.phone ?? contact.mobile_phone ?? null;
  const linkedin = contact.linkedin_url ?? null;
  const city = contact.city ?? null;
  const country = contact.country ?? null;
  const seniority = contact.seniority ?? null;
  const emailStatus = contact.email_status ?? null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const employment = (contact.employment_history as any[] | null) ?? [];
  const emailDraftSubject = contact.email_draft_subject ?? null;
  const emailDraftBody = contact.email_draft_body ?? null;

  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 12,
      overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.03)',
    }}>
      {/* Collapsed bar */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 14,
          padding: '14px 20px', background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: 'inherit', textAlign: 'left',
          transition: 'background 0.15s ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
      >
        {/* Photo */}
        {photo ? (
          <img src={photo} alt={name} style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover', border: `1px solid ${C.border}`, flexShrink: 0 }} />
        ) : (
          <div style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(99,102,241,0.04))',
            border: `1px solid rgba(99,102,241,0.15)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 500, color: C.accent,
          }}>
            {name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
        )}

        {/* Name + title */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: C.text1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
          {title && <div style={{ fontSize: 11, color: C.accent, marginTop: 1 }}>{title}</div>}
        </div>

        {/* Quick badges */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
          {email && (
            <span style={{ fontSize: 9, color: '#34D399', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.15)', padding: '2px 7px', borderRadius: 4, fontWeight: 500 }}>
              E-Mail
            </span>
          )}
          {phone && (
            <span style={{ fontSize: 9, color: '#38BDF8', background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.15)', padding: '2px 7px', borderRadius: 4, fontWeight: 500 }}>
              Telefon
            </span>
          )}
          {emailDraftBody && (
            <span style={{ fontSize: 9, color: '#A78BFA', background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.15)', padding: '2px 7px', borderRadius: 4, fontWeight: 500 }}>
              E-Mail Draft
            </span>
          )}
        </div>

        {/* Chevron */}
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={C.text3} strokeWidth={2} strokeLinecap="round"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s ease', flexShrink: 0 }}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {/* Expanded content */}
      {open && (
        <div style={{ padding: '0 20px 20px', borderTop: `1px solid ${C.border}`, animation: 'fadeIn 0.2s ease both' }}>
          {/* Contact details grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '16px 0' }}>
            {email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <SvgIcon d={ICONS.mail} size={12} color="#34D399" />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 10, color: C.text3 }}>E-Mail</div>
                  <a href={`mailto:${email}`} style={{ fontSize: 12, color: C.text1, textDecoration: 'none', fontFamily: 'ui-monospace, SFMono-Regular, monospace', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</a>
                  {emailStatus && <span style={{ fontSize: 9, color: emailStatus === 'verified' ? '#34D399' : C.text3, fontWeight: 500 }}>{emailStatus === 'verified' ? '✓ Verifiziert' : emailStatus}</span>}
                </div>
              </div>
            )}
            {phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <SvgIcon d={ICONS.mic} size={12} color="#38BDF8" />
                </div>
                <div>
                  <div style={{ fontSize: 10, color: C.text3 }}>Telefon</div>
                  <a href={`tel:${phone}`} style={{ fontSize: 12, color: C.text1, textDecoration: 'none', fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}>{phone}</a>
                </div>
              </div>
            )}
            {linkedin && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <SvgIcon d={ICONS.globe} size={12} color={C.accent} />
                </div>
                <div>
                  <div style={{ fontSize: 10, color: C.text3 }}>LinkedIn</div>
                  <a href={linkedin} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: C.accent, textDecoration: 'none' }}>Profil öffnen ↗</a>
                </div>
              </div>
            )}
            {(city || country) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <SvgIcon d={ICONS.home} size={12} color={C.text3} />
                </div>
                <div>
                  <div style={{ fontSize: 10, color: C.text3 }}>Standort</div>
                  <div style={{ fontSize: 12, color: C.text2 }}>{[city, country].filter(Boolean).join(', ')}</div>
                </div>
              </div>
            )}
            {seniority && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <SvgIcon d={ICONS.users} size={12} color={C.text3} />
                </div>
                <div>
                  <div style={{ fontSize: 10, color: C.text3 }}>Seniorität</div>
                  <div style={{ fontSize: 12, color: C.text2, textTransform: 'capitalize' }}>{seniority}</div>
                </div>
              </div>
            )}
          </div>

          {/* Employment history */}
          {employment.length > 0 && (
            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16, marginTop: 4 }}>
              <div style={{ fontSize: 10, color: C.text3, letterSpacing: '0.06em', fontWeight: 500, marginBottom: 10 }}>KARRIERE</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {employment.slice(0, 5).map((e: Enrichment, i: number) => (
                  <div key={e.id ?? i} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: i < Math.min(employment.length, 5) - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                    <div style={{ width: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 6, flexShrink: 0 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: e.current ? C.accent : C.text3, flexShrink: 0 }} />
                      {i < Math.min(employment.length, 5) - 1 && <div style={{ width: 1, flex: 1, background: 'rgba(255,255,255,0.06)', marginTop: 4 }} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: e.current ? C.text1 : C.text2 }}>{e.title}</div>
                      <div style={{ fontSize: 11, color: C.text3, marginTop: 1 }}>
                        {e.organization_name}
                        {e.start_date && <span> · {e.start_date.slice(0, 7)}{e.current ? ' – heute' : e.end_date ? ` – ${e.end_date.slice(0, 7)}` : ''}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Email draft */}
          {emailDraftBody && (
            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16, marginTop: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontSize: 10, color: C.text3, letterSpacing: '0.06em', fontWeight: 500 }}>E-MAIL DRAFT</div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`Betreff: ${emailDraftSubject ?? ''}\n\n${emailDraftBody}`);
                    showToast('E-Mail kopiert', 'success');
                  }}
                  style={{ fontSize: 10, color: C.text3, background: 'none', border: `1px solid ${C.border}`, borderRadius: 5, padding: '3px 8px', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Kopieren
                </button>
              </div>
              {emailDraftSubject && (
                <div style={{ fontSize: 11, color: C.text1, fontWeight: 500, marginBottom: 8, padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.04)' }}>
                  Betreff: {emailDraftSubject}
                </div>
              )}
              <pre style={{ fontSize: 12, color: C.text2, lineHeight: 1.7, fontFamily: 'inherit', whiteSpace: 'pre-wrap', margin: 0 }}>
                {emailDraftBody}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ContactEnrichments({ leadId }: { leadId: string }) {
  const [contacts, setContacts] = useState<Enrichment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { createBrowserClient } = await import('@supabase/ssr');
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data } = await supabase
          .from('lead_contact_enrichments')
          .select('*')
          .eq('lead_id', leadId)
          .order('created_at', { ascending: false });
        setContacts(data ?? []);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    })();
  }, [leadId]);

  if (loading || contacts.length === 0) return null;

  return (
    <div style={{ animation: 'fadeInUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.25s both' }}>
      <div style={{ fontSize: 10, color: C.text3, letterSpacing: '0.06em', fontWeight: 500, marginBottom: 10 }}>
        ANSPRECHPARTNER ({contacts.length})
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {contacts.map((c) => <ContactCard key={c.id} contact={c} />)}
      </div>
    </div>
  );
}

// ─── PAGE ────────────────────────────────────────────────────────────────────

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { leads: liveLeads, loading: leadsLoading } = useLeads();
  const lead = liveLeads.find((l) => l.id === id) ?? null;

  const [status, setStatus] = useState<Lead['status']>('Neu');
  const [statusOpen, setStatusOpen] = useState(false);
  const [notes, setNotes] = useState<string[]>([]);
  const [newNote, setNewNote] = useState('');
  const [emailExpanded, setEmailExpanded] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [peopleModalOpen, setPeopleModalOpen] = useState(false);

  // Sync state when lead loads
  if (lead && !initialized) {
    setStatus(lead.status);
    setNotes(lead.notes ?? []);
    setInitialized(true);
  }

  if (leadsLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '40px 0' }}>
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            border: `2px solid ${C.border}`,
            borderTopColor: C.accent,
            animation: 'gradient-spin 0.8s linear infinite',
          }}
        />
        <span style={{ fontSize: 13, color: C.text2 }}>Lead wird geladen...</span>
      </div>
    );
  }

  if (!lead) {
    return (
      <>
        <Breadcrumbs
          items={[
            { label: 'Onvero Sales', href: '/sales' },
            { label: 'Leads', href: '/sales/leads' },
            { label: 'Nicht gefunden' },
          ]}
        />
        <div
          style={{
            padding: '80px 24px',
            textAlign: 'center',
            animation: 'fadeInUp 0.4s ease both',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: 'rgba(248,113,113,0.08)',
              border: '1px solid rgba(248,113,113,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px',
            }}
          >
            <SvgIcon d={ICONS.search} size={22} color={C.danger} />
          </div>
          <h2 style={{ fontSize: 16, color: C.text1, margin: '0 0 6px' }}>Unternehmen nicht gefunden</h2>
          <p style={{ fontSize: 12, color: C.text3, margin: '0 0 20px' }}>Das Unternehmen mit ID &quot;{id}&quot; existiert nicht.</p>
          <GhostButton onClick={() => router.push('/sales/leads')}>← Zurück</GhostButton>
        </div>
      </>
    );
  }

  // Organisation data is now directly on the lead (no nested object)
  const org = {
    name: lead.company,
    industry: lead.industry,
    city: lead.city,
    country: lead.country,
    estimatedNumEmployees: lead.employeeCount,
    foundedYear: lead.foundedYear,
    websiteUrl: lead.website,
    primaryDomain: lead.primaryDomain,
    logoUrl: lead.logoUrl,
    linkedinUrl: lead.linkedinUrl,
    annualRevenuePrinted: lead.annualRevenuePrinted,
    technologies: lead.technologyNames,
    shortDescription: lead.summary,
    phone: lead.phone,
    keywords: lead.tags,
  };
  const s = lead.score ?? 0;
  const scoreColor = s >= 70 ? '#818CF8' : s >= 50 ? '#FBBF24' : '#F87171';

  function addNote() {
    if (!newNote.trim()) return;
    const text = newNote.trim();
    setNotes((prev) => [text, ...prev]);
    setNewNote('');
    showToast('Notiz hinzugefügt', 'success');
    if (lead) writeActivity(lead.id, 'note_added', `Notiz hinzugefügt`, text);
  }

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Onvero Sales', href: '/sales' },
          { label: 'Unternehmen', href: '/sales/leads' },
          { label: org?.name ?? lead.company },
        ]}
      />

      {/* ── HERO HEADER ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          animation: 'fadeInUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          {/* Avatar */}
          {lead.logoUrl ? (
            <img src={lead.logoUrl} alt={lead.company} style={{ width: 56, height: 56, borderRadius: 14, objectFit: 'cover', border: `1px solid ${C.border}`, background: '#fff' }} />
          ) : (
            <LeadAvatar website={lead.website} companyName={lead.company} score={lead.score ?? undefined} size="lg" />
          )}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontSize: 22, fontWeight: 600, color: C.text1, margin: 0, letterSpacing: '-0.02em' }}>
                {lead.company}
              </h1>
              {lead.tier && (
                <span style={{
                  padding: '2px 8px',
                  borderRadius: 5,
                  fontSize: 10,
                  fontWeight: 600,
                  background: lead.tier === 'Hot' ? 'rgba(248,113,113,0.08)' : lead.tier === 'Warm' ? 'rgba(251,191,36,0.08)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${lead.tier === 'Hot' ? 'rgba(248,113,113,0.2)' : lead.tier === 'Warm' ? 'rgba(251,191,36,0.2)' : C.border}`,
                  color: lead.tier === 'Hot' ? '#F87171' : lead.tier === 'Warm' ? '#FBBF24' : C.text3,
                }}>
                  {lead.tier}
                </span>
              )}
              {lead.isExcluded && (
                <span style={{ padding: '2px 8px', borderRadius: 5, fontSize: 10, fontWeight: 600, background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)', color: '#F87171' }}>
                  Ausgeschlossen
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, color: C.text3, marginTop: 5, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              {lead.industry && (
                <span style={{ padding: '2px 8px', borderRadius: 5, fontSize: 10, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.12)', color: C.accentBright, fontWeight: 500 }}>
                  {lead.industry}
                </span>
              )}
              {lead.companyType && (
                <span style={{ padding: '2px 8px', borderRadius: 5, fontSize: 10, background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.12)', color: '#38BDF8', fontWeight: 500 }}>
                  {lead.companyType}
                </span>
              )}
              {lead.city && <span>{lead.city}{lead.country ? `, ${lead.country}` : ''}</span>}
              {lead.employees && (
                <><span style={{ opacity: 0.25 }}>·</span><span>{lead.employees} Mitarbeiter</span></>
              )}
              {lead.foundedYear && (
                <><span style={{ opacity: 0.25 }}>·</span><span>Gegr. {lead.foundedYear}</span></>
              )}
            </div>
            {(lead.primaryDomain ?? lead.website) && (
              <a href={lead.website ?? '#'} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: C.accent, textDecoration: 'none', marginTop: 4, display: 'inline-block' }}>
                {lead.primaryDomain ?? lead.website?.replace(/^https?:\/\//, '').replace(/\/$/, '')} ↗
              </a>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Ansprechpartner finden button */}
          <button
            className="s-primary-glow"
            onClick={() => setPeopleModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '9px 16px',
              borderRadius: 9,
              background: 'linear-gradient(135deg, #6366F1, #818CF8)',
              border: 'none',
              color: '#fff',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'inherit',
              boxShadow: '0 2px 16px rgba(99,102,241,0.25), inset 0 1px 0 rgba(255,255,255,0.15)',
            }}
          >
            <SvgIcon d={ICONS.users} size={13} />
            Ansprechpartner finden
          </button>

          {/* Status dropdown */}
          <DetailStatusDropdown
            status={status}
            statusOpen={statusOpen}
            setStatusOpen={setStatusOpen}
            onChangeStatus={(opt) => {
              const oldStatus = status;
              setStatus(opt.value);
              setStatusOpen(false);
              showToast(`Status → ${opt.value}`, 'success');
              updateLeadStatus(lead.id, oldStatus, opt.value);
            }}
          />

          <GhostButton onClick={() => router.push('/sales/leads')}>← Zurück</GhostButton>
        </div>
      </div>

      {/* ── NEXT ACTION BANNER ── */}
      {lead.nextAction && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 20px',
            borderRadius: 12,
            background:
              s >= 70
                ? 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(99,102,241,0.02))'
                : 'rgba(255,255,255,0.02)',
            border: `1px solid ${s >= 70 ? 'rgba(99,102,241,0.15)' : C.border}`,
            animation: 'fadeInUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) 0.08s both',
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: s >= 70 ? 'rgba(99,102,241,0.1)' : 'rgba(251,191,36,0.08)',
              border: `1px solid ${s >= 70 ? 'rgba(99,102,241,0.2)' : 'rgba(251,191,36,0.15)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <SvgIcon d={ICONS.zap} size={14} color={s >= 70 ? C.accent : '#FBBF24'} />
          </div>
          <div>
            <div style={{ fontSize: 10, color: C.text3, letterSpacing: '0.06em', fontWeight: 500 }}>
              EMPFOHLENE AKTION
            </div>
            <div style={{ fontSize: 13, color: C.text1, fontWeight: 500, marginTop: 2 }}>{lead.nextAction}</div>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT — 2 columns ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 360px',
          gap: 16,
          animation: 'fadeInUp 0.45s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both',
        }}
      >
        {/* LEFT COLUMN — Main content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* KI-Score + Breakdown */}
          <Section title="KI-Score Analyse" icon={ICONS.spark} color="#818CF8">
            <div style={{ display: 'flex', gap: 24, marginBottom: 20 }}>
              <ProgressRing value={s} max={100} size={80} strokeWidth={5} color={scoreColor} label={s > 0 ? `${s}` : '—'} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: C.text1, fontWeight: 500, marginBottom: 4 }}>
                  {s === 0 ? 'Score noch nicht berechnet' : s >= 70 ? 'Hot Lead — Sofort kontaktieren' : s >= 50 ? 'Warm Lead — Potenzial vorhanden' : 'Cold Lead — Beobachten'}
                </div>
                {s > 0 && (() => { const avg = getLeadStats(liveLeads).avgScore; const diff = s - avg; return (<div style={{ fontSize: 11, color: diff > 0 ? C.success : C.danger, marginBottom: 8 }}>{diff > 0 ? `+${diff}` : diff} Punkte vs. Ø {avg} aller Leads</div>); })()}
                {lead.scoreBreakdown.length > 0 && <Sparkline data={lead.scoreBreakdown.map((sb) => sb.value)} width={200} height={24} color={scoreColor} />}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {lead.scoreBreakdown.map((sb) => (
                <ScoreBreakdownBar key={sb.label} {...sb} color={sb.value / sb.max > 0.8 ? '#34D399' : sb.value / sb.max > 0.6 ? '#818CF8' : '#FBBF24'} />
              ))}
            </div>
          </Section>

          {/* KI-Analyse (Summary) */}
          {lead.summary && (
            <Section title="KI-Analyse" icon={ICONS.spark} color="#A78BFA">
              <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.75, margin: 0 }}>{lead.summary}</p>
              {lead.tags.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 14 }}>
                  {lead.tags.map((tag) => (
                    <span key={tag} style={{ padding: '3px 10px', borderRadius: 6, fontSize: 10, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.12)', color: C.accentBright, fontWeight: 500 }}>{tag}</span>
                  ))}
                </div>
              )}
            </Section>
          )}

          {/* Strengths & Concerns */}
          {(lead.strengths.length > 0 || lead.concerns.length > 0) && (
            <div style={{ display: 'grid', gridTemplateColumns: lead.strengths.length > 0 && lead.concerns.length > 0 ? '1fr 1fr' : '1fr', gap: 16 }}>
              {lead.strengths.length > 0 && (
                <Section title="Stärken" icon={ICONS.zap} color="#34D399">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {lead.strengths.map((s, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12, color: C.text2, lineHeight: 1.55 }}>
                        <span style={{ color: '#34D399', flexShrink: 0, marginTop: 1 }}>✓</span>
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                </Section>
              )}
              {lead.concerns.length > 0 && (
                <Section title="Bedenken" icon={ICONS.eye} color="#FBBF24">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {lead.concerns.map((c, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12, color: C.text2, lineHeight: 1.55 }}>
                        <span style={{ color: '#FBBF24', flexShrink: 0, marginTop: 1 }}>⚠</span>
                        <span>{c}</span>
                      </div>
                    ))}
                  </div>
                </Section>
              )}
            </div>
          )}

          {/* Website Deep Research */}
          {(lead.companyDescription || lead.usp || lead.coreServices || lead.painPoints || lead.growthSignals) && (
            <Section title="Website-Analyse" icon={ICONS.globe} color="#38BDF8"
              actions={lead.websiteScrapedAt ? <span style={{ fontSize: 10, color: C.text3 }}>Analysiert: {new Date(lead.websiteScrapedAt).toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' })}</span> : undefined}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {lead.companyDescription && (
                  <div>
                    <div style={{ fontSize: 10, color: '#38BDF8', letterSpacing: '0.04em', fontWeight: 600, textTransform: 'uppercase' as const, marginBottom: 6 }}>Beschreibung</div>
                    <div style={{ fontSize: 12, color: C.text2, lineHeight: 1.65 }}>{lead.companyDescription}</div>
                  </div>
                )}
                {lead.usp && (
                  <div>
                    <div style={{ fontSize: 10, color: '#38BDF8', letterSpacing: '0.04em', fontWeight: 600, textTransform: 'uppercase' as const, marginBottom: 6 }}>USP</div>
                    <div style={{ fontSize: 12, color: C.text2, lineHeight: 1.65 }}>{lead.usp}</div>
                  </div>
                )}
                {lead.coreServices && lead.coreServices.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, color: '#38BDF8', letterSpacing: '0.04em', fontWeight: 600, textTransform: 'uppercase' as const, marginBottom: 6 }}>Kernleistungen</div>
                    {lead.coreServices.map((s, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12, color: C.text2, lineHeight: 1.55, marginBottom: 4 }}>
                        <span style={{ color: C.text3, flexShrink: 0 }}>•</span><span>{s}</span>
                      </div>
                    ))}
                  </div>
                )}
                {lead.targetCustomers && (
                  <div>
                    <div style={{ fontSize: 10, color: '#38BDF8', letterSpacing: '0.04em', fontWeight: 600, textTransform: 'uppercase' as const, marginBottom: 6 }}>Zielkunden</div>
                    <div style={{ fontSize: 12, color: C.text2, lineHeight: 1.65 }}>{lead.targetCustomers}</div>
                  </div>
                )}
                {lead.painPoints && lead.painPoints.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, color: '#38BDF8', letterSpacing: '0.04em', fontWeight: 600, textTransform: 'uppercase' as const, marginBottom: 6 }}>Pain Points</div>
                    {lead.painPoints.map((p, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12, color: C.text2, lineHeight: 1.55, marginBottom: 4 }}>
                        <span style={{ color: '#F87171', flexShrink: 0 }}>•</span><span>{p}</span>
                      </div>
                    ))}
                  </div>
                )}
                {lead.growthSignals && lead.growthSignals.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, color: '#38BDF8', letterSpacing: '0.04em', fontWeight: 600, textTransform: 'uppercase' as const, marginBottom: 6 }}>Wachstumssignale</div>
                    {lead.growthSignals.map((g, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12, color: C.text2, lineHeight: 1.55, marginBottom: 4 }}>
                        <span style={{ color: '#34D399', flexShrink: 0 }}>↑</span><span>{g}</span>
                      </div>
                    ))}
                  </div>
                )}
                {lead.automationPotential && (
                  <div>
                    <div style={{ fontSize: 10, color: '#38BDF8', letterSpacing: '0.04em', fontWeight: 600, textTransform: 'uppercase' as const, marginBottom: 6 }}>Automatisierungspotenzial</div>
                    <div style={{ fontSize: 12, color: C.text2, lineHeight: 1.65 }}>{lead.automationPotential}</div>
                  </div>
                )}
                {lead.automationOpportunities && lead.automationOpportunities.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, color: '#38BDF8', letterSpacing: '0.04em', fontWeight: 600, textTransform: 'uppercase' as const, marginBottom: 6 }}>Automatisierungsmöglichkeiten</div>
                    {lead.automationOpportunities.map((a, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12, color: C.text2, lineHeight: 1.55, marginBottom: 4 }}>
                        <span style={{ color: C.accent, flexShrink: 0 }}>→</span><span>{a}</span>
                      </div>
                    ))}
                  </div>
                )}
                {lead.websiteHighlights && (
                  <div>
                    <div style={{ fontSize: 10, color: '#38BDF8', letterSpacing: '0.04em', fontWeight: 600, textTransform: 'uppercase' as const, marginBottom: 6 }}>Website-Highlights</div>
                    <div style={{ fontSize: 12, color: C.text2, lineHeight: 1.65 }}>{lead.websiteHighlights}</div>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Outreach-Hilfe (Follow-up Context) */}
          {lead.followUpContext?.conversation_opener && (
            <Section title="Outreach-Hilfe" icon={ICONS.mail} color="#34D399">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 10, color: '#34D399', letterSpacing: '0.04em', fontWeight: 600, textTransform: 'uppercase' as const, marginBottom: 6 }}>Gesprächseröffner</div>
                  <div style={{ fontSize: 12, color: C.text2, lineHeight: 1.65, padding: '12px 14px', borderRadius: 8, background: 'rgba(52,211,153,0.04)', border: '1px solid rgba(52,211,153,0.1)' }}>
                    {lead.followUpContext.conversation_opener}
                  </div>
                </div>
                {lead.followUpContext.personalization_hooks && lead.followUpContext.personalization_hooks.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, color: '#34D399', letterSpacing: '0.04em', fontWeight: 600, textTransform: 'uppercase' as const, marginBottom: 6 }}>Personalisierungsansätze</div>
                    {lead.followUpContext.personalization_hooks.map((h, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12, color: C.text2, lineHeight: 1.55, marginBottom: 4 }}>
                        <span style={{ color: '#34D399', flexShrink: 0 }}>💡</span><span>{h}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* E-Mail Draft — mail-style layout */}
          {lead.emailDraftBody && (
            <Section
              title="E-Mail Draft"
              icon={ICONS.mail}
              color="#34D399"
              actions={
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `Betreff: ${lead.emailDraftSubject ?? ''}\n\n${lead.emailDraftBody!}`
                      );
                      showToast('E-Mail kopiert', 'success');
                      writeActivity(lead.id, 'email_draft', 'E-Mail-Draft kopiert', lead.emailDraftSubject);
                    }}
                    style={{
                      fontSize: 11,
                      color: C.text3,
                      background: 'none',
                      border: `1px solid ${C.border}`,
                      borderRadius: 6,
                      padding: '4px 10px',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    Kopieren
                  </button>
                  <button
                    onClick={() => {
                      showToast('E-Mail wird gesendet...', 'info');
                      writeActivity(lead.id, 'email_sent', 'E-Mail versendet', lead.emailDraftSubject);
                    }}
                    style={{
                      fontSize: 11,
                      color: '#34D399',
                      background: 'rgba(52,211,153,0.08)',
                      border: '1px solid rgba(52,211,153,0.15)',
                      borderRadius: 6,
                      padding: '4px 10px',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    Senden
                  </button>
                </div>
              }
            >
              {/* Mail header rows */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  padding: '12px 14px',
                  borderRadius: 8,
                  marginBottom: 14,
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <div style={{ display: 'flex', gap: 8, fontSize: 11.5 }}>
                  <span style={{ color: C.text3, width: 48, flexShrink: 0 }}>Von</span>
                  <span style={{ color: C.text2 }}>
                    {ACCOUNT.senderName} &lt;{ACCOUNT.senderName.toLowerCase().replace(' ', '.')}
                    @smartparcelsolutions.de&gt;
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8, fontSize: 11.5 }}>
                  <span style={{ color: C.text3, width: 48, flexShrink: 0 }}>An</span>
                  <span style={{ color: C.text2 }}>
                    {lead.name} {lead.email ? `<${lead.email}>` : '(keine E-Mail)'}
                  </span>
                </div>
                {lead.emailDraftSubject && (
                  <div
                    style={{
                      display: 'flex',
                      gap: 8,
                      fontSize: 11.5,
                      borderTop: '1px solid rgba(255,255,255,0.04)',
                      paddingTop: 6,
                    }}
                  >
                    <span style={{ color: C.text3, width: 48, flexShrink: 0 }}>Betreff</span>
                    <span style={{ color: C.text1, fontWeight: 500 }}>{lead.emailDraftSubject}</span>
                  </div>
                )}
              </div>
              {/* Mail body */}
              <pre
                style={{
                  fontSize: 12.5,
                  color: C.text2,
                  lineHeight: 1.75,
                  fontFamily: 'inherit',
                  whiteSpace: 'pre-wrap',
                  margin: 0,
                }}
              >
                {lead.emailDraftBody}
              </pre>
            </Section>
          )}

          {/* Career History — collapsible with glow animation */}
          {lead.employmentHistory && lead.employmentHistory.length > 0 && (
            <CareerSection entries={lead.employmentHistory} />
          )}

          {/* Timeline — collapsible, LIVE from Supabase Realtime */}
          <CollapsibleTimeline leadId={lead.id} />
        </div>

        {/* RIGHT COLUMN — Sidebar info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Contact Person Card */}
          {(() => {
            const fields = [lead.email, lead.phone, lead.linkedinUrl, lead.jobTitle];
            const filled = fields.filter(Boolean).length;
            const pct = Math.round((filled / fields.length) * 100);
            const copyBtn = (text: string) => (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  navigator.clipboard.writeText(text);
                  showToast('Kopiert', 'success');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 2,
                  flexShrink: 0,
                  opacity: 0.4,
                }}
                title="Kopieren"
              >
                <svg
                  width={12}
                  height={12}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={C.text3}
                  strokeWidth={1.5}
                  strokeLinecap="round"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
              </button>
            );
            return (
              <div
                style={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 14,
                  overflow: 'hidden',
                  boxShadow: '0 2px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)',
                }}
              >
                <div
                  style={{
                    padding: '16px 22px',
                    borderBottom: `1px solid ${C.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <SvgIcon d={ICONS.users} size={13} color={C.accent} />
                    <span style={{ fontSize: 12, fontWeight: 500, color: C.text1 }}>Kontaktperson</span>
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      color: pct === 100 ? C.success : C.text3,
                      fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                    }}
                  >
                    {pct}% vollständig
                  </span>
                </div>
                <div style={{ padding: '16px 22px' }}>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: C.text1 }}>{lead.name}</div>
                    {lead.jobTitle && (
                      <div style={{ fontSize: 12, color: C.accent, marginTop: 3 }}>{lead.jobTitle}</div>
                    )}
                  </div>

                  {/* Completeness bar */}
                  <div
                    style={{
                      height: 3,
                      borderRadius: 2,
                      background: 'rgba(255,255,255,0.04)',
                      marginBottom: 14,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        height: '100%',
                        borderRadius: 2,
                        background: pct === 100 ? C.success : pct >= 50 ? C.accent : '#FBBF24',
                        transition: 'width 0.8s ease',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {/* Email */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 7,
                          flexShrink: 0,
                          background: lead.email ? 'rgba(52,211,153,0.08)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${lead.email ? 'rgba(52,211,153,0.15)' : C.border}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <SvgIcon d={ICONS.mail} size={12} color={lead.email ? '#34D399' : C.text3} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {lead.email ? (
                          <a
                            href={`mailto:${lead.email}`}
                            style={{
                              fontSize: 12,
                              color: C.text1,
                              textDecoration: 'none',
                              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              display: 'block',
                            }}
                          >
                            {lead.email}
                          </a>
                        ) : (
                          <span style={{ fontSize: 12, color: C.text3 }}>Keine E-Mail verfügbar</span>
                        )}
                        {lead.emailStatus && (
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 600,
                              letterSpacing: '0.04em',
                              color: lead.emailStatus === 'verified' ? '#34D399' : C.text3,
                              marginTop: 1,
                              display: 'block',
                            }}
                          >
                            {lead.emailStatus === 'verified' ? '✓ VERIFIZIERT' : 'NICHT VERIFIZIERT'}
                          </span>
                        )}
                      </div>
                      {lead.email && copyBtn(lead.email)}
                    </div>

                    {/* Phone */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 7,
                          flexShrink: 0,
                          background: lead.phone ? 'rgba(56,189,248,0.08)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${lead.phone ? 'rgba(56,189,248,0.15)' : C.border}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <SvgIcon d={ICONS.mic} size={12} color={lead.phone ? '#38BDF8' : C.text3} />
                      </div>
                      {lead.phone ? (
                        <a
                          href={`tel:${lead.phone}`}
                          style={{
                            fontSize: 12,
                            color: C.text1,
                            textDecoration: 'none',
                            flex: 1,
                            fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                          }}
                        >
                          {lead.phone}
                        </a>
                      ) : (
                        <span style={{ fontSize: 12, color: C.text3, fontStyle: 'italic', flex: 1 }}>
                          Telefonnummer fehlt
                        </span>
                      )}
                      {lead.phone && copyBtn(lead.phone)}
                    </div>

                    {/* LinkedIn */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 7,
                          flexShrink: 0,
                          background: lead.linkedinUrl ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${lead.linkedinUrl ? 'rgba(99,102,241,0.15)' : C.border}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <SvgIcon d={ICONS.globe} size={12} color={lead.linkedinUrl ? C.accent : C.text3} />
                      </div>
                      {lead.linkedinUrl ? (
                        <a
                          href={lead.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: 12,
                            color: C.accent,
                            textDecoration: 'none',
                            flex: 1,
                          }}
                        >
                          LinkedIn Profil ↗
                        </a>
                      ) : (
                        <span style={{ fontSize: 12, color: C.text3, flex: 1 }}>Kein LinkedIn</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Company Info Card */}
          <div
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 14,
              padding: '20px 22px',
              boxShadow: '0 2px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <SvgIcon d={ICONS.globe} size={13} color="#38BDF8" />
              <span style={{ fontSize: 12, fontWeight: 500, color: C.text1 }}>Unternehmensdaten</span>
            </div>
            <InfoRow label="Firma" value={org?.name ?? lead.company} />
            <InfoRow
              label="Website"
              value={(org?.websiteUrl ?? lead.website)?.replace(/^https?:\/\//, '').replace(/\/$/, '') ?? null}
              href={org?.websiteUrl ?? lead.website ?? undefined}
            />
            <InfoRow label="Branche" value={org?.industry ?? lead.industry} />
            {org?.industries && org.industries.length > 0 && (
              <InfoRow label="Weitere Branchen" value={org.industries.join(', ')} />
            )}
            <InfoRow
              label="Mitarbeiter"
              value={
                org?.estimatedNumEmployees
                  ? `~${org.estimatedNumEmployees.toLocaleString('de-DE')}`
                  : lead.employeeCount
                    ? `~${lead.employeeCount.toLocaleString('de-DE')}`
                    : lead.employees !== 'Unbekannt' ? lead.employees : null
              }
            />
            {org?.foundedYear && <InfoRow label="Gegründet" value={String(org.foundedYear)} />}
            {org?.annualRevenuePrinted && <InfoRow label="Jahresumsatz" value={org.annualRevenuePrinted} />}
            {org?.totalFundingPrinted && <InfoRow label="Funding" value={org.totalFundingPrinted} />}
            {org?.latestFundingStage && <InfoRow label="Funding-Phase" value={org.latestFundingStage} />}
            <InfoRow label="Standort" value={[org?.city ?? lead.city, org?.country ?? lead.country].filter(Boolean).join(', ')} />
            {org?.street && <InfoRow label="Adresse" value={[org.street, org.postalCode, org.city].filter(Boolean).join(', ')} />}
            {org?.phone && <InfoRow label="Telefon" value={org.phone} />}
            {lead.linkedinUrl && <InfoRow label="LinkedIn" value="Firmenprofil" href={lead.linkedinUrl} />}
            {lead.twitterUrl && <InfoRow label="Twitter" value="Profil" href={lead.twitterUrl} />}
            {lead.facebookUrl && <InfoRow label="Facebook" value="Seite" href={lead.facebookUrl} />}
            <InfoRow label="Quelle" value={lead.source} />
            <InfoRow label="Erstellt am" value={lead.createdAt} />
            {lead.lastContactedAt && <InfoRow label="Zuletzt kontaktiert" value={lead.lastContactedAt} />}
          </div>

          {/* Technologies */}
          {((lead.techStack && lead.techStack.length > 0) || (lead.technologyNames && lead.technologyNames.length > 0)) && (
            <div
              style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 14,
                padding: '16px 22px',
                boxShadow: '0 2px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <SvgIcon d={ICONS.zap} size={13} color="#A78BFA" />
                <span style={{ fontSize: 12, fontWeight: 500, color: C.text1 }}>Technologien</span>
              </div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {[...(lead.techStack ?? []), ...(lead.technologyNames ?? [])].filter((v, i, a) => a.indexOf(v) === i).map((tech) => (
                  <span
                    key={tech}
                    style={{
                      padding: '3px 9px',
                      borderRadius: 5,
                      fontSize: 10,
                      background: 'rgba(167,139,250,0.06)',
                      border: '1px solid rgba(167,139,250,0.12)',
                      color: '#A78BFA',
                      fontWeight: 500,
                    }}
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 14,
              padding: '16px 18px',
              boxShadow: '0 2px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <div style={{ fontSize: 10, color: C.text3, letterSpacing: '0.06em', fontWeight: 500, marginBottom: 4 }}>
              AKTIONEN
            </div>
            {[
              {
                label: 'E-Mail senden',
                icon: ICONS.mail,
                color: '#34D399',
                action: () => {
                  showToast('E-Mail wird gesendet...', 'info');
                  writeActivity(lead.id, 'email_sent', 'E-Mail versendet');
                },
              },
              {
                label: 'Meeting planen',
                icon: ICONS.calendar,
                color: '#38BDF8',
                action: () => {
                  showToast('Meeting-Planer öffnet...', 'info');
                  writeActivity(lead.id, 'meeting_scheduled', 'Meeting geplant');
                },
              },
              {
                label: 'KI-Rescore',
                icon: ICONS.spark,
                color: '#818CF8',
                action: () => {
                  showToast('Rescore wird gestartet...', 'info');
                  writeActivity(lead.id, 'score_update', 'KI-Rescore angefordert');
                },
              },
            ].map((a) => (
              <button
                key={a.label}
                onClick={a.action}
                className="s-nav"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: 'none',
                  width: '100%',
                  background: 'transparent',
                  color: C.text2,
                  fontSize: 12,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    background: `${a.color}10`,
                    border: `1px solid ${a.color}18`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <SvgIcon d={a.icon} size={11} color={a.color} />
                </div>
                {a.label}
              </button>
            ))}
          </div>

          {/* Notes */}
          <div
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 14,
              padding: '16px 18px',
              boxShadow: '0 2px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)',
            }}
          >
            <div style={{ fontSize: 10, color: C.text3, letterSpacing: '0.06em', fontWeight: 500, marginBottom: 12 }}>
              NOTIZEN
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: notes.length > 0 ? 12 : 0 }}>
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addNote();
                }}
                placeholder="Notiz hinzufügen..."
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${C.border}`,
                  borderRadius: 7,
                  padding: '7px 12px',
                  fontSize: 12,
                  color: C.text1,
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
              <button
                onClick={addNote}
                style={{
                  background: 'rgba(99,102,241,0.08)',
                  border: '1px solid rgba(99,102,241,0.15)',
                  borderRadius: 7,
                  padding: '0 12px',
                  color: C.accent,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontFamily: 'inherit',
                }}
              >
                +
              </button>
            </div>
            {notes.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {notes.map((note, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 7,
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.04)',
                      fontSize: 12,
                      color: C.text2,
                      lineHeight: 1.5,
                    }}
                  >
                    {note}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Deep Research */}
          {lead.websiteData && Object.keys(lead.websiteData).length > 0 && (
            <DeepResearchPanel data={lead.websiteData} />
          )}
        </div>
      </div>

      {/* ── SIMILAR LEADS ── */}
      {(() => {
        const similar = liveLeads
          .filter((l) => l.id !== lead.id && l.industry === lead.industry)
          .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
          .slice(0, 3);
        if (similar.length === 0) return null;
        return (
          <div style={{ animation: 'fadeInUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.2s both' }}>
            <div style={{ fontSize: 10, color: C.text3, letterSpacing: '0.06em', fontWeight: 500, marginBottom: 10 }}>
              ÄHNLICHE UNTERNEHMEN IN {(org?.industry ?? lead.industry).toUpperCase()}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${similar.length}, 1fr)`, gap: 12 }}>
              {similar.map((sl) => (
                <Link
                  key={sl.id}
                  href={`/sales/leads/${sl.id}`}
                  className="s-card"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '14px 16px',
                    borderRadius: 11,
                    textDecoration: 'none',
                    color: 'inherit',
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.03)',
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 9,
                      flexShrink: 0,
                      background:
                        (sl.score ?? 0) >= 70
                          ? 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(99,102,241,0.05))'
                          : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${(sl.score ?? 0) >= 70 ? 'rgba(99,102,241,0.2)' : C.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 500,
                      color: (sl.score ?? 0) >= 70 ? C.accent : C.text3,
                    }}
                  >
                    {(sl.organisation?.name ?? sl.company).slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 12.5,
                        fontWeight: 500,
                        color: C.text1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {sl.organisation?.name ?? sl.company}
                    </div>
                    <div style={{ fontSize: 10.5, color: C.text3, marginTop: 2 }}>
                      {sl.organisation?.industry ?? sl.industry} · {sl.organisation?.city ?? sl.city}
                    </div>
                  </div>
                  {sl.score && (
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: sl.score >= 70 ? C.accent : C.text3,
                        fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                      }}
                    >
                      {sl.score}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Contact Enrichments */}
      <ContactEnrichments leadId={lead.id} />

      {/* People Finder Modal */}
      <PeopleFinderModal
        open={peopleModalOpen}
        onClose={() => setPeopleModalOpen(false)}
        companyName={lead.company}
        companyDomain={lead.primaryDomain}
        leadId={lead.id}
      />
    </>
  );
}
