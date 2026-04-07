'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell } from 'lucide-react';

interface Notification {
  id: string;
  type: 'lead' | 'system' | 'campaign';
  title: string;
  description: string;
  dotColor: string;
  timestamp: string;
  read: boolean;
}

interface Lead {
  id: string;
  company_name: string;
  score: number | null;
  created_at: string;
}

function getTier(score: number | null): 'HOT' | 'WARM' | 'COLD' {
  if (score !== null && score >= 70) return 'HOT';
  if (score !== null && score >= 40) return 'WARM';
  return 'COLD';
}

function getTierColor(tier: 'HOT' | 'WARM' | 'COLD'): string {
  if (tier === 'HOT') return '#22c55e';
  if (tier === 'WARM') return '#f59e0b';
  return '#3b82f6';
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'gerade eben';
  if (diffMin < 60) return `vor ${diffMin} Minute${diffMin === 1 ? '' : 'n'}`;
  if (diffHrs < 24) return `vor ${diffHrs} Stunde${diffHrs === 1 ? '' : 'n'}`;
  if (diffDays === 1) return 'gestern';
  if (diffDays < 7) return `vor ${diffDays} Tagen`;
  return `vor ${Math.floor(diffDays / 7)} Woche${Math.floor(diffDays / 7) === 1 ? '' : 'n'}`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch leads and generate notifications
  useEffect(() => {
    fetch('/api/leads?limit=5')
      .then((r) => r.json())
      .then((data) => {
        const leads: Lead[] = (data.leads ?? [])
          .sort((a: Lead, b: Lead) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5);

        if (leads.length === 0) return;

        const items: Notification[] = [];

        // Create lead notifications from the most recent leads (up to 3)
        const leadSlice = leads.slice(0, 3);
        for (const lead of leadSlice) {
          const tier = getTier(lead.score);
          items.push({
            id: `lead-${lead.id}`,
            type: 'lead',
            title: 'Neuer Lead gescored',
            description: `${lead.company_name || 'Unbekannt'} hat Score ${lead.score ?? '–'} erhalten`,
            dotColor: getTierColor(tier),
            timestamp: lead.created_at,
            read: false,
          });
        }

        // System notification — scoring summary
        const scoredCount = leads.filter((l) => l.score !== null).length;
        if (scoredCount > 0) {
          items.push({
            id: 'system-scoring',
            type: 'system',
            title: 'Scoring abgeschlossen',
            description: `${scoredCount} Leads wurden bewertet`,
            dotColor: '#3b82f6',
            timestamp: leads[0].created_at,
            read: false,
          });
        }

        // Campaign notification
        items.push({
          id: 'campaign-1',
          type: 'campaign',
          title: 'Kampagne abgeschlossen',
          description: `${leads.length} neue Kontakte gefunden`,
          dotColor: '#f59e0b',
          timestamp: leads[leads.length - 1].created_at,
          read: false,
        });

        setNotifications(items);
      })
      .catch(() => {});
  }, []);

  // Click outside to close
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const hasUnread = notifications.some((n) => !n.read);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'relative', zIndex: 50 }}>
      {/* Bell Button */}
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
              top: 2,
              right: 2,
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#ef4444',
            }}
          />
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: 'fixed',
            top: 48,
            left: 210,
            width: 340,
            maxHeight: 400,
            overflowY: 'auto',
            background: '#111',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            zIndex: 100,
            fontFamily: 'var(--font-dm-sans)',
            marginTop: 4,
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px 10px',
            }}
          >
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Benachrichtigungen</span>
            <button
              onClick={markAllRead}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 11,
                color: 'rgba(255,255,255,0.3)',
                padding: 0,
                fontFamily: 'var(--font-dm-sans)',
                transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
            >
              Alle lesen
            </button>
          </div>

          {/* Separator */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

          {/* Notification Items */}
          {notifications.length === 0 ? (
            <div
              style={{
                padding: '24px 14px',
                textAlign: 'center',
                fontSize: 12,
                color: 'rgba(255,255,255,0.25)',
              }}
            >
              Keine Benachrichtigungen
            </div>
          ) : (
            notifications.map((n) => <NotificationItem key={n.id} notification={n} />)
          )}
        </div>
      )}
    </div>
  );
}

function NotificationItem({ notification }: { notification: Notification }) {
  const [hover, setHover] = useState(false);

  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        padding: '10px 14px',
        background: hover ? 'rgba(255,255,255,0.04)' : notification.read ? 'transparent' : 'rgba(255,255,255,0.03)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        cursor: 'default',
        transition: 'background 0.15s',
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Dot */}
      <div style={{ paddingTop: 4, flexShrink: 0 }}>
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: notification.dotColor,
          }}
        />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 500, lineHeight: 1.3 }}>
          {notification.title}
        </div>
        <div
          style={{
            fontSize: 11,
            color: 'rgba(255,255,255,0.35)',
            lineHeight: 1.4,
            marginTop: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {notification.description}
        </div>
        <div
          style={{
            fontSize: 10,
            color: 'rgba(255,255,255,0.2)',
            marginTop: 3,
            fontFamily: 'var(--font-dm-mono)',
          }}
        >
          {formatRelativeTime(notification.timestamp)}
        </div>
      </div>
    </div>
  );
}
