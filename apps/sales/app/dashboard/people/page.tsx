'use client';

import { useState, useEffect } from 'react';
import { C, SvgIcon, ICONS, PageHeader, Breadcrumbs, GLOBAL_STYLES } from '../_shared';
import { PersonDetail, type Contact } from '../_components/PersonDetailModal';


// ─── MAIN PAGE ──────────────────────────────────────────────────────────────

export default function PeoplePage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Contact | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/people', { cache: 'no-store' });
        const data = await res.json();
        console.log('[people] API response:', { status: res.status, data });
        setContacts(data.contacts ?? []);
      } catch (err) {
        console.error('[people] fetch error:', err);
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

      <Breadcrumbs items={[{ label: 'Sales', href: '/dashboard' }, { label: 'People' }]} />

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

      {/* Loading — skeleton */}
      {loading && (
        <>
          <style>{`
            @keyframes skelShimmer {
              0% { background-position: -200% 0; }
              100% { background-position: 200% 0; }
            }
            .skel {
              background: linear-gradient(90deg,
                rgba(255,255,255,0.03) 0%,
                rgba(255,255,255,0.065) 50%,
                rgba(255,255,255,0.03) 100%);
              background-size: 200% 100%;
              animation: skelShimmer 1.6s ease-in-out infinite;
              border-radius: 6px;
            }
          `}</style>
          <div
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              overflow: 'hidden',
            }}
          >
            {/* Header row */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.6fr 1.4fr 1.4fr 1.8fr 1.2fr 1.2fr',
                gap: 12,
                padding: '10px 14px',
                borderBottom: `1px solid ${C.border}`,
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              {['Name', 'Titel', 'Unternehmen', 'E-Mail', 'Telefon', 'Standort'].map((h) => (
                <span
                  key={h}
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: C.text3,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {h}
                </span>
              ))}
            </div>

            {/* Skeleton rows */}
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.6fr 1.4fr 1.4fr 1.8fr 1.2fr 1.2fr',
                  gap: 12,
                  padding: '12px 14px',
                  alignItems: 'center',
                  borderBottom: i < 5 ? `1px solid ${C.border}` : 'none',
                  opacity: Math.max(0.35, 1 - i * 0.12),
                }}
              >
                {/* Name: avatar + lines */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="skel" style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0 }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div className="skel" style={{ height: 10, width: '70%' }} />
                    <div className="skel" style={{ height: 8, width: '40%', opacity: 0.7 }} />
                  </div>
                </div>
                <div className="skel" style={{ height: 10, width: '78%' }} />
                <div className="skel" style={{ height: 10, width: '68%' }} />
                <div className="skel" style={{ height: 10, width: '88%' }} />
                <div className="skel" style={{ height: 10, width: '62%' }} />
                <div className="skel" style={{ height: 10, width: '72%' }} />
              </div>
            ))}
          </div>
        </>
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
