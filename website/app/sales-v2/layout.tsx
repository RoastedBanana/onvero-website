'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { C, GLOBAL_STYLES, SvgIcon, ParallaxBackground, ICONS, ToastContainer, StatusBar } from './_shared';
import { CommandPalette } from './_command-palette';
import { AIChatWidget } from './_ai-chat';
import { OnboardingTour } from './_onboarding';
import { useLeads } from './_use-leads';
import { useActivities, formatActivityTime, getActivityStyle } from './_activities';

// ─── NAV CONFIG ──────────────────────────────────────────────────────────────

type NavItem = {
  label: string;
  href: string;
  icon: string;
  badge?: string;
  children?: { label: string; href: string }[];
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
      items: [{ label: 'Home', href: '/sales-v2', icon: ICONS.home }],
    },
    {
      title: 'LEADS',
      items: [
        {
          label: 'Alle Leads',
          href: '/sales-v2/leads',
          icon: ICONS.list,
          badge: `${leadCount}`,
          children: [
            { label: `Neu heute (${neuHeute})`, href: '/sales-v2/leads?filter=neu-heute' },
            { label: `Qualifiziert (${qualifiziert})`, href: '/sales-v2/leads?filter=qualifiziert' },
            { label: `In Kontakt (${inKontakt})`, href: '/sales-v2/leads?filter=kontakt' },
          ],
        },
      ],
    },
    {
      title: 'PROSPECTS',
      items: [
        { label: 'Market Intent', href: '/sales-v2/prospects', icon: ICONS.zap, badge: `${mitEmail}` },
        { label: 'Outreach-Ideen', href: '/sales-v2/outreach', icon: ICONS.mail },
        { label: 'Monitoring', href: '/sales-v2/monitoring', icon: ICONS.eye },
      ],
    },
    {
      title: 'PRODUKT',
      items: [
        { label: 'Meetings', href: '/sales-v2/meetings', icon: ICONS.calendar },
        { label: 'Analytics', href: '/sales-v2/analytics', icon: ICONS.chart },
      ],
    },
  ];
}

// ─── ONVERO ICON (real brand mark) ───────────────────────────────────────────

function OnveroIconMark({ size = 20, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 148.57 212.32"
      width={size}
      height={size * (212.32 / 148.57)}
      fill={color}
    >
      <circle cx="78.75" cy="196.57" r="15.75" />
      <circle cx="16" cy="133.32" r="16" />
      <line
        x1="67.64"
        y1="185.06"
        x2="27.08"
        y2="144.87"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeMiterlimit="10"
        strokeWidth="8"
      />
      <line
        x1="98.86"
        y1="49.8"
        x2="26.84"
        y2="121.55"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeMiterlimit="10"
        strokeWidth="8"
      />
      <path d="M147.45,21.2c-9.47-3.12-16.95-10.59-20.07-20.06C127.15.46,126.51,0,125.79,0h0c-.72,0-1.36.46-1.59,1.14-3.11,9.44-10.56,16.9-19.99,20.04-.46.15-.87.47-1.06.92-.4.95.09,1.98.98,2.27,9.47,3.12,16.95,10.59,20.07,20.06.23.68.87,1.14,1.59,1.14h0c.72,0,1.36-.46,1.59-1.14,3.11-9.44,10.56-16.9,19.99-20.04.46-.15.87-.47,1.06-.92.4-.95-.09-1.98-.98-2.27Z" />
    </svg>
  );
}

// ─── NOTIFICATION BELL — live from Supabase ─────────────────────────────────

function NotifBell() {
  const [open, setOpen] = useState(false);
  const { activities, loading } = useActivities();

  // Recent activities are our "notifications"
  const recent = activities.slice(0, 8);
  const count = recent.length;

  return (
    <div style={{ position: 'relative' }}>
      <button
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

      {open && (
        <>
          {/* Backdrop — closes on click anywhere */}
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 1100 }} />

          <div
            style={{
              position: 'fixed',
              top: 60,
              right: 20,
              width: 370,
              zIndex: 1101,
              background: C.surface,
              border: `1px solid ${C.borderLight}`,
              borderRadius: 14,
              overflow: 'hidden',
              boxShadow: '0 16px 64px rgba(0,0,0,0.5), 0 0 0 0.5px rgba(255,255,255,0.04)',
              animation: 'scaleIn 0.2s cubic-bezier(0.22, 1, 0.36, 1) both',
            }}
          >
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
                    style={{
                      display: 'flex',
                      gap: 12,
                      padding: '12px 18px',
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                    }}
                    onClick={() => setOpen(false)}
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
                      <div style={{ fontSize: 10, color: C.text3, marginTop: 2 }}>
                        {formatActivityTime(a.created_at)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── TOPBAR ──────────────────────────────────────────────────────────────────

// ─── PROFILE DROPDOWN ────────────────────────────────────────────────────────

function ProfileDropdown() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<{ email: string; initials: string; name: string } | null>(null);

  useEffect(() => {
    async function load() {
      const { createBrowserClient } = await import('@supabase/ssr');
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const {
        data: { user: u },
      } = await supabase.auth.getUser();
      if (u?.email) {
        const parts = u.email.split('@')[0].split('.');
        const name = parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
        const initials = parts.map((p) => p.charAt(0).toUpperCase()).join('');
        setUser({ email: u.email, initials, name });
      }
    }
    load();
  }, []);

  async function handleLogout() {
    try {
      // Use the same logout API as the old dashboard
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Fallback: sign out via Supabase client directly
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
    <div style={{ position: 'relative' }}>
      <button
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

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 999 }} />
          <div
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 6,
              zIndex: 1000,
              background: C.surface,
              border: `1px solid ${C.borderLight}`,
              borderRadius: 10,
              padding: 4,
              minWidth: 200,
              boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 0.5px rgba(255,255,255,0.04)',
              animation: 'scaleIn 0.15s ease both',
            }}
          >
            {/* User info */}
            <div style={{ padding: '10px 12px', borderBottom: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: C.text1 }}>{user?.name}</div>
              <div style={{ fontSize: 10, color: C.text3, marginTop: 2 }}>{user?.email}</div>
            </div>

            {/* Settings link */}
            <Link
              href="/sales-v2/settings"
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
        </>
      )}
    </div>
  );
}

// ─── TOPBAR ──────────────────────────────────────────────────────────────────

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
      <Link href="/sales-v2" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Icon container with glow */}
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(99,102,241,0.05))',
            border: '1px solid rgba(99,102,241,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 12px rgba(99,102,241,0.15), inset 0 1px 0 rgba(255,255,255,0.05)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle inner gradient */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(circle at 30% 20%, rgba(129,140,248,0.12), transparent 70%)',
            }}
          />
          <div style={{ position: 'relative', marginTop: -1 }}>
            <OnveroIconMark size={13} color="#A5B4FC" />
          </div>
        </div>

        {/* Wordmark */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: C.text1,
                letterSpacing: '-0.02em',
                fontFamily: "TimesNewRomanPSMT, 'Times New Roman', Georgia, serif",
              }}
            >
              Onvero
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: '0.04em',
                background: 'linear-gradient(135deg, #818CF8, #A5B4FC)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              SALES
            </span>
          </div>
        </div>
      </Link>

      {/* ─── Center: Command bar ─── */}
      <div
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
      </div>

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
  const { leads } = useLeads();

  // Compute counts from live data
  const neuHeute = leads.filter((l) => {
    const created = new Date(l.createdAt.replace(/(\d+)\. (\w+) (\d+)/, '$2 $1, $3'));
    return created.toDateString() === new Date().toDateString();
  }).length;
  const qualifiziert = leads.filter((l) => l.status === 'Qualifiziert').length;
  const inKontakt = leads.filter((l) => l.status === 'In Kontakt').length;
  const mitEmail = leads.filter((l) => l.emailDraftBody).length;
  const NAV = buildNav(leads.length, neuHeute, qualifiziert, inKontakt, mitEmail);

  function isActive(href: string) {
    if (href === '/sales-v2') return pathname === '/sales-v2';
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
                    {item.badge && (
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
                    )}
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
          href="/sales-v2/settings"
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
      <div
        className="noise"
        style={{
          background: C.bg,
          color: C.text1,
          minHeight: '100vh',
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
        <AIChatWidget />
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
