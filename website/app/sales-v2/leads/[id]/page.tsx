'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
import { getLeadById } from '../../_lead-data';
import type { Lead } from '../../_lead-data';

// ─── STATUS OPTIONS ──────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: Lead['status']; color: string }[] = [
  { value: 'Neu', color: 'rgba(255,255,255,0.3)' },
  { value: 'In Kontakt', color: '#A5B4FC' },
  { value: 'Qualifiziert', color: '#34D399' },
  { value: 'Verloren', color: '#F87171' },
];

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

// ─── PAGE ────────────────────────────────────────────────────────────────────

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const lead = getLeadById(id);

  const [status, setStatus] = useState(lead?.status ?? 'Neu');
  const [statusOpen, setStatusOpen] = useState(false);
  const [notes, setNotes] = useState(lead?.notes ?? []);
  const [newNote, setNewNote] = useState('');
  const [emailExpanded, setEmailExpanded] = useState(false);

  if (!lead) {
    return (
      <>
        <Breadcrumbs
          items={[
            { label: 'Onvero Sales', href: '/sales-v2' },
            { label: 'Leads', href: '/sales-v2/leads' },
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
          <h2 style={{ fontSize: 16, color: C.text1, margin: '0 0 6px' }}>Lead nicht gefunden</h2>
          <p style={{ fontSize: 12, color: C.text3, margin: '0 0 20px' }}>Der Lead mit ID "{id}" existiert nicht.</p>
          <GhostButton onClick={() => router.push('/sales-v2/leads')}>← Zurück zu Leads</GhostButton>
        </div>
      </>
    );
  }

  const s = lead.score ?? 0;
  const scoreColor = s >= 70 ? '#818CF8' : s >= 50 ? '#FBBF24' : '#F87171';

  function addNote() {
    if (!newNote.trim()) return;
    setNotes((prev) => [newNote.trim(), ...prev]);
    setNewNote('');
    showToast('Notiz hinzugefügt', 'success');
  }

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Onvero Sales', href: '/sales-v2' },
          { label: 'Leads', href: '/sales-v2/leads' },
          { label: lead.name },
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
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #6366F1, #818CF8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              fontWeight: 600,
              color: '#fff',
              boxShadow: '0 4px 20px rgba(99,102,241,0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
            }}
          >
            {lead.name
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 600, color: C.text1, margin: 0, letterSpacing: '-0.02em' }}>
              {lead.name}
            </h1>
            <div style={{ fontSize: 13, color: C.text3, marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>{lead.company}</span>
              <span style={{ opacity: 0.25 }}>·</span>
              <span>{lead.city}</span>
              <span style={{ opacity: 0.25 }}>·</span>
              <span>{lead.industry}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Status dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setStatusOpen(!statusOpen)}
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
            {statusOpen && (
              <>
                <div onClick={() => setStatusOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: 4,
                    zIndex: 100,
                    background: C.surface,
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
                      onClick={() => {
                        setStatus(opt.value);
                        setStatusOpen(false);
                        showToast(`Status → ${opt.value}`, 'success');
                      }}
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
              </>
            )}
          </div>

          <GhostButton onClick={() => router.push('/sales-v2/leads')}>← Zurück</GhostButton>
          <GlowButton onClick={() => showToast('Outreach wird generiert...', 'info')}>Outreach generieren</GlowButton>
        </div>
      </div>

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
              <ProgressRing
                value={s}
                max={100}
                size={80}
                strokeWidth={5}
                color={scoreColor}
                label={s > 0 ? `${s}` : '—'}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: C.text3, marginBottom: 8 }}>
                  {s === 0
                    ? 'Score noch nicht berechnet'
                    : s >= 70
                      ? 'Hot Lead — Sofort kontaktieren'
                      : s >= 50
                        ? 'Warm Lead — Potenzial vorhanden'
                        : 'Cold Lead — Beobachten'}
                </div>
                {lead.scoreBreakdown.length > 0 && (
                  <Sparkline
                    data={lead.scoreBreakdown.map((sb) => sb.value)}
                    width={200}
                    height={24}
                    color={scoreColor}
                  />
                )}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {lead.scoreBreakdown.map((s) => (
                <ScoreBreakdownBar
                  key={s.label}
                  {...s}
                  color={s.value / s.max > 0.8 ? '#34D399' : s.value / s.max > 0.6 ? '#818CF8' : '#FBBF24'}
                />
              ))}
            </div>
          </Section>

          {/* KI-Analyse */}
          {lead.aiSummary && (
            <Section title="KI-Analyse" icon={ICONS.spark} color="#A78BFA">
              <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.75, margin: 0 }}>{lead.aiSummary}</p>
              {lead.aiTags.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 14 }}>
                  {lead.aiTags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        padding: '3px 10px',
                        borderRadius: 6,
                        fontSize: 10,
                        background: 'rgba(99,102,241,0.06)',
                        border: '1px solid rgba(99,102,241,0.12)',
                        color: C.accentBright,
                        fontWeight: 500,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </Section>
          )}

          {/* E-Mail Draft */}
          {lead.emailDraftBody && (
            <Section
              title={lead.emailDraftSubject ? `E-Mail: ${lead.emailDraftSubject}` : 'E-Mail Draft'}
              icon={ICONS.mail}
              color="#34D399"
              actions={
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(lead.emailDraftBody!);
                      showToast('E-Mail kopiert', 'success');
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
                    onClick={() => showToast('E-Mail wird gesendet...', 'info')}
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

          {/* Timeline */}
          <Section title="Aktivitäts-Timeline" icon={ICONS.clock} color="#38BDF8">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  left: 5,
                  top: 8,
                  bottom: 8,
                  width: 1,
                  background: `linear-gradient(180deg, ${C.border}, transparent)`,
                }}
              />
              {lead.timeline.map((t, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: 14,
                    padding: '10px 0',
                    paddingLeft: 0,
                    animation: 'fadeIn 0.3s ease both',
                    animationDelay: `${0.15 + i * 0.04}s`,
                  }}
                >
                  <div
                    style={{
                      width: 11,
                      height: 11,
                      borderRadius: '50%',
                      background: C.bg,
                      border: `2px solid ${t.color}`,
                      boxShadow: `0 0 6px ${t.color}40`,
                      flexShrink: 0,
                      marginTop: 3,
                      zIndex: 1,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12.5, color: C.text1, lineHeight: 1.4 }}>{t.action}</div>
                    <div style={{ fontSize: 10, color: C.text3, marginTop: 2 }}>{t.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* RIGHT COLUMN — Sidebar info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Quick Info Card */}
          <div
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 14,
              padding: '20px 22px',
              boxShadow: '0 2px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)',
            }}
          >
            <InfoRow label="E-Mail" value={lead.email} href={`mailto:${lead.email}`} mono />
            <InfoRow label="Telefon" value={lead.phone} href={lead.phone ? `tel:${lead.phone}` : undefined} mono />
            <InfoRow
              label="Website"
              value={lead.website?.replace('https://', '') ?? null}
              href={lead.website ?? undefined}
            />
            <InfoRow label="Branche" value={lead.industry} />
            <InfoRow label="Mitarbeiter" value={lead.employees} />
            <InfoRow label="Erstellt am" value={lead.createdAt} />
            <InfoRow label="Nächste Aktion" value={lead.nextAction} />
            {lead.pipeline && <InfoRow label="Pipeline" value={lead.pipeline} mono />}
          </div>

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
                action: () => showToast('E-Mail wird gesendet...', 'info'),
              },
              {
                label: 'Meeting planen',
                icon: ICONS.calendar,
                color: '#38BDF8',
                action: () => showToast('Meeting-Planer öffnet...', 'info'),
              },
              {
                label: 'KI-Rescore',
                icon: ICONS.spark,
                color: '#818CF8',
                action: () => showToast('Rescore wird gestartet...', 'info'),
              },
              {
                label: 'Outreach generieren',
                icon: ICONS.zap,
                color: '#FBBF24',
                action: () => showToast('Outreach wird generiert...', 'info'),
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
        </div>
      </div>
    </>
  );
}
