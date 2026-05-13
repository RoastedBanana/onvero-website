'use client';

import { createContext, useContext, useCallback, useState, useEffect } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

type ToastCtx = {
  toast: (message: string, type?: ToastType) => void;
};

const Ctx = createContext<ToastCtx>({ toast: () => {} });

export function useToast() {
  return useContext(Ctx);
}

// ─── Single toast item ────────────────────────────────────────────────────────

const TYPE_STYLES: Record<ToastType, { bg: string; color: string; icon: React.ReactNode }> = {
  success: {
    bg: '#ECFDF5',
    color: '#059669',
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        stroke="#059669"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="8" cy="8" r="7" />
        <polyline points="5 8 7 10 11 6" />
      </svg>
    ),
  },
  error: {
    bg: '#FEF2F2',
    color: '#DC2626',
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        stroke="#DC2626"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <circle cx="8" cy="8" r="7" />
        <line x1="8" y1="5" x2="8" y2="8.5" />
        <line x1="8" y1="11" x2="8" y2="11.2" />
      </svg>
    ),
  },
  info: {
    bg: '#EEF0FF',
    color: '#4F46E5',
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        stroke="#4F46E5"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <circle cx="8" cy="8" r="7" />
        <line x1="8" y1="7.5" x2="8" y2="11" />
        <line x1="8" y1="5" x2="8" y2="5.2" />
      </svg>
    ),
  },
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const s = TYPE_STYLES[toast.type];

  useEffect(() => {
    const t = setTimeout(() => onRemove(toast.id), 3500);
    return () => clearTimeout(t);
  }, [toast.id, onRemove]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: '#fff',
        border: `1.5px solid ${s.bg}`,
        borderLeft: `4px solid ${s.color}`,
        borderRadius: 10,
        padding: '12px 16px',
        boxShadow: '0 4px 20px rgba(10,37,64,0.12)',
        minWidth: 260,
        maxWidth: 380,
        fontFamily: 'var(--font-inter), sans-serif',
        animation: 'toastIn 0.2s ease',
      }}
    >
      {s.icon}
      <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#0A2540', lineHeight: 1.4 }}>{toast.message}</span>
      <button
        onClick={() => onRemove(toast.id)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#B0BAC9',
          padding: 2,
          lineHeight: 1,
          fontSize: 16,
        }}
      >
        ×
      </button>
    </div>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div
        style={{
          position: 'fixed',
          bottom: 52,
          right: 24,
          zIndex: 9998,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          pointerEvents: 'none',
        }}
      >
        <style>{`
          @keyframes toastIn {
            from { opacity: 0; transform: translateY(8px) scale(0.97); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}</style>
        {toasts.map((t) => (
          <div key={t.id} style={{ pointerEvents: 'auto' }}>
            <ToastItem toast={t} onRemove={remove} />
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
