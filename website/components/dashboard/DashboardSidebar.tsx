'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Home,
  Globe,
  Calendar,
  Users,
  BarChart2,
  Activity,
  Sparkles,
  Zap,
  Plug,
  BookOpen,
  Settings,
  Search,
  LogOut,
  AlertCircle,
} from 'lucide-react';

interface UserInfo {
  firstName: string;
  lastName: string;
  email: string;
}

interface NavItem {
  href: string;
  icon: typeof Home;
  label: string;
  children?: NavItem[];
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/dashboard/website', icon: Globe, label: 'Website' },
  { href: '/dashboard/meetings', icon: Calendar, label: 'Meetings' },
  {
    href: '/dashboard/leads',
    icon: Users,
    label: 'Leads',
    children: [{ href: '/dashboard/generate', icon: Zap, label: 'Generate' }],
  },
  { href: '/dashboard/analytics', icon: BarChart2, label: 'Analytics' },
  { href: '/dashboard/business-ai', icon: Sparkles, label: 'Business AI' },
  { href: '/dashboard/integrations', icon: Plug, label: 'Integrationen' },
];

const NAV_BOTTOM = [
  { href: '/dashboard/docs', icon: BookOpen, label: 'Dokumentation' },
  { href: '/dashboard/settings', icon: Settings, label: 'Einstellungen' },
];

const TRANSITION = 'all 0.3s cubic-bezier(0.32,0.72,0,1)';

export default function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [search, setSearch] = useState('');
  const [searchHover, setSearchHover] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => setUser(d.user ?? null))
      .catch(() => {});
  }, []);

  const isActive = (href: string) => (href === '/dashboard' ? pathname === href : pathname.startsWith(href));

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/');
  };

  const initials = user ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() : '?';

  const gradientSeparator: React.CSSProperties = {
    height: 1,
    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%)',
  };

  return (
    <aside
      style={{
        width: 220,
        flexShrink: 0,
        height: '100vh',
        position: 'sticky',
        top: 0,
        background: 'rgba(255,255,255,0.02)',
        borderRight: '1px solid rgba(255,255,255,0.04)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: 'var(--font-dm-sans)',
      }}
    >
      {/* Subtle noise/gradient overlay at top */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 120,
          background: 'linear-gradient(180deg, rgba(107,122,255,0.03) 0%, transparent 100%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* ── Logo ── */}
      <div style={{ padding: '22px 18px 16px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: '#6B7AFF',
                flexShrink: 0,
                boxShadow: '0 0 6px rgba(107,122,255,0.4)',
              }}
            />
            <span style={{ fontSize: 17, fontWeight: 700, color: '#fff', letterSpacing: '-0.03em' }}>Onvero.</span>
          </div>
        </div>
        <div
          style={{
            fontSize: 9,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'rgba(255,255,255,0.25)',
            marginTop: 4,
            marginLeft: 14,
          }}
        >
          BusinessOS
        </div>
        <div style={{ ...gradientSeparator, marginTop: 14 }} />
      </div>

      {/* ── Search ── */}
      <div style={{ margin: '6px 12px 8px', position: 'relative', zIndex: 1 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(255,255,255,0.03)',
            border: `1px solid ${searchHover ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.05)'}`,
            borderRadius: 14,
            padding: '7px 12px',
            transition: TRANSITION,
          }}
          onMouseEnter={() => setSearchHover(true)}
          onMouseLeave={() => setSearchHover(false)}
        >
          <Search size={13} style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Suchen..."
            readOnly
            onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
            onFocus={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              color: 'rgba(255,255,255,0.5)',
              fontSize: 12,
              padding: 0,
              fontFamily: 'var(--font-dm-sans)',
              cursor: 'pointer',
            }}
          />
          <span
            style={{
              fontSize: 9,
              color: 'rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.06)',
              borderRadius: 4,
              padding: '2px 6px',
              fontFamily: 'var(--font-dm-mono)',
              flexShrink: 0,
            }}
          >
            K
          </span>
        </div>
      </div>

      {/* ── Nav Items ── */}
      <nav
        style={{
          flex: 1,
          padding: '6px 10px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          const childActive = item.children?.some((c) => isActive(c.href)) ?? false;
          const showChildren = active || childActive;
          return (
            <div key={item.href}>
              <Link
                href={item.href}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 12px',
                  borderRadius: 10,
                  background: active ? 'rgba(107,122,255,0.08)' : 'transparent',
                  color: active ? '#ffffff' : 'rgba(255,255,255,0.4)',
                  fontSize: 13,
                  fontWeight: active ? 500 : 400,
                  textDecoration: 'none',
                  transition: TRANSITION,
                  borderLeft: active ? '2px solid #6B7AFF' : '2px solid transparent',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.4)';
                  }
                }}
              >
                <Icon size={15} strokeWidth={1.5} style={{ flexShrink: 0 }} />
                {item.label}
              </Link>
              {showChildren &&
                item.children?.map((child) => {
                  const ChildIcon = child.icon;
                  const childIsActive = isActive(child.href);
                  return (
                    <div
                      key={child.href}
                      style={{
                        marginLeft: 18,
                        borderLeft: '1px solid rgba(255,255,255,0.04)',
                        paddingLeft: 0,
                      }}
                    >
                      <Link
                        href={child.href}
                        style={{
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '7px 12px 7px 12px',
                          marginTop: 2,
                          borderRadius: 10,
                          background: childIsActive ? 'rgba(107,122,255,0.08)' : 'transparent',
                          color: childIsActive ? '#ffffff' : 'rgba(255,255,255,0.4)',
                          fontSize: 12,
                          fontWeight: childIsActive ? 500 : 400,
                          textDecoration: 'none',
                          transition: TRANSITION,
                        }}
                        onMouseEnter={(e) => {
                          if (!childIsActive) {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                            e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!childIsActive) {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = 'rgba(255,255,255,0.4)';
                          }
                        }}
                      >
                        <ChildIcon size={13} strokeWidth={1.5} style={{ flexShrink: 0 }} />
                        {child.label}
                      </Link>
                    </div>
                  );
                })}
            </div>
          );
        })}
      </nav>

      {/* ── Bottom Section ── */}
      <div
        style={{
          padding: '0 10px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ ...gradientSeparator, marginBottom: 8 }} />

        {NAV_BOTTOM.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 12px',
                borderRadius: 10,
                background: active ? 'rgba(107,122,255,0.08)' : 'transparent',
                color: active ? '#fff' : 'rgba(255,255,255,0.4)',
                fontSize: 12,
                fontWeight: active ? 500 : 400,
                textDecoration: 'none',
                transition: TRANSITION,
                borderLeft: active ? '2px solid #6B7AFF' : '2px solid transparent',
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.4)';
                }
              }}
            >
              <Icon size={15} strokeWidth={1.5} style={{ flexShrink: 0 }} />
              {item.label}
            </Link>
          );
        })}

        {/* Issues badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            fontSize: 11,
            color: 'rgba(255,255,255,0.35)',
          }}
        >
          <AlertCircle size={12} style={{ color: 'rgba(255,92,46,0.7)' }} />
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: '#FF5C2E',
                display: 'inline-block',
              }}
            />
            3 Issues
          </span>
        </div>

        {/* User */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 12px',
            marginTop: 4,
            borderRadius: 10,
            background: 'rgba(255,255,255,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'rgba(107,122,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontSize: 10,
                fontWeight: 600,
                color: '#6B7AFF',
                fontFamily: 'var(--font-dm-mono)',
              }}
            >
              {initials}
            </div>
            <span
              style={{
                fontSize: 12,
                color: 'rgba(255,255,255,0.6)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user ? `${user.firstName} ${user.lastName}` : '...'}
            </span>
          </div>
          <button
            onClick={handleLogout}
            title="Abmelden"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.3)',
              fontSize: 12,
              padding: 2,
              display: 'flex',
              flexShrink: 0,
              transition: TRANSITION,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
          >
            <LogOut size={14} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </aside>
  );
}
