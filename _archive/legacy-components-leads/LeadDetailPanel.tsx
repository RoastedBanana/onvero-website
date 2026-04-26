'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { History, ChevronDown } from 'lucide-react';
import type { Lead } from '@/lib/leads-client';
import { updateLeadStatus } from '@/lib/leads-client';
import LeadAvatar from '@/components/ui/LeadAvatar';

const TENANT_ID = 'df763f85-c687-42d6-be66-a2b353b89c90';

interface LeadDetailPanelProps {
  lead: Lead | null;
  onClose: () => void;
}

function formatDaysAgo(d: number): string {
  if (d === 0) return 'heute';
  if (d === 1) return 'gestern';
  if (d <= 7) return 'diese Woche';
  if (d <= 30) return `vor ${d} Tagen`;
  if (d <= 60) return 'letzten Monat';
  return `vor ${Math.floor(d / 30)} Monaten`;
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 600,
        color: 'rgba(255,255,255,0.25)',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        marginBottom: 10,
        paddingTop: 4,
      }}
    >
      {title}
    </div>
  );
}

function ScoreBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', width: 100, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: color,
            borderRadius: 3,
            transition: 'width 0.6s ease',
          }}
        />
      </div>
      <span
        style={{
          fontSize: 11,
          color: 'rgba(255,255,255,0.7)',
          fontFamily: 'var(--font-dm-mono)',
          width: 38,
          textAlign: 'right',
        }}
      >
        {value} Pkt
      </span>
    </div>
  );
}

function ContactRow({
  label,
  value,
  action,
  href,
  onCopy,
}: {
  label: string;
  value?: string;
  action?: 'copy' | 'link' | 'tel';
  href?: string;
  onCopy?: () => void;
}) {
  const display = value || '—';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', width: 68, flexShrink: 0 }}>{label}</span>
      <span
        style={{
          fontSize: 11,
          color: value ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.2)',
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {action === 'tel' && value ? (
          <a href={`tel:${value}`} style={{ color: 'inherit', textDecoration: 'none' }}>
            {display}
          </a>
        ) : action === 'link' && href ? (
          <a href={href} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
            {display} <span style={{ fontSize: 9, opacity: 0.4 }}>↗</span>
          </a>
        ) : (
          display
        )}
      </span>
      {action === 'copy' && value && (
        <button
          onClick={onCopy}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.2)',
            cursor: 'pointer',
            fontSize: 10,
            padding: '2px 4px',
          }}
          title="Kopieren"
        >
          ⎘
        </button>
      )}
    </div>
  );
}

const STATUS_OPTIONS = [
  { value: 'new', label: 'Neu' },
  { value: 'contacted', label: 'Kontaktiert' },
  { value: 'qualified', label: 'Qualifiziert' },
  { value: 'lost', label: 'Verloren' },
];

export default function LeadDetailPanel({ lead, onClose }: LeadDetailPanelProps) {
  const router = useRouter();
  const isOpen = lead !== null;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [statusDropdown, setStatusDropdown] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [draftCopied, setDraftCopied] = useState(false);
  const [emailExpanded, setEmailExpanded] = useState(false);
  const [emailEditing, setEmailEditing] = useState(false);
  const [emailText, setEmailText] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [followUpDisplay, setFollowUpDisplay] = useState('');
  const [followUpTimestamp, setFollowUpTimestamp] = useState<string | null>(null);
  const [followUpExpired, setFollowUpExpired] = useState(false);
  const [autoFollowUp, setAutoFollowUp] = useState(true);
  const [scrapingStarted, setScrapingStarted] = useState(false);
  const [scrapingLoading, setScrapingLoading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  // Load auto follow-up preference
  useEffect(() => {
    (async () => {
      const { createClient } = await import('@/lib/supabase');
      const supabase = createClient();
      const { data } = await supabase
        .from('tenant_preferences')
        .select('automatic_followup_emails')
        .eq('tenant_id', TENANT_ID)
        .single();
      if (data) setAutoFollowUp(data.automatic_followup_emails ?? true);
    })();
  }, []);

  // Scroll to top + reset state when lead changes
  useEffect(() => {
    if (lead && scrollRef.current) scrollRef.current.scrollTop = 0;
    setEmailExpanded(false);
    setEmailEditing(false);
    setEmailText(lead?.emailDraft ?? '');
    setStatusDropdown(false);
    setDraftCopied(false);
    // Determine follow-up timestamp: only for "contacted" leads
    if (lead?.status === 'contacted') {
      const ts = lead.statusUpdatedAt ?? lead.lastContactedAt;
      setFollowUpTimestamp(ts ?? null);
    } else {
      setFollowUpTimestamp(null);
    }
  }, [lead?.id, lead?.status, lead?.statusUpdatedAt, lead?.lastContactedAt]);

  // Per-lead follow-up countdown: 3 days from status change
  useEffect(() => {
    if (!followUpTimestamp) {
      setFollowUpDisplay('');
      setFollowUpExpired(false);
      return;
    }
    const deadline = new Date(followUpTimestamp).getTime() + 3 * 24 * 60 * 60 * 1000;
    if (deadline <= Date.now()) {
      setFollowUpDisplay('');
      setFollowUpExpired(true);
      return;
    }
    setFollowUpExpired(false);
    function tick() {
      const diff = deadline - Date.now();
      if (diff <= 0) {
        setFollowUpDisplay('');
        setFollowUpExpired(true);
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setFollowUpDisplay(`${d}T ${h}h ${m}m ${s}s`);
    }
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [followUpTimestamp]);

  // Escape to close
  const onCloseStable = useCallback(() => onClose(), [onClose]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseStable();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onCloseStable]);

  const tierFromData = lead?.tier?.toUpperCase();
  const scoreLabel =
    tierFromData === 'HOT' || tierFromData === 'WARM' || tierFromData === 'COLD'
      ? tierFromData
      : lead
        ? lead.score >= 75
          ? 'HOT'
          : lead.score >= 45
            ? 'WARM'
            : 'COLD'
        : 'COLD';
  const scoreColor = scoreLabel === 'HOT' ? '#FF5C2E' : scoreLabel === 'WARM' ? '#F59E0B' : '#6B7AFF';
  const scoreBg = lead
    ? lead.score >= 75
      ? 'rgba(255,92,46,0.1)'
      : lead.score >= 45
        ? 'rgba(245,158,11,0.08)'
        : 'rgba(107,122,255,0.08)'
    : 'rgba(107,122,255,0.08)';
  const scoreBorder = lead
    ? lead.score >= 75
      ? 'rgba(255,92,46,0.2)'
      : lead.score >= 45
        ? 'rgba(245,158,11,0.15)'
        : 'rgba(107,122,255,0.15)'
    : 'rgba(107,122,255,0.15)';

  async function handleStatusChange(newStatus: string) {
    if (!lead) return;
    setStatusUpdating(true);
    try {
      await updateLeadStatus(lead.id, newStatus);
      setStatusDropdown(false);
      onClose();
      router.refresh();
    } catch (e) {
      console.error('Status update failed:', e);
    } finally {
      setStatusUpdating(false);
    }
  }

  async function handleWebsiteScrape() {
    if (!lead?.website) return;
    setScrapingLoading(true);
    try {
      await fetch('/api/proxy/n8n', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'website-analysis',
          lead_id: lead.id,
          website: lead.website,
          tenant_id: TENANT_ID,
        }),
      });
      setScrapingStarted(true);
      setTimeout(() => setScrapingStarted(false), 5000);
    } catch (e) {
      console.error('Website scrape failed:', e);
    } finally {
      setScrapingLoading(false);
    }
  }

  function copyDraft() {
    if (emailText) {
      navigator.clipboard?.writeText(emailText);
      setDraftCopied(true);
      setTimeout(() => setDraftCopied(false), 2000);
    }
  }

  async function sendEmail() {
    if (!lead?.email || !emailText) return;
    setEmailSending(true);
    try {
      // First line = subject, rest = body
      const lines = emailText.split('\n');
      const subject = lines[0].replace(/^betreff:\s*/i, '').trim() || `Kontaktanfrage von ${lead.company ?? 'uns'}`;
      const body = lines.slice(1).join('\n').trim();

      const res = await fetch('/api/leads/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: lead.id,
          tenant_id: TENANT_ID,
          to: lead.email,
          subject,
          text: body,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setEmailSent(true);
        setTimeout(() => setEmailSent(false), 3000);
        setFollowUpTimestamp(new Date().toISOString());
      } else {
        alert('E-Mail senden fehlgeschlagen: ' + (result.error ?? 'Unbekannter Fehler'));
      }
    } catch (err) {
      console.error('Send email error:', err);
      alert('E-Mail senden fehlgeschlagen');
    } finally {
      setEmailSending(false);
    }
  }

  async function saveEmailDraft() {
    if (!lead) return;
    setEmailSaving(true);
    try {
      const { createClient } = await import('@/lib/supabase');
      const supabase = createClient();
      await supabase.from('leads').update({ email_draft_body: emailText }).eq('id', lead.id);
      setEmailEditing(false);
    } catch (e) {
      console.error('Email save failed:', e);
    } finally {
      setEmailSaving(false);
    }
  }

  const draftSubject = emailText.split('\n')[0] ?? '';
  const draftBody = emailText.split('\n').slice(1).join('\n').trim();

  const breakdown = lead?.scoreBreakdown;

  // Real activities from API
  const [realActivities, setRealActivities] = useState<
    {
      id: string;
      type: string;
      title: string;
      content: string | null;
      created_at: string;
      metadata: Record<string, unknown> | null;
    }[]
  >([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  useEffect(() => {
    if (!lead?.id) {
      setRealActivities([]);
      return;
    }
    setActivitiesLoading(true);
    fetch(`/api/leads/${lead.id}`)
      .then((r) => r.json())
      .then((d) => setRealActivities(d.activities || []))
      .catch(() => setRealActivities([]))
      .finally(() => setActivitiesLoading(false));
  }, [lead?.id]);

  const ACTIVITY_META: Record<string, { icon: string; color: string; label: string }> = {
    lead_created: { icon: '＋', color: '#22C55E', label: 'Lead erstellt' },
    scored: { icon: 'S', color: '#6B7AFF', label: 'KI-Score' },
    email_generated: { icon: 'E', color: '#8B5CF6', label: 'E-Mail generiert' },
    status_change: { icon: '↻', color: '#F59E0B', label: 'Status geändert' },
    website_analysis: { icon: 'W', color: '#3B82F6', label: 'Website-Analyse' },
    enrichment: { icon: '★', color: '#22C55E', label: 'Anreicherung' },
    contact: { icon: '☎', color: '#a78bfa', label: 'Kontaktiert' },
  };

  // Merge API activities with fallback timeline entries
  const activities =
    realActivities.length > 0
      ? realActivities.map((a) => {
          const meta = ACTIVITY_META[a.type] || { icon: '●', color: 'rgba(255,255,255,0.3)', label: a.type };
          return {
            date: a.created_at,
            text: a.title || meta.label,
            content: a.content,
            color: meta.color,
            icon: meta.icon,
          };
        })
      : lead
        ? [
            { date: lead.createdAt, text: 'Lead generiert', content: null, color: '#22C55E', icon: '＋' },
            ...(lead.aiScoredAt
              ? [
                  {
                    date: lead.aiScoredAt,
                    text: `KI-Score: ${lead.score}`,
                    content: null,
                    color: '#6B7AFF',
                    icon: 'S',
                  },
                ]
              : [
                  {
                    date: lead.createdAt,
                    text: `KI-Score: ${lead.score}`,
                    content: null,
                    color: '#6B7AFF',
                    icon: 'S',
                  },
                ]),
            ...(lead.lastContactedAt
              ? [{ date: lead.lastContactedAt, text: 'Kontaktiert', content: null, color: '#a78bfa', icon: '☎' }]
              : []),
          ]
        : [];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 49,
          background: 'rgba(0,0,0,0.5)',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 420,
          zIndex: 50,
          background: '#111',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'var(--font-dm-sans)',
        }}
      >
        {lead && (
          <>
            {/* ── Header ── */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '16px 20px',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
                flexShrink: 0,
              }}
            >
              <LeadAvatar
                website={lead.website}
                companyName={lead.company}
                score={lead.score}
                size="lg"
                logoUrl={lead.logoUrl}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: '#fff',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {lead.company || '—'}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>
                  {lead.name || '—'}
                  {lead.jobTitle && <span style={{ color: 'rgba(255,255,255,0.25)' }}> · {lead.jobTitle}</span>}
                </div>
              </div>
              <button
                onClick={() => router.push(`/dashboard/leads/${lead.id}`)}
                title="Vollansicht"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.06)',
                  border: 'none',
                  color: 'rgba(255,255,255,0.3)',
                  fontSize: 12,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
              >
                ↗
              </button>
              <button
                onClick={onClose}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.06)',
                  border: 'none',
                  color: 'rgba(255,255,255,0.4)',
                  fontSize: 14,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
              >
                ×
              </button>
            </div>

            {/* ── Score Banner ── */}
            <div
              style={{
                padding: '16px 20px',
                background: scoreBg,
                borderBottom: `1px solid ${scoreBorder}`,
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span
                  style={{
                    fontSize: 48,
                    fontWeight: 900,
                    color: scoreColor,
                    lineHeight: 1,
                    fontFamily: 'var(--font-dm-mono)',
                    letterSpacing: '-0.03em',
                  }}
                >
                  {lead.score}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: scoreColor,
                    letterSpacing: '0.12em',
                    background: `${scoreColor}15`,
                    border: `1px solid ${scoreColor}30`,
                    borderRadius: 20,
                    padding: '3px 10px',
                  }}
                >
                  {scoreLabel}
                </span>
              </div>

              {breakdown ? (
                <>
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', margin: '0 0 10px' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {breakdown.unternehmensfit != null && (
                      <ScoreBar label="Unternehmensfit" value={breakdown.unternehmensfit} max={35} color={scoreColor} />
                    )}
                    {breakdown.kontaktqualitaet != null && (
                      <ScoreBar
                        label="Kontaktqualität"
                        value={breakdown.kontaktqualitaet}
                        max={25}
                        color={scoreColor}
                      />
                    )}
                    {breakdown.entscheidungsposition != null && (
                      <ScoreBar
                        label="Entscheiderpos."
                        value={breakdown.entscheidungsposition}
                        max={25}
                        color={scoreColor}
                      />
                    )}
                    {breakdown.kaufsignale != null && (
                      <ScoreBar label="Kaufsignale" value={breakdown.kaufsignale} max={15} color={scoreColor} />
                    )}
                    {breakdown.abzuege != null && breakdown.abzuege !== 0 && (
                      <div
                        style={{
                          fontSize: 10,
                          color: 'rgba(255,255,255,0.35)',
                          marginTop: 2,
                          fontFamily: 'var(--font-dm-mono)',
                        }}
                      >
                        Abzüge: −{Math.abs(breakdown.abzuege)} Pkt
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${lead.score}%`,
                      background: scoreColor,
                      borderRadius: 3,
                      transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
                    }}
                  />
                </div>
              )}

              {lead.buyingSignals && lead.buyingSignals.length > 0 && (
                <>
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', margin: '12px 0 10px' }} />
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 500,
                      color: 'rgba(255,255,255,0.3)',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase' as const,
                      marginBottom: 6,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    Kaufsignale
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {lead.buyingSignals.slice(0, 4).map((signal, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: 10,
                          color: '#92400e',
                          background: 'rgba(245,158,11,0.15)',
                          border: '1px solid rgba(245,158,11,0.2)',
                          padding: '2px 8px',
                          borderRadius: 10,
                          fontWeight: 500,
                          lineHeight: 1.4,
                        }}
                      >
                        {signal}
                      </span>
                    ))}
                    {lead.buyingSignals.length > 4 && (
                      <span
                        style={{
                          fontSize: 10,
                          color: 'rgba(255,255,255,0.35)',
                          background: 'rgba(255,255,255,0.06)',
                          padding: '2px 8px',
                          borderRadius: 10,
                        }}
                      >
                        +{lead.buyingSignals.length - 4} weitere
                      </span>
                    )}
                  </div>
                </>
              )}

              {lead.nextAction && (
                <>
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', margin: '12px 0 10px' }} />
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 500,
                      color: 'rgba(255,255,255,0.3)',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase' as const,
                      marginBottom: 4,
                    }}
                  >
                    Nächste Aktion
                  </div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>{lead.nextAction}</div>
                </>
              )}
            </div>

            {/* ── Scrollable Content ── */}
            <div
              ref={scrollRef}
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '14px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
              }}
              className="hide-scrollbar"
            >
              <style>{`.hide-scrollbar::-webkit-scrollbar{display:none}.hide-scrollbar{scrollbar-width:none}`}</style>

              {/* Kontakt */}
              <div>
                <SectionHeader title="Kontakt" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <ContactRow
                        label="E-Mail"
                        value={lead.email}
                        action="copy"
                        onCopy={() => lead.email && navigator.clipboard?.writeText(lead.email)}
                      />
                    </div>
                    {lead.emailStatus === 'verified' && (
                      <span
                        style={{
                          fontSize: 9,
                          color: '#22C55E',
                          background: 'rgba(34,197,94,0.1)',
                          padding: '1px 6px',
                          borderRadius: 8,
                          fontWeight: 500,
                          flexShrink: 0,
                        }}
                      >
                        ✓ Verifiziert
                      </span>
                    )}
                    {(lead.emailStatus === 'guessed' || lead.emailStatus === 'estimated') && (
                      <span
                        style={{
                          fontSize: 9,
                          color: '#F59E0B',
                          background: 'rgba(245,158,11,0.1)',
                          padding: '1px 6px',
                          borderRadius: 8,
                          fontWeight: 500,
                          flexShrink: 0,
                        }}
                      >
                        ~ Geschätzt
                      </span>
                    )}
                  </div>
                  <ContactRow label="Telefon" value={lead.phone} action="tel" />
                  <ContactRow
                    label="Website"
                    value={lead.website?.replace(/^https?:\/\/(www\.)?/, '')}
                    action="link"
                    href={lead.website}
                  />
                  <ContactRow
                    label="LinkedIn"
                    value={lead.linkedinUrl ? 'Profil öffnen' : undefined}
                    action="link"
                    href={lead.linkedinUrl}
                  />
                  <ContactRow label="Branche" value={lead.industry} />
                  <ContactRow label="Mitarbeiter" value={lead.employeeCount ? String(lead.employeeCount) : undefined} />
                  <ContactRow label="Stadt" value={lead.city} />
                  <ContactRow label="Budget" value={lead.budgetEstimate} />
                </div>

                {/* Lokale Präsenz (Google Maps) */}
                {lead.googleBusinessStatus && !['API_ERROR', 'FETCH_ERROR'].includes(lead.googleBusinessStatus) && (
                  <div style={{ marginTop: 14, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 12 }}>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: 'rgba(255,255,255,0.25)',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase' as const,
                        marginBottom: 8,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                      }}
                    >
                      Lokale Präsenz
                    </div>

                    {lead.googleBusinessStatus === 'OPERATIONAL' && lead.googleRating != null ? (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <span
                            style={{
                              fontSize: 22,
                              fontWeight: 700,
                              color:
                                lead.googleRating >= 4.0 ? '#1D9E75' : lead.googleRating >= 3.0 ? '#F59E0B' : '#ef4444',
                              fontFamily: 'var(--font-dm-mono)',
                              lineHeight: 1,
                            }}
                          >
                            {lead.googleRating.toFixed(1)}
                          </span>
                          <div style={{ display: 'flex', gap: 1 }}>
                            {Array.from({ length: 5 }, (_, i) => {
                              const filled = lead.googleRating! - i;
                              const starColor =
                                lead.googleRating! >= 4.0
                                  ? '#1D9E75'
                                  : lead.googleRating! >= 3.0
                                    ? '#F59E0B'
                                    : '#ef4444';
                              return (
                                <span
                                  key={i}
                                  style={{
                                    fontSize: 12,
                                    color:
                                      filled >= 1 ? starColor : filled >= 0.5 ? starColor : 'rgba(255,255,255,0.1)',
                                  }}
                                >
                                  {filled >= 0.75 ? '★' : filled >= 0.25 ? '★' : '☆'}
                                </span>
                              );
                            })}
                          </div>
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                            ({lead.googleReviews ?? 0} Bewertungen)
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                          <span
                            style={{
                              fontSize: 10,
                              color: '#1D9E75',
                              background: 'rgba(29,158,117,0.12)',
                              padding: '2px 8px',
                              borderRadius: 10,
                              fontWeight: 500,
                            }}
                          >
                            Aktiv
                          </span>
                          {(lead.googleReviews ?? 0) < 10 && (
                            <span
                              style={{
                                fontSize: 10,
                                color: '#F59E0B',
                                background: 'rgba(245,158,11,0.1)',
                                padding: '2px 8px',
                                borderRadius: 10,
                                fontWeight: 500,
                              }}
                            >
                              Wenige Bewertungen
                            </span>
                          )}
                          {lead.googleMapsMatchScore != null && lead.googleMapsMatchScore < 70 && (
                            <span
                              title={`Match-Score: ${lead.googleMapsMatchScore} — Bitte manuell verifizieren`}
                              style={{
                                fontSize: 10,
                                color: '#F59E0B',
                                background: 'rgba(245,158,11,0.1)',
                                padding: '2px 8px',
                                borderRadius: 10,
                                fontWeight: 500,
                                cursor: 'help',
                              }}
                            >
                              ⚠ Treffer prüfen
                            </span>
                          )}
                        </div>
                        {lead.googleMapsMatchedName && lead.googleMapsMatchedName !== lead.company && (
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>
                            Gefunden als: {lead.googleMapsMatchedName}
                          </div>
                        )}
                        {lead.googleMapsUrl && (
                          <a
                            href={lead.googleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              marginTop: 6,
                              fontSize: 11,
                              color: 'rgba(255,255,255,0.5)',
                              textDecoration: 'none',
                              transition: 'color 0.15s',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
                          >
                            Maps öffnen <span style={{ fontSize: 9 }}>↗</span>
                          </a>
                        )}
                      </div>
                    ) : lead.googleBusinessStatus === 'CLOSED_PERMANENTLY' ? (
                      <div>
                        <span
                          style={{
                            fontSize: 11,
                            color: '#ef4444',
                            background: 'rgba(239,68,68,0.12)',
                            padding: '3px 10px',
                            borderRadius: 10,
                            fontWeight: 600,
                          }}
                        >
                          Dauerhaft geschlossen
                        </span>
                        {lead.googleMapsUrl && (
                          <a
                            href={lead.googleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'block',
                              marginTop: 6,
                              fontSize: 11,
                              color: 'rgba(255,255,255,0.4)',
                              textDecoration: 'none',
                            }}
                          >
                            Maps öffnen <span style={{ fontSize: 9 }}>↗</span>
                          </a>
                        )}
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: 11, color: '#F59E0B', marginBottom: 2 }}>
                          Kein Google Maps Eintrag gefunden
                        </div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
                          Schwache lokale Sichtbarkeit — Kaufsignal
                        </div>
                        {lead.googleMapsUrl && (
                          <a
                            href={lead.googleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              marginTop: 6,
                              fontSize: 11,
                              color: 'rgba(255,255,255,0.4)',
                              textDecoration: 'none',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
                          >
                            Maps suchen <span style={{ fontSize: 9 }}>↗</span>
                          </a>
                        )}
                      </div>
                    )}

                    {lead.googleMapsSignals && lead.googleMapsSignals.length > 0 && (
                      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {lead.googleMapsSignals.map((signal, i) => (
                          <div
                            key={i}
                            style={{
                              fontSize: 11,
                              color: 'rgba(255,255,255,0.35)',
                              display: 'flex',
                              gap: 5,
                              lineHeight: 1.4,
                            }}
                          >
                            <span style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>•</span>
                            <span>{signal}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Aktuelle Signale (News) */}
                {(lead.hasNewsSignal || (lead.newsArticles && lead.newsArticles.length > 0)) && (
                  <div style={{ marginTop: 14, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 12 }}>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: 'rgba(255,255,255,0.25)',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase' as const,
                        marginBottom: 8,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                      }}
                    >
                      Aktuelle Signale
                    </div>

                    {lead.newsSignals && lead.newsSignals.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                        {lead.newsSignals.map((signal, i) => {
                          const isWarning =
                            signal.toLowerCase().includes('achtung') || signal.toLowerCase().includes('insolvenz');
                          return (
                            <span
                              key={i}
                              style={{
                                fontSize: 10,
                                fontWeight: 500,
                                color: isWarning ? '#ef4444' : '#1D9E75',
                                background: isWarning ? 'rgba(239,68,68,0.1)' : 'rgba(29,158,117,0.1)',
                                border: `1px solid ${isWarning ? 'rgba(239,68,68,0.15)' : 'rgba(29,158,117,0.15)'}`,
                                padding: '2px 8px',
                                borderRadius: 10,
                              }}
                            >
                              {signal}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {lead.newsArticles && lead.newsArticles.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                        {lead.newsArticles.slice(0, 3).map((article, i) => (
                          <div
                            key={i}
                            style={{
                              padding: '6px 0',
                              borderBottom:
                                i < Math.min(lead.newsArticles!.length, 3) - 1
                                  ? '1px solid rgba(255,255,255,0.04)'
                                  : 'none',
                            }}
                          >
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}>
                              {article.title.length > 80 ? article.title.slice(0, 80) + '...' : article.title}
                            </div>
                            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>
                              {article.source} · {formatDaysAgo(article.days_ago)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {lead.technologies.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>Technologien:</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                      {lead.technologies.map((t) => (
                        <span
                          key={t}
                          style={{
                            background: 'rgba(255,255,255,0.06)',
                            color: 'rgba(255,255,255,0.45)',
                            fontSize: 9,
                            padding: '2px 7px',
                            borderRadius: 4,
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* KI-Analyse */}
              <div>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}
                >
                  <SectionHeader title="KI-Analyse" />
                  {lead.aiScoredAt && (
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-dm-mono)' }}>
                      {new Date(lead.aiScoredAt).toLocaleDateString('de-DE', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, margin: '0 0 12px' }}>
                  {lead.aiSummary ?? `${lead.company} — weitere KI-Analyse wird durchgeführt.`}
                </p>

                {lead.strengths.length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 500,
                        color: 'rgba(255,255,255,0.3)',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase' as const,
                        marginBottom: 6,
                      }}
                    >
                      Stärken
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {lead.strengths.map((s, i) => (
                        <div
                          key={`s-${i}`}
                          style={{
                            fontSize: 12,
                            color: 'rgba(255,255,255,0.7)',
                            display: 'flex',
                            gap: 6,
                            lineHeight: 1.4,
                          }}
                        >
                          <span style={{ color: '#22C55E', flexShrink: 0 }}>✓</span>
                          <span>{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(lead.concerns.length > 0 || lead.redFlags.length > 0) && (
                  <div style={{ marginBottom: 10 }}>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 500,
                        color: 'rgba(255,255,255,0.3)',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase' as const,
                        marginBottom: 6,
                      }}
                    >
                      Bedenken
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {lead.concerns.map((c, i) => (
                        <div
                          key={`c-${i}`}
                          style={{
                            fontSize: 12,
                            color: 'rgba(255,255,255,0.6)',
                            display: 'flex',
                            gap: 6,
                            lineHeight: 1.4,
                          }}
                        >
                          <span style={{ color: '#F59E0B', flexShrink: 0 }}>△</span>
                          <span>{c}</span>
                        </div>
                      ))}
                      {lead.redFlags.map((r, i) => (
                        <div
                          key={`r-${i}`}
                          style={{
                            fontSize: 12,
                            color: 'rgba(255,255,255,0.6)',
                            display: 'flex',
                            gap: 6,
                            lineHeight: 1.4,
                          }}
                        >
                          <span style={{ color: '#F59E0B', flexShrink: 0 }}>△</span>
                          <span>{r}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {lead.aiSources && lead.aiSources.length > 0 && (
                  <div>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 500,
                        color: 'rgba(255,255,255,0.3)',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase' as const,
                        marginBottom: 6,
                      }}
                    >
                      Quellen
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {lead.aiSources.map((src, i) => (
                        <div key={i}>
                          <a
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontSize: 12,
                              color: 'rgba(255,255,255,0.7)',
                              textDecoration: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '4px 8px',
                              margin: '0 -8px',
                              borderRadius: 6,
                              transition: 'all 0.15s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                              e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                            }}
                          >
                            <span style={{ color: '#60a5fa', flexShrink: 0 }}>↗</span>
                            <span style={{ fontWeight: 500 }}>{src.label}</span>
                            <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, marginLeft: 'auto' }}>
                              {src.url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                            </span>
                          </a>
                          {src.info && (
                            <div
                              style={{
                                fontSize: 11,
                                color: 'rgba(255,255,255,0.35)',
                                paddingLeft: 22,
                                lineHeight: 1.4,
                              }}
                            >
                              {src.info}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!lead.websiteSummary && lead.website && (
                  <button
                    onClick={handleWebsiteScrape}
                    disabled={scrapingLoading || scrapingStarted}
                    style={{
                      marginTop: 10,
                      background: scrapingStarted ? 'rgba(34,197,94,0.1)' : 'rgba(107,122,255,0.1)',
                      color: scrapingStarted ? '#22C55E' : '#6B7AFF',
                      border: `1px solid ${scrapingStarted ? 'rgba(34,197,94,0.2)' : 'rgba(107,122,255,0.2)'}`,
                      borderRadius: 6,
                      padding: '6px 12px',
                      fontSize: 11,
                      cursor: scrapingLoading || scrapingStarted ? 'default' : 'pointer',
                      opacity: scrapingLoading ? 0.6 : 1,
                      transition: 'all 0.2s',
                    }}
                  >
                    {scrapingLoading
                      ? '⟳ Analysiere...'
                      : scrapingStarted
                        ? '✓ Analyse gestartet'
                        : 'Website analysieren'}
                  </button>
                )}

                {lead.websiteSummary && (
                  <div style={{ marginTop: 8, fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
                    {lead.websiteTitle && (
                      <div style={{ fontWeight: 500, color: 'rgba(255,255,255,0.55)', marginBottom: 2 }}>
                        {lead.websiteTitle}
                      </div>
                    )}
                    {lead.websiteSummary}
                  </div>
                )}
              </div>

              {/* E-Mail Draft */}
              {emailText && (
                <div style={{ marginTop: 16 }}>
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: 'rgba(255,255,255,0.3)',
                        fontWeight: 600,
                      }}
                    >
                      PERSONALISIERTE E-MAIL
                    </span>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {emailEditing ? (
                        <>
                          <button
                            onClick={saveEmailDraft}
                            disabled={emailSaving}
                            style={{
                              fontSize: 11,
                              color: '#22C55E',
                              background: 'rgba(34,197,94,0.1)',
                              border: '1px solid rgba(34,197,94,0.2)',
                              borderRadius: 6,
                              padding: '3px 10px',
                              cursor: 'pointer',
                              opacity: emailSaving ? 0.5 : 1,
                            }}
                          >
                            {emailSaving ? '...' : '✓ Speichern'}
                          </button>
                          <button
                            onClick={() => {
                              setEmailEditing(false);
                              setEmailText(lead.emailDraft ?? '');
                            }}
                            style={{
                              fontSize: 11,
                              color: 'rgba(255,255,255,0.4)',
                              background: 'rgba(255,255,255,0.06)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: 6,
                              padding: '3px 10px',
                              cursor: 'pointer',
                            }}
                          >
                            ✗ Abbrechen
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setEmailEditing(true)}
                            style={{
                              fontSize: 11,
                              color: 'rgba(255,255,255,0.4)',
                              background: 'rgba(255,255,255,0.06)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: 6,
                              padding: '3px 10px',
                              cursor: 'pointer',
                            }}
                          >
                            Bearbeiten
                          </button>
                          <button
                            onClick={copyDraft}
                            style={{
                              fontSize: 11,
                              color: draftCopied ? '#22C55E' : '#6B7AFF',
                              background: draftCopied ? 'rgba(34,197,94,0.1)' : 'rgba(107,122,255,0.1)',
                              border: `1px solid ${draftCopied ? 'rgba(34,197,94,0.2)' : 'rgba(107,122,255,0.2)'}`,
                              borderRadius: 6,
                              padding: '3px 10px',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                          >
                            {draftCopied ? '✓' : 'Kopieren'}
                          </button>
                          <button
                            onClick={() => setEmailExpanded((e) => !e)}
                            style={{
                              fontSize: 11,
                              color: 'rgba(255,255,255,0.4)',
                              background: 'rgba(255,255,255,0.06)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: 6,
                              padding: '3px 10px',
                              cursor: 'pointer',
                            }}
                          >
                            {emailExpanded ? '▲' : '▼'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {emailEditing ? (
                    <textarea
                      value={emailText}
                      onChange={(e) => setEmailText(e.target.value)}
                      style={{
                        width: '100%',
                        minHeight: 220,
                        background: '#0a0a0a',
                        border: '1px solid #6B7AFF',
                        borderRadius: 8,
                        padding: 12,
                        fontSize: 11,
                        color: '#fff',
                        lineHeight: 1.6,
                        resize: 'vertical',
                        outline: 'none',
                        fontFamily: 'var(--font-dm-mono)',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        background: '#0a0a0a',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 8,
                        padding: 12,
                        maxHeight: emailExpanded ? 'none' : 80,
                        overflow: 'hidden',
                        position: 'relative',
                        cursor: 'pointer',
                      }}
                      onClick={() => setEmailExpanded(true)}
                    >
                      {draftSubject && (
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#fff', marginBottom: 6 }}>
                          {draftSubject}
                        </div>
                      )}
                      <div
                        style={{
                          fontSize: 11,
                          color: 'rgba(255,255,255,0.5)',
                          lineHeight: 1.6,
                          whiteSpace: 'pre-line',
                        }}
                      >
                        {draftBody}
                      </div>
                      {!emailExpanded && (
                        <div
                          style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: 40,
                            background: 'linear-gradient(transparent, #0a0a0a)',
                          }}
                        />
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Tags */}
              {lead.aiTags.length > 0 && (
                <div>
                  <SectionHeader title="Tags" />
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {lead.aiTags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          background: 'rgba(107,122,255,0.1)',
                          color: '#6B7AFF',
                          fontSize: 10,
                          padding: '3px 10px',
                          borderRadius: 20,
                        }}
                      >
                        {tag.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Aktivitäten & Historie — faltbar */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: 4 }}>
                <button
                  onClick={() => setHistoryOpen((h) => !h)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 0',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'opacity 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <History size={14} style={{ color: 'rgba(255,255,255,0.3)' }} />
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 500,
                        color: 'rgba(255,255,255,0.4)',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                      }}
                    >
                      Aktivitäten & Historie
                    </span>
                    {realActivities.length > 0 && (
                      <span
                        style={{
                          fontSize: 10,
                          background: 'rgba(255,255,255,0.1)',
                          color: 'rgba(255,255,255,0.4)',
                          padding: '1px 6px',
                          borderRadius: 10,
                          fontFamily: 'var(--font-dm-mono)',
                        }}
                      >
                        {realActivities.length}
                      </span>
                    )}
                  </div>
                  <ChevronDown
                    size={14}
                    style={{
                      color: 'rgba(255,255,255,0.3)',
                      transition: 'transform 0.2s',
                      transform: historyOpen ? 'rotate(180deg)' : 'rotate(0)',
                    }}
                  />
                </button>

                {historyOpen && (
                  <div style={{ paddingBottom: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {activitiesLoading ? (
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', padding: '8px 0' }}>
                        Lade Aktivitäten…
                      </div>
                    ) : realActivities.length === 0 ? (
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', padding: '8px 0' }}>
                        Keine Aktivitäten vorhanden.
                      </div>
                    ) : (
                      realActivities.map((activity) => {
                        const typeIcon: Record<string, { icon: string; color: string }> = {
                          task: { icon: 'T', color: '#f97316' },
                          status_change: { icon: '↔', color: '#60a5fa' },
                          note: { icon: 'N', color: 'rgba(255,255,255,0.4)' },
                          email: { icon: 'E', color: '#22C55E' },
                          email_generated: { icon: 'E', color: '#8B5CF6' },
                          call: { icon: 'A', color: '#a78bfa' },
                          scored: { icon: 'S', color: '#6B7AFF' },
                          lead_created: { icon: '+', color: '#22C55E' },
                          website_analysis: { icon: 'W', color: '#3B82F6' },
                          enrichment: { icon: '★', color: '#22C55E' },
                        };
                        const ti = typeIcon[activity.type] ?? { icon: '•', color: 'rgba(255,255,255,0.3)' };
                        return (
                          <div
                            key={activity.id}
                            style={{
                              display: 'flex',
                              gap: 10,
                              padding: '8px 0',
                              borderBottom: '1px solid rgba(255,255,255,0.04)',
                            }}
                          >
                            <span style={{ color: ti.color, fontSize: 12, flexShrink: 0, marginTop: 1 }}>
                              {ti.icon}
                            </span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}>
                                {activity.title}
                              </div>
                              {activity.content && (
                                <div
                                  style={{
                                    fontSize: 11,
                                    color: 'rgba(255,255,255,0.35)',
                                    marginTop: 2,
                                    lineHeight: 1.4,
                                  }}
                                >
                                  {activity.content}
                                </div>
                              )}
                              <div
                                style={{
                                  fontSize: 10,
                                  color: 'rgba(255,255,255,0.2)',
                                  marginTop: 3,
                                  fontFamily: 'var(--font-dm-mono)',
                                }}
                              >
                                {new Date(activity.created_at).toLocaleDateString('de-DE', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── Actions Bar ── */}
            <div
              style={{
                padding: '14px 20px',
                borderTop: '1px solid rgba(255,255,255,0.07)',
                background: '#111',
                display: 'flex',
                gap: 8,
                flexShrink: 0,
              }}
            >
              {followUpDisplay ? (
                <div
                  style={{
                    flex: 1,
                    background: 'rgba(251, 191, 36, 0.1)',
                    border: '1px solid rgba(251, 191, 36, 0.25)',
                    borderRadius: 8,
                    padding: '8px 12px',
                    fontSize: 11,
                    color: '#FBBF24',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <span></span>
                  <span>
                    Follow-up E-Mail in: <strong>{followUpDisplay}</strong>
                  </span>
                </div>
              ) : (
                <button
                  onClick={sendEmail}
                  disabled={!lead.emailDraft || !lead.email || emailSending}
                  style={{
                    flex: 1,
                    background: emailSent ? 'rgba(34,197,94,0.15)' : 'rgba(107,122,255,0.15)',
                    color: emailSent ? '#22C55E' : emailSending ? 'rgba(107,122,255,0.6)' : '#6B7AFF',
                    border: `1px solid ${emailSent ? 'rgba(34,197,94,0.25)' : 'rgba(107,122,255,0.25)'}`,
                    borderRadius: 8,
                    padding: '8px 12px',
                    fontSize: 11,
                    fontWeight: 500,
                    cursor: lead.emailDraft && lead.email && !emailSending ? 'pointer' : 'default',
                    opacity: lead.emailDraft && lead.email ? 1 : 0.4,
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5,
                  }}
                >
                  {emailSending
                    ? 'Senden...'
                    : emailSent
                      ? '✓ Gesendet'
                      : followUpExpired && !autoFollowUp
                        ? 'Follow Up'
                        : 'E-Mail senden'}
                </button>
              )}
              <button
                onClick={copyDraft}
                disabled={!lead.emailDraft}
                title="E-Mail kopieren"
                style={{
                  width: 36,
                  background: 'rgba(255,255,255,0.06)',
                  color: draftCopied ? '#22C55E' : 'rgba(255,255,255,0.5)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  padding: '8px',
                  fontSize: 13,
                  cursor: lead.emailDraft ? 'pointer' : 'default',
                  opacity: lead.emailDraft ? 1 : 0.4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color 0.2s',
                }}
              >
                {draftCopied ? '✓' : 'Kopieren'}
              </button>

              <div style={{ position: 'relative', flex: 1 }}>
                <button
                  onClick={() => setStatusDropdown(!statusDropdown)}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.06)',
                    color: 'rgba(255,255,255,0.6)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    padding: '8px 12px',
                    fontSize: 11,
                    fontWeight: 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  Status ▾
                </button>
                {statusDropdown && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '100%',
                      left: 0,
                      right: 0,
                      marginBottom: 4,
                      background: '#181818',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 8,
                      overflow: 'hidden',
                      zIndex: 10,
                    }}
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => handleStatusChange(opt.value)}
                        disabled={statusUpdating}
                        style={{
                          display: 'block',
                          width: '100%',
                          padding: '8px 12px',
                          background: lead.status === opt.value ? 'rgba(255,255,255,0.06)' : 'transparent',
                          color: lead.status === opt.value ? '#fff' : 'rgba(255,255,255,0.5)',
                          border: 'none',
                          fontSize: 11,
                          cursor: statusUpdating ? 'wait' : 'pointer',
                          textAlign: 'left',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                        onMouseLeave={(e) => {
                          if (lead.status !== opt.value) e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => lead.linkedinUrl && window.open(lead.linkedinUrl, '_blank')}
                disabled={!lead.linkedinUrl}
                style={{
                  width: 36,
                  background: 'rgba(255,255,255,0.06)',
                  color: lead.linkedinUrl ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  padding: '8px',
                  fontSize: 11,
                  cursor: lead.linkedinUrl ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title={lead.linkedinUrl ? 'LinkedIn öffnen' : 'Kein LinkedIn'}
              >
                🔗
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
