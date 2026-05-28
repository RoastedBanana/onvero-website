'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  payload: Record<string, unknown>;
  link: string | null;
  read_at: string | null;
  expires_at: string;
  created_at: string;
}

const POLL_INTERVAL_MS = 10_000;

export function useNotifications(opts?: {
  onNew?: (notification: AppNotification) => void;
}) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const seenIds = useRef<Set<string>>(new Set());
  const initialized = useRef(false);
  const onNewRef = useRef(opts?.onNew);
  onNewRef.current = opts?.onNew;

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications', { cache: 'no-store' });
      if (!res.ok) return;
      const json = (await res.json()) as { notifications?: AppNotification[] };
      const list = Array.isArray(json.notifications) ? json.notifications : [];

      if (!initialized.current) {
        // First load: prime seen-set, don't toast for existing ones.
        list.forEach((n) => seenIds.current.add(n.id));
        initialized.current = true;
      } else {
        // Toast and broadcast for anything new since last poll.
        const handler = onNewRef.current;
        list
          .filter((n) => !seenIds.current.has(n.id))
          .forEach((n) => {
            seenIds.current.add(n.id);
            if (handler) handler(n);
            if (typeof window !== 'undefined') {
              window.dispatchEvent(
                new CustomEvent('onvero:notification-arrived', { detail: n }),
              );
            }
          });
      }

      setNotifications(list);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = window.setInterval(refresh, POLL_INTERVAL_MS);
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('focus', onFocus);
    };
  }, [refresh]);

  const deleteOne = useCallback(async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
    } catch {
      // optimistic; ignore failure
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) =>
      prev.map((n) => (n.read_at ? n : { ...n, read_at: new Date().toISOString() })),
    );
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_all_read' }),
      });
    } catch {
      // ignore
    }
  }, []);

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  return { notifications, unreadCount, loading, deleteOne, markAllRead, refresh };
}
