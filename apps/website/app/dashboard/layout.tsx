'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { C, GLOBAL_STYLES, ParallaxBackground } from './_shared';

// ─── NAV CONFIG ──────────────────────────────────────────────────────────────

type NavItem = {
  label: string;
  href: string;
  icon: string;
  comingSoon?: boolean;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const ICONS = {
  pen: 'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7m-1.5-9.5a2.121 2.121 0 113 3L12 19l-4 1 1-4 9.5-9.5z',
  edit: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z',
  text: 'M4 6h16M4 12h16M4 18h10',
  search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
} as const;

const NAV: NavSection[] = [
  {
    title: 'BLOG',
    items: [
      { label: 'Erstellen', href: '/dashboard', icon: ICONS.pen },
      { label: 'Bearbeiten', href: '/dashboard/edit', icon: ICONS.edit },
    ],
  },
  {
    title: 'CONTENT',
    items: [{ label: 'Texte', href: '/dashboard/texts', icon: ICONS.text }],
  },
  {
    title: 'SEO',
    items: [{ label: 'SEO Optimization', href: '/dashboard/seo', icon: ICONS.search, comingSoon: true }],
  },
];

function SvgIcon({ d, size = 14, color = 'currentColor' }: { d: string; size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────

function Sidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  }

  return (
    <div
      style={{
        width: 220,
        background: C.topbar,
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
              if (item.comingSoon) {
                return (
                  <div
                    key={item.label}
                    aria-disabled="true"
                    title="Bald verfügbar"
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
                      cursor: 'not-allowed',
                      opacity: 0.55,
                      userSelect: 'none',
                      fontFamily: 'inherit',
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
                );
              }
              const active = isActive(item.href);
              return (
                <Link
                  key={item.label}
                  href={item.href}
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
                  onMouseEnter={(e) => {
                    if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                  }}
                  onMouseLeave={(e) => {
                    if (!active) e.currentTarget.style.background = 'transparent';
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
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── PROFILE DROPDOWN ────────────────────────────────────────────────────────

function ProfileDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<{ email: string; initials: string; name: string } | null>(null);

  useEffect(() => {
    try {
      const match = document.cookie.match(/onvero_user=([^;]+)/);
      if (match) {
        const parsed = JSON.parse(decodeURIComponent(match[1]));
        if (parsed.firstName || parsed.email) {
          const name =
            [parsed.firstName, parsed.lastName].filter(Boolean).join(' ') || parsed.email?.split('@')[0] || '';
          const initials =
            [parsed.firstName?.[0], parsed.lastName?.[0]].filter(Boolean).join('').toUpperCase() || '?';
          setUser({ email: parsed.email ?? '', initials, name });
          return;
        }
      }
    } catch {}

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
  }, []);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    window.location.href = '/login';
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-ghost"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          padding: '4px 10px 4px 4px',
          borderRadius: 9,
          border: `1px solid ${C.border}`,
          cursor: 'pointer',
          background: 'rgba(255,255,255,0.02)',
          fontFamily: 'inherit',
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
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: 240,
            background: C.surface,
            border: `1px solid ${C.borderLight}`,
            borderRadius: 14,
            overflow: 'hidden',
            boxShadow: '0 16px 64px rgba(0,0,0,0.5)',
            animation: 'scaleIn 0.2s cubic-bezier(0.22, 1, 0.36, 1) both',
            zIndex: 1000,
          }}
        >
          <div style={{ padding: '12px 14px', borderBottom: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: C.text1 }}>{user?.name}</div>
            <div style={{ fontSize: 10, color: C.text3, marginTop: 2 }}>{user?.email}</div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              width: '100%',
              padding: '10px 14px',
              border: 'none',
              background: 'transparent',
              color: '#F87171',
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: 'inherit',
              textAlign: 'left',
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
        padding: '0 24px',
        flexShrink: 0,
        backdropFilter: 'blur(20px)',
        position: 'relative',
        zIndex: 10,
      }}
    >
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

      <Link
        href="/dashboard"
        style={{
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 0,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
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
            Website
          </span>
        </div>
      </Link>

      <ProfileDropdown />
    </div>
  );
}

// ─── LAYOUT ──────────────────────────────────────────────────────────────────

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_STYLES }} />
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

        <Topbar />
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative', zIndex: 1 }}>
          <Sidebar />
          <main
            style={{
              flex: 1,
              padding: '28px 32px 40px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 22,
            }}
          >
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
