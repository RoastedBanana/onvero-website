'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { mapLead, updateLeadStatus } from '@/lib/leads-client';
import type { Lead } from '@/lib/leads-client';
import LeadAvatar from '@/components/ui/LeadAvatar';
import PageHeader from '@/components/ui/PageHeader';

interface Activity {
  id: string;
  type: string;
  title: string;
  content: string | null;
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
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const scoreColor = lead.score >= 75 ? '#FF5C2E' : lead.score >= 45 ? '#F59E0B' : '#6B7AFF';
  const tierLabel = lead.tier?.toUpperCase() ?? (lead.score >= 75 ? 'HOT' : lead.score >= 45 ? 'WARM' : 'COLD');
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
                  }}
                >
                  {lead.score}
                </span>
              </div>
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
              {/* Copy email */}
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(lead.email);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  padding: '6px 14px',
                  fontSize: 12,
                  color: copied ? '#22C55E' : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  transition: 'color 0.2s',
                }}
              >
                {copied ? '✓ Kopiert' : '📧 E-Mail kopieren'}
              </button>
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
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(lead.emailDraft ?? '');
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
                    {emailCopied ? '✓ Kopiert' : '📋 Kopieren'}
                  </button>
                </div>
                <div
                  style={{
                    background: '#0a0a0a',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 8,
                    padding: 14,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 6 }}>
                    {lead.emailDraft.split('\n')[0]}
                  </div>
                  <div
                    style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, whiteSpace: 'pre-line' }}
                  >
                    {lead.emailDraft.split('\n').slice(1).join('\n').trim()}
                  </div>
                </div>
              </Card>
            )}

            {/* Buying Signals */}
            {lead.buyingSignals && lead.buyingSignals.length > 0 && (
              <Card title="⚡ Kaufsignale">
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
              <Card title="⚡ Nächste Aktion">
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
              <Card title="📍 Lokale Präsenz">
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
            {activities.length > 0 && (
              <Card title={`Aktivitäten (${activities.length})`}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {activities.map((a, i) => (
                    <div
                      key={a.id}
                      style={{
                        padding: '8px 0',
                        borderBottom: i < activities.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                      }}
                    >
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{a.title}</div>
                      {a.content && (
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{a.content}</div>
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
                  ))}
                </div>
              </Card>
            )}

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
                    ? '📍 Google Maps'
                    : lead.source === 'apollo_outbound'
                      ? '⚡ Apollo'
                      : (lead.source ?? '—')
                }
              />
              {lead.apolloId && <InfoRow label="Apollo ID" value={lead.apolloId} mono />}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
