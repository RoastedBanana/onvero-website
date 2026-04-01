'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase';

const TENANT_ID = 'df763f85-c687-42d6-be66-a2b353b89c90';

interface RunState {
  startedAt: string;
  leadsTarget: number;
  baselineCount?: number;
}

interface Toast {
  visible: boolean;
  newLeads: number;
  hot: number;
  warm: number;
  cold: number;
}

export function GeneratorStatusBanner({ currentLeadCount }: { currentLeadCount: number }) {
  const [runState, setRunState] = useState<RunState | null>(null);
  const [newLeads, setNewLeads] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [toast, setToast] = useState<Toast | null>(null);
  const toastShownRef = useRef(false);

  const baseCount = runState?.baselineCount ?? currentLeadCount;

  // Read localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('vero_generator_running');
    if (stored) {
      try {
        setRunState(JSON.parse(stored));
      } catch {
        localStorage.removeItem('vero_generator_running');
      }
    }
  }, []);

  // Poll localStorage for same-tab changes from modal
  useEffect(() => {
    const check = () => {
      const stored = localStorage.getItem('vero_generator_running');
      if (stored && !runState) {
        try {
          setRunState(JSON.parse(stored));
          toastShownRef.current = false;
        } catch {
          /* ignore */
        }
      } else if (!stored && runState) {
        setRunState(null);
        setNewLeads(0);
      }
    };
    const t = setInterval(check, 1000);
    window.addEventListener('storage', check);
    return () => {
      clearInterval(t);
      window.removeEventListener('storage', check);
    };
  }, [runState]);

  // Elapsed timer
  useEffect(() => {
    if (!runState) {
      setElapsed(0);
      return;
    }
    const t = setInterval(() => {
      setElapsed(Math.floor((Date.now() - new Date(runState.startedAt).getTime()) / 1000));
    }, 1000);
    return () => clearInterval(t);
  }, [runState]);

  // Show completion toast
  async function showCompletionToast(foundCount: number) {
    if (toastShownRef.current || !runState) return;
    toastShownRef.current = true;

    const supabase = createClient();
    const { data } = await supabase
      .from('leads')
      .select('score')
      .eq('tenant_id', TENANT_ID)
      .gte('created_at', runState.startedAt);

    const scores = data ?? [];
    const hot = scores.filter((l) => (l.score ?? 0) >= 75).length;
    const warm = scores.filter((l) => (l.score ?? 0) >= 45 && (l.score ?? 0) < 75).length;
    const cold = scores.filter((l) => (l.score ?? 0) < 45).length;

    setToast({ visible: true, newLeads: foundCount, hot, warm, cold });
    localStorage.removeItem('vero_generator_running');
    setRunState(null);
    window.dispatchEvent(new CustomEvent('vero:new-leads'));

    setTimeout(() => setToast(null), 8000);
  }

  // Supabase polling every 15s
  useEffect(() => {
    if (!runState) return;
    const supabase = createClient();

    const poll = async () => {
      const { count } = await supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', TENANT_ID);
      if (count !== null) {
        const found = Math.max(0, count - baseCount);
        if (found > newLeads) {
          window.dispatchEvent(new CustomEvent('vero:new-leads'));
        }
        setNewLeads(found);

        // Completion: target reached or 15min timeout with some leads
        if (found >= runState.leadsTarget && !toastShownRef.current) {
          showCompletionToast(found);
        }
      }
    };

    poll();
    const t = setInterval(poll, 15000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runState, baseCount]);

  // 15min timeout
  useEffect(() => {
    if (!runState || toastShownRef.current) return;
    if (elapsed > 900 && newLeads > 0) {
      showCompletionToast(newLeads);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed, newLeads, runState]);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  const pct =
    runState && runState.leadsTarget > 0 ? Math.min(100, Math.round((newLeads / runState.leadsTarget) * 100)) : 0;

  return (
    <>
      <style>{`
        @keyframes vero-pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes vero-progress{0%{background-position:0% 50%}100%{background-position:200% 50%}}
        @keyframes vero-slideIn{from{transform:translateX(320px);opacity:0}to{transform:translateX(0);opacity:1}}
        @keyframes vero-shrink{from{width:100%}to{width:0%}}
      `}</style>

      {/* ── Banner ── */}
      {runState && (
        <div
          style={{
            marginBottom: 12,
            background: 'rgba(107,122,255,0.06)',
            border: '1px solid rgba(107,122,255,0.2)',
            borderRadius: 10,
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#6B7AFF',
              animation: 'vero-pulse 1.5s ease-in-out infinite',
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{ fontSize: 12, fontWeight: 500, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <span>⚡ Lead Generator läuft</span>
              {newLeads > 0 && (
                <span
                  style={{
                    background: 'rgba(34,197,94,0.15)',
                    border: '1px solid rgba(34,197,94,0.25)',
                    color: '#22C55E',
                    fontSize: 10,
                    padding: '1px 8px',
                    borderRadius: 20,
                    fontWeight: 600,
                  }}
                >
                  +{newLeads} neue Leads
                </span>
              )}
            </div>
            <div
              style={{
                marginTop: 6,
                height: 3,
                background: 'rgba(255,255,255,0.06)',
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: newLeads > 0 ? `${pct}%` : '30%',
                  background: newLeads > 0 ? 'linear-gradient(90deg, #6B7AFF, #22C55E)' : '#6B7AFF',
                  borderRadius: 2,
                  transition: 'width 1s ease',
                  backgroundSize: newLeads === 0 ? '200% 100%' : '100% 100%',
                  animation: newLeads === 0 ? 'vero-progress 2s linear infinite' : 'none',
                }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-dm-mono)' }}>
              {timeStr}
            </span>
            <button
              onClick={() => {
                localStorage.removeItem('vero_generator_running');
                setRunState(null);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.2)',
                cursor: 'pointer',
                fontSize: 16,
                lineHeight: 1,
                padding: '0 2px',
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* ── Completion Toast ── */}
      {toast?.visible && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 9999,
            width: 300,
            background: '#111',
            border: '1px solid rgba(34,197,94,0.3)',
            borderRadius: 12,
            padding: '14px 16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            animation: 'vero-slideIn 0.3s ease',
            fontFamily: 'var(--font-dm-sans)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'rgba(34,197,94,0.15)',
                  border: '1px solid rgba(34,197,94,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                }}
              >
                ✓
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
                  {toast.newLeads} neue Leads generiert
                </div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>
                  KI-Scoring abgeschlossen
                </div>
              </div>
            </div>
            <button
              onClick={() => setToast(null)}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.3)',
                cursor: 'pointer',
                fontSize: 16,
                padding: 0,
                lineHeight: 1,
                marginTop: 2,
              }}
            >
              ×
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
            {[
              { label: 'HOT', count: toast.hot, color: '#FF5C2E', bg: 'rgba(255,92,46,0.1)' },
              { label: 'WARM', count: toast.warm, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
              { label: 'COLD', count: toast.cold, color: '#6B7AFF', bg: 'rgba(107,122,255,0.1)' },
            ].map(({ label, count, color, bg }) => (
              <div
                key={label}
                style={{
                  background: bg,
                  border: `1px solid ${color}22`,
                  borderRadius: 8,
                  padding: '6px 4px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 16, fontWeight: 700, color, fontFamily: 'var(--font-dm-mono)' }}>{count}</div>
                <div style={{ fontSize: 9, color, opacity: 0.7, letterSpacing: '0.08em' }}>{label}</div>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: 10,
              height: 2,
              background: 'rgba(255,255,255,0.06)',
              borderRadius: 1,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                background: '#22C55E',
                borderRadius: 1,
                animation: 'vero-shrink 8s linear forwards',
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
