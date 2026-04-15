'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { mapLead, updateLeadStatus } from '@/lib/leads-client';
import type { Lead } from '@/lib/leads-client';
import LeadAvatar from '@/components/ui/LeadAvatar';
import PageHeader from '@/components/ui/PageHeader';
import ScoreExplanation from '@/components/leads/ScoreExplanation';
import EmploymentTimeline from '@/components/leads/EmploymentTimeline';
import CompanyInfo from '@/components/leads/CompanyInfo';
import ResearchStatus from '@/components/leads/ResearchStatus';
import { Pencil, Check, Sparkles } from 'lucide-react';

interface Activity {
  id: string;
  type: string;
  title: string;
  content: string | null;
  content_full_title: string | null;
  content_full_content: string | null;
  interested: boolean | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

const STATUS_OPTIONS = [
  { value: 'new', label: 'Neu', color: '#a78bfa' },
  { value: 'contacted', label: 'Kontaktiert', color: '#6B7AFF' },
  { value: 'qualified', label: 'Qualifiziert', color: '#22C55E' },
  { value: 'lost', label: 'Verloren', color: 'rgba(255,255,255,0.3)' },
];

function ScoreBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', width: 120, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${Math.min((value / max) * 100, 100)}%`,
            background: color,
            borderRadius: 3,
            transition: 'width 0.6s ease',
          }}
        />
      </div>
      <span
        style={{
          fontSize: 12,
          color: 'rgba(255,255,255,0.7)',
          fontFamily: 'var(--font-dm-mono)',
          width: 42,
          textAlign: 'right',
        }}
      >
        {value} Pkt
      </span>
    </div>
  );
}

function Card({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div
      style={{
        background: '#111',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 12,
        padding: 20,
        marginBottom: 14,
      }}
    >
      {title && (
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.25)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase' as const,
            marginBottom: 12,
          }}
        >
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

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
        padding: '5px 0',
        borderBottom: '1px solid rgba(255,255,255,0.03)',
      }}
    >
      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{label}</span>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 12,
            color: '#60a5fa',
            textDecoration: 'none',
            fontFamily: mono ? 'var(--font-dm-mono)' : undefined,
          }}
        >
          {value} <span style={{ fontSize: 9, opacity: 0.5 }}>↗</span>
        </a>
      ) : (
        <span
          style={{
            fontSize: 12,
            color: 'rgba(255,255,255,0.75)',
            fontFamily: mono ? 'var(--font-dm-mono)' : undefined,
            textAlign: 'right',
            maxWidth: '60%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {value}
        </span>
      )}
    </div>
  );
}

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusDropdown, setStatusDropdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [viewActivity, setViewActivity] = useState<Activity | null>(null);
  const [activityPage, setActivityPage] = useState(0);
  const ACTIVITIES_PER_PAGE = 5;
  const [editingEmail, setEditingEmail] = useState(false);
  const [editedDraft, setEditedDraft] = useState('');
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [isScoring, setIsScoring] = useState(false);
  const [emailPreviewOpen, setEmailPreviewOpen] = useState(false);
  const [scoreExplanationOpen, setScoreExplanationOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    fetch(`/api/leads/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error(`API returned ${r.status}`);
        return r.json();
      })
      .then((d) => {
        if (d.lead) setLead(mapLead(d.lead));
        else setError('Lead-Daten leer');
        setActivities(d.activities ?? []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const refreshLead = async () => {
    if (!id) return;
    try {
      const r = await fetch(`/api/leads/${id}`);
      const d = await r.json();
      if (d.lead) setLead(mapLead(d.lead));
      setActivities(d.activities ?? []);
    } catch {
      /* ignore */
    }
  };

  const handleRescore = async () => {
    if (isScoring || !lead) return;
    setIsScoring(true);
    try {
      await fetch('/api/leads/rescore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: lead.id }),
      });
      await new Promise((r) => setTimeout(r, 75000));
      await refreshLead();
    } catch (e) {
      console.error(e);
    } finally {
      setIsScoring(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#0a0a0a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(255,255,255,0.3)',
          fontFamily: 'var(--font-dm-sans)',
        }}
      >
        Lade Lead...
      </div>
    );
  }

  if (!lead) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#0a0a0a',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          color: 'rgba(255,255,255,0.3)',
          fontFamily: 'var(--font-dm-sans)',
        }}
      >
        <div style={{ fontSize: 14 }}>Lead nicht gefunden</div>
        {error && <div style={{ fontSize: 11, color: '#ef4444' }}>{error}</div>}
        <button
          onClick={() => router.push('/dashboard/leads')}
          style={{
            marginTop: 8,
            fontSize: 12,
            color: 'rgba(255,255,255,0.4)',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 6,
            padding: '6px 14px',
            cursor: 'pointer',
          }}
        >
          ← Zurück zu Leads
        </button>
      </div>
    );
  }

  const scoreColor = lead.score >= 70 ? '#FF5C2E' : lead.score >= 45 ? '#F59E0B' : '#6B7AFF';
  const tierLabel = lead.tier?.toUpperCase() ?? (lead.score >= 70 ? 'HOT' : lead.score >= 45 ? 'WARM' : 'COLD');
  const bd = lead.scoreBreakdown;
  const st = STATUS_OPTIONS.find((o) => o.value === lead.status) ?? STATUS_OPTIONS[0];

  async function handleStatusChange(newStatus: string) {
    if (!lead) return;
    await updateLeadStatus(lead.id, newStatus);
    setLead({ ...lead, status: newStatus });
    setStatusDropdown(false);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', fontFamily: 'var(--font-dm-sans)', color: '#fff' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 32px' }}>
        {/* ── Back + Header ── */}
        <div style={{ marginBottom: 20 }}>
          <button
            onClick={() => router.push('/dashboard/leads')}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.4)',
              cursor: 'pointer',
              fontSize: 12,
              padding: '4px 0',
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            ← Zurück zu Leads
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <LeadAvatar website={lead.website} companyName={lead.company} score={lead.score} size="lg" />
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>{lead.company}</h1>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: scoreColor,
                    letterSpacing: '0.1em',
                    background: `${scoreColor}15`,
                    border: `1px solid ${scoreColor}30`,
                    borderRadius: 20,
                    padding: '3px 10px',
                  }}
                >
                  {tierLabel}
                </span>
                <span
                  style={{
                    fontSize: 36,
                    fontWeight: 900,
                    color: scoreColor,
                    fontFamily: 'var(--font-dm-mono)',
                    lineHeight: 1,
                    animation: isScoring ? 'onvero-pulse 1.5s ease-in-out infinite' : 'none',
                  }}
                >
                  {lead.score}
                </span>
                <button
                  onClick={() => setScoreExplanationOpen(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255,255,255,0.25)',
                    cursor: 'pointer',
                    fontSize: 10,
                    padding: '2px 6px',
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.25)')}
                >
                  Warum?
                </button>
              </div>
              <style>{`@keyframes onvero-pulse{0%,100%{opacity:0.3}50%{opacity:0.8}}`}</style>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                {lead.name}
                {lead.jobTitle ? ` · ${lead.jobTitle}` : ''}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {/* Status dropdown */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setStatusDropdown(!statusDropdown)}
                  style={{
                    background: `${st.color}18`,
                    color: st.color,
                    border: `1px solid ${st.color}30`,
                    borderRadius: 8,
                    padding: '6px 14px',
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  {st.label} ▾
                </button>
                {statusDropdown && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 30 }} onClick={() => setStatusDropdown(false)} />
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        marginTop: 4,
                        background: '#1a1a1a',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 8,
                        overflow: 'hidden',
                        zIndex: 31,
                        minWidth: 140,
                      }}
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => handleStatusChange(opt.value)}
                          style={{
                            display: 'block',
                            width: '100%',
                            padding: '8px 14px',
                            background: lead.status === opt.value ? 'rgba(255,255,255,0.06)' : 'transparent',
                            color: lead.status === opt.value ? '#fff' : 'rgba(255,255,255,0.5)',
                            border: 'none',
                            fontSize: 12,
                            cursor: 'pointer',
                            textAlign: 'left',
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
                  </>
                )}
              </div>
              {/* Send email */}
              {lead.emailDraft && (
                <button
                  disabled={emailSending || emailSent}
                  onClick={async () => {
                    if (!lead.emailDraft || !lead.email) return;
                    setEmailSending(true);
                    try {
                      const subject = lead.emailDraftSubject ?? '';
                      const emailBody = editedDraft || lead.emailDraft || '';
                      const res = await fetch('/api/leads/send-email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          lead_id: lead.id,
                          tenant_id: 'df763f85-c687-42d6-be66-a2b353b89c90',
                          to: lead.email,
                          subject,
                          html: emailBody,
                        }),
                      });
                      if (res.ok) {
                        setEmailSent(true);
                      } else {
                        alert('E-Mail senden fehlgeschlagen');
                      }
                    } catch {
                      alert('E-Mail senden fehlgeschlagen');
                    } finally {
                      setEmailSending(false);
                    }
                  }}
                  style={{
                    background: emailSent ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.08)',
                    border: `1px solid ${emailSent ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.15)'}`,
                    borderRadius: 8,
                    padding: '6px 14px',
                    fontSize: 12,
                    color: emailSent ? '#22C55E' : '#F59E0B',
                    cursor: emailSending || emailSent ? 'default' : 'pointer',
                    opacity: emailSending ? 0.6 : 1,
                    transition: 'color 0.2s',
                  }}
                >
                  {emailSent ? '✓ Gesendet' : emailSending ? 'Sende...' : 'E-Mail senden'}
                </button>
              )}
              {/* Delete */}
              {!deleteConfirm ? (
                <button
                  onClick={() => setDeleteConfirm(true)}
                  style={{
                    background: 'none',
                    border: '1px solid rgba(239,68,68,0.15)',
                    borderRadius: 8,
                    padding: '6px 10px',
                    fontSize: 12,
                    color: '#ef4444',
                    cursor: 'pointer',
                    opacity: 0.6,
                    transition: 'opacity 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
                  title="Lead löschen"
                >
                  🗑
                </button>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, color: '#ef4444' }}>Löschen?</span>
                  <button
                    onClick={async () => {
                      setDeleting(true);
                      try {
                        await fetch(`/api/leads/${lead.id}`, { method: 'DELETE' });
                        router.push('/dashboard/leads');
                      } catch {
                        setDeleting(false);
                      }
                    }}
                    disabled={deleting}
                    style={{
                      background: '#ef4444',
                      border: 'none',
                      borderRadius: 6,
                      padding: '4px 10px',
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#fff',
                      cursor: 'pointer',
                      opacity: deleting ? 0.5 : 1,
                    }}
                  >
                    {deleting ? '...' : 'Ja'}
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(false)}
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 6,
                      padding: '4px 10px',
                      fontSize: 11,
                      color: 'rgba(255,255,255,0.4)',
                      cursor: 'pointer',
                    }}
                  >
                    Nein
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Two Column Layout ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, alignItems: 'start' }}>
          {/* ── Left Column ── */}
          <div>
            {/* KI-Analyse */}
            <Card title="KI-Analyse">
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, margin: 0 }}>
                {lead.aiSummary ?? `${lead.company} — weitere KI-Analyse wird durchgeführt.`}
              </p>
            </Card>

            {/* Company Info */}
            {lead.organisation && <CompanyInfo organisation={lead.organisation} />}

            {/* Score Breakdown */}
            {bd && (
              <Card title="Score-Breakdown">
                {bd.unternehmensfit != null && (
                  <ScoreBar label="Unternehmensfit" value={bd.unternehmensfit} max={35} color={scoreColor} />
                )}
                {bd.kontaktqualitaet != null && (
                  <ScoreBar label="Kontaktqualität" value={bd.kontaktqualitaet} max={25} color={scoreColor} />
                )}
                {bd.entscheidungsposition != null && (
                  <ScoreBar label="Entscheiderpos." value={bd.entscheidungsposition} max={25} color={scoreColor} />
                )}
                {bd.kaufsignale != null && (
                  <ScoreBar label="Kaufsignale" value={bd.kaufsignale} max={15} color={scoreColor} />
                )}
                {bd.abzuege != null && bd.abzuege !== 0 && (
                  <div
                    style={{
                      fontSize: 11,
                      color: 'rgba(255,255,255,0.35)',
                      marginTop: 4,
                      fontFamily: 'var(--font-dm-mono)',
                    }}
                  >
                    Abzüge: −{Math.abs(bd.abzuege)} Pkt
                  </div>
                )}
              </Card>
            )}

            {/* E-Mail Draft */}
            {lead.emailDraft && (
              <Card title="Personalisierte E-Mail">
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginBottom: 8 }}>
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(editedDraft || lead.emailDraft || '');
                      setEmailCopied(true);
                      setTimeout(() => setEmailCopied(false), 2000);
                    }}
                    style={{
                      fontSize: 11,
                      color: emailCopied ? '#22C55E' : '#6B7AFF',
                      background: emailCopied ? 'rgba(34,197,94,0.1)' : 'rgba(107,122,255,0.1)',
                      border: `1px solid ${emailCopied ? 'rgba(34,197,94,0.2)' : 'rgba(107,122,255,0.2)'}`,
                      borderRadius: 6,
                      padding: '4px 10px',
                      cursor: 'pointer',
                    }}
                  >
                    {emailCopied ? '✓ Kopiert' : 'Kopieren'}
                  </button>
                  <button
                    disabled={emailSending || emailSent}
                    onClick={async () => {
                      if (!lead.emailDraft || !lead.email) return;
                      setEmailSending(true);
                      try {
                        const subject = lead.emailDraftSubject ?? '';
                        const emailBody = editedDraft || lead.emailDraft || '';
                        const res = await fetch('/api/leads/send-email', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            lead_id: lead.id,
                            tenant_id: 'df763f85-c687-42d6-be66-a2b353b89c90',
                            to: lead.email,
                            subject,
                            html: emailBody,
                          }),
                        });
                        if (res.ok) {
                          setEmailSent(true);
                        } else {
                          alert('E-Mail senden fehlgeschlagen');
                        }
                      } catch {
                        alert('E-Mail senden fehlgeschlagen');
                      } finally {
                        setEmailSending(false);
                      }
                    }}
                    style={{
                      fontSize: 11,
                      color: emailSent ? '#22C55E' : '#F59E0B',
                      background: emailSent ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
                      border: `1px solid ${emailSent ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)'}`,
                      borderRadius: 6,
                      padding: '4px 10px',
                      cursor: emailSending || emailSent ? 'default' : 'pointer',
                      opacity: emailSending ? 0.6 : 1,
                    }}
                  >
                    {emailSent ? '✓ Gesendet' : emailSending ? 'Sende...' : 'E-Mail senden'}
                  </button>
                </div>
                <div
                  style={{
                    background: '#0a0a0a',
                    border: aiLoading ? '1px solid rgba(107,122,255,0.2)' : '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 8,
                    padding: 14,
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'border-color 0.3s',
                  }}
                >
                  {aiError && (
                    <div
                      style={{
                        background: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.25)',
                        borderRadius: 6,
                        padding: '8px 12px',
                        marginBottom: 10,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div
                        style={{ fontSize: 12, color: '#ef4444', lineHeight: 1.6, flex: 1 }}
                        dangerouslySetInnerHTML={{
                          __html: aiError.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>'),
                        }}
                      />
                      <button
                        onClick={() => setAiError(null)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          fontSize: 14,
                          padding: '0 4px',
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                  {aiLoading && (
                    <>
                      <style>{`@keyframes aiShimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }`}</style>
                      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2 }}>
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            background:
                              'linear-gradient(90deg, transparent 0%, rgba(107,122,255,0.12) 40%, rgba(107,122,255,0.22) 50%, rgba(107,122,255,0.12) 60%, transparent 100%)',
                            animation: 'aiShimmer 1.5s ease-in-out infinite',
                          }}
                        />
                      </div>
                    </>
                  )}
                  {editingEmail ? (
                    <div
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => setEditedDraft(e.currentTarget.innerHTML)}
                      onInput={(e) => setEditedDraft(e.currentTarget.innerHTML)}
                      dangerouslySetInnerHTML={{ __html: editedDraft }}
                      style={{
                        width: '100%',
                        minHeight: 180,
                        background: 'transparent',
                        outline: 'none',
                        color: 'rgba(255,255,255,0.7)',
                        fontSize: 13,
                        lineHeight: 1.7,
                        fontFamily: 'inherit',
                        border: '1px dashed rgba(107,122,255,0.3)',
                        borderRadius: 6,
                        padding: 8,
                      }}
                    />
                  ) : (
                    <>
                      {lead.emailDraftSubject && (
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 8 }}>
                          {lead.emailDraftSubject}
                        </div>
                      )}
                      <style>{`.email-draft-content p { margin: 0 0 0.8em; } .email-draft-content br { display: block; content: ""; margin-top: 0.4em; }`}</style>
                      <div
                        className="email-draft-content"
                        style={{
                          fontSize: 13,
                          color: 'rgba(255,255,255,0.7)',
                          lineHeight: 1.7,
                          whiteSpace: 'pre-line',
                        }}
                        dangerouslySetInnerHTML={{ __html: editedDraft || lead.emailDraft || '' }}
                      />
                    </>
                  )}
                  {/* Edit + AI buttons */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginTop: 10 }}>
                    <button
                      onClick={async () => {
                        if (editingEmail) {
                          setEditingEmail(false);
                          if (editedDraft && editedDraft !== lead.emailDraft) {
                            await fetch(`/api/leads/${lead.id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ email_draft_body: editedDraft }),
                            });
                            setLead((prev) => (prev ? { ...prev, emailDraft: editedDraft } : prev));
                          }
                        } else {
                          setEditedDraft(editedDraft || lead.emailDraft || '');
                          setEditingEmail(true);
                        }
                      }}
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 6,
                        border: '1px solid rgba(255,255,255,0.12)',
                        background: editingEmail ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)',
                        color: editingEmail ? '#22C55E' : 'rgba(255,255,255,0.4)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                      }}
                      title={editingEmail ? 'Speichern' : 'Bearbeiten'}
                    >
                      {editingEmail ? <Check size={14} /> : <Pencil size={13} />}
                    </button>
                    <button
                      onClick={() => setAiModalOpen(true)}
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 6,
                        border: '1px solid rgba(107,122,255,0.25)',
                        background: 'rgba(107,122,255,0.12)',
                        color: '#6B7AFF',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title="KI-Änderung"
                    >
                      <Sparkles size={13} />
                    </button>
                  </div>
                </div>
              </Card>
            )}

            {/* Buying Signals */}
            {lead.buyingSignals && lead.buyingSignals.length > 0 && (
              <Card title="Kaufsignale">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {lead.buyingSignals.map((s, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: 11,
                        color: '#92400e',
                        background: 'rgba(245,158,11,0.15)',
                        border: '1px solid rgba(245,158,11,0.2)',
                        padding: '3px 10px',
                        borderRadius: 10,
                        fontWeight: 500,
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </Card>
            )}

            {/* Strengths & Concerns */}
            {(lead.strengths.length > 0 || lead.concerns.length > 0 || lead.redFlags.length > 0) && (
              <Card title="Stärken & Bedenken">
                {lead.strengths.length > 0 && (
                  <div style={{ marginBottom: lead.concerns.length > 0 || lead.redFlags.length > 0 ? 12 : 0 }}>
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
                    {lead.strengths.map((s, i) => (
                      <div
                        key={i}
                        style={{
                          fontSize: 13,
                          color: 'rgba(255,255,255,0.7)',
                          display: 'flex',
                          gap: 6,
                          marginBottom: 4,
                          lineHeight: 1.4,
                        }}
                      >
                        <span style={{ color: '#22C55E', flexShrink: 0 }}>✓</span>
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                )}
                {(lead.concerns.length > 0 || lead.redFlags.length > 0) && (
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
                      Bedenken
                    </div>
                    {[...lead.concerns, ...lead.redFlags].map((c, i) => (
                      <div
                        key={i}
                        style={{
                          fontSize: 13,
                          color: 'rgba(255,255,255,0.6)',
                          display: 'flex',
                          gap: 6,
                          marginBottom: 4,
                          lineHeight: 1.4,
                        }}
                      >
                        <span style={{ color: '#F59E0B', flexShrink: 0 }}>△</span>
                        <span>{c}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* Next Action */}
            {lead.nextAction && (
              <Card title="Nächste Aktion">
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, margin: 0 }}>
                  {lead.nextAction}
                </p>
              </Card>
            )}
          </div>

          {/* ── Right Column ── */}
          <div>
            {/* Contact Info */}
            <Card title="Kontaktdaten">
              <InfoRow label="E-Mail" value={lead.email} href={`mailto:${lead.email}`} />
              <InfoRow label="Telefon" value={lead.phone} href={lead.phone ? `tel:${lead.phone}` : undefined} />
              <InfoRow
                label="Website"
                value={lead.website?.replace(/^https?:\/\/(www\.)?/, '')}
                href={lead.website ?? undefined}
              />
              <InfoRow
                label="LinkedIn"
                value={lead.linkedinUrl ? 'Profil öffnen' : undefined}
                href={lead.linkedinUrl ?? undefined}
              />
              <InfoRow label="Stadt" value={lead.city} />
              <InfoRow label="Land" value={lead.country} />
            </Card>

            {/* Company Info */}
            <Card title="Firmeninfo">
              <InfoRow label="Branche" value={lead.industry} />
              <InfoRow label="Mitarbeiter" value={lead.employeeCount ? String(lead.employeeCount) : undefined} />
              <InfoRow label="Budget" value={lead.budgetEstimate} />
            </Card>

            {/* Sources */}
            {lead.aiSources && lead.aiSources.length > 0 && (
              <Card title="Quellen">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
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
                          padding: '4px 0',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
                      >
                        <span style={{ color: '#60a5fa', flexShrink: 0 }}>↗</span>
                        <span style={{ fontWeight: 500 }}>{src.label}</span>
                        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, marginLeft: 'auto' }}>
                          {src.url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                        </span>
                      </a>
                      {src.info && (
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', paddingLeft: 18, lineHeight: 1.4 }}>
                          {src.info}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Tags */}
            {lead.aiTags.length > 0 && (
              <Card title="Tags">
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
              </Card>
            )}

            {/* Google Maps */}
            {lead.googleBusinessStatus === 'OPERATIONAL' && lead.googleRating != null && (
              <Card title="Lokale Präsenz">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      fontSize: 24,
                      fontWeight: 700,
                      color: lead.googleRating >= 4.0 ? '#1D9E75' : lead.googleRating >= 3.0 ? '#F59E0B' : '#ef4444',
                      fontFamily: 'var(--font-dm-mono)',
                    }}
                  >
                    {lead.googleRating.toFixed(1)}
                  </span>
                  <div style={{ display: 'flex', gap: 1 }}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: 14,
                          color:
                            i < Math.round(lead.googleRating!)
                              ? lead.googleRating! >= 4.0
                                ? '#1D9E75'
                                : '#F59E0B'
                              : 'rgba(255,255,255,0.1)',
                        }}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>({lead.googleReviews ?? 0})</span>
                </div>
                {lead.googleMapsUrl && (
                  <a
                    href={lead.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-block',
                      marginTop: 8,
                      fontSize: 11,
                      color: 'rgba(255,255,255,0.5)',
                      textDecoration: 'none',
                    }}
                  >
                    Maps öffnen ↗
                  </a>
                )}
              </Card>
            )}

            {/* Activities */}
            {activities.length > 0 &&
              (() => {
                const totalPages = Math.ceil(activities.length / ACTIVITIES_PER_PAGE);
                const paged = activities.slice(
                  activityPage * ACTIVITIES_PER_PAGE,
                  (activityPage + 1) * ACTIVITIES_PER_PAGE
                );
                return (
                  <Card title={`Aktivitäten (${activities.length})`}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                      {paged.map((a, i) => {
                        const dimmed = a.type === 'task' || a.type === 'ai_analysis';
                        const intBg =
                          a.interested === true
                            ? 'rgba(34,197,94,0.08)'
                            : a.interested === false
                              ? 'rgba(239,68,68,0.08)'
                              : 'transparent';
                        const intBorder =
                          a.interested === true
                            ? '1px solid rgba(34,197,94,0.15)'
                            : a.interested === false
                              ? '1px solid rgba(239,68,68,0.15)'
                              : 'none';
                        return (
                          <div
                            key={a.id}
                            style={{
                              padding: '8px',
                              marginBottom: i < paged.length - 1 ? 4 : 0,
                              borderRadius: a.interested != null ? 6 : 0,
                              background: intBg,
                              border: intBorder,
                              borderBottom:
                                a.interested == null && i < paged.length - 1
                                  ? '1px solid rgba(255,255,255,0.04)'
                                  : undefined,
                              opacity: dimmed ? 0.4 : 1,
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div
                                style={{
                                  fontSize: 12,
                                  color: dimmed ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.7)',
                                  flex: 1,
                                }}
                              >
                                {a.title}
                              </div>
                              {(a.content_full_title || a.content_full_content) && (
                                <button
                                  onClick={() => setViewActivity(a)}
                                  style={{
                                    fontSize: 10,
                                    color: '#6B7AFF',
                                    background: 'rgba(107,122,255,0.1)',
                                    border: '1px solid rgba(107,122,255,0.2)',
                                    borderRadius: 5,
                                    padding: '2px 8px',
                                    cursor: 'pointer',
                                    flexShrink: 0,
                                  }}
                                >
                                  Ansehen
                                </button>
                              )}
                            </div>
                            {a.content && (
                              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                                {a.content}
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
                              {new Date(a.created_at).toLocaleDateString('de-DE', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {totalPages > 1 && (
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginTop: 10,
                          paddingTop: 10,
                          borderTop: '1px solid rgba(255,255,255,0.06)',
                        }}
                      >
                        <button
                          disabled={activityPage === 0}
                          onClick={() => setActivityPage((p) => p - 1)}
                          style={{
                            fontSize: 11,
                            color: activityPage === 0 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.5)',
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 5,
                            padding: '3px 10px',
                            cursor: activityPage === 0 ? 'default' : 'pointer',
                          }}
                        >
                          ← Zurück
                        </button>
                        <span
                          style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-dm-mono)' }}
                        >
                          {activityPage + 1} / {totalPages}
                        </span>
                        <button
                          disabled={activityPage >= totalPages - 1}
                          onClick={() => setActivityPage((p) => p + 1)}
                          style={{
                            fontSize: 11,
                            color: activityPage >= totalPages - 1 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.5)',
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 5,
                            padding: '3px 10px',
                            cursor: activityPage >= totalPages - 1 ? 'default' : 'pointer',
                          }}
                        >
                          Weiter →
                        </button>
                      </div>
                    )}
                  </Card>
                );
              })()}

            {/* Meta */}
            <Card title="Metadaten">
              <InfoRow
                label="Erstellt am"
                value={new Date(lead.createdAt).toLocaleDateString('de-DE', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              />
              <InfoRow
                label="Quelle"
                value={
                  lead.source === 'google_maps_apify'
                    ? 'Google Maps'
                    : lead.source === 'apollo_outbound'
                      ? 'Apollo'
                      : (lead.source ?? '—')
                }
              />
              {lead.apolloId && <InfoRow label="Apollo ID" value={lead.apolloId} mono />}
            </Card>

            {/* Research status */}
            <ResearchStatus
              isExcluded={!!lead.isExcluded}
              exclusionReason={lead.exclusionReason}
              websiteData={lead.websiteData}
              followUpContext={lead.followUpContext}
            />
          </div>
        </div>

        {/* Employment History Timeline */}
        {lead.employmentHistory && lead.employmentHistory.length > 0 && (
          <EmploymentTimeline entries={lead.employmentHistory} />
        )}
      </div>

      {/* AI Rewrite Modal */}
      {aiModalOpen && (
        <div
          onClick={() => {
            if (!aiLoading) setAiModalOpen(false);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#111',
              border: '1px solid rgba(107,122,255,0.2)',
              borderRadius: 14,
              padding: 24,
              maxWidth: 500,
              width: '90%',
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 14 }}>✦ KI-Änderung</div>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Beschreibe, was die KI ändern soll..."
              style={{
                width: '100%',
                minHeight: 100,
                background: '#0a0a0a',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                padding: 12,
                color: 'rgba(255,255,255,0.8)',
                fontSize: 13,
                lineHeight: 1.6,
                fontFamily: 'inherit',
                resize: 'vertical',
                outline: 'none',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
              <button
                disabled={aiLoading}
                onClick={() => {
                  setAiModalOpen(false);
                  setAiPrompt('');
                }}
                style={{
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.4)',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 6,
                  padding: '6px 14px',
                  cursor: 'pointer',
                }}
              >
                Abbrechen
              </button>
              <button
                disabled={aiLoading || !aiPrompt.trim()}
                onClick={() => {
                  const subject = lead?.emailDraftSubject ?? '';
                  const body = editedDraft || lead?.emailDraft || '';
                  const prompt = aiPrompt;
                  setAiModalOpen(false);
                  setAiPrompt('');
                  setAiError(null);
                  setAiLoading(true);
                  fetch('/api/leads/ai-rewrite', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      prompt,
                      subject,
                      body,
                      lead_id: lead?.id,
                      tenant_id: 'df763f85-c687-42d6-be66-a2b353b89c90',
                    }),
                  })
                    .then(async (res) => {
                      const data = await res.json().catch(() => ({}));
                      if (!res.ok || data.error) {
                        setAiError(data.error ?? 'KI-Änderung fehlgeschlagen');
                        return;
                      }
                      return data;
                    })
                    .then(async (data) => {
                      if (!data) return;
                      // Webhook updates Supabase directly — reload lead data
                      const res2 = await fetch(`/api/leads/${lead?.id}`);
                      if (res2.ok) {
                        const d = await res2.json();
                        if (d.lead) {
                          const updated = mapLead(d.lead);
                          setLead(updated);
                          setEditedDraft(updated.emailDraft ?? '');
                        }
                      }
                    })
                    .catch(() => setAiError('KI-Änderung fehlgeschlagen'))
                    .finally(() => setAiLoading(false));
                }}
                style={{
                  fontSize: 12,
                  color: '#fff',
                  background: aiLoading ? 'rgba(107,122,255,0.3)' : '#6B7AFF',
                  border: 'none',
                  borderRadius: 6,
                  padding: '6px 14px',
                  cursor: aiLoading || !aiPrompt.trim() ? 'default' : 'pointer',
                  opacity: !aiPrompt.trim() ? 0.5 : 1,
                }}
              >
                {aiLoading ? 'KI arbeitet...' : 'Absenden'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activity Detail Popup */}
      {viewActivity && (
        <div
          onClick={() => setViewActivity(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#111',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 14,
              padding: 24,
              maxWidth: 600,
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>
                {viewActivity.content_full_title ?? viewActivity.title}
              </div>
              <button
                onClick={() => setViewActivity(null)}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 6,
                  padding: '4px 10px',
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                }}
              >
                Schliessen
              </button>
            </div>
            {viewActivity.content_full_content && (
              <div
                style={{
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.7)',
                  lineHeight: 1.7,
                }}
                dangerouslySetInnerHTML={{ __html: viewActivity.content_full_content }}
              />
            )}
          </div>
        </div>
      )}

      {lead && (
        <>
          <ScoreExplanation
            isOpen={scoreExplanationOpen}
            onClose={() => setScoreExplanationOpen(false)}
            lead={{
              company: lead.company,
              score: lead.score,
              scoreBreakdown: lead.scoreBreakdown,
              aiSummary: lead.aiSummary,
              strengths: lead.strengths,
              concerns: lead.concerns,
            }}
          />
        </>
      )}
    </div>
  );
}
