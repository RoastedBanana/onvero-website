'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, createContext, useContext } from 'react';
import { motion } from 'framer-motion';
import {
  Home2,
  MessageText1,
  Share,
  Activity,
  Archive,
  Profile2User,
  ChartSquare,
  Routing,
  Setting2,
  SearchNormal1,
  Notification,
  Sun1,
  Moon,
  Logout,
} from 'iconsax-react';
import { CommandPaletteProvider, usePalette } from './_command-palette';
import { ToastProvider, useToast } from './_toast';
import { OnboardingProvider, useOnboarding } from './_onboarding';
import { useNotifications } from './_use-notifications';

// ─── Theme ────────────────────────────────────────────────────────────────────

type Theme = 'light' | 'dark';
const ThemeCtx = createContext<{ theme: Theme; toggle: () => void }>({
  theme: 'light',
  toggle: () => {},
});
export function useTheme() {
  return useContext(ThemeCtx);
}

const LIGHT = {
  bg: '#FFFFFF',
  bgPage: '#FFFFFF',
  bgCard: '#F4F5F8',
  bgHover: '#ECEDF2',
  border: '#E8E9EE',
  borderStrong: '#CDCDD8',
  sidebar: '#FFFFFF',
  topbar: '#FFFFFF',
  text: '#111111',
  textSub: '#555567',
  textMuted: '#9CA3AF',
  accent: '#111111',
  accentHover: '#333333',
  success: '#10B981',
  warning: '#F97316',
  danger: '#EF4444',
};

const DARK = {
  bg: '#111318',
  bgPage: '#0A0B0F',
  bgCard: '#15171E',
  bgHover: '#1C1E27',
  border: '#21232E',
  borderStrong: '#2E3040',
  sidebar: '#0F1014',
  topbar: '#111318',
  text: '#F1F5F9',
  textSub: '#94A3B8',
  textMuted: '#4B5563',
  accent: '#F1F5F9',
  accentHover: '#FFFFFF',
  success: '#10B981',
  warning: '#F97316',
  danger: '#EF4444',
};

export function colors(theme: Theme) {
  return theme === 'dark' ? DARK : LIGHT;
}

// ─── User context ─────────────────────────────────────────────────────────────

type UserInfo = { id: string; tenantId: string; role: string; firstName: string; lastName: string; email: string };
const UserCtx = createContext<UserInfo | null>(null);
export function useUser() {
  return useContext(UserCtx);
}

// ─── Nav config ───────────────────────────────────────────────────────────────

type NavItem = { label: string; href: string; Icon: React.ElementType; disabled?: boolean };
type NavSection = { heading: string; items: NavItem[] };

const NAV_TOP: NavItem = { label: 'Home', href: '/intelligence', Icon: Home2 };

const NAV_SECTIONS: NavSection[] = [
  {
    heading: 'Discovery',
    items: [
      { label: 'Lead Scout', href: '/intelligence/discovery', Icon: MessageText1 },
      { label: 'Netzwerk', href: '/intelligence/network', Icon: Share, disabled: true },
      { label: 'Intent Monitor', href: '/intelligence/intent', Icon: Activity, disabled: true },
    ],
  },
  {
    heading: 'Qualifizierung',
    items: [
      { label: 'Archiv', href: '/intelligence/archiv', Icon: Archive },
      { label: 'Leads', href: '/intelligence/leads', Icon: Profile2User },
    ],
  },
];

const NAV_SYSTEM: NavItem[] = [
  { label: 'Analytics', href: '/intelligence/analytics', Icon: ChartSquare, disabled: true },
  { label: 'Integrationen', href: '/intelligence/integrations', Icon: Routing },
  { label: 'Einstellungen', href: '/intelligence/settings', Icon: Setting2 },
];

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function Sidebar({ theme }: { theme: Theme }) {
  const c = colors(theme);
  const pathname = usePathname();
  const isDark = theme === 'dark';
  const [expanded, setExpanded] = useState(false);

  function isActive(href: string) {
    if (href === '/intelligence') return pathname === '/intelligence';
    return pathname.startsWith(href);
  }

  function SidebarLink({ item }: { item: NavItem }) {
    const [hovered, setHovered] = useState(false);
    const [pressed, setPressed] = useState(false);
    const active = isActive(item.href);
    const { Icon } = item;
    const disabled = item.disabled ?? false;

    const bg = active
      ? isDark
        ? 'rgba(255,255,255,0.10)'
        : 'rgba(0,0,0,0.07)'
      : hovered && !disabled
        ? isDark
          ? 'rgba(255,255,255,0.05)'
          : 'rgba(0,0,0,0.04)'
        : 'transparent';

    const inner = (
      <>
        {active && !disabled && (
          <span
            style={{
              position: 'absolute',
              left: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 3,
              height: 16,
              borderRadius: 99,
              background: c.text,
            }}
          />
        )}
        <Icon
          size={17}
          variant="Linear"
          color={disabled ? c.textMuted : active ? c.text : c.textMuted}
          style={{ flexShrink: 0, opacity: disabled ? 0.4 : 1 }}
        />
        <span
          style={{
            fontSize: 13,
            fontWeight: active ? 700 : 500,
            color: disabled ? c.textMuted : active ? c.text : c.textSub,
            whiteSpace: 'nowrap',
            opacity: expanded ? (disabled ? 0.45 : 1) : 0,
            transition: 'opacity 150ms ease-out',
            pointerEvents: expanded ? 'auto' : 'none',
            flex: 1,
          }}
        >
          {item.label}
        </span>
        {disabled && expanded && (
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: c.textMuted,
              background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
              padding: '2px 5px',
              borderRadius: 4,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              opacity: expanded ? 1 : 0,
              transition: 'opacity 150ms ease-out',
            }}
          >
            Bald
          </span>
        )}
      </>
    );

    if (disabled) {
      return (
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            padding: '0 10px',
            height: 34,
            borderRadius: 9,
            background: 'transparent',
            cursor: 'default',
            flexShrink: 0,
          }}
        >
          {inner}
        </div>
      );
    }

    return (
      <Link
        href={item.href}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => {
          setHovered(false);
          setPressed(false);
        }}
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          padding: '0 10px',
          height: 34,
          borderRadius: 9,
          background: bg,
          textDecoration: 'none',
          transition: 'background 100ms ease-out, transform 60ms ease-out',
          transform: pressed ? 'scale(0.97)' : 'scale(1)',
          flexShrink: 0,
        }}
      >
        {inner}
      </Link>
    );
  }

  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      style={{
        width: expanded ? 220 : 56,
        minWidth: expanded ? 220 : 56,
        transition: 'width 220ms cubic-bezier(0.4,0,0.2,1), min-width 220ms cubic-bezier(0.4,0,0.2,1)',
        background: isDark ? 'rgba(10,12,24,0.55)' : 'rgba(255,255,255,0.30)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        borderRight: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.65)'}`,
        display: 'flex',
        flexDirection: 'column',
        padding: '16px 0 14px',
        flexShrink: 0,
        height: '100%',
        overflowY: expanded ? 'auto' : 'hidden',
        overflowX: 'hidden',
        zIndex: 100,
      }}
    >
      {/* Logo */}
      <Link
        href="/intelligence"
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0 10px 0 18px',
          height: 34,
          marginBottom: 58,
          textDecoration: 'none',
          flexShrink: 0,
          position: 'relative',
        }}
      >
        {/* Collapsed: single lettermark */}
        <span
          style={{
            position: 'absolute',
            left: 18,
            fontSize: 22,
            fontWeight: 900,
            color: c.text,
            letterSpacing: '-0.05em',
            lineHeight: 1,
            opacity: expanded ? 0 : 1,
            transition: 'opacity 120ms ease-out',
            pointerEvents: 'none',
          }}
        >
          O
        </span>
        {/* Expanded: two-line wordmark */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            opacity: expanded ? 1 : 0,
            transition: 'opacity 150ms ease-out',
          }}
        >
          <span
            style={{
              fontSize: 20,
              fontWeight: 900,
              color: c.text,
              letterSpacing: '-0.04em',
              lineHeight: 1,
              whiteSpace: 'nowrap',
            }}
          >
            Onvero
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: c.textMuted,
              letterSpacing: '0.04em',
              lineHeight: 1,
              whiteSpace: 'nowrap',
              textTransform: 'uppercase',
            }}
          >
            Leads
          </span>
        </div>
      </Link>

      {/* Home */}
      <div style={{ padding: '0 8px', marginBottom: 6 }}>
        <SidebarLink item={NAV_TOP} />
      </div>

      {/* Sectioned nav */}
      <div style={{ flex: 1, padding: '0 8px', display: 'flex', flexDirection: 'column', gap: 0 }}>
        {NAV_SECTIONS.map((section) => (
          <div key={section.heading} style={{ marginBottom: 4 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: c.textMuted,
                letterSpacing: '0.09em',
                textTransform: 'uppercase',
                padding: '10px 10px 4px',
                opacity: expanded ? 1 : 0,
                transition: 'opacity 150ms ease-out',
                whiteSpace: 'nowrap',
              }}
            >
              {section.heading}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {section.items.map((item) => (
                <SidebarLink key={item.href} item={item} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* System divider */}
      <div style={{ height: 1, background: c.border, margin: '8px 12px' }} />

      {/* System nav */}
      <div style={{ padding: '0 8px', display: 'flex', flexDirection: 'column', gap: 1 }}>
        {NAV_SYSTEM.map((item) => (
          <SidebarLink key={item.href} item={item} />
        ))}
      </div>
    </aside>
  );
}

// ─── Topbar ───────────────────────────────────────────────────────────────────

const PAGE_LABELS: Record<string, string> = {
  '/intelligence': 'Home',
  '/intelligence/discovery': 'Lead Scout',
  '/intelligence/network': 'Netzwerk',
  '/intelligence/intent': 'Intent Monitor',
  '/intelligence/qualifizierung': 'Qualifizierung',
  '/intelligence/leads': 'Leads',
  '/intelligence/archiv': 'Archiv',
  '/intelligence/analytics': 'Analytics',
  '/intelligence/integrations': 'Integrationen',
  '/intelligence/settings': 'Einstellungen',
  '/intelligence/team': 'Team',
  '/intelligence/setup': 'Erste Schritte',
};

function IconBtn({
  onClick,
  title,
  active,
  c,
  children,
}: {
  onClick: () => void;
  title?: string;
  active?: boolean;
  c: ReturnType<typeof colors>;
  children: React.ReactNode;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        width: 34,
        height: 34,
        borderRadius: 8,
        background: active ? c.accent + '16' : c.bgPage,
        border: `1px solid ${active ? c.accent + '35' : c.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'background 100ms ease-out, transform 70ms ease-out',
        transform: pressed ? 'scale(0.93)' : 'scale(1)',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}

function greeting(firstName: string | undefined) {
  const h = new Date().getHours();
  const salut = h < 12 ? 'Guten Morgen' : h < 18 ? 'Guten Tag' : 'Guten Abend';
  return firstName ? `${salut}, ${firstName}` : salut;
}

function Topbar({ theme, toggleTheme, user }: { theme: Theme; toggleTheme: () => void; user: UserInfo | null }) {
  const c = colors(theme);
  const pathname = usePathname();
  const { open } = usePalette();
  const { toast } = useToast();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchPressed, setSearchPressed] = useState(false);

  const { notifications, unreadCount, deleteOne, markAllRead } = useNotifications({
    onNew: (n) => {
      toast(n.title, 'success');
    },
  });

  function timeAgoShort(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'gerade eben';
    if (m < 60) return `vor ${m} Min.`;
    const h = Math.floor(m / 60);
    if (h < 24) return `vor ${h} Std.`;
    const d = Math.floor(h / 24);
    return `vor ${d} Tag${d === 1 ? '' : 'en'}`;
  }

  useEffect(() => {
    if (notifOpen && unreadCount > 0) {
      void markAllRead();
    }
  }, [notifOpen, unreadCount, markAllRead]);

  const pageLabel =
    Object.entries(PAGE_LABELS).find(([key]) =>
      key === '/intelligence' ? pathname === key : pathname.startsWith(key)
    )?.[1] ?? 'Intelligence';

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  }

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || user.email.slice(0, 2).toUpperCase()
    : '?';
  const displayName = user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() : '';

  return (
    <header
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 84,
        background: 'transparent',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
        borderBottom: 'none',
        display: 'flex',
        alignItems: 'center',
        paddingInline: '28px 20px',
        gap: 12,
        zIndex: 20,
      }}
    >
      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Search — borderless, just icon + text */}
      <button
        onClick={open}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '0.7';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '1';
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          padding: '0 4px',
          height: 34,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: c.textMuted,
          fontSize: 13,
          fontFamily: 'inherit',
          transition: 'opacity 120ms ease-out',
        }}
      >
        <SearchNormal1 size={16} variant="Linear" color={c.textMuted} />
        <span>Suchen...</span>
        <kbd
          style={{
            marginLeft: 4,
            padding: '1px 5px',
            background: c.bgCard,
            border: `1px solid ${c.border}`,
            borderRadius: 5,
            fontSize: 10,
            color: c.textMuted,
            fontFamily: 'inherit',
          }}
        >
          ⌘K
        </kbd>
      </button>

      {/* Divider */}
      <div style={{ width: 1, height: 20, background: c.border }} />

      {/* Theme toggle — bare icon */}
      <button
        onClick={toggleTheme}
        title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 4,
          display: 'flex',
          alignItems: 'center',
          color: c.textMuted,
          transition: 'color 120ms ease-out',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.color = c.text;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.color = c.textMuted;
        }}
      >
        {theme === 'dark' ? (
          <Sun1 size={20} variant="Linear" color="currentColor" />
        ) : (
          <Moon size={20} variant="Linear" color="currentColor" />
        )}
      </button>

      {/* Notifications — bare icon */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setNotifOpen((o) => !o)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
            position: 'relative',
            color: c.textMuted,
            transition: 'color 120ms ease-out',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = c.text;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = c.textMuted;
          }}
        >
          <Notification size={20} variant="Linear" color="currentColor" />
          {unreadCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: 4,
                right: 4,
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: c.danger,
                border: `1.5px solid ${c.topbar}`,
              }}
            />
          )}
        </button>
        {notifOpen && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setNotifOpen(false)} />
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 42,
                width: 320,
                maxHeight: 480,
                background: c.bgCard,
                border: `1px solid ${c.border}`,
                borderRadius: 12,
                boxShadow: '0 8px 32px rgba(0,0,0,0.13)',
                zIndex: 50,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  padding: '11px 16px',
                  borderBottom: `1px solid ${c.border}`,
                  fontSize: 11,
                  fontWeight: 700,
                  color: c.textMuted,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  flexShrink: 0,
                }}
              >
                Benachrichtigungen
              </div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div
                    style={{
                      padding: '24px 16px',
                      fontSize: 12,
                      color: c.textMuted,
                      textAlign: 'center',
                    }}
                  >
                    Noch keine Benachrichtigungen
                  </div>
                ) : (
                  notifications.map((n) => {
                    const isUnread = !n.read_at;
                    return (
                      <div
                        key={n.id}
                        style={{
                          display: 'flex',
                          gap: 10,
                          padding: '11px 12px 11px 16px',
                          borderBottom: `1px solid ${c.border}`,
                          background: isUnread
                            ? c.accent === '#F1F5F9'
                              ? 'rgba(255,255,255,0.03)'
                              : 'rgba(0,0,0,0.025)'
                            : 'transparent',
                          alignItems: 'flex-start',
                        }}
                      >
                        <div
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: isUnread ? c.success : c.textMuted,
                            flexShrink: 0,
                            marginTop: 6,
                          }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: c.text,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {n.link ? (
                              <Link
                                href={n.link}
                                onClick={() => setNotifOpen(false)}
                                style={{ color: 'inherit', textDecoration: 'none' }}
                              >
                                {n.title}
                              </Link>
                            ) : (
                              n.title
                            )}
                          </div>
                          {n.body && (
                            <div
                              style={{
                                fontSize: 12,
                                color: c.textSub,
                                marginTop: 2,
                                lineHeight: 1.4,
                              }}
                            >
                              {n.body}
                            </div>
                          )}
                          <div style={{ fontSize: 11, color: c.textMuted, marginTop: 3 }}>
                            {timeAgoShort(n.created_at)}
                          </div>
                        </div>
                        <button
                          onClick={() => void deleteOne(n.id)}
                          title="Benachrichtigung löschen"
                          aria-label="Löschen"
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: c.textMuted,
                            padding: 4,
                            display: 'flex',
                            alignItems: 'center',
                            flexShrink: 0,
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.color = c.danger;
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.color = c.textMuted;
                          }}
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 16 16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          >
                            <path d="M4 4l8 8M12 4l-8 8" />
                          </svg>
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Profile — no box, text lights up on hover */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setProfileOpen((o) => !o)}
          onMouseEnter={(e) => {
            const name = e.currentTarget.querySelector<HTMLElement>('[data-name]');
            const role = e.currentTarget.querySelector<HTMLElement>('[data-role]');
            if (name) name.style.color = c.text;
            if (role) role.style.color = c.textSub;
          }}
          onMouseLeave={(e) => {
            const name = e.currentTarget.querySelector<HTMLElement>('[data-name]');
            const role = e.currentTarget.querySelector<HTMLElement>('[data-role]');
            if (name) name.style.color = c.textSub;
            if (role) role.style.color = c.textMuted;
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 11,
            padding: '4px 0',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: c.accent,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 800,
              color: '#fff',
              letterSpacing: '0.03em',
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div style={{ textAlign: 'left' }}>
            <div
              data-name=""
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: c.textSub,
                lineHeight: 1.3,
                whiteSpace: 'nowrap',
                transition: 'color 120ms ease-out',
              }}
            >
              {displayName || '—'}
            </div>
            <div
              data-role=""
              style={{ fontSize: 11, color: c.textMuted, lineHeight: 1.3, transition: 'color 120ms ease-out' }}
            >
              {user?.role === 'owner' ? 'Inhaber' : (user?.role ?? '')}
            </div>
          </div>
        </button>
        {profileOpen && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setProfileOpen(false)} />
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 42,
                width: 192,
                background: c.bgCard,
                border: `1px solid ${c.border}`,
                borderRadius: 12,
                boxShadow: '0 8px 32px rgba(0,0,0,0.13)',
                zIndex: 50,
                overflow: 'hidden',
                padding: 6,
              }}
            >
              <Link
                href="/intelligence/team"
                onClick={() => setProfileOpen(false)}
                style={{
                  display: 'block',
                  padding: '8px 10px',
                  borderRadius: 7,
                  fontSize: 13,
                  fontWeight: 500,
                  color: c.textSub,
                  textDecoration: 'none',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = c.bgHover)}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                Team verwalten
              </Link>
              <div style={{ height: 1, background: c.border, margin: '4px 0' }} />
              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 7,
                  fontSize: 13,
                  fontWeight: 500,
                  color: c.danger,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = c.danger + '12')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <Logout size={15} variant="Linear" color={c.danger} />
                Abmelden
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}

// ─── User ─────────────────────────────────────────────────────────────────────

function useCurrentUser() {
  const [user, setUser] = useState<UserInfo | null>(null);
  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then(async (d) => {
        if (d.user) setUser(d.user);
        else {
          await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
          window.location.href = '/login';
        }
      })
      .catch(() => {});
  }, []);
  return user;
}

// ─── Inner layout ─────────────────────────────────────────────────────────────

function InnerLayout({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const { allDone } = useOnboarding();
  const user = useCurrentUser();
  const c = colors(theme);

  useEffect(() => {
    const saved = localStorage.getItem('vero-theme') as Theme | null;
    if (saved === 'dark' || saved === 'light') setTheme(saved);
  }, []);

  function toggleTheme() {
    setTheme((t) => {
      const next = t === 'light' ? 'dark' : 'light';
      localStorage.setItem('vero-theme', next);
      return next;
    });
  }

  return (
    <UserCtx.Provider value={user}>
      <ThemeCtx.Provider value={{ theme, toggle: toggleTheme }}>
        <div
          style={{
            display: 'flex',
            height: '100vh',
            fontFamily: 'var(--font-inter), sans-serif',
            overflow: 'hidden',
            position: 'relative',
            background:
              theme === 'dark'
                ? '#080a12'
                : `
                radial-gradient(ellipse 85% 65% at 8% 8%, rgba(175,109,255,0.38), transparent 60%),
                radial-gradient(ellipse 75% 60% at 78% 32%, rgba(255,235,170,0.50), transparent 62%),
                radial-gradient(ellipse 70% 60% at 14% 82%, rgba(255,100,180,0.35), transparent 62%),
                radial-gradient(ellipse 70% 60% at 92% 92%, rgba(120,190,255,0.40), transparent 62%),
                linear-gradient(180deg, #f7eaff 0%, #fde2ea 100%)
              `,
          }}
        >
          {/* Dark mode — animated aurora blobs */}
          {theme === 'dark' && (
            <>
              <motion.div
                style={{
                  position: 'absolute',
                  top: '-25%',
                  left: '-25%',
                  width: '60%',
                  height: '60%',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(88,28,135,0.55) 0%, transparent 70%)',
                  filter: 'blur(60px)',
                  zIndex: 0,
                  pointerEvents: 'none',
                }}
                animate={{ x: [-40, 40, -40], y: [-20, 20, -20], scale: [1, 1.2, 1] }}
                transition={{ duration: 28, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
              />
              <motion.div
                style={{
                  position: 'absolute',
                  bottom: '-25%',
                  right: '-25%',
                  width: '60%',
                  height: '60%',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(124,58,237,0.50) 0%, transparent 70%)',
                  filter: 'blur(80px)',
                  zIndex: 0,
                  pointerEvents: 'none',
                }}
                animate={{ x: [40, -40, 40], y: [20, -20, 20], scale: [1, 1.3, 1] }}
                transition={{ duration: 36, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
              />
              <motion.div
                style={{
                  position: 'absolute',
                  top: '35%',
                  left: '35%',
                  width: '40%',
                  height: '40%',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(79,70,229,0.40) 0%, transparent 70%)',
                  filter: 'blur(60px)',
                  zIndex: 0,
                  pointerEvents: 'none',
                }}
                animate={{ x: [20, -20, 20], y: [-30, 30, -30] }}
                transition={{ duration: 44, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
              />
            </>
          )}
          <Sidebar theme={theme} />
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              minWidth: 0,
              position: 'relative',
              zIndex: 1,
            }}
          >
            <Topbar theme={theme} toggleTheme={toggleTheme} user={user} />
            <main style={{ flex: 1, overflowY: 'auto', background: 'transparent', height: '100%' }}>{children}</main>
          </div>
        </div>
      </ThemeCtx.Provider>
    </UserCtx.Provider>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default function IntelligenceLayout({ children }: { children: React.ReactNode }) {
  return (
    <OnboardingProvider>
      <ToastProvider>
        <CommandPaletteProvider>
          <InnerLayout>{children}</InnerLayout>
        </CommandPaletteProvider>
      </ToastProvider>
    </OnboardingProvider>
  );
}
