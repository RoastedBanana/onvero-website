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
import { getLeadStats, ACCOUNT } from '../../_lead-data';
import type { Lead } from '../../_lead-data';
import { useActivities, writeActivity, formatActivityTime, getActivityStyle } from '../../_activities';
import { useLeads } from '../../_use-leads';
import Link from 'next/link';

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

// ─── LIVE TIMELINE ───────────────────────────────────────────────────────────

function LeadTimeline({ leadId }: { leadId: string }) {
  const { activities, loading } = useActivities(leadId);

  return (
    <Section
      title="Aktivitäts-Timeline"
      icon={ICONS.clock}
      color="#38BDF8"
      actions={
        <span style={{ fontSize: 10, color: C.text3 }}>
          {loading ? 'Laden...' : `${activities.length} Events`}
          <span
            style={{
              display: 'inline-block',
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: '#34D399',
              marginLeft: 6,
              boxShadow: '0 0 4px rgba(52,211,153,0.6)',
              animation: 'pulse-live 2.5s ease-in-out infinite',
            }}
          />
        </span>
      }
    >
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

        {activities.length === 0 && !loading && (
          <div style={{ padding: '16px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: C.text3 }}>Noch keine Aktivität für diesen Lead</div>
            <div style={{ fontSize: 10, color: C.text3, marginTop: 4 }}>Aktionen werden hier live angezeigt</div>
          </div>
        )}

        {activities.map((a, i) => {
          const st = getActivityStyle(a.type);
          return (
            <div
              key={a.id}
              style={{
                display: 'flex',
                gap: 14,
                padding: '10px 0',
                animation: 'fadeIn 0.3s ease both',
                animationDelay: `${0.1 + i * 0.03}s`,
              }}
            >
              <div
                style={{
                  width: 11,
                  height: 11,
                  borderRadius: '50%',
                  background: C.bg,
                  border: `2px solid ${st.color}`,
                  boxShadow: `0 0 6px ${st.color}40`,
                  flexShrink: 0,
                  marginTop: 3,
                  zIndex: 1,
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, color: C.text1, lineHeight: 1.4 }}>{a.title}</div>
                {a.content && <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>{a.content}</div>}
                <div style={{ fontSize: 10, color: C.text3, marginTop: 2 }}>{formatActivityTime(a.created_at)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
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
          {/* Avatar — color reflects score tier */}
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background:
                s >= 70
                  ? 'linear-gradient(135deg, #6366F1, #818CF8)'
                  : s >= 50
                    ? 'linear-gradient(135deg, #D97706, #FBBF24)'
                    : 'linear-gradient(135deg, #374151, #4B5563)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              fontWeight: 600,
              color: '#fff',
              boxShadow:
                s >= 70
                  ? '0 4px 20px rgba(99,102,241,0.3), inset 0 1px 0 rgba(255,255,255,0.15)'
                  : s >= 50
                    ? '0 4px 20px rgba(251,191,36,0.2), inset 0 1px 0 rgba(255,255,255,0.15)'
                    : '0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.08)',
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
            {lead.jobTitle && (
              <div style={{ fontSize: 12, color: C.accent, marginTop: 3, fontWeight: 500 }}>{lead.jobTitle}</div>
            )}
            <div style={{ fontSize: 12, color: C.text3, marginTop: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>{lead.company}</span>
              <span style={{ opacity: 0.25 }}>·</span>
              <span>
                {lead.city}
                {lead.country ? `, ${lead.country}` : ''}
              </span>
              {lead.employeeCount && (
                <>
                  <span style={{ opacity: 0.25 }}>·</span>
                  <span>~{lead.employeeCount.toLocaleString('de-DE')} MA</span>
                </>
              )}
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
                        writeActivity(lead.id, 'status_change', `Status geändert: ${status} → ${opt.value}`);
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

      {/* ── NEXT ACTION BANNER ── */}
      {lead.nextAction && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
          <GlowButton onClick={() => showToast('Aktion wird ausgeführt...', 'info')}>Jetzt ausführen</GlowButton>
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
              <ProgressRing
                value={s}
                max={100}
                size={80}
                strokeWidth={5}
                color={scoreColor}
                label={s > 0 ? `${s}` : '—'}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: C.text1, fontWeight: 500, marginBottom: 4 }}>
                  {s === 0
                    ? 'Score noch nicht berechnet'
                    : s >= 70
                      ? 'Hot Lead — Sofort kontaktieren'
                      : s >= 50
                        ? 'Warm Lead — Potenzial vorhanden'
                        : 'Cold Lead — Beobachten'}
                </div>
                {s > 0 &&
                  (() => {
                    const avg = getLeadStats(liveLeads).avgScore;
                    const diff = s - avg;
                    return (
                      <div style={{ fontSize: 11, color: diff > 0 ? C.success : C.danger, marginBottom: 8 }}>
                        {diff > 0 ? `+${diff}` : diff} Punkte vs. Ø {avg} aller Leads
                      </div>
                    );
                  })()}
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

          {/* Career History — above timeline */}
          {lead.employmentHistory && lead.employmentHistory.length > 0 && (
            <Section title="Berufsverlauf" icon={ICONS.trending} color="#A78BFA">
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: 4,
                    top: 14,
                    bottom: 14,
                    width: 1,
                    background: `linear-gradient(180deg, ${C.border}, transparent)`,
                  }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {lead.employmentHistory
                    .sort((a, b) => {
                      if (a.current && !b.current) return -1;
                      if (!a.current && b.current) return 1;
                      if (!a.startDate && !b.startDate) return 0;
                      if (!a.startDate) return 1;
                      if (!b.startDate) return -1;
                      return b.startDate.localeCompare(a.startDate);
                    })
                    .map((entry, i) => {
                      const startStr = entry.startDate
                        ? new Date(entry.startDate).toLocaleDateString('de-DE', { month: 'short', year: 'numeric' })
                        : null;
                      const endStr = entry.current
                        ? 'Heute'
                        : entry.endDate
                          ? new Date(entry.endDate).toLocaleDateString('de-DE', { month: 'short', year: 'numeric' })
                          : null;
                      let duration = '';
                      if (entry.startDate) {
                        const start = new Date(entry.startDate);
                        const end = entry.current ? new Date() : entry.endDate ? new Date(entry.endDate) : null;
                        if (end) {
                          const months = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30));
                          const years = Math.floor(months / 12);
                          const rm = months % 12;
                          duration = years > 0 ? `${years} J.${rm > 0 ? ` ${rm} M.` : ''}` : `${rm} M.`;
                        }
                      }
                      return (
                        <div key={i} style={{ display: 'flex', gap: 14, padding: '10px 0' }}>
                          <div
                            style={{
                              width: 9,
                              height: 9,
                              borderRadius: '50%',
                              flexShrink: 0,
                              marginTop: 4,
                              background: entry.current ? C.accent : C.bg,
                              border: `2px solid ${entry.current ? C.accent : C.text3}`,
                              boxShadow: entry.current ? `0 0 8px ${C.accent}50` : 'none',
                              zIndex: 1,
                            }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12.5, fontWeight: 500, color: entry.current ? C.text1 : C.text2 }}>
                              {entry.title}
                            </div>
                            <div style={{ fontSize: 11.5, color: C.text3, marginTop: 2 }}>{entry.company}</div>
                            <div
                              style={{
                                fontSize: 10,
                                color: C.text3,
                                marginTop: 3,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                              }}
                            >
                              <span>
                                {startStr ?? '—'} – {endStr ?? '—'}
                              </span>
                              {duration && (
                                <>
                                  <span style={{ opacity: 0.3 }}>·</span>
                                  <span>{duration}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </Section>
          )}

          {/* Timeline — LIVE from Supabase Realtime */}
          <LeadTimeline leadId={lead.id} />
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
              <span style={{ fontSize: 12, fontWeight: 500, color: C.text1 }}>Unternehmen</span>
            </div>
            <InfoRow label="Firma" value={lead.company} />
            <InfoRow
              label="Website"
              value={lead.website?.replace('https://', '') ?? null}
              href={lead.website ?? undefined}
            />
            <InfoRow label="Branche" value={lead.industry} />
            {lead.industryApollo && <InfoRow label="Apollo Kategorie" value={lead.industryApollo} />}
            <InfoRow
              label="Mitarbeiter"
              value={lead.employeeCount ? `~${lead.employeeCount.toLocaleString('de-DE')}` : lead.employees}
            />
            <InfoRow label="Standort" value={[lead.city, lead.country].filter(Boolean).join(', ')} />
            <InfoRow label="Quelle" value={lead.source} />
            <InfoRow label="Erstellt am" value={lead.createdAt} />
            {lead.lastContactedAt && <InfoRow label="Zuletzt kontaktiert" value={lead.lastContactedAt} />}
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
              {
                label: 'Outreach generieren',
                icon: ICONS.zap,
                color: '#FBBF24',
                action: () => {
                  showToast('Outreach wird generiert...', 'info');
                  writeActivity(lead.id, 'outreach_generated', 'Outreach generiert');
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
              ÄHNLICHE LEADS IN {lead.industry.toUpperCase()}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${similar.length}, 1fr)`, gap: 12 }}>
              {similar.map((sl) => (
                <Link
                  key={sl.id}
                  href={`/sales-v2/leads/${sl.id}`}
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
                    {sl.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
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
                      {sl.name}
                    </div>
                    <div style={{ fontSize: 10.5, color: C.text3, marginTop: 2 }}>
                      {sl.company} · {sl.city}
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
    </>
  );
}
