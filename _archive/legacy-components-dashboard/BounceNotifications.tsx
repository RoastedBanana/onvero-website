'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';

interface Bounce {
  id: string;
  email_to: string;
  subject: string;
  bounce_type: string;
  reason: string;
  created_at: string;
}

export default function BounceNotifications() {
  const [bounces, setBounces] = useState<Bounce[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    const supabase = createClient();

    // Load unseen bounces
    supabase
      .from('email_bounces')
      .select('*')
      .eq('seen', false)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (data) setBounces(data);
      });

    // Subscribe to new bounces in real-time
    const channel = supabase
      .channel('email_bounces')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'email_bounces' },
        (payload) => {
          setBounces((prev) => [payload.new as Bounce, ...prev].slice(0, 10));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function dismiss(id: string) {
    setDismissed((prev) => new Set(prev).add(id));
    const supabase = createClient();
    await supabase.from('email_bounces').update({ seen: true }).eq('id', id);
    setTimeout(() => {
      setBounces((prev) => prev.filter((b) => b.id !== id));
    }, 300);
  }

  const visible = bounces.filter((b) => !dismissed.has(b.id));
  if (visible.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 16,
        right: 16,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        maxWidth: 380,
      }}
    >
      {visible.map((b) => (
        <div
          key={b.id}
          style={{
            background: 'rgba(220, 38, 38, 0.12)',
            border: '1px solid rgba(220, 38, 38, 0.3)',
            borderRadius: 10,
            padding: '12px 14px',
            backdropFilter: 'blur(12px)',
            animation: 'bounceIn 0.3s ease-out',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#f87171', marginBottom: 4 }}>
                ⚠ E-Mail Bounce
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', marginBottom: 2 }}>
                <strong>{b.email_to}</strong>
              </div>
              {b.subject && (
                <div
                  style={{
                    fontSize: 10,
                    color: 'rgba(255,255,255,0.5)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Betreff: {b.subject}
                </div>
              )}
              <div
                style={{
                  fontSize: 10,
                  color: 'rgba(255,255,255,0.4)',
                  marginTop: 4,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {b.reason}
              </div>
            </div>
            <button
              onClick={() => dismiss(b.id)}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.4)',
                cursor: 'pointer',
                fontSize: 14,
                padding: 2,
                lineHeight: 1,
                flexShrink: 0,
              }}
            >
              ✕
            </button>
          </div>
        </div>
      ))}
      <style>{`
        @keyframes bounceIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
