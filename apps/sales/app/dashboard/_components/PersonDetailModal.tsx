'use client';

// Shared PersonDetailModal — used by /dashboard/people and /dashboard/unternehmen/[id]

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { C, SvgIcon, ICONS, showToast } from '../_shared';

export interface Contact {
  id: string;
  lead_id: string;
  lead_contact_id: string | null;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  title: string | null;
  headline: string | null;
  seniority: string | null;
  email: string | null;
  email_status: string | null;
  phone: string | null;
  mobile_phone: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  facebook_url: string | null;
  github_url: string | null;
  photo_url: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  departments: string[] | null;
  functions: string[] | null;
  status: string | null;
  created_at: string;
  email_draft_subject: string | null;
  email_draft_body: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  employment_history: any[] | null;
  leads?: { company_name: string; website: string | null; city: string | null; country: string | null; industry: string | null; company_description: string | null; estimated_num_employees: number | null; logo_url: string | null; fit_score: number | null } | null;
}

// Convert email body to safe HTML: if it already contains HTML tags, keep it;
// otherwise convert plain text (newlines → <br>, double newlines → paragraphs, URLs → links)
function renderEmailHtml(raw: string | null | undefined): string {
  if (!raw) return '';
  const hasHtml = /<\/?(p|br|div|a|strong|em|b|i|ul|ol|li|blockquote|h[1-6]|span|table|tr|td)\b/i.test(raw);
  if (hasHtml) return raw;

  // Plain text: escape then transform
  const escaped = raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  // Linkify URLs
  const linked = escaped.replace(
    /(https?:\/\/[^\s<]+)/g,
    (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`
  );
  // Split into paragraphs on double newlines, single newlines → <br>
  return linked
    .split(/\n{2,}/)
    .map((para) => `<p>${para.replace(/\n/g, '<br>')}</p>`)
    .join('');
}

// ─── DETAIL MODAL ───────────────────────────────────────────────────────────

export function PersonDetail({ contact, onClose }: { contact: Contact; onClose: () => void }) {
  const name = contact.full_name ?? ([contact.first_name, contact.last_name].filter(Boolean).join(' ') || '—');
  const title = contact.title ?? contact.headline ?? null;
  const email = contact.email ?? null;
  const emailStatus = contact.email_status ?? null;
  const phone = contact.phone ?? contact.mobile_phone ?? null;
  const linkedin = contact.linkedin_url ?? null;
  const city = contact.city ?? null;
  const country = contact.country ?? null;
  const seniority = contact.seniority ?? null;
  const photo = contact.photo_url ?? null;
  const employment = contact.employment_history ?? [];
  const company = contact.leads;
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Email draft state (editable)
  const [emailDraftSubject, setEmailDraftSubject] = useState(contact.email_draft_subject ?? '');
  const [emailDraftBody, setEmailDraftBody] = useState(contact.email_draft_body ?? '');
  const [editing, setEditing] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const bodyEditorRef = useRef<HTMLDivElement>(null);

  // When entering edit mode or when body changes externally (rewrite),
  // seed the editor with current HTML. During typing we don't reset innerHTML
  // (that would move the caret), so only reset when entering edit mode.
  useEffect(() => {
    if (editing && bodyEditorRef.current) {
      bodyEditorRef.current.innerHTML = renderEmailHtml(emailDraftBody);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);
  // Rewrite popup
  const [showRewrite, setShowRewrite] = useState(false);
  const [rewritePrompt, setRewritePrompt] = useState('');
  const [rewriting, setRewriting] = useState(false);

  async function handleSaveDraft() {
    setSavingDraft(true);
    try {
      const res = await fetch(`/api/people/${contact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email_draft_subject: emailDraftSubject,
          email_draft_body: emailDraftBody,
        }),
      });
      if (res.ok) {
        showToast('Entwurf gespeichert', 'success');
        setEditing(false);
      } else {
        showToast('Fehler beim Speichern', 'error');
      }
    } catch {
      showToast('Netzwerkfehler', 'error');
    } finally {
      setSavingDraft(false);
    }
  }

  async function handleRewrite() {
    if (!rewritePrompt.trim()) return;
    // Close popup immediately and start loading state on card
    const promptCopy = rewritePrompt;
    setShowRewrite(false);
    setRewritePrompt('');
    setRewriting(true);
    try {
      const res = await fetch('/api/people/rewrite-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptCopy,
          subject: emailDraftSubject,
          body: emailDraftBody,
          lead_id: contact.lead_id,
          people_id: contact.lead_contact_id,
        }),
      });

      if (!res.ok) {
        showToast('Fehler bei der Anfrage', 'error');
        return;
      }

      const data = await res.json();
      console.log('[rewrite-email] webhook response:', data);

      // Try to get updated email from webhook response first
      let newSubject = data?.email_draft_subject ?? data?.subject ?? null;
      let newBody = data?.email_draft_body ?? data?.body ?? data?.output ?? null;

      // Fallback: refetch from DB (n8n workflow may have written directly)
      if (!newSubject && !newBody) {
        const refreshRes = await fetch(`/api/people/${contact.id}`, { cache: 'no-store' });
        if (refreshRes.ok) {
          const fresh = await refreshRes.json();
          newSubject = fresh?.contact?.email_draft_subject ?? null;
          newBody = fresh?.contact?.email_draft_body ?? null;
        }
      }

      if (newSubject !== null) setEmailDraftSubject(newSubject);
      if (newBody !== null) setEmailDraftBody(newBody);

      // Persist to DB only if we got new content from webhook response (not from refetch)
      if ((data?.email_draft_subject || data?.subject || data?.email_draft_body || data?.body || data?.output)) {
        await fetch(`/api/people/${contact.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email_draft_subject: newSubject ?? emailDraftSubject,
            email_draft_body: newBody ?? emailDraftBody,
          }),
        });
      }

      if (newSubject || newBody) {
        showToast('E-Mail neu generiert', 'success');
      } else {
        showToast('Keine neue E-Mail erhalten', 'error');
      }
    } catch (err) {
      console.error('[rewrite-email] error:', err);
      showToast('Netzwerkfehler', 'error');
    } finally {
      setRewriting(false);
    }
  }

  async function handleSendEmail() {
    if (!email || !emailDraftBody || sending || sent) return;
    setSending(true);
    try {
      const res = await fetch('/api/people/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: contact.lead_id,
          to: email,
          subject: emailDraftSubject || `Kontaktaufnahme – ${company?.company_name ?? ''}`,
          html: renderEmailHtml(emailDraftBody),
        }),
      });
      if (res.ok) {
        setSent(true);
        showToast('E-Mail gesendet', 'success');
        // Reset checkmark after 4s so user can send again
        setTimeout(() => setSent(false), 4000);
      } else {
        showToast('Fehler beim Senden', 'error');
      }
    } catch {
      showToast('Netzwerkfehler', 'error');
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: 60, overflowY: 'auto',
        animation: 'fadeIn 0.15s ease both',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 680, background: C.bg,
          border: `1px solid ${C.border}`, borderRadius: 16,
          boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
          animation: 'fadeInUp 0.25s cubic-bezier(0.22,1,0.36,1) both',
          marginBottom: 60,
        }}
      >
        {/* Header */}
        <div style={{ padding: '24px 28px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          {photo ? (
            <img src={photo} alt="" style={{ width: 56, height: 56, borderRadius: 14, objectFit: 'cover', border: `1px solid ${C.border}`, flexShrink: 0 }} />
          ) : (
            <div style={{
              width: 56, height: 56, borderRadius: 14, flexShrink: 0,
              background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(99,102,241,0.05))',
              border: `1px solid rgba(99,102,241,0.2)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 600, color: C.accent,
            }}>
              {name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text1, margin: 0 }}>{name}</h2>
            {title && <div style={{ fontSize: 13, color: C.accent, marginTop: 3 }}>{title}</div>}
            {seniority && <div style={{ fontSize: 11, color: C.text3, marginTop: 2, textTransform: 'capitalize' }}>{seniority}</div>}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0 }}>
            <SvgIcon d={ICONS.x} size={18} color={C.text3} />
          </button>
        </div>

        <div style={{ padding: '20px 28px 28px' }}>
          {/* Contact details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
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
                <div style={{ width: 28, height: 28, borderRadius: 7, background: C.accentGhost, border: `1px solid rgba(99,102,241,0.15)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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
          </div>

          {/* Company info */}
          {company && (
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 10, color: C.text3, letterSpacing: '0.06em', fontWeight: 500, marginBottom: 10 }}>UNTERNEHMEN</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                {company.logo_url ? (
                  <img src={company.logo_url} alt="" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'contain', background: '#fff', padding: 2 }} />
                ) : (
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: C.accentGhost, border: `1px solid ${C.borderAccent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: C.accent }}>
                    {(company.company_name || '?')[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <Link href={`/dashboard/unternehmen/${contact.lead_id}`} style={{ fontSize: 14, fontWeight: 600, color: C.text1, textDecoration: 'none' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = C.accentBright; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = C.text1; }}
                  >
                    {company.company_name} ↗
                  </Link>
                  {company.industry && <div style={{ fontSize: 11, color: C.text3, marginTop: 1 }}>{company.industry}</div>}
                </div>
                {company.fit_score != null && company.fit_score > 0 && (
                  <div style={{ marginLeft: 'auto', fontSize: 18, fontWeight: 700, color: company.fit_score >= 70 ? C.accent : company.fit_score >= 45 ? C.warning : C.text3, fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}>
                    {company.fit_score}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 11, color: C.text2 }}>
                {company.city && <span>{[company.city, company.country].filter(Boolean).join(', ')}</span>}
                {company.estimated_num_employees && <span>~{company.estimated_num_employees.toLocaleString('de-DE')} MA</span>}
                {company.website && (
                  <a href={company.website.startsWith('http') ? company.website : `https://${company.website}`} target="_blank" rel="noopener noreferrer"
                    style={{ color: C.accent, textDecoration: 'none' }}>
                    {company.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                  </a>
                )}
              </div>
              {company.company_description && (
                <p style={{ fontSize: 12, color: C.text2, lineHeight: 1.6, margin: '10px 0 0' }}>
                  {company.company_description.length > 200 ? company.company_description.slice(0, 200) + '...' : company.company_description}
                </p>
              )}
            </div>
          )}

          {/* Employment history */}
          {employment.length > 0 && (
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 10, color: C.text3, letterSpacing: '0.06em', fontWeight: 500, marginBottom: 10 }}>KARRIERE</div>
              {employment.slice(0, 5).map((e: Record<string, unknown>, i: number) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: i < Math.min(employment.length, 5) - 1 ? `1px solid rgba(255,255,255,0.03)` : 'none' }}>
                  <div style={{ width: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 6, flexShrink: 0 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: e.current ? C.accent : C.text3 }} />
                    {i < Math.min(employment.length, 5) - 1 && <div style={{ width: 1, flex: 1, background: 'rgba(255,255,255,0.06)', marginTop: 4 }} />}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: e.current ? C.text1 : C.text2 }}>{String(e.title ?? '')}</div>
                    <div style={{ fontSize: 11, color: C.text3, marginTop: 1 }}>
                      {String(e.organization_name ?? e.name ?? '')}
                      {e.start_date ? <span> · {String(e.start_date).slice(0, 7)}{e.current ? ' – heute' : e.end_date ? ` – ${String(e.end_date).slice(0, 7)}` : ''}</span> : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Email draft */}
          {(emailDraftBody || editing) && (
            <div
              style={{
                background: C.surface,
                border: `1px solid ${rewriting ? 'rgba(129,140,248,0.35)' : C.border}`,
                borderRadius: 10,
                padding: 16,
                position: 'relative',
                overflow: 'hidden',
                boxShadow: rewriting ? '0 0 24px rgba(129,140,248,0.22), inset 0 0 0 1px rgba(129,140,248,0.08)' : 'none',
                transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
              }}
            >
              <style>{`
                @keyframes emailShimmer {
                  0% { transform: translateX(-100%); }
                  100% { transform: translateX(200%); }
                }
                @keyframes emailPulseBorder {
                  0%, 100% { opacity: 0.6; }
                  50% { opacity: 1; }
                }
                @keyframes checkPop {
                  0% { transform: scale(0) rotate(-20deg); opacity: 0; }
                  60% { transform: scale(1.2) rotate(0deg); opacity: 1; }
                  100% { transform: scale(1) rotate(0deg); opacity: 1; }
                }
              `}</style>
              {rewriting && (
                <>
                  {/* Shimmer overlay */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      pointerEvents: 'none',
                      overflow: 'hidden',
                      borderRadius: 10,
                      zIndex: 2,
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '50%',
                        height: '100%',
                        background:
                          'linear-gradient(90deg, transparent 0%, rgba(165,180,252,0.18) 50%, transparent 100%)',
                        animation: 'emailShimmer 1.8s ease-in-out infinite',
                      }}
                    />
                  </div>
                  {/* Status pill */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 10,
                      right: 14,
                      zIndex: 3,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '3px 10px',
                      borderRadius: 999,
                      fontSize: 10,
                      fontWeight: 600,
                      color: '#A5B4FC',
                      background: 'rgba(129,140,248,0.12)',
                      border: '1px solid rgba(129,140,248,0.3)',
                      animation: 'emailPulseBorder 1.5s ease-in-out infinite',
                    }}
                  >
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        display: 'inline-block',
                        borderRadius: '50%',
                        border: '1.5px solid rgba(165,180,252,0.25)',
                        borderTopColor: '#A5B4FC',
                        animation: 'spinLoader 0.8s linear infinite',
                      }}
                    />
                    Wird geschrieben…
                  </div>
                </>
              )}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: C.text3, letterSpacing: '0.06em', fontWeight: 500 }}>E-MAIL DRAFT</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`Betreff: ${emailDraftSubject}\n\n${emailDraftBody}`);
                      showToast('E-Mail kopiert', 'success');
                    }}
                    style={{ fontSize: 10, color: C.text3, background: 'none', border: `1px solid ${C.border}`, borderRadius: 5, padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    Kopieren
                  </button>
                  {email && !editing && (
                    <button
                      onClick={handleSendEmail}
                      disabled={sending || sent}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        fontSize: 10, fontWeight: 600, fontFamily: 'inherit',
                        color: '#fff',
                        background: sent
                          ? 'linear-gradient(135deg, #059669, #34D399)'
                          : 'linear-gradient(135deg, #6366F1, #818CF8)',
                        border: 'none', borderRadius: 5, padding: '4px 14px',
                        cursor: sending ? 'wait' : sent ? 'default' : 'pointer',
                        minWidth: 80, justifyContent: 'center',
                        transition: 'background 0.3s ease',
                        boxShadow: sent ? '0 0 14px rgba(52,211,153,0.35)' : 'none',
                      }}
                    >
                      {sent ? (
                        <>
                          <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'checkPop 0.35s cubic-bezier(0.22, 1, 0.36, 1) both' }}>
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                          Gesendet
                        </>
                      ) : sending ? (
                        <>
                          <span
                            style={{
                              width: 10, height: 10, display: 'inline-block',
                              borderRadius: '50%',
                              border: '1.5px solid rgba(255,255,255,0.25)',
                              borderTopColor: '#fff',
                              animation: 'spinLoader 0.7s linear infinite',
                            }}
                          />
                          Sende…
                        </>
                      ) : (
                        <>
                          <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                          </svg>
                          Senden
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
              {email && (
                <div style={{ fontSize: 11, color: C.text3, marginBottom: 8 }}>
                  An: <span style={{ color: C.text2 }}>{name} &lt;{email}&gt;</span>
                </div>
              )}
              {/* Subject */}
              {editing ? (
                <input
                  value={emailDraftSubject}
                  onChange={(e) => setEmailDraftSubject(e.target.value)}
                  placeholder="Betreff"
                  style={{
                    width: '100%', fontSize: 12, color: C.text1, fontWeight: 500, marginBottom: 10,
                    padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 6,
                    border: `1px solid ${C.borderAccent}`, outline: 'none', fontFamily: 'inherit',
                  }}
                />
              ) : (
                emailDraftSubject && (
                  <div style={{ fontSize: 12, color: C.text1, fontWeight: 500, marginBottom: 10, padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.04)' }}>
                    Betreff: {emailDraftSubject}
                  </div>
                )
              )}
              {/* Body */}
              {editing ? (
                <div
                  ref={bodyEditorRef}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={(e) => setEmailDraftBody((e.target as HTMLDivElement).innerHTML)}
                  className="email-draft-html email-draft-editor"
                  style={{
                    width: '100%',
                    minHeight: 160,
                    fontSize: 13,
                    color: C.text2,
                    lineHeight: 1.7,
                    fontFamily: 'inherit',
                    padding: '12px 14px',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: 6,
                    border: `1px solid ${C.borderAccent}`,
                    outline: 'none',
                    wordBreak: 'break-word',
                  }}
                />
              ) : (
                <div
                  className="email-draft-html"
                  style={{
                    fontSize: 13,
                    color: C.text2,
                    lineHeight: 1.7,
                    fontFamily: 'inherit',
                    margin: 0,
                    wordBreak: 'break-word',
                  }}
                  dangerouslySetInnerHTML={{ __html: renderEmailHtml(emailDraftBody) }}
                />
              )}
              <style>{`
                .email-draft-html p { margin: 0 0 10px; }
                .email-draft-html p:last-child { margin-bottom: 0; }
                .email-draft-html a { color: #A5B4FC; text-decoration: underline; }
                .email-draft-html ul, .email-draft-html ol { margin: 0 0 10px; padding-left: 22px; }
                .email-draft-html li { margin-bottom: 4px; }
                .email-draft-html strong, .email-draft-html b { color: ${C.text1}; font-weight: 600; }
                .email-draft-html em, .email-draft-html i { font-style: italic; }
                .email-draft-html br + br { display: block; content: ''; margin-top: 8px; }
                .email-draft-html blockquote {
                  border-left: 3px solid rgba(129,140,248,0.4);
                  padding: 4px 0 4px 12px;
                  margin: 8px 0;
                  color: ${C.text3};
                }
                .email-draft-editor:focus {
                  border-color: rgba(129,140,248,0.55) !important;
                  box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
                }
                .email-draft-editor:empty::before {
                  content: 'E-Mail-Text...';
                  color: ${C.text3};
                  pointer-events: none;
                }
              `}</style>

              {/* Action bar: both buttons right-aligned */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
                {editing ? (
                  <>
                    <button
                      onClick={() => {
                        setEmailDraftSubject(contact.email_draft_subject ?? '');
                        setEmailDraftBody(contact.email_draft_body ?? '');
                        setEditing(false);
                      }}
                      style={{
                        fontSize: 11, color: C.text3, fontFamily: 'inherit',
                        background: 'none', border: `1px solid ${C.border}`,
                        borderRadius: 7, padding: '6px 12px', cursor: 'pointer',
                      }}
                    >
                      Abbrechen
                    </button>
                    <button
                      onClick={handleSaveDraft}
                      disabled={savingDraft}
                      title="Speichern"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        fontSize: 11, fontWeight: 600, fontFamily: 'inherit',
                        color: '#fff', background: 'linear-gradient(135deg, #059669, #34D399)',
                        border: 'none', borderRadius: 7, padding: '6px 14px', cursor: savingDraft ? 'wait' : 'pointer',
                        opacity: savingDraft ? 0.6 : 1,
                      }}
                    >
                      <SvgIcon d={ICONS.check} size={12} />
                      {savingDraft ? 'Speichere…' : 'Speichern'}
                    </button>
                  </>
                ) : (
                  <>
                    {/* Pencil — edit */}
                    <button
                      onClick={() => setEditing(true)}
                      title="Bearbeiten"
                      style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 30, height: 30, borderRadius: 8,
                        background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`,
                        color: C.text2, cursor: 'pointer', fontFamily: 'inherit', padding: 0,
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = C.borderAccent;
                        e.currentTarget.style.color = C.accent;
                        e.currentTarget.style.background = C.accentGhost;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = C.border;
                        e.currentTarget.style.color = C.text2;
                        e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                      }}
                    >
                      <SvgIcon d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" size={13} />
                    </button>

                    {/* Rewrite spark */}
                    <button
                      onClick={() => setShowRewrite(true)}
                      title="Umschreiben"
                      style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 30, height: 30, borderRadius: 8,
                        background: 'linear-gradient(135deg, rgba(129,140,248,0.1), rgba(129,140,248,0.03))',
                        border: '1px solid rgba(129,140,248,0.22)',
                        color: '#A5B4FC', cursor: 'pointer', fontFamily: 'inherit', padding: 0,
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(129,140,248,0.45)';
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(129,140,248,0.22), rgba(129,140,248,0.08))';
                        e.currentTarget.style.boxShadow = '0 0 12px rgba(129,140,248,0.25)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(129,140,248,0.22)';
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(129,140,248,0.1), rgba(129,140,248,0.03))';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <SvgIcon d={ICONS.spark} size={14} />
                    </button>
                  </>
                )}
              </div>

              {/* Rewrite popup */}
              {showRewrite && (
                <div
                  onClick={() => setShowRewrite(false)}
                  style={{
                    position: 'fixed', inset: 0, zIndex: 1100,
                    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: 'fadeIn 0.15s ease both',
                  }}
                >
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      width: '100%', maxWidth: 460, background: C.bg,
                      border: `1px solid ${C.border}`, borderRadius: 14,
                      boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                      padding: 22,
                      animation: 'fadeInUp 0.2s cubic-bezier(0.22,1,0.36,1) both',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: 9,
                        background: 'linear-gradient(135deg, rgba(129,140,248,0.2), rgba(129,140,248,0.08))',
                        border: '1px solid rgba(129,140,248,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <SvgIcon d={ICONS.spark} size={15} color="#A5B4FC" />
                      </div>
                      <div>
                        <h3 style={{ fontSize: 14, fontWeight: 600, color: C.text1, margin: 0 }}>E-Mail umschreiben</h3>
                        <p style={{ fontSize: 11, color: C.text3, margin: '2px 0 0' }}>Was möchtest du ändern?</p>
                      </div>
                    </div>
                    <textarea
                      value={rewritePrompt}
                      onChange={(e) => setRewritePrompt(e.target.value)}
                      placeholder="z.B. 'Freundlicher formulieren', 'Kürzer machen', 'Fokus auf ROI legen'…"
                      rows={4}
                      autoFocus
                      style={{
                        width: '100%', fontSize: 13, color: C.text1, lineHeight: 1.6,
                        padding: '12px 14px', background: 'rgba(255,255,255,0.03)',
                        borderRadius: 10, border: `1px solid ${C.border}`,
                        outline: 'none', fontFamily: 'inherit', resize: 'vertical', minHeight: 90,
                        transition: 'border-color 0.15s',
                      }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(129,140,248,0.35)'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
                      <button
                        onClick={() => setShowRewrite(false)}
                        style={{
                          fontSize: 12, color: C.text2, fontFamily: 'inherit',
                          background: 'none', border: `1px solid ${C.border}`,
                          borderRadius: 8, padding: '8px 16px', cursor: 'pointer',
                        }}
                      >
                        Abbrechen
                      </button>
                      <button
                        onClick={handleRewrite}
                        disabled={!rewritePrompt.trim() || rewriting}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
                          color: '#fff', background: 'linear-gradient(135deg, #6366F1, #818CF8)',
                          border: 'none', borderRadius: 8, padding: '8px 18px',
                          cursor: rewriting || !rewritePrompt.trim() ? 'not-allowed' : 'pointer',
                          opacity: rewriting || !rewritePrompt.trim() ? 0.5 : 1,
                          boxShadow: '0 2px 12px rgba(99,102,241,0.3)',
                        }}
                      >
                        <SvgIcon d={ICONS.spark} size={12} />
                        {rewriting ? 'Generiere…' : 'Neu generieren'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
