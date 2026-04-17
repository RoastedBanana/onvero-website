'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { C, SvgIcon, ICONS, PageHeader, Breadcrumbs, GLOBAL_STYLES, showToast } from '../_shared';

interface Contact {
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

// ─── DETAIL MODAL ───────────────────────────────────────────────────────────

function PersonDetail({ contact, onClose }: { contact: Contact; onClose: () => void }) {
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
  const emailDraftSubject = contact.email_draft_subject ?? null;
  const emailDraftBody = contact.email_draft_body ?? null;
  const company = contact.leads;
  const [sending, setSending] = useState(false);

  async function handleSendEmail() {
    if (!email || !emailDraftBody) return;
    setSending(true);
    try {
      const res = await fetch('/api/leads/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: contact.lead_id,
          to: email,
          subject: emailDraftSubject ?? `Kontaktaufnahme – ${company?.company_name ?? ''}`,
          body: emailDraftBody,
          name,
        }),
      });
      if (res.ok) {
        showToast('E-Mail gesendet', 'success');
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
                  <Link href={`/sales/leads/${contact.lead_id}`} style={{ fontSize: 14, fontWeight: 600, color: C.text1, textDecoration: 'none' }}
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
                      {e.start_date && <span> · {String(e.start_date).slice(0, 7)}{e.current ? ' – heute' : e.end_date ? ` – ${String(e.end_date).slice(0, 7)}` : ''}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Email draft */}
          {emailDraftBody && (
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: C.text3, letterSpacing: '0.06em', fontWeight: 500 }}>E-MAIL DRAFT</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`Betreff: ${emailDraftSubject ?? ''}\n\n${emailDraftBody}`);
                      showToast('E-Mail kopiert', 'success');
                    }}
                    style={{ fontSize: 10, color: C.text3, background: 'none', border: `1px solid ${C.border}`, borderRadius: 5, padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    Kopieren
                  </button>
                  {email && (
                    <button
                      onClick={handleSendEmail}
                      disabled={sending}
                      style={{
                        fontSize: 10, fontWeight: 600, fontFamily: 'inherit',
                        color: '#fff', background: 'linear-gradient(135deg, #6366F1, #818CF8)',
                        border: 'none', borderRadius: 5, padding: '4px 14px', cursor: sending ? 'wait' : 'pointer',
                        opacity: sending ? 0.6 : 1,
                      }}
                    >
                      {sending ? 'Sende...' : 'Senden'}
                    </button>
                  )}
                </div>
              </div>
              {email && (
                <div style={{ fontSize: 11, color: C.text3, marginBottom: 8 }}>
                  An: <span style={{ color: C.text2 }}>{name} &lt;{email}&gt;</span>
                </div>
              )}
              {emailDraftSubject && (
                <div style={{ fontSize: 12, color: C.text1, fontWeight: 500, marginBottom: 10, padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.04)' }}>
                  Betreff: {emailDraftSubject}
                </div>
              )}
              <pre style={{ fontSize: 12, color: C.text2, lineHeight: 1.7, fontFamily: 'inherit', whiteSpace: 'pre-wrap', margin: 0 }}>
                {emailDraftBody}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ──────────────────────────────────────────────────────────────

export default function PeoplePage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Contact | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/people');
        const data = await res.json();
        setContacts(data.contacts ?? []);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = contacts.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (c.full_name || '').toLowerCase().includes(q) ||
      (c.title || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.leads?.company_name || '').toLowerCase().includes(q) ||
      (c.city || '').toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1200 }}>
      <style>{GLOBAL_STYLES}</style>

      <Breadcrumbs items={[{ label: 'Sales', href: '/sales' }, { label: 'People' }]} />

      <div style={{ marginTop: 16 }}>
        <PageHeader title="People" subtitle={`${contacts.length} Ansprechpartner`} />
      </div>

      {/* Search */}
      <div style={{ marginTop: 20, marginBottom: 20, maxWidth: 400 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Name, Firma, E-Mail suchen..."
          style={{
            width: '100%', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
            padding: '10px 14px', color: C.text1, fontSize: 13, outline: 'none', fontFamily: 'inherit',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.35)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
        />
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: `2px solid ${C.border}`, borderTopColor: C.accent, animation: 'spinLoader 1s linear infinite' }} />
        </div>
      )}

      {/* Empty */}
      {!loading && contacts.length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: C.text3 }}>
          <SvgIcon d={ICONS.users} size={40} color={C.text3} />
          <p style={{ fontSize: 14, marginTop: 16 }}>Noch keine Ansprechpartner vorhanden</p>
        </div>
      )}

      {/* Table */}
      {!loading && filtered.length > 0 && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.02)' }}>
                {['Name', 'Titel', 'Unternehmen', 'E-Mail', 'Telefon', 'Standort'].map((h) => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const name = c.full_name || [c.first_name, c.last_name].filter(Boolean).join(' ') || '—';
                const location = [c.city, c.country].filter(Boolean).join(', ') || '—';
                const emailVerified = c.email_status === 'verified';
                return (
                  <tr
                    key={c.id}
                    onClick={() => setSelected(c)}
                    style={{ borderBottom: `1px solid ${C.border}`, transition: 'background 0.1s', cursor: 'pointer' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {c.photo_url ? (
                          <img src={c.photo_url} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: C.accentGhost, border: `1px solid ${C.borderAccent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, fontWeight: 600, color: C.accent }}>
                            {(c.first_name?.[0] || '?').toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div style={{ color: C.text1, fontWeight: 500 }}>{name}</div>
                          {c.linkedin_url && (
                            <a href={c.linkedin_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                              style={{ fontSize: 10, color: C.text3, textDecoration: 'none' }}
                              onMouseEnter={(e) => { e.currentTarget.style.color = C.accent; }}
                              onMouseLeave={(e) => { e.currentTarget.style.color = C.text3; }}>
                              LinkedIn
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px', color: C.text2 }}>{c.title || c.headline || '—'}</td>
                    <td style={{ padding: '10px 14px', color: C.text2 }}>{c.leads?.company_name || '—'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      {c.email ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ color: C.text1 }}>{c.email}</span>
                          {emailVerified && (
                            <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, background: C.successBg, border: `1px solid ${C.successBorder}`, color: C.success, fontWeight: 600 }}>
                              VERIFIED
                            </span>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: C.text3 }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '10px 14px', color: c.phone || c.mobile_phone ? C.text1 : C.text3 }}>{c.phone || c.mobile_phone || '—'}</td>
                    <td style={{ padding: '10px 14px', color: C.text2 }}>{location}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* No results */}
      {!loading && contacts.length > 0 && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: C.text3, fontSize: 13 }}>
          Keine Ergebnisse für &quot;{search}&quot;
        </div>
      )}

      {/* Detail modal */}
      {selected && <PersonDetail contact={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
