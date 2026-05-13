'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTheme, colors } from '../layout';

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = 'owner' | 'admin' | 'member';

interface Member {
  id: string;
  email: string;
  name: string;
  role: Role;
  invited_at: string | null;
  last_sign_in: string | null;
}

interface Invitation {
  token: string;
  email: string;
  role: Role;
  created_at: string;
  expires_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<Role, string> = { owner: 'Inhaber', admin: 'Admin', member: 'Mitglied' };
const ROLE_COLORS: Record<Role, { bg: string; color: string }> = {
  owner: { bg: '#FFF7ED', color: '#C2410C' },
  admin: { bg: '#EEF0FF', color: '#4F46E5' },
  member: { bg: '#F1F5F9', color: '#425466' },
};
const AVATAR_PALETTE = ['#4F46E5', '#0A2540', '#059669', '#D97706', '#DC2626', '#7C3AED', '#0891B2'];

function initials(name: string, email: string) {
  const src = name && name !== email.split('@')[0] ? name : email;
  return src
    .split(/[\s@]/)
    .map((p: string) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}
function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Atoms ────────────────────────────────────────────────────────────────────

function Avatar({ name, email, size = 38 }: { name: string; email: string; size?: number }) {
  const idx = (email.charCodeAt(0) + email.charCodeAt(1)) % AVATAR_PALETTE.length;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: AVATAR_PALETTE[idx],
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: Math.round(size * 0.34),
        fontWeight: 800,
        color: '#fff',
        flexShrink: 0,
        letterSpacing: '-0.02em',
      }}
    >
      {initials(name, email)}
    </div>
  );
}

function RoleBadge({ role }: { role: Role }) {
  const { bg, color } = ROLE_COLORS[role];
  return (
    <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: bg, color }}>
      {ROLE_LABELS[role]}
    </span>
  );
}

function SlotDots({ used, max, c }: { used: number; max: number; c: ReturnType<typeof colors> }) {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: i < used ? c.accent : c.border,
            transition: 'background 0.2s',
          }}
        />
      ))}
      <span style={{ fontSize: 11, color: c.textMuted, marginLeft: 4 }}>
        {used} / {max} Plätze
      </span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TeamPage() {
  const { theme } = useTheme();
  const c = colors(theme);
  const isDark = theme === 'dark';

  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [newLink, setNewLink] = useState<string | null>(null);

  const [roleChanging, setRoleChanging] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/team');
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Fehler');
      const d = await res.json();
      setMembers(d.members ?? []);
      setInvitations(d.invitations ?? []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => setCurrentUserId(d.user?.id ?? null))
      .catch(() => {});
  }, [load]);

  async function createInvite() {
    setInviting(true);
    setInviteError(null);
    setNewLink(null);
    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: inviteRole }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Fehler');
      setNewLink(d.invite_link);
      await load();
    } catch (e) {
      setInviteError((e as Error).message);
    } finally {
      setInviting(false);
    }
  }

  async function copyText(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  async function revokeInvite(token: string) {
    if (!confirm('Einladung wirklich widerrufen?')) return;
    await fetch(`/api/team/invite/${token}`, { method: 'DELETE' });
    setInvitations((p) => p.filter((i) => i.token !== token));
    if (newLink?.includes(token)) setNewLink(null);
  }

  async function changeRole(id: string, role: 'admin' | 'member') {
    setRoleChanging(id);
    try {
      const res = await fetch(`/api/team/members/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        alert((await res.json()).error || 'Fehler');
        return;
      }
      setMembers((p) => p.map((m) => (m.id === id ? { ...m, role } : m)));
    } finally {
      setRoleChanging(null);
    }
  }

  async function removeMember(id: string, name: string) {
    if (!confirm(`${name || 'Mitglied'} wirklich entfernen?`)) return;
    setRemoving(id);
    try {
      const res = await fetch(`/api/team/members/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        alert((await res.json()).error || 'Fehler');
        return;
      }
      setMembers((p) => p.filter((m) => m.id !== id));
    } finally {
      setRemoving(null);
    }
  }

  const totalSlots = members.length + invitations.length;
  const atLimit = totalSlots >= 10;

  return (
    <div
      style={{
        minHeight: '100%',
        background: c.bgPage,
        fontFamily: 'var(--font-inter), sans-serif',
        color: c.text,
      }}
    >
      {/* Header — matches settings page */}
      <div
        style={{
          background: isDark
            ? 'linear-gradient(135deg, #1C1D26 0%, #13141A 100%)'
            : 'linear-gradient(135deg, #EEF0FF 0%, #F0F4FF 60%, #F7F8FC 100%)',
          borderBottom: `1px solid ${c.border}`,
          padding: '24px 32px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 24,
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: c.bgCard,
              border: `1px solid ${isDark ? c.border : '#E0E3FF'}`,
              color: c.accent,
              borderRadius: 99,
              padding: '3px 10px',
              fontSize: 11,
              fontWeight: 700,
              marginBottom: 10,
              letterSpacing: '0.04em',
            }}
          >
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: c.accent }} />
            Konfiguration
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 5px', color: c.text, lineHeight: 1 }}>Team</h1>
          <p style={{ fontSize: 13, color: c.textSub, margin: 0 }}>
            Mitglieder verwalten, Rollen anpassen und neue Personen einladen
          </p>
        </div>
        {!loading && (
          <div
            style={{
              background: c.bgCard,
              border: `1px solid ${c.border}`,
              borderRadius: 12,
              padding: '10px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: c.textMuted,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Kapazität
            </div>
            <SlotDots used={totalSlots} max={10} c={c} />
          </div>
        )}
      </div>

      {/* Body — two-column */}
      <div style={{ padding: '28px 32px', display: 'flex', gap: 20, alignItems: 'flex-start', maxWidth: 1100 }}>
        {/* Left: members + pending invites */}
        <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && (
            <div
              style={{
                padding: '12px 16px',
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: 10,
                fontSize: 13,
                color: '#DC2626',
              }}
            >
              {error}
            </div>
          )}

          {/* Members card */}
          <div style={{ background: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 14, overflow: 'hidden' }}>
            <div
              style={{
                padding: '16px 20px',
                borderBottom: `1px solid ${c.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: c.text }}>Aktive Mitglieder</div>
                {!loading && (
                  <div style={{ fontSize: 11, color: c.textMuted, marginTop: 1 }}>
                    {members.length} {members.length === 1 ? 'Person' : 'Personen'}
                  </div>
                )}
              </div>
              {/* Stacked avatars preview */}
              {!loading && members.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {members.slice(0, 5).map((m, i) => (
                    <div
                      key={m.id}
                      style={{
                        marginLeft: i === 0 ? 0 : -8,
                        zIndex: members.length - i,
                        border: `2px solid ${c.bgCard}`,
                        borderRadius: '50%',
                      }}
                    >
                      <Avatar name={m.name} email={m.email} size={28} />
                    </div>
                  ))}
                  {members.length > 5 && (
                    <div
                      style={{
                        marginLeft: -8,
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: c.bgHover,
                        border: `2px solid ${c.bgCard}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 10,
                        fontWeight: 700,
                        color: c.textMuted,
                      }}
                    >
                      +{members.length - 5}
                    </div>
                  )}
                </div>
              )}
            </div>

            {loading ? (
              <div style={{ padding: '32px 20px', textAlign: 'center', fontSize: 13, color: c.textMuted }}>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#A5B4FC"
                  strokeWidth="2"
                  strokeLinecap="round"
                  style={{ animation: 'spin 0.8s linear infinite' }}
                >
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
              </div>
            ) : members.length === 0 ? (
              <div style={{ padding: '32px 20px', textAlign: 'center', fontSize: 13, color: c.textMuted }}>
                Noch keine Mitglieder.
              </div>
            ) : (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {members.map((m, i) => (
                  <li
                    key={m.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 20px',
                      borderBottom: i < members.length - 1 ? `1px solid ${c.bgPage}` : 'none',
                      transition: 'background 0.12s',
                    }}
                  >
                    <Avatar name={m.name} email={m.email} />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: c.text,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {m.name || m.email}
                        </span>
                        <RoleBadge role={m.role} />
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: c.textMuted,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {m.name ? m.email : ''}
                        {m.last_sign_in && (
                          <span style={{ color: c.textMuted }}>
                            {m.name ? ' · ' : ''}Zuletzt aktiv {formatDate(m.last_sign_in)}
                          </span>
                        )}
                      </div>
                    </div>

                    {m.role !== 'owner' && m.id !== currentUserId && (
                      <select
                        value={m.role}
                        disabled={roleChanging === m.id}
                        onChange={(e) => changeRole(m.id, e.target.value as 'admin' | 'member')}
                        style={{
                          padding: '4px 8px',
                          borderRadius: 7,
                          border: `1.5px solid ${c.border}`,
                          fontSize: 12,
                          fontWeight: 600,
                          color: c.textSub,
                          background: c.bgPage,
                          fontFamily: 'var(--font-inter), sans-serif',
                          cursor: 'pointer',
                          outline: 'none',
                          opacity: roleChanging === m.id ? 0.5 : 1,
                        }}
                      >
                        <option value="admin">Admin</option>
                        <option value="member">Mitglied</option>
                      </select>
                    )}

                    {m.role !== 'owner' && (
                      <button
                        onClick={() => removeMember(m.id, m.name)}
                        disabled={removing === m.id}
                        title="Entfernen"
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 7,
                          border: '1.5px solid transparent',
                          background: 'transparent',
                          color: c.textMuted,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          padding: 0,
                          transition: 'all 0.12s',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = '#FEF2F2';
                          (e.currentTarget as HTMLButtonElement).style.borderColor = '#FECACA';
                          (e.currentTarget as HTMLButtonElement).style.color = '#DC2626';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                          (e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent';
                          (e.currentTarget as HTMLButtonElement).style.color = c.textMuted;
                        }}
                      >
                        {removing === m.id ? (
                          <span style={{ fontSize: 11 }}>…</span>
                        ) : (
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 16 16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          >
                            <path d="M3 4h10M6 4V2.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5V4M5 4l.5 9h5l.5-9" />
                          </svg>
                        )}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Pending invitations */}
          {invitations.length > 0 && (
            <div
              style={{ background: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 14, overflow: 'hidden' }}
            >
              <div style={{ padding: '14px 20px', borderBottom: `1px solid ${c.border}` }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: c.text }}>Ausstehende Einladungen</div>
                <div style={{ fontSize: 11, color: c.textMuted, marginTop: 1 }}>
                  Links wurden erstellt, aber noch nicht angenommen
                </div>
              </div>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {invitations.map((inv, i) => {
                  const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/join?token=${inv.token}`;
                  const copied = copiedKey === inv.token;
                  return (
                    <li
                      key={inv.token}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '11px 20px',
                        borderBottom: i < invitations.length - 1 ? `1px solid ${c.bgPage}` : 'none',
                      }}
                    >
                      {/* Dashed avatar placeholder */}
                      <div
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: '50%',
                          border: `1.5px dashed ${c.borderStrong}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 16 16"
                          fill="none"
                          stroke={c.borderStrong}
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M8 4v8M4 8h8" />
                        </svg>
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: c.textMuted }}>
                            Einladung ausstehend
                          </span>
                          <RoleBadge role={inv.role} />
                        </div>
                        <div style={{ fontSize: 11, color: c.textMuted }}>Läuft ab {formatDate(inv.expires_at)}</div>
                      </div>

                      <button
                        onClick={() => copyText(link, inv.token)}
                        style={{
                          padding: '4px 11px',
                          borderRadius: 7,
                          border: `1.5px solid ${copied ? '#BBF7D0' : c.border}`,
                          background: copied ? '#F0FDF4' : c.bgPage,
                          color: copied ? '#16A34A' : c.textSub,
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontFamily: 'var(--font-inter), sans-serif',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5,
                          transition: 'all 0.15s',
                        }}
                      >
                        {copied ? (
                          <>
                            <svg
                              width="11"
                              height="11"
                              viewBox="0 0 16 16"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                            >
                              <path d="M13 4L6 11 3 8" />
                            </svg>
                            Kopiert
                          </>
                        ) : (
                          <>
                            <svg
                              width="11"
                              height="11"
                              viewBox="0 0 16 16"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.6"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <rect x="5" y="5" width="8" height="8" rx="1.5" />
                              <path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" />
                            </svg>
                            Link kopieren
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => revokeInvite(inv.token)}
                        title="Widerrufen"
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 7,
                          border: '1.5px solid transparent',
                          background: 'transparent',
                          color: c.textMuted,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          padding: 0,
                          transition: 'all 0.12s',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = '#FEF2F2';
                          (e.currentTarget as HTMLButtonElement).style.borderColor = '#FECACA';
                          (e.currentTarget as HTMLButtonElement).style.color = '#DC2626';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                          (e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent';
                          (e.currentTarget as HTMLButtonElement).style.color = c.textMuted;
                        }}
                      >
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 16 16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        >
                          <line x1="3" y1="3" x2="13" y2="13" />
                          <line x1="13" y1="3" x2="3" y2="13" />
                        </svg>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {/* Right: invite panel */}
        <div style={{ width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Invite card */}
          <div style={{ background: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${c.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: c.text }}>Mitglied einladen</div>
              <div style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>
                Erstelle einen Einladungslink und schicke ihn weiter.
              </div>
            </div>

            <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Role picker — visual cards */}
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: c.textMuted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: 8,
                  }}
                >
                  Rolle
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {(['member', 'admin'] as const).map((r) => {
                    const active = inviteRole === r;
                    return (
                      <button
                        key={r}
                        onClick={() => setInviteRole(r)}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 10,
                          padding: '10px 12px',
                          borderRadius: 9,
                          border: `1.5px solid ${active ? (isDark ? c.accent + '60' : '#C7D2FE') : c.border}`,
                          background: active ? (isDark ? c.accent + '18' : '#EEF0FF') : c.bgPage,
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontFamily: 'var(--font-inter), sans-serif',
                          transition: 'all 0.12s',
                        }}
                      >
                        <div
                          style={{
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            border: `2px solid ${active ? c.accent : c.borderStrong}`,
                            marginTop: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {active && <div style={{ width: 7, height: 7, borderRadius: '50%', background: c.accent }} />}
                        </div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: active ? c.accent : c.text }}>
                            {ROLE_LABELS[r]}
                          </div>
                          <div style={{ fontSize: 11, color: c.textMuted, marginTop: 1, lineHeight: 1.4 }}>
                            {r === 'member' ? 'Leads einsehen und kommentieren' : 'Volles Zugriff inkl. Einstellungen'}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Error */}
              {inviteError && (
                <div
                  style={{
                    padding: '9px 12px',
                    background: '#FEF2F2',
                    border: '1px solid #FECACA',
                    borderRadius: 8,
                    fontSize: 12,
                    color: '#DC2626',
                  }}
                >
                  {inviteError}
                </div>
              )}

              {/* New link display */}
              {newLink && (
                <div
                  style={{ padding: '10px 12px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 9 }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#16A34A',
                      marginBottom: 6,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                    }}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <path d="M13 4L6 11 3 8" />
                    </svg>
                    Link erstellt
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      fontFamily: 'monospace',
                      color: c.textSub,
                      background: c.bgCard,
                      border: '1px solid #D1FAE5',
                      borderRadius: 6,
                      padding: '5px 8px',
                      wordBreak: 'break-all',
                      marginBottom: 8,
                      lineHeight: 1.5,
                    }}
                  >
                    {newLink}
                  </div>
                  <button
                    onClick={() => copyText(newLink, 'newLink')}
                    style={{
                      width: '100%',
                      padding: '6px 0',
                      borderRadius: 7,
                      border: `1.5px solid ${copiedKey === 'newLink' ? '#BBF7D0' : '#D1FAE5'}`,
                      background: copiedKey === 'newLink' ? '#DCFCE7' : c.bgCard,
                      color: '#16A34A',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: 'var(--font-inter), sans-serif',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 5,
                    }}
                  >
                    {copiedKey === 'newLink' ? (
                      <>
                        <svg
                          width="11"
                          height="11"
                          viewBox="0 0 16 16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        >
                          <path d="M13 4L6 11 3 8" />
                        </svg>
                        Kopiert!
                      </>
                    ) : (
                      <>
                        <svg
                          width="11"
                          height="11"
                          viewBox="0 0 16 16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect x="5" y="5" width="8" height="8" rx="1.5" />
                          <path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" />
                        </svg>
                        Link kopieren
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Invite button */}
              <button
                onClick={createInvite}
                disabled={inviting || atLimit}
                style={{
                  width: '100%',
                  padding: '11px 0',
                  borderRadius: 9,
                  border: 'none',
                  background: inviting || atLimit ? c.border : c.accent,
                  color: inviting || atLimit ? c.textMuted : '#fff',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: inviting || atLimit ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-inter), sans-serif',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 7,
                  transition: 'background 0.15s',
                }}
              >
                {inviting ? (
                  <>
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      style={{ animation: 'spin 0.8s linear infinite' }}
                    >
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                    Erstellt…
                  </>
                ) : atLimit ? (
                  'Limit erreicht (10/10)'
                ) : (
                  <>
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="2" y="4" width="12" height="9" rx="1.5" />
                      <polyline points="2 4 8 9 14 4" />
                    </svg>
                    Einladungslink erstellen
                  </>
                )}
              </button>

              {atLimit && (
                <p style={{ fontSize: 11, color: '#D97706', margin: 0, textAlign: 'center' }}>
                  Maximale Team-Größe von 10 Personen erreicht.
                </p>
              )}
            </div>
          </div>

          {/* Roles info card */}
          <div
            style={{ background: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 14, padding: '16px 20px' }}
          >
            <div style={{ fontSize: 12, fontWeight: 800, color: c.text, marginBottom: 12 }}>Rollenübersicht</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { role: 'owner' as Role, desc: 'Voller Zugriff, kann Inhaber-Rechte übertragen' },
                { role: 'admin' as Role, desc: 'Leads, Einstellungen, Mitglieder einladen' },
                { role: 'member' as Role, desc: 'Nur Leads einsehen und kommentieren' },
              ].map(({ role, desc }) => (
                <div key={role} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <RoleBadge role={role} />
                  <span style={{ fontSize: 11, color: c.textMuted, lineHeight: 1.4, paddingTop: 1 }}>{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
