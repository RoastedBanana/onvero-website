'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  description: string;
  dotColor: string;
  timestamp: string;
  read: boolean;
  href?: string;
}

function formatRelativeTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  const hrs = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  if (mins < 1) return 'gerade eben';
  if (mins < 60) return `vor ${mins} Min.`;
  if (hrs < 24) return `vor ${hrs} Std.`;
  if (days === 1) return 'gestern';
  if (days < 7) return `vor ${days} Tagen`;
  return new Date(dateStr).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
}

const READ_KEY = 'onvero_notifications_read';

function getReadIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    return new Set(JSON.parse(localStorage.getItem(READ_KEY) ?? '[]'));
  } catch {
    return new Set();
  }
}

function saveReadIds(ids: Set<string>) {
  localStorage.setItem(READ_KEY, JSON.stringify([...ids]));
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    setReadIds(getReadIds());

    fetch('/api/leads')
      .then((r) => r.json())
      .then((data) => {
        const leads = (data.leads ?? []) as {
          id: string;
          company_name: string;
          score: number | null;
          status: string;
          created_at: string;
          source: string;
        }[];
        if (leads.length === 0) return;

        const sorted = [...leads].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        const items: Notification[] = [];
        const savedRead = getReadIds();

        // Recent scored leads (last 5)
        const recentScored = sorted.filter((l) => l.score !== null).slice(0, 5);
        for (const lead of recentScored) {
          const score = lead.score ?? 0;
          const tier = score >= 70 ? 'HOT' : score >= 45 ? 'WARM' : 'COLD';
          const color = score >= 70 ? '#FF5C2E' : score >= 45 ? '#F59E0B' : '#6B7AFF';
          items.push({
            id: `score-${lead.id}`,
            title: `${lead.company_name} — ${tier}`,
            description: `Score ${score} · ${tier === 'HOT' ? 'Sofort kontaktieren' : tier === 'WARM' ? 'Nachfassen empfohlen' : 'Beobachten'}`,
            dotColor: color,
            timestamp: lead.created_at,
            read: savedRead.has(`score-${lead.id}`),
            href: `/dashboard/leads/${lead.id}`,
          });
        }

        // New leads without score yet
        const unscored = sorted.filter((l) => l.score === null).slice(0, 2);
        for (const lead of unscored) {
          items.push({
            id: `new-${lead.id}`,
            title: `${lead.company_name} importiert`,
            description: 'Wird gerade von der KI analysiert...',
            dotColor: 'rgba(255,255,255,0.3)',
            timestamp: lead.created_at,
            read: savedRead.has(`new-${lead.id}`),
            href: `/dashboard/leads/${lead.id}`,
          });
        }

        // Google Maps leads
        const mapsLeads = sorted.filter((l) => l.source === 'google_maps_apify').length;
        if (mapsLeads > 0) {
          items.push({
            id: 'maps-summary',
            title: `${mapsLeads} Google Maps Leads`,
            description: 'Über Google Maps Scraper importiert',
            dotColor: '#1D9E75',
            timestamp: sorted.find((l) => l.source === 'google_maps_apify')?.created_at ?? sorted[0].created_at,
            read: savedRead.has('maps-summary'),
            href: '/dashboard/leads',
          });
        }

        // Summary
        const total = leads.length;
        const hot = leads.filter((l) => (l.score ?? 0) >= 70).length;
        if (total > 0) {
          items.push({
            id: 'summary',
            title: `${total} Leads insgesamt`,
            description: `${hot} HOT · Ø Score ${Math.round(leads.reduce((s, l) => s + (l.score ?? 0), 0) / total)}`,
            dotColor: '#6B7AFF',
            timestamp: sorted[0].created_at,
            read: savedRead.has('summary'),
            href: '/dashboard/analytics',
          });
        }

        setNotifications(items);
      })
      .catch(() => {});
  }, []);

  // Click outside to close
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const hasUnread = notifications.some((n) => !n.read);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    const allIds = new Set(notifications.map((n) => n.id));
    setReadIds(allIds);
    saveReadIds(allIds);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClick = (notif: Notification) => {
    // Mark as read
    const next = new Set(readIds);
    next.add(notif.id);
    setReadIds(next);
    saveReadIds(next);
    setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)));

    // Navigate
    if (notif.href) {
      setOpen(false);
      router.push(notif.href);
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', zIndex: 50 }}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        style={{
          position: 'relative',
          background: open ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 6,
          cursor: 'pointer',
          padding: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.15s',
          width: 28,
          height: 28,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
        onMouseLeave={(e) =>
          (e.currentTarget.style.background = open ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)')
        }
        title="Benachrichtigungen"
      >
        <Bell size={14} style={{ color: 'rgba(255,255,255,0.5)' }} />
        {hasUnread && (
          <span
            style={{
              position: 'absolute',
              top: 1,
              right: 1,
              minWidth: 14,
              height: 14,
              borderRadius: 7,
              background: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 8,
              fontWeight: 700,
              color: '#fff',
              padding: '0 3px',
              fontFamily: 'var(--font-dm-mono)',
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 8,
            width: 360,
            maxHeight: 440,
            overflowY: 'auto',
            background: '#111',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            zIndex: 100,
            fontFamily: 'var(--font-dm-sans)',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px 10px',
            }}
          >
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
              Benachrichtigungen
              {unreadCount > 0 && (
                <span style={{ marginLeft: 6, fontSize: 10, color: 'rgba(255,255,255,0.25)', fontWeight: 400 }}>
                  {unreadCount} neu
                </span>
              )}
            </span>
            {hasUnread && (
              <button
                onClick={markAllRead}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.3)',
                  padding: 0,
                  fontFamily: 'inherit',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
              >
                Alle gelesen
              </button>
            )}
          </div>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

          {notifications.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>
              Keine Benachrichtigungen
            </div>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                style={{
                  display: 'flex',
                  gap: 10,
                  padding: '10px 16px',
                  width: '100%',
                  background: n.read ? 'transparent' : 'rgba(255,255,255,0.02)',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  cursor: n.href ? 'pointer' : 'default',
                  transition: 'background 0.15s',
                  border: 'none',
                  textAlign: 'left',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(255,255,255,0.02)')
                }
              >
                <div style={{ paddingTop: 4, flexShrink: 0 }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: n.dotColor,
                      opacity: n.read ? 0.3 : 1,
                    }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 12,
                      color: n.read ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.75)',
                      fontWeight: n.read ? 400 : 500,
                      lineHeight: 1.3,
                    }}
                  >
                    {n.title}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: 'rgba(255,255,255,0.3)',
                      marginTop: 2,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {n.description}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: 'rgba(255,255,255,0.15)',
                      marginTop: 3,
                      fontFamily: 'var(--font-dm-mono)',
                    }}
                  >
                    {formatRelativeTime(n.timestamp)}
                  </div>
                </div>
                {n.href && (
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.1)', alignSelf: 'center', flexShrink: 0 }}>
                    →
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
