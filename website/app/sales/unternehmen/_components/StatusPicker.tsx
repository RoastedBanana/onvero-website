'use client';

import { useState, useEffect, useRef } from 'react';
import { TOKENS } from '../_tokens';
import type { CompanyStatus } from '../_types';

const OPTIONS: { key: CompanyStatus; label: string; color: string; bg: string; border: string }[] = [
  {
    key: 'new',
    label: 'Neu',
    color: TOKENS.color.textTertiary,
    bg: TOKENS.color.bgSubtle,
    border: TOKENS.color.borderSubtle,
  },
  {
    key: 'contacted',
    label: 'In Kontakt',
    color: TOKENS.color.indigoLight,
    bg: TOKENS.color.indigoBgSubtle,
    border: TOKENS.color.indigoBorderSoft,
  },
  {
    key: 'qualified',
    label: 'Qualifiziert',
    color: TOKENS.color.warm,
    bg: 'rgba(245,169,127,0.08)',
    border: 'rgba(245,169,127,0.25)',
  },
  {
    key: 'lost',
    label: 'Verloren',
    color: 'rgba(248,113,113,0.85)',
    bg: 'rgba(248,113,113,0.06)',
    border: 'rgba(248,113,113,0.2)',
  },
];

export default function StatusPicker({
  status,
  onStatusChange,
}: {
  status: CompanyStatus | null;
  onStatusChange: (s: CompanyStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = OPTIONS.find((o) => o.key === (status ?? 'new')) ?? OPTIONS[0];

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: '3px 9px 3px 8px',
          borderRadius: TOKENS.radius.chip,
          border: `1px solid ${open ? current.color + '55' : current.border}`,
          background: open ? current.bg : current.bg,
          color: current.color,
          fontSize: 11,
          fontWeight: 500,
          cursor: 'pointer',
          fontFamily: TOKENS.font.family,
          transition: 'all 0.15s',
        }}
      >
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: current.color,
            flexShrink: 0,
          }}
        />
        {current.label}
        <svg
          width="9"
          height="9"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          style={{
            marginLeft: 1,
            opacity: 0.6,
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s',
          }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            zIndex: 200,
            background: TOKENS.color.bgCard,
            border: `1px solid ${TOKENS.color.borderDefault}`,
            borderRadius: TOKENS.radius.card,
            padding: 4,
            minWidth: 150,
            boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
          }}
        >
          {OPTIONS.map((opt) => {
            const active = opt.key === (status ?? 'new');
            return (
              <button
                key={opt.key}
                onClick={() => {
                  onStatusChange(opt.key);
                  setOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: 6,
                  border: 'none',
                  background: active ? opt.bg : 'transparent',
                  color: active ? opt.color : TOKENS.color.textSecondary,
                  fontSize: 12,
                  fontWeight: active ? 500 : 400,
                  cursor: 'pointer',
                  fontFamily: TOKENS.font.family,
                  textAlign: 'left',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => {
                  if (!active) (e.currentTarget as HTMLButtonElement).style.background = TOKENS.color.bgSubtle;
                }}
                onMouseLeave={(e) => {
                  if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: opt.color,
                    flexShrink: 0,
                  }}
                />
                {opt.label}
                {active && (
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={opt.color}
                    strokeWidth="3"
                    strokeLinecap="round"
                    style={{ marginLeft: 'auto' }}
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
