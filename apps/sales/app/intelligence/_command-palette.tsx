'use client';

import { useEffect, useRef, useState, createContext, useContext, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from './layout';

// ─── Context ──────────────────────────────────────────────────────────────────

type PaletteCtx = { open: () => void };
const Ctx = createContext<PaletteCtx>({ open: () => {} });
export function usePalette() {
  return useContext(Ctx);
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const PAGES = [
  { label: 'Übersicht', href: '/intelligence', icon: 'home' },
  { label: 'Discovery', href: '/intelligence/discovery', icon: 'discovery' },
  { label: 'Intent Monitor', href: '/intelligence/intent', icon: 'zap' },
  { label: 'Netzwerk', href: '/intelligence/network', icon: 'network' },
  { label: 'Qualifizierung', href: '/intelligence/qualifizierung', icon: 'qualify' },
  { label: 'Leads', href: '/intelligence/leads', icon: 'users' },
  { label: 'Archiv', href: '/intelligence/archiv', icon: 'archive' },
  { label: 'Analytics', href: '/intelligence/analytics', icon: 'bar' },
  { label: 'Integrationen', href: '/intelligence/integrations', icon: 'integrations' },
  { label: 'Einstellungen', href: '/intelligence/settings', icon: 'settings' },
  { label: 'Team', href: '/intelligence/team', icon: 'team' },
  { label: 'Erste Schritte', href: '/intelligence/setup', icon: 'setup' },
];

const LEADS = [
  { name: 'Nordvik Home & Living GmbH', city: 'Hamburg', score: 95, href: '/intelligence/leads/demo' },
  {
    name: 'ARO-tec GmbH',
    city: 'Bielefeld',
    score: 68,
    href: '/intelligence/leads/7de8adb9-9de3-418e-8ad9-716861faf386',
  },
  { name: 'Fashion House GmbH', city: 'München', score: 91, href: '/intelligence/leads/1' },
  { name: 'LuxuryBags Store', city: 'Düsseldorf', score: 88, href: '/intelligence/leads/luxurybags' },
  { name: 'Velora Sports GmbH', city: 'Stuttgart', score: 86, href: '/intelligence/leads/velora' },
  { name: 'TechDirect GmbH', city: 'Berlin', score: 79, href: '/intelligence/leads/techdirect' },
  { name: 'Stylehaus AG', city: 'Düsseldorf', score: 81, href: '/intelligence/leads/a6' },
  { name: 'Flowmatic AG', city: 'Berlin', score: 72, href: '/intelligence/leads/a10' },
];

// flexShrink must live in style — not as a direct SVG attribute
const iconStyle = { width: 14, height: 14, style: { flexShrink: 0 } } as const;

function PageIcon({ type }: { type: string }) {
  if (type === 'bar')
    return (
      <svg {...iconStyle} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <line x1="3" y1="13" x2="3" y2="7" />
        <line x1="8" y1="13" x2="8" y2="3" />
        <line x1="13" y1="13" x2="13" y2="9" />
      </svg>
    );
  if (type === 'users')
    return (
      <svg {...iconStyle} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M11 14v-1.5a3 3 0 0 0-3-3H4a3 3 0 0 0-3 3V14" />
        <circle cx="6" cy="5.5" r="2.5" />
        <path d="M15 14v-1.2a2.5 2.5 0 0 0-1.9-2.4" />
        <path d="M10.5 2.1a2.5 2.5 0 0 1 0 4.8" />
      </svg>
    );
  if (type === 'zap')
    return (
      <svg
        {...iconStyle}
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon points="9 1.5 2 9.5 8 9.5 7 14.5 14 6.5 8 6.5 9 1.5" />
      </svg>
    );
  return (
    <svg {...iconStyle} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="8" cy="8" r="2" />
      <path d="M13.2 10a5.5 5.5 0 0 0 .3-1 5.5 5.5 0 0 0-5.5-5.5 5.5 5.5 0 0 0-5.5 5.5 5.5 5.5 0 0 0 5.5 5.5 5.5 5.5 0 0 0 1-.1" />
    </svg>
  );
}

function scoreColor(s: number) {
  if (s >= 80) return '#10B981';
  if (s >= 65) return '#F97316';
  return '#64748B';
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function PaletteModal({ onClose, isDark }: { onClose: () => void; isDark: boolean }) {
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const q = query.toLowerCase();
  const pageResults = PAGES.filter((p) => p.label.toLowerCase().includes(q));
  const leadResults = LEADS.filter((l) => l.name.toLowerCase().includes(q) || l.city.toLowerCase().includes(q)).slice(
    0,
    q ? 8 : 5
  );

  type Item =
    | { kind: 'page'; label: string; href: string; icon: string }
    | { kind: 'lead'; name: string; city: string; score: number; href: string };
  const items: Item[] = [
    ...pageResults.map((p) => ({ kind: 'page' as const, ...p })),
    ...leadResults.map((l) => ({ kind: 'lead' as const, ...l })),
  ];

  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  useEffect(() => {
    setCursor(0);
  }, [query]);

  function go(href: string) {
    router.push(href);
    onClose();
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setCursor((c) => Math.min(c + 1, items.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setCursor((c) => Math.max(c - 1, 0));
      }
      if (e.key === 'Enter' && items[cursor]) go(items[cursor].href);
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // ── Theme tokens ──
  const bg = isDark ? 'rgba(8,10,22,0.82)' : 'rgba(255,255,255,0.82)';
  const border = isDark ? '1px solid rgba(255,255,255,0.09)' : '1px solid rgba(255,255,255,0.75)';
  const divider = isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(10,37,64,0.07)';
  const text = isDark ? '#F1F5F9' : '#0A2540';
  const textMuted = isDark ? '#64748B' : '#697386';
  const accent = '#4F46E5';
  const hoverBg = isDark ? 'rgba(79,70,229,0.14)' : 'rgba(79,70,229,0.07)';
  const iconBg = isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9';
  const iconBgHov = accent;
  const kbdBg = isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9';
  const kbdColor = isDark ? 'rgba(255,255,255,0.45)' : '#697386';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: 120,
        background: isDark ? 'rgba(8,10,22,0.55)' : 'rgba(10,37,64,0.22)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: 580,
          background: bg,
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          borderRadius: 18,
          boxShadow: isDark
            ? '0 32px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.07)'
            : '0 24px 80px rgba(10,37,64,0.16), inset 0 1px 0 rgba(255,255,255,0.9)',
          borderTop: border.replace('1px solid ', ''),
          borderRight: border.replace('1px solid ', ''),
          borderBottom: border.replace('1px solid ', ''),
          borderLeft: border.replace('1px solid ', ''),
          overflow: 'hidden',
        }}
      >
        {/* Input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 18px',
            borderBottom: divider,
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke={textMuted}
            strokeWidth="1.5"
            strokeLinecap="round"
            style={{ flexShrink: 0 }}
          >
            <circle cx="6.5" cy="6.5" r="4.5" />
            <line x1="10.5" y1="10.5" x2="14" y2="14" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Seite oder Lead suchen..."
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: 15,
              fontFamily: 'var(--font-nunito), var(--font-inter), sans-serif',
              color: text,
              background: 'transparent',
            }}
          />
          <kbd
            style={{
              padding: '2px 7px',
              background: kbdBg,
              borderRadius: 5,
              fontSize: 11,
              color: kbdColor,
              fontFamily: 'inherit',
              border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
            }}
          >
            esc
          </kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 360, overflowY: 'auto' }}>
          {items.length === 0 && (
            <div style={{ padding: '32px', textAlign: 'center', color: textMuted, fontSize: 13 }}>Keine Ergebnisse</div>
          )}

          {pageResults.length > 0 && (
            <div>
              <div
                style={{
                  padding: '10px 18px 6px',
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: textMuted,
                }}
              >
                Navigation
              </div>
              {pageResults.map((page, i) => {
                const idx = i;
                const active = cursor === idx;
                return (
                  <button
                    key={page.href}
                    onMouseEnter={() => setCursor(idx)}
                    onClick={() => go(page.href)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '9px 18px',
                      background: active ? hoverBg : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.1s',
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 7,
                        background: active ? iconBgHov : iconBg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: active ? '#fff' : textMuted,
                        flexShrink: 0,
                        transition: 'background 0.1s, color 0.1s',
                      }}
                    >
                      <PageIcon type={page.icon} />
                    </div>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: active ? accent : text,
                        fontFamily: 'var(--font-nunito), var(--font-inter), sans-serif',
                      }}
                    >
                      {page.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {leadResults.length > 0 && (
            <div>
              <div
                style={{
                  padding: '10px 18px 6px',
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: textMuted,
                  borderTop: pageResults.length > 0 ? divider : 'none',
                  marginTop: pageResults.length > 0 ? 4 : 0,
                }}
              >
                Leads
              </div>
              {leadResults.map((lead, i) => {
                const idx = pageResults.length + i;
                const active = cursor === idx;
                const sc = scoreColor(lead.score);
                return (
                  <button
                    key={lead.name}
                    onMouseEnter={() => setCursor(idx)}
                    onClick={() => go(lead.href)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '9px 18px',
                      background: active ? hoverBg : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.1s',
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 7,
                        background: active ? 'rgba(79,70,229,0.2)' : isDark ? 'rgba(79,70,229,0.12)' : '#EEF0FF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        fontWeight: 800,
                        color: accent,
                        flexShrink: 0,
                        borderTop: isDark ? '1px solid rgba(79,70,229,0.2)' : '1px solid rgba(79,70,229,0.15)',
                        borderRight: isDark ? '1px solid rgba(79,70,229,0.2)' : '1px solid rgba(79,70,229,0.15)',
                        borderBottom: isDark ? '1px solid rgba(79,70,229,0.2)' : '1px solid rgba(79,70,229,0.15)',
                        borderLeft: isDark ? '1px solid rgba(79,70,229,0.2)' : '1px solid rgba(79,70,229,0.15)',
                      }}
                    >
                      {lead.name[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: active ? accent : text,
                          fontFamily: 'var(--font-nunito), var(--font-inter), sans-serif',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {lead.name}
                      </div>
                      <div style={{ fontSize: 11, color: textMuted }}>{lead.city}</div>
                    </div>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 800,
                        color: sc,
                        background: sc + '18',
                        padding: '2px 8px',
                        borderRadius: 5,
                      }}
                    >
                      {lead.score}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '10px 18px',
            borderTop: divider,
            display: 'flex',
            gap: 16,
            fontSize: 11,
            color: textMuted,
          }}
        >
          {[
            ['↑↓', 'navigieren'],
            ['↵', 'öffnen'],
            ['esc', 'schließen'],
          ].map(([key, label]) => (
            <span key={key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <kbd
                style={{
                  padding: '1px 5px',
                  background: kbdBg,
                  borderRadius: 4,
                  fontFamily: 'inherit',
                  border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
                  color: kbdColor,
                }}
              >
                {key}
              </kbd>
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <Ctx.Provider value={{ open }}>
      {children}
      {isOpen && <PaletteModal onClose={() => setIsOpen(false)} isDark={isDark} />}
    </Ctx.Provider>
  );
}
