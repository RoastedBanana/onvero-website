'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { C, SvgIcon, ICONS } from './_shared';
import { useLeads } from './_use-leads';

// ─── GLOBAL OPEN TRIGGER ─────────────────────────────────────────────────────

let _openFn: (() => void) | null = null;

export function openCommandPalette() {
  _openFn?.();
}

// ─── COMMAND PALETTE ─────────────────────────────────────────────────────────

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { leads } = useLeads();

  // Register global open function
  useEffect(() => {
    _openFn = () => {
      setOpen(true);
      setQuery('');
      setSelectedIndex(0);
    };
    return () => {
      _openFn = null;
    };
  }, []);

  // ⌘K + Escape keyboard shortcuts
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

  // Focus input when opening
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  // Reset selection on query change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // ─── Build items from live data ────────────────────────────────────

  type Item = {
    id: string;
    label: string;
    description?: string;
    icon: string;
    color: string;
    action: () => void;
    section: string;
  };

  const navItems: Item[] = [
    {
      id: 'home',
      label: 'Home',
      description: 'Dashboard Übersicht',
      icon: ICONS.home,
      color: '#818CF8',
      action: () => router.push('/sales'),
      section: 'Navigation',
    },
    {
      id: 'leads',
      label: 'Alle Leads',
      description: `${leads.length} Einträge`,
      icon: ICONS.list,
      color: '#818CF8',
      action: () => router.push('/sales/leads'),
      section: 'Navigation',
    },
    {
      id: 'prospects',
      label: 'Market Intent',
      icon: ICONS.zap,
      color: '#34D399',
      action: () => router.push('/sales/prospects'),
      section: 'Navigation',
    },
    {
      id: 'outreach',
      label: 'Outreach-Ideen',
      icon: ICONS.mail,
      color: '#38BDF8',
      action: () => router.push('/sales/outreach'),
      section: 'Navigation',
    },
    {
      id: 'monitoring',
      label: 'Monitoring',
      icon: ICONS.eye,
      color: '#A78BFA',
      action: () => router.push('/sales/monitoring'),
      section: 'Navigation',
    },
    {
      id: 'meetings',
      label: 'Meetings',
      icon: ICONS.calendar,
      color: '#38BDF8',
      action: () => router.push('/sales/meetings'),
      section: 'Navigation',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: ICONS.chart,
      color: '#FBBF24',
      action: () => router.push('/sales/analytics'),
      section: 'Navigation',
    },
    {
      id: 'settings',
      label: 'Einstellungen',
      icon: ICONS.settings,
      color: '#4E5170',
      action: () => router.push('/sales/settings'),
      section: 'Navigation',
    },
  ];

  // Real leads — only show when searching or show top 5 by default
  const leadItems: Item[] = leads
    .filter((l) => {
      if (!query) return (l.score ?? 0) >= 50; // show top leads by default
      const q = query.toLowerCase();
      return (
        l.name.toLowerCase().includes(q) ||
        l.company.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q) ||
        (l.jobTitle?.toLowerCase().includes(q) ?? false) ||
        (l.industry?.toLowerCase().includes(q) ?? false)
      );
    })
    .slice(0, query ? 10 : 5)
    .map((l) => ({
      id: l.id,
      label: l.name,
      description: `${l.company} · ${l.city}${l.score ? ` · Score ${l.score}` : ''}`,
      icon: ICONS.users,
      color: (l.score ?? 0) >= 70 ? '#818CF8' : (l.score ?? 0) >= 50 ? '#FBBF24' : '#4E5170',
      action: () => router.push(`/sales/leads/${l.id}`),
      section: 'Leads',
    }));

  const allItems = query
    ? [...navItems, ...leadItems].filter(
        (i) =>
          i.label.toLowerCase().includes(query.toLowerCase()) ||
          (i.description?.toLowerCase().includes(query.toLowerCase()) ?? false)
      )
    : [...navItems, ...leadItems];

  const sections = Array.from(new Set(allItems.map((i) => i.section)));

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, allItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && allItems[selectedIndex]) {
      allItems[selectedIndex].action();
      setOpen(false);
    }
  }

  if (!open) return null;

  return (
    <>
      {/* Backdrop + centering container */}
      <div
        onClick={() => setOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
          zIndex: 99992,
          animation: 'fadeIn 0.15s ease both',
          display: 'flex',
          justifyContent: 'center',
          paddingTop: '16vh',
          paddingLeft: 220,
        }}
      />

      {/* Palette centering wrapper */}
      <div
        style={{
          position: 'fixed',
          top: '16vh',
          left: 220,
          right: 0,
          zIndex: 99993,
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: 580,
            maxHeight: '62vh',
            background: '#131530',
            border: `1px solid ${C.borderLight}`,
            borderRadius: 14,
            overflow: 'hidden',
            boxShadow:
              '0 16px 80px rgba(0,0,0,0.6), 0 0 0 0.5px rgba(255,255,255,0.04), 0 0 40px rgba(99,102,241,0.08)',
            animation: 'scaleIn 0.2s cubic-bezier(0.22, 1, 0.36, 1) both',
            pointerEvents: 'auto',
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
              placeholder="Leads, Seiten, Aktionen suchen..."
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
          <div style={{ maxHeight: 'calc(62vh - 54px)', overflowY: 'auto', padding: 8 }}>
            {allItems.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: C.text3 }}>Keine Ergebnisse für &quot;{query}&quot;</div>
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
                  {allItems
                    .filter((i) => i.section === section)
                    .map((item) => {
                      const globalIdx = allItems.indexOf(item);
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
      </div>
    </>
  );
}
