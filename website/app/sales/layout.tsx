'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { C, GLOBAL_STYLES, SvgIcon, ParallaxBackground, ICONS, ToastContainer, StatusBar } from './_shared';
import { openCommandPalette } from './_command-palette';
import { getSupabase, readSessionFromStorage } from './_use-leads';
import { useActivities, formatActivityTime, getActivityStyle } from './_activities';

const CommandPalette = dynamic(() => import('./_command-palette').then((m) => m.CommandPalette), { ssr: false });
const AIChatWidget = dynamic(() => import('./_ai-chat').then((m) => m.AIChatWidget), { ssr: false });
const OnboardingTour = dynamic(() => import('./_onboarding').then((m) => m.OnboardingTour), { ssr: false });

// ─── NAV CONFIG ──────────────────────────────────────────────────────────────

type NavItem = {
  label: string;
  href: string;
  icon: string;
  badge?: string;
  children?: { label: string; href: string }[];
  comingSoon?: boolean;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

// Nav structure — counts are computed dynamically in Sidebar via useLeads()
function buildNav(
  leadCount: number,
  neuHeute: number,
  qualifiziert: number,
  inKontakt: number,
  mitEmail: number
): NavSection[] {
  return [
    {
      title: 'ÜBERSICHT',
      items: [{ label: 'Home', href: '/sales', icon: ICONS.home }],
    },
    {
      title: 'PROSPECTS',
      items: [
        // { label: 'Market Intent', href: '/sales/prospects', icon: ICONS.zap, badge: `${mitEmail}` },
        { label: 'Lead Generator', href: '/sales/generate', icon: ICONS.spark },
        // { label: 'Outreach-Ideen', href: '/sales/outreach', icon: ICONS.mail },
        // { label: 'Monitoring', href: '/sales/monitoring', icon: ICONS.eye },
        { label: 'Network', href: '/sales/network', icon: ICONS.network, comingSoon: true },
      ],
    },
    {
      title: 'LEADS & KUNDEN',
      items: [
        {
          label: 'Unternehmen',
          href: '/sales/unternehmen',
          icon: ICONS.list,
          badge: `${leadCount}`,
          children: [
            { label: `Neu heute (${neuHeute})`, href: '/sales/unternehmen?filter=neu-heute' },
            { label: `Qualifiziert (${qualifiziert})`, href: '/sales/unternehmen?filter=qualifiziert' },
            { label: `In Kontakt (${inKontakt})`, href: '/sales/unternehmen?filter=kontakt' },
          ],
        },
        { label: 'People', href: '/sales/people', icon: ICONS.users },
        { label: 'Kunden', href: '/sales/kunden', icon: ICONS.check, comingSoon: true },
      ],
    },
    {
      title: 'PRODUKT',
      items: [
        { label: 'Meetings', href: '/sales/meetings', icon: ICONS.calendar },
        { label: 'Analytics', href: '/sales/analytics', icon: ICONS.chart },
      ],
    },
  ];
}

// ─── PORTAL DROPDOWN — renders outside topbar stacking context ───────────────

function PortalDropdown({
  open,
  onClose,
  anchorRef,
  width = 370,
  children,
}: {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  width?: number;
  children: React.ReactNode;
}) {
  const [pos, setPos] = useState({ top: 0, right: 0 });

  useEffect(() => {
    if (open && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
  }, [open, anchorRef]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <>
      {/* Full-screen invisible backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99990,
          background: 'transparent',
        }}
      />
      {/* Dropdown panel */}
      <div
        style={{
          position: 'fixed',
          top: pos.top,
          right: pos.right,
          width,
          zIndex: 99991,
          background: C.surface,
          border: `1px solid ${C.borderLight}`,
          borderRadius: 14,
          overflow: 'hidden',
          boxShadow: '0 16px 64px rgba(0,0,0,0.5), 0 0 0 0.5px rgba(255,255,255,0.04)',
          animation: 'scaleIn 0.2s cubic-bezier(0.22, 1, 0.36, 1) both',
        }}
      >
        {children}
      </div>
    </>,
    document.body
  );
}

// ─── NOTIFICATION BELL — live from Supabase ─────────────────────────────────

function NotifBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  const { activities, loading } = useActivities();
  const recent = activities.slice(0, 8);
  const count = recent.length;

  return (
    <>
      <button
        ref={ref}
        onClick={() => setOpen(!open)}
        style={{
          position: 'relative',
          cursor: 'pointer',
          background: 'none',
          border: 'none',
          padding: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          width={16}
          height={16}
          viewBox="0 0 24 24"
          fill="none"
          stroke={open ? C.accentBright : C.text3}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transition: 'stroke 0.15s ease' }}
        >
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        {count > 0 && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366F1, #818CF8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 8,
              fontWeight: 700,
              color: '#fff',
              boxShadow: '0 2px 8px rgba(99,102,241,0.5)',
              border: `2px solid ${C.topbar}`,
            }}
          >
            {count > 9 ? '9+' : count}
          </div>
        )}
      </button>

      <PortalDropdown open={open} onClose={() => setOpen(false)} anchorRef={ref} width={370}>
        {/* Header */}
        <div
          style={{
            padding: '14px 18px',
            borderBottom: `1px solid ${C.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: C.text1 }}>Benachrichtigungen</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: C.success,
                boxShadow: `0 0 4px ${C.success}`,
                animation: 'pulse-live 2.5s ease-in-out infinite',
              }}
            />
            <span style={{ fontSize: 10, color: C.text3 }}>Live</span>
          </div>
        </div>

        {/* List */}
        <div style={{ maxHeight: 360, overflowY: 'auto' }}>
          {loading && (
            <div style={{ padding: '24px 18px', textAlign: 'center' }}>
              <span style={{ fontSize: 11, color: C.text3 }}>Laden...</span>
            </div>
          )}
          {!loading && recent.length === 0 && (
            <div style={{ padding: '32px 18px', textAlign: 'center' }}>
              <span style={{ fontSize: 12, color: C.text3 }}>Keine Aktivitäten</span>
              <div style={{ fontSize: 10, color: C.text3, marginTop: 4 }}>Aktionen werden hier live angezeigt</div>
            </div>
          )}
          {recent.map((a) => {
            const st = getActivityStyle(a.type);
            return (
              <div
                key={a.id}
                onClick={() => setOpen(false)}
                style={{
                  display: 'flex',
                  gap: 12,
                  padding: '12px 18px',
                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(99,102,241,0.04)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 7,
                    flexShrink: 0,
                    background: `${st.color}10`,
                    border: `1px solid ${st.color}18`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <SvgIcon d={st.icon} size={12} color={st.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: C.text1, lineHeight: 1.4, fontWeight: 500 }}>{a.title}</div>
                  {a.company_name && (
                    <div style={{ fontSize: 10, color: C.text3, marginTop: 2 }}>
                      {a.first_name} {a.last_name} · {a.company_name}
                    </div>
                  )}
                  <div style={{ fontSize: 10, color: C.text3, marginTop: 2 }}>{formatActivityTime(a.created_at)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </PortalDropdown>
    </>
  );
}

// ─── TOPBAR ──────────────────────────────────────────────────────────────────

// ─── PROFILE DROPDOWN ────────────────────────────────────────────────────────

function ProfileDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  const [user, setUser] = useState<{ email: string; initials: string; name: string } | null>(null);
  const [quota, setQuota] = useState<QuotaData | null>(_quotaCache);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Load quota once at mount (cached at module level, reused across dropdown opens)
  useEffect(() => {
    if (_quotaCache) {
      setQuota(_quotaCache);
      return;
    }
    let cancelled = false;
    loadQuotaOnce().then((d) => {
      if (!cancelled && d) setQuota(d);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    // 1) Try onvero_user cookie first (set by login API)
    try {
      const match = document.cookie.match(/onvero_user=([^;]+)/);
      if (match) {
        const parsed = JSON.parse(decodeURIComponent(match[1]));
        if (parsed.firstName || parsed.email) {
          const name =
            [parsed.firstName, parsed.lastName].filter(Boolean).join(' ') || parsed.email?.split('@')[0] || '';
          const initials = [parsed.firstName?.[0], parsed.lastName?.[0]].filter(Boolean).join('').toUpperCase() || '?';
          setUser({ email: parsed.email ?? '', initials, name });
          return;
        }
      }
    } catch {}

    // 2) Fallback: read Supabase session from localStorage
    try {
      const stored = readSessionFromStorage();
      if (stored?.email) {
        const parts = stored.email.split('@')[0].split('.');
        const name = parts.map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
        const initials = parts.map((p: string) => p.charAt(0).toUpperCase()).join('');
        setUser({ email: stored.email, initials, name });
        return;
      }
    } catch {}

    // 3) Last resort: call /api/auth/me
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          const u = data.user;
          const name = [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email?.split('@')[0] || '';
          const initials = [u.firstName?.[0], u.lastName?.[0]].filter(Boolean).join('').toUpperCase() || '?';
          setUser({ email: u.email ?? '', initials, name });
        }
      })
      .catch(() => {});

    // Fetch company logo
    fetch('/api/integrations')
      .then((r) => r.json())
      .then((d) => {
        if (d.logo_url) setLogoUrl(d.logo_url);
      })
      .catch(() => {});
  }, []);

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      const { createBrowserClient } = await import('@supabase/ssr');
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      await supabase.auth.signOut();
    }
    window.location.href = '/login';
  }

  return (
    <>
      <button
        ref={ref}
        onClick={() => setOpen(!open)}
        className="s-ghost"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          padding: '4px 10px 4px 4px',
          borderRadius: 9,
          border: `1px solid ${C.border}`,
          cursor: 'pointer',
          background: 'rgba(255,255,255,0.02)',
        }}
      >
        {logoUrl ? (
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              backgroundImage: `url(${logoUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              flexShrink: 0,
            }}
          />
        ) : (
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              background: 'linear-gradient(135deg, #6366F1, #818CF8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              fontWeight: 600,
              color: '#fff',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)',
            }}
          >
            {user?.initials ?? '..'}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 11.5, fontWeight: 500, color: C.text1, lineHeight: 1.2 }}>
            {user?.name ?? 'Laden...'}
          </span>
          <span style={{ fontSize: 9.5, color: C.text3, lineHeight: 1.2 }}>
            {user?.email ? user.email.split('@')[1] : ''}
          </span>
        </div>
        <svg
          width={10}
          height={10}
          viewBox="0 0 24 24"
          fill="none"
          stroke={C.text3}
          strokeWidth={2}
          strokeLinecap="round"
          style={{ marginLeft: 2 }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      <PortalDropdown open={open} onClose={() => setOpen(false)} anchorRef={ref} width={260}>
        <div style={{ padding: 4 }}>
          {/* User info */}
          <div
            style={{
              padding: '10px 12px',
              borderBottom: `1px solid ${C.border}`,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            {logoUrl && (
              <img
                src={logoUrl}
                alt=""
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  objectFit: 'cover',
                  flexShrink: 0,
                }}
              />
            )}
            <div>
              <div style={{ fontSize: 12, fontWeight: 500, color: C.text1 }}>{user?.name}</div>
              <div style={{ fontSize: 10, color: C.text3, marginTop: 2 }}>{user?.email}</div>
            </div>
          </div>

          {/* Credits + Plan */}
          <CreditsPanel data={quota} />

          {/* Settings */}
          <Link
            href="/sales/settings"
            onClick={() => setOpen(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              borderRadius: 6,
              margin: '4px 0',
              textDecoration: 'none',
              color: C.text2,
              fontSize: 12,
              transition: 'background 0.1s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <SvgIcon d={ICONS.settings} size={13} color={C.text3} />
            Einstellungen
          </Link>

          {/* Logout */}
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              width: '100%',
              padding: '8px 12px',
              borderRadius: 6,
              border: 'none',
              background: 'transparent',
              color: '#F87171',
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: 'inherit',
              textAlign: 'left',
              transition: 'background 0.1s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(248,113,113,0.06)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <svg
              width={13}
              height={13}
              viewBox="0 0 24 24"
              fill="none"
              stroke="#F87171"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            Abmelden
          </button>
        </div>
      </PortalDropdown>
    </>
  );
}

// ─── TOPBAR ──────────────────────────────────────────────────────────────────

// ─── CREDITS PANEL (for profile dropdown) ───────────────────────────────────

type QuotaData = {
  tenant: { id: string; name: string } | null;
  credits: {
    plan: string;
    credits_remaining: number;
    credits_used_period: number;
    overage_used: number;
    period_start: string;
    period_end: string;
    is_paused: boolean;
  } | null;
};

// Plan definitions — matches tenant_credits.plan values
const PLAN_INFO: Record<string, { label: string; total: number; price: string; overage: string | null }> = {
  basic: { label: 'Basic', total: 50, price: '29 €/Mo', overage: null },
  business: { label: 'Business', total: 200, price: '79 €/Mo', overage: null },
  enterprise: { label: 'Enterprise', total: 1000, price: '199 €/Mo', overage: '+200 Cr Puffer' },
};

// Module-level cache: fetched once on first mount, reused across dropdown open/close
let _quotaCache: QuotaData | null = null;
let _quotaPromise: Promise<QuotaData | null> | null = null;

function loadQuotaOnce(): Promise<QuotaData | null> {
  if (_quotaCache) return Promise.resolve(_quotaCache);
  if (_quotaPromise) return _quotaPromise;
  _quotaPromise = fetch('/api/tenant-quota', { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : null))
    .then((json) => {
      if (json) _quotaCache = json;
      return json;
    })
    .catch(() => null)
    .finally(() => {
      _quotaPromise = null;
    });
  return _quotaPromise;
}

function CreditsPanel({ data }: { data: QuotaData | null }) {
  if (!data) {
    return <div style={{ padding: '12px', fontSize: 10, color: C.text3, textAlign: 'center' }}>Lade Plan…</div>;
  }

  const { tenant, credits } = data;
  const planKey = credits?.plan ?? 'basic';
  const planInfo = PLAN_INFO[planKey] ?? { label: planKey, total: 0, price: '—', overage: null };
  const total = planInfo.total;
  const remaining = credits?.credits_remaining ?? 0;
  const overageUsed = credits?.overage_used ?? 0;
  const percent = total > 0 ? Math.max(0, Math.min(100, (remaining / total) * 100)) : 0;
  const lowCredits = percent < 20;
  const midCredits = percent < 50;

  const barColor = lowCredits ? '#F87171' : midCredits ? '#FBBF24' : '#34D399';
  const barGlow = lowCredits ? 'rgba(248,113,113,0.3)' : midCredits ? 'rgba(251,191,36,0.25)' : 'rgba(52,211,153,0.25)';
  const resetDate = credits?.period_end
    ? new Date(credits.period_end).toLocaleDateString('de-DE', { day: 'numeric', month: 'long' })
    : null;

  return (
    <div style={{ padding: '12px', borderBottom: `1px solid ${C.border}` }}>
      {/* Company + plan header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: C.text1,
            letterSpacing: '-0.01em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: 140,
          }}
          title={tenant?.name ?? ''}
        >
          {tenant?.name ?? 'Onvero'}
        </div>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 9.5,
            fontWeight: 600,
            letterSpacing: '0.04em',
            color: '#E0E7FF',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.22), rgba(129,140,248,0.12))',
            border: '1px solid rgba(129,140,248,0.3)',
            padding: '2.5px 9px',
            borderRadius: 999,
            lineHeight: 1.2,
            boxShadow: '0 0 0 1px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}
        >
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: '#A5B4FC',
              boxShadow: '0 0 6px rgba(165,180,252,0.8)',
            }}
          />
          {planInfo.label}
        </span>
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: 5,
          borderRadius: 3,
          background: 'rgba(255,255,255,0.05)',
          overflow: 'hidden',
          marginBottom: 7,
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${percent}%`,
            background: `linear-gradient(90deg, ${barColor}, ${barColor}cc)`,
            borderRadius: 3,
            boxShadow: `0 0 10px ${barGlow}`,
            transition: 'width 0.8s cubic-bezier(0.22, 1, 0.36, 1), background 0.3s ease',
          }}
        />
      </div>

      {/* Numbers */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div>
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: C.text1,
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
            }}
          >
            {remaining.toLocaleString('de-DE')}
          </span>
          <span style={{ fontSize: 10, color: C.text3, marginLeft: 4 }}>/ {total.toLocaleString('de-DE')} Credits</span>
        </div>
        <span style={{ fontSize: 9, color: C.text3, letterSpacing: '0.04em' }}>{Math.round(percent)}% frei</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, gap: 8 }}>
        {resetDate && (
          <span style={{ fontSize: 9.5, color: C.text3, letterSpacing: '0.02em' }}>Reset am {resetDate}</span>
        )}
        {planInfo.overage && (
          <span
            style={{
              fontSize: 9,
              color: overageUsed > 0 ? '#FBBF24' : C.text3,
              letterSpacing: '0.02em',
              fontWeight: 500,
            }}
          >
            {planInfo.overage}
            {overageUsed > 0 ? ` · ${overageUsed} genutzt` : ''}
          </span>
        )}
      </div>
    </div>
  );
}

function Topbar() {
  return (
    <div
      style={{
        height: 56,
        background: C.topbar,
        borderBottom: `1px solid ${C.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        flexShrink: 0,
        backdropFilter: 'blur(20px)',
        position: 'relative',
        zIndex: 10,
      }}
    >
      {/* Top edge shimmer */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background:
            'linear-gradient(90deg, transparent 5%, rgba(129,140,248,0.1) 30%, rgba(56,189,248,0.06) 60%, transparent 95%)',
        }}
      />

      {/* ─── Left: Logo ─── */}
      <Link
        href="/sales"
        className="s-ghost"
        style={{
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          padding: '2px 0',
          marginLeft: 2,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center' }}>
          <span
            style={{
              fontSize: 26,
              fontWeight: 600,
              color: '#fff',
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
            }}
          >
            onvero
          </span>
          <span
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              letterSpacing: '0.18em',
              color: 'rgba(165,180,252,0.7)',
              lineHeight: 1,
              textTransform: 'uppercase',
            }}
          >
            Sales
          </span>
        </div>
      </Link>

      {/* ─── Center: Command bar — click to open ─── */}
      <button
        onClick={openCommandPalette}
        className="s-ghost"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '6px 14px 6px 12px',
          borderRadius: 9,
          background: 'rgba(255,255,255,0.025)',
          border: `1px solid ${C.border}`,
          cursor: 'pointer',
          minWidth: 260,
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)',
          fontFamily: 'inherit',
        }}
      >
        <SvgIcon d={ICONS.search} size={13} color={C.text3} />
        <span style={{ fontSize: 12, color: C.text3, flex: 1 }}>Leads, Firmen, Kontakte suchen...</span>
        <div style={{ display: 'flex', gap: 3 }}>
          {['⌘', 'K'].map((k) => (
            <kbd
              key={k}
              style={{
                fontSize: 10,
                color: C.text3,
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid rgba(255,255,255,0.08)`,
                borderRadius: 4,
                padding: '2px 6px',
                fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                lineHeight: 1.3,
              }}
            >
              {k}
            </kbd>
          ))}
        </div>
      </button>

      {/* ─── Right: Status, Notifications, Profile ─── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* Live indicator pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 10px',
            borderRadius: 20,
            background: 'rgba(52,211,153,0.06)',
            border: '1px solid rgba(52,211,153,0.1)',
          }}
        >
          <div style={{ position: 'relative' }}>
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: C.success,
                boxShadow: '0 0 6px rgba(52,211,153,0.6)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: -3,
                borderRadius: '50%',
                border: '1.5px solid rgba(52,211,153,0.25)',
                animation: 'pulse-live 2.5s ease-in-out infinite',
              }}
            />
          </div>
          <span style={{ fontSize: 10, color: C.success, letterSpacing: '0.06em', fontWeight: 600 }}>LIVE</span>
        </div>

        <div style={{ width: 1, height: 24, background: C.border, margin: '0 6px' }} />

        {/* Notification bell */}
        <NotifBell />

        <div style={{ width: 1, height: 24, background: C.border, margin: '0 6px' }} />

        {/* Profile with Dropdown */}
        <ProfileDropdown />
      </div>
    </div>
  );
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────

function Sidebar() {
  const pathname = usePathname();
  // Static counts — avoids loading the full leads dataset just for badge numbers
  const NAV = useMemo(() => buildNav(0, 0, 0, 0, 0), []);

  function isActive(href: string) {
    if (href === '/sales') return pathname === '/sales';
    return pathname.startsWith(href);
  }

  return (
    <div
      style={{
        width: 220,
        background: C.sidebar,
        borderRight: `1px solid ${C.border}`,
        padding: '20px 10px',
        flexShrink: 0,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 28,
        position: 'relative',
      }}
    >
      {/* Sidebar ambient */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 80,
          height: '100%',
          background: 'linear-gradient(270deg, rgba(99,102,241,0.02) 0%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />

      {NAV.map((section) => (
        <div key={section.title}>
          <div
            style={{
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: '0.14em',
              color: C.text3,
              padding: '0 12px',
              marginBottom: 8,
            }}
          >
            {section.title}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {section.items.map((item) => {
              const active = isActive(item.href);
              if (item.comingSoon) {
                return (
                  <div key={item.label}>
                    <div
                      aria-disabled="true"
                      title="Coming Soon"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 12px',
                        borderRadius: 8,
                        background: 'transparent',
                        color: C.text3,
                        fontSize: 12.5,
                        fontWeight: 400,
                        position: 'relative',
                        fontFamily: 'inherit',
                        cursor: 'not-allowed',
                        opacity: 0.5,
                        userSelect: 'none',
                      }}
                    >
                      <SvgIcon d={item.icon} color={C.text3} />
                      <span style={{ flex: 1 }}>{item.label}</span>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '2px 7px',
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: 4,
                          fontSize: 9,
                          fontWeight: 600,
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                          color: C.text3,
                        }}
                      >
                        Bald
                      </span>
                    </div>
                  </div>
                );
              }
              return (
                <div key={item.label}>
                  <Link
                    href={item.href}
                    className="s-nav"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 12px',
                      borderRadius: 8,
                      textDecoration: 'none',
                      background: active ? 'rgba(99,102,241,0.1)' : 'transparent',
                      boxShadow: active
                        ? 'inset 0 0 0 0.5px rgba(99,102,241,0.2), 0 2px 8px rgba(99,102,241,0.08)'
                        : 'none',
                      color: active ? C.accentBright : C.text2,
                      fontSize: 12.5,
                      fontWeight: active ? 500 : 400,
                      transition: 'all 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
                      position: 'relative',
                      fontFamily: 'inherit',
                    }}
                  >
                    {active && (
                      <div
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: 2.5,
                          height: 18,
                          borderRadius: 2,
                          background: 'linear-gradient(180deg, #818CF8, #6366F1)',
                          boxShadow: '0 0 10px rgba(99,102,241,0.5)',
                        }}
                      />
                    )}
                    <SvgIcon d={item.icon} color={active ? C.accent : C.text3} />
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {item.badge &&
                      (item.badge === 'v2' ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '2px 6px',
                            background: 'rgba(107,122,255,0.15)',
                            borderRadius: 4,
                            fontSize: 9.5,
                            fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                            fontWeight: 600,
                            color: '#b9c2ff',
                            letterSpacing: '0.04em',
                          }}
                        >
                          <span
                            style={{
                              width: 5,
                              height: 5,
                              borderRadius: '50%',
                              background: '#6B7AFF',
                              animation: 'live-pulse-v2 2s ease-in-out infinite',
                            }}
                          />
                          v2
                        </span>
                      ) : (
                        <span
                          style={{
                            background: active ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.04)',
                            color: active ? C.accent : C.text3,
                            fontSize: 10,
                            padding: '2px 8px',
                            borderRadius: 10,
                            fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                            fontWeight: 500,
                            letterSpacing: '-0.01em',
                          }}
                        >
                          {item.badge}
                        </span>
                      ))}
                  </Link>
                  {item.children && active && (
                    <div style={{ marginTop: 4, marginBottom: 4 }}>
                      {item.children.map((child, i) => (
                        <Link
                          key={child.label}
                          href={child.href}
                          className="s-sub"
                          style={{
                            display: 'block',
                            fontSize: 11.5,
                            color: C.text3,
                            padding: '6px 12px 6px 38px',
                            textDecoration: 'none',
                            cursor: 'pointer',
                            borderRadius: 6,
                            transition: 'all 0.15s ease',
                            animation: 'fadeInUp 0.25s ease both',
                            animationDelay: `${i * 0.04}s`,
                          }}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Bottom settings link */}
      <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
        <Link
          href="/sales/settings"
          className="s-nav"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 12px',
            borderRadius: 8,
            textDecoration: 'none',
            color: C.text3,
            fontSize: 12,
            transition: 'all 0.15s ease',
            fontFamily: 'inherit',
          }}
        >
          <SvgIcon d={ICONS.settings} color={C.text3} />
          <span>Einstellungen</span>
        </Link>
      </div>
    </div>
  );
}

// ─── LAYOUT ──────────────────────────────────────────────────────────────────

export default function SalesV2Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_STYLES }} />
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes live-pulse-v2 {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(107,122,255,0.5); }
          50% { opacity: 0.6; box-shadow: 0 0 0 4px rgba(107,122,255,0); }
        }
        @keyframes skeleton-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .uv2-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .uv2-scrollbar::-webkit-scrollbar-track { background: #0a0a0a; }
        .uv2-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
        .uv2-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
      `,
        }}
      />
      <div
        className="noise"
        style={{
          background: C.bg,
          color: C.text1,
          height: '100vh',
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          WebkitFontSmoothing: 'antialiased',
        }}
      >
        <ParallaxBackground />
        <ToastContainer />
        <CommandPalette />
        {/* <AIChatWidget /> */}
        <OnboardingTour />
        <Topbar />
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative', zIndex: 1 }}>
          <Sidebar />
          <main
            style={{
              flex: 1,
              padding: '28px 32px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 22,
            }}
          >
            {children}
          </main>
        </div>
        <StatusBar />
      </div>
    </>
  );
}
