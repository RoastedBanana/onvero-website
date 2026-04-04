'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Home,
  Globe,
  GitBranch,
  Calendar,
  Headphones,
  Users,
  BarChart2,
  Sparkles,
  Zap,
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

const NAV_ITEMS = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/dashboard/website', icon: Globe, label: 'Website' },
  { href: '/dashboard/workflows', icon: GitBranch, label: 'Workflows' },
  { href: '/dashboard/meetings', icon: Calendar, label: 'Meetings' },
  { href: '/dashboard/support', icon: Headphones, label: 'Support' },
  { href: '/dashboard/leads', icon: Users, label: 'Leads' },
  { href: '/dashboard/generate', icon: Zap, label: 'Generate' },
  { href: '/dashboard/analytics', icon: BarChart2, label: 'Analytics' },
  { href: '/dashboard/business-ai', icon: Sparkles, label: 'Business AI' },
];

const NAV_BOTTOM = [
  { href: '/dashboard/docs', icon: BookOpen, label: 'Dokumentation' },
  { href: '/dashboard/settings', icon: Settings, label: 'Einstellungen' },
];

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

  return (
    <aside
      style={{
        width: 180,
        flexShrink: 0,
        height: '100vh',
        position: 'sticky',
        top: 0,
        background: '#0a0a0a',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: 'var(--font-dm-sans)',
      }}
    >
      {/* ── Logo ── */}
      <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: '#ffffff',
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 15, fontWeight: 600, color: '#fff', letterSpacing: '-0.02em' }}>Onvero.</span>
        </div>
        <div
          style={{
            fontSize: 9,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'rgba(255,255,255,0.25)',
            marginTop: 4,
            marginLeft: 13,
          }}
        >
          BusinessOS
        </div>
      </div>

      {/* ── Search ── */}
      <div style={{ margin: '10px 10px 6px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: '#181818',
            border: `1px solid ${searchHover ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.07)'}`,
            borderRadius: 8,
            padding: '6px 10px',
            transition: 'border-color 0.15s',
          }}
          onMouseEnter={() => setSearchHover(true)}
          onMouseLeave={() => setSearchHover(false)}
        >
          <Search size={12} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Suchen..."
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              color: 'rgba(255,255,255,0.6)',
              fontSize: 11,
              padding: 0,
              fontFamily: 'var(--font-dm-sans)',
            }}
          />
          <span
            style={{
              fontSize: 9,
              color: 'rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.06)',
              borderRadius: 3,
              padding: '1px 5px',
              fontFamily: 'var(--font-dm-mono)',
              flexShrink: 0,
            }}
          >
            ⌘K
          </span>
        </div>
      </div>

      {/* ── Nav Items ── */}
      <nav style={{ flex: 1, padding: '4px 8px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '7px 10px',
                borderRadius: 7,
                background: active ? 'rgba(255,255,255,0.06)' : 'transparent',
                color: active ? '#ffffff' : 'rgba(255,255,255,0.45)',
                fontSize: 13,
                fontWeight: active ? 500 : 400,
                textDecoration: 'none',
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.75)';
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.45)';
                }
              }}
            >
              {active && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 2,
                    height: 16,
                    background: '#fff',
                    borderRadius: '0 2px 2px 0',
                  }}
                />
              )}
              <Icon size={14} strokeWidth={1.8} style={{ flexShrink: 0 }} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* ── Bottom Section ── */}
      <div
        style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: '8px 8px 6px',
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
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
                gap: 8,
                padding: '6px 10px',
                borderRadius: 7,
                background: active ? 'rgba(255,255,255,0.06)' : 'transparent',
                color: active ? '#fff' : 'rgba(255,255,255,0.4)',
                fontSize: 12,
                textDecoration: 'none',
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.75)';
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.4)';
                }
              }}
            >
              <Icon size={13} strokeWidth={1.8} style={{ flexShrink: 0 }} />
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
            padding: '5px 10px',
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
            padding: '8px 10px',
            marginTop: 2,
            borderRadius: 8,
            background: 'rgba(255,255,255,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <div
              style={{
                width: 26,
                height: 26,
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
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
          >
            →
          </button>
        </div>
      </div>
    </aside>
  );
}
