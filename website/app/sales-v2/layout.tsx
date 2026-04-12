'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { C, GLOBAL_STYLES, SvgIcon, ParallaxBackground, ICONS, ToastContainer, StatusBar } from './_shared';
import { CommandPalette } from './_command-palette';
import { AIChatWidget } from './_ai-chat';
import { OnboardingTour } from './_onboarding';
import { LEADS } from './_lead-data';

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

// Derive real counts from lead data
const neuHeute = LEADS.filter((l) => {
  const d = new Date(l.createdAt.replace(/(\d+)\. (\w+) (\d+)/, '$2 $1, $3'));
  const today = new Date();
  return d.toDateString() === today.toDateString();
}).length;
const qualifiziert = LEADS.filter((l) => l.status === 'Qualifiziert').length;
const inKontakt = LEADS.filter((l) => l.status === 'In Kontakt').length;
const mitEmail = LEADS.filter((l) => l.emailDraftBody).length;

const NAV: NavSection[] = [
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
        badge: `${LEADS.length}`,
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

// ─── NOTIFICATION BELL ───────────────────────────────────────────────────────

const NOTIFICATIONS = [
  {
    id: 1,
    text: 'Nexlayer CEO hat deinen LinkedIn-Post geliked',
    time: 'vor 12 min',
    color: '#818CF8',
    icon: ICONS.globe,
    read: false,
  },
  {
    id: 2,
    text: 'Marcus Weber wartet auf Follow-up (3 Tage)',
    time: 'vor 2h',
    color: '#F87171',
    icon: ICONS.clock,
    read: false,
  },
  {
    id: 3,
    text: 'KI-Score für 23 Leads aktualisiert',
    time: 'vor 6h',
    color: '#34D399',
    icon: ICONS.spark,
    read: false,
  },
  {
    id: 4,
    text: 'Meeting mit Axflow AG morgen um 10:30',
    time: 'vor 8h',
    color: '#38BDF8',
    icon: ICONS.calendar,
    read: true,
  },
  {
    id: 5,
    text: 'Neues Intent-Signal: Greenfield AG',
    time: 'vor 1 Tag',
    color: '#FBBF24',
    icon: ICONS.zap,
    read: true,
  },
];

function NotifBell({ count = 3 }: { count?: number }) {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState(NOTIFICATIONS);
  const unread = notifs.filter((n) => !n.read).length;

  function markAllRead() {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  }

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
        {unread > 0 && (
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
            {unread}
          </div>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <>
          {/* Backdrop */}
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 999 }} />

          <div
            style={{
              position: 'absolute',
              top: '100%',
              right: -8,
              marginTop: 8,
              width: 360,
              zIndex: 1000,
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
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: 11,
                    color: C.accent,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  Alle gelesen
                </button>
              )}
            </div>

            {/* Notifications list */}
            <div style={{ maxHeight: 340, overflowY: 'auto' }}>
              {notifs.map((n) => (
                <div
                  key={n.id}
                  style={{
                    display: 'flex',
                    gap: 12,
                    padding: '12px 18px',
                    borderBottom: `1px solid rgba(255,255,255,0.03)`,
                    background: n.read ? 'transparent' : 'rgba(99,102,241,0.03)',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(99,102,241,0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(99,102,241,0.03)';
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 7,
                      flexShrink: 0,
                      background: `${n.color}10`,
                      border: `1px solid ${n.color}18`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <SvgIcon d={n.icon} size={12} color={n.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 12,
                        color: n.read ? C.text2 : C.text1,
                        lineHeight: 1.4,
                        fontWeight: n.read ? 400 : 500,
                      }}
                    >
                      {n.text}
                    </div>
                    <div style={{ fontSize: 10, color: C.text3, marginTop: 3 }}>{n.time}</div>
                  </div>
                  {!n.read && (
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: C.accent,
                        boxShadow: `0 0 6px ${C.accent}60`,
                        flexShrink: 0,
                        marginTop: 8,
                      }}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div
              style={{
                padding: '10px 18px',
                borderTop: `1px solid ${C.border}`,
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: 11, color: C.accent, cursor: 'pointer' }}>Alle Benachrichtigungen anzeigen</span>
            </div>
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
        <NotifBell count={3} />

        <div style={{ width: 1, height: 24, background: C.border, margin: '0 6px' }} />

        {/* Profile */}
        <div
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
            HL
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 11.5, fontWeight: 500, color: C.text1, lineHeight: 1.2 }}>Hans L.</span>
            <span style={{ fontSize: 9.5, color: C.text3, lineHeight: 1.2 }}>Admin</span>
          </div>
          <svg
            width={10}
            height={10}
            viewBox="0 0 24 24"
            fill="none"
            stroke={C.text3}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ marginLeft: 2 }}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>
    </div>
  );
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────

function Sidebar() {
  const pathname = usePathname();

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
