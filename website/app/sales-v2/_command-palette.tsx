'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { C, SvgIcon, ICONS } from './_shared';

type CommandItem = {
  id: string;
  label: string;
  description?: string;
  icon: string;
  color: string;
  action: () => void;
  section: string;
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const items: CommandItem[] = [
    {
      id: 'home',
      label: 'Home',
      description: 'Dashboard Übersicht',
      icon: ICONS.home,
      color: '#818CF8',
      action: () => router.push('/sales-v2'),
      section: 'Navigation',
    },
    {
      id: 'leads',
      label: 'Alle Leads',
      description: '2.847 Einträge',
      icon: ICONS.list,
      color: '#818CF8',
      action: () => router.push('/sales-v2/leads'),
      section: 'Navigation',
    },
    {
      id: 'prospects',
      label: 'Market Intent',
      description: '18 neue Signale',
      icon: ICONS.zap,
      color: '#34D399',
      action: () => router.push('/sales-v2/prospects'),
      section: 'Navigation',
    },
    {
      id: 'outreach',
      label: 'Outreach-Ideen',
      description: 'KI-generierte Nachrichten',
      icon: ICONS.mail,
      color: '#38BDF8',
      action: () => router.push('/sales-v2/outreach'),
      section: 'Navigation',
    },
    {
      id: 'monitoring',
      label: 'Monitoring',
      description: 'Firmen beobachten',
      icon: ICONS.eye,
      color: '#A78BFA',
      action: () => router.push('/sales-v2/monitoring'),
      section: 'Navigation',
    },
    {
      id: 'meetings',
      label: 'Meetings',
      description: 'Aufnehmen & Analysieren',
      icon: ICONS.calendar,
      color: '#38BDF8',
      action: () => router.push('/sales-v2/meetings'),
      section: 'Navigation',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      description: 'Performance-Daten',
      icon: ICONS.chart,
      color: '#FBBF24',
      action: () => router.push('/sales-v2/analytics'),
      section: 'Navigation',
    },
    {
      id: 'gen',
      label: 'Lead generieren',
      description: 'KI-basierte Lead-Suche starten',
      icon: ICONS.spark,
      color: '#818CF8',
      action: () => router.push('/sales-v2/leads'),
      section: 'Aktionen',
    },
    {
      id: 'scan',
      label: 'Intent-Scan starten',
      description: 'Markt nach Kaufsignalen durchsuchen',
      icon: ICONS.zap,
      color: '#34D399',
      action: () => router.push('/sales-v2/prospects'),
      section: 'Aktionen',
    },
    {
      id: 'meeting',
      label: 'Meeting aufnehmen',
      description: 'Aufnahme + Transkription starten',
      icon: ICONS.mic,
      color: '#F87171',
      action: () => router.push('/sales-v2/meetings'),
      section: 'Aktionen',
    },
    {
      id: 'marcus',
      label: 'Marcus Weber',
      description: 'Stackbase GmbH · Score 94',
      icon: ICONS.users,
      color: '#818CF8',
      action: () => router.push('/sales-v2/leads'),
      section: 'Leads',
    },
    {
      id: 'tom',
      label: 'Tom Schreiber',
      description: 'Axflow AG · Score 92',
      icon: ICONS.users,
      color: '#818CF8',
      action: () => router.push('/sales-v2/leads'),
      section: 'Leads',
    },
    {
      id: 'clara',
      label: 'Clara Wolff',
      description: 'Silo Labs · Score 91',
      icon: ICONS.users,
      color: '#818CF8',
      action: () => router.push('/sales-v2/leads'),
      section: 'Leads',
    },
  ];

  const filtered = query
    ? items.filter(
        (i) =>
          i.label.toLowerCase().includes(query.toLowerCase()) ||
          i.description?.toLowerCase().includes(query.toLowerCase())
      )
    : items;

  const sections = Array.from(new Set(filtered.map((i) => i.section)));

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((p) => !p);
        setQuery('');
        setSelectedIndex(0);
      }
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      filtered[selectedIndex].action();
      setOpen(false);
    }
  }

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
          zIndex: 2000,
          animation: 'fadeIn 0.15s ease both',
        }}
      />

      {/* Palette */}
      <div
        style={{
          position: 'fixed',
          top: '18%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 560,
          maxHeight: '60vh',
          background: C.surface,
          border: `1px solid ${C.borderLight}`,
          borderRadius: 14,
          overflow: 'hidden',
          zIndex: 2001,
          boxShadow: '0 16px 80px rgba(0,0,0,0.5), 0 0 0 0.5px rgba(255,255,255,0.04), 0 0 40px rgba(99,102,241,0.08)',
          animation: 'scaleIn 0.2s cubic-bezier(0.22, 1, 0.36, 1) both',
        }}
      >
        {/* Input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 18px',
            borderBottom: `1px solid ${C.border}`,
          }}
        >
          <SvgIcon d={ICONS.search} size={16} color={C.text3} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Suche nach Leads, Seiten, Aktionen..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: C.text1,
              fontSize: 14,
              fontFamily: 'inherit',
            }}
          />
          <kbd
            style={{
              fontSize: 10,
              color: C.text3,
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${C.border}`,
              borderRadius: 4,
              padding: '2px 6px',
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 'calc(60vh - 54px)', overflowY: 'auto', padding: '8px' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: C.text3 }}>Keine Ergebnisse für "{query}"</div>
            </div>
          ) : (
            sections.map((section) => (
              <div key={section}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    color: C.text3,
                    padding: '10px 12px 4px',
                    marginTop: 4,
                  }}
                >
                  {section.toUpperCase()}
                </div>
                {filtered
                  .filter((i) => i.section === section)
                  .map((item) => {
                    const globalIdx = filtered.indexOf(item);
                    const isSelected = globalIdx === selectedIndex;
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          item.action();
                          setOpen(false);
                        }}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '10px 12px',
                          borderRadius: 8,
                          cursor: 'pointer',
                          background: isSelected ? 'rgba(99,102,241,0.08)' : 'transparent',
                          transition: 'background 0.1s ease',
                        }}
                      >
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 7,
                            background: `${item.color}10`,
                            border: `1px solid ${item.color}18`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <SvgIcon d={item.icon} size={13} color={item.color} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: isSelected ? C.text1 : C.text2 }}>
                            {item.label}
                          </div>
                          {item.description && (
                            <div style={{ fontSize: 11, color: C.text3, marginTop: 1 }}>{item.description}</div>
                          )}
                        </div>
                        {isSelected && (
                          <kbd
                            style={{
                              fontSize: 9,
                              color: C.text3,
                              background: 'rgba(255,255,255,0.05)',
                              border: `1px solid ${C.border}`,
                              borderRadius: 3,
                              padding: '1px 5px',
                              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                            }}
                          >
                            ↵
                          </kbd>
                        )}
                      </div>
                    );
                  })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '10px 18px',
            borderTop: `1px solid ${C.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            background: 'rgba(255,255,255,0.01)',
          }}
        >
          {[
            { keys: ['↑', '↓'], label: 'navigieren' },
            { keys: ['↵'], label: 'öffnen' },
            { keys: ['esc'], label: 'schließen' },
          ].map((h) => (
            <div key={h.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {h.keys.map((k) => (
                <kbd
                  key={k}
                  style={{
                    fontSize: 9,
                    color: C.text3,
                    background: 'rgba(255,255,255,0.05)',
                    border: `1px solid ${C.border}`,
                    borderRadius: 3,
                    padding: '1px 5px',
                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  }}
                >
                  {k}
                </kbd>
              ))}
              <span style={{ fontSize: 10, color: C.text3 }}>{h.label}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
