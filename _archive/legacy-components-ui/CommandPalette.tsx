'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Home,
  Users,
  BarChart2,
  Zap,
  Calendar,
  Sparkles,
  Settings,
  Search,
  Rocket,
  UserCog,
  Clock,
} from 'lucide-react';

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; style?: React.CSSProperties }>;
  action: () => void;
  category: string;
}

function fuzzyMatch(query: string, text: string): boolean {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++;
  }
  return qi === q.length;
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setSelectedIndex(0);
  }, []);

  const navigate = useCallback(
    (path: string) => {
      close();
      router.push(path);
    },
    [close, router]
  );

  const items: CommandItem[] = useMemo(
    () => [
      { id: 'nav-home', title: 'Home', icon: Home, action: () => navigate('/dashboard'), category: 'Navigation' },
      {
        id: 'nav-leads',
        title: 'Leads',
        icon: Users,
        action: () => navigate('/dashboard/leads'),
        category: 'Navigation',
      },
      {
        id: 'nav-analytics',
        title: 'Analytics',
        icon: BarChart2,
        action: () => navigate('/dashboard/analytics'),
        category: 'Navigation',
      },
      {
        id: 'nav-generate',
        title: 'Generate',
        icon: Zap,
        action: () => navigate('/dashboard/generate'),
        category: 'Navigation',
      },
      {
        id: 'nav-meetings',
        title: 'Meetings',
        icon: Calendar,
        action: () => navigate('/dashboard/meetings'),
        category: 'Navigation',
      },
      {
        id: 'nav-business-ai',
        title: 'Business AI',
        icon: Sparkles,
        action: () => navigate('/dashboard/business-ai'),
        category: 'Navigation',
      },
      {
        id: 'nav-settings',
        title: 'Settings',
        icon: Settings,
        action: () => navigate('/dashboard/settings'),
        category: 'Navigation',
      },
      {
        id: 'act-campaign',
        title: 'Neue Kampagne starten',
        subtitle: 'Lead-Generierung starten',
        icon: Rocket,
        action: () => navigate('/dashboard/generate'),
        category: 'Aktionen',
      },
      {
        id: 'act-search-leads',
        title: 'Lead suchen',
        subtitle: 'Leads durchsuchen',
        icon: Search,
        action: () => navigate('/dashboard/leads'),
        category: 'Aktionen',
      },
      {
        id: 'act-profile',
        title: 'Profil bearbeiten',
        subtitle: 'Einstellungen anpassen',
        icon: UserCog,
        action: () => navigate('/dashboard/settings'),
        category: 'Aktionen',
      },
    ],
    [navigate]
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    return items.filter((item) => fuzzyMatch(query, item.title) || (item.subtitle && fuzzyMatch(query, item.subtitle)));
  }, [query, items]);

  // Group by category preserving order
  const grouped = useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    for (const item of filtered) {
      if (!map.has(item.category)) map.set(item.category, []);
      map.get(item.category)!.push(item);
    }
    return map;
  }, [filtered]);

  // Flat list for index-based navigation
  const flatFiltered = useMemo(() => {
    const result: CommandItem[] = [];
    for (const items of grouped.values()) result.push(...items);
    return result;
  }, [grouped]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Global Cmd+K listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Custom event listener for sidebar trigger
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('open-command-palette', handler);
    return () => window.removeEventListener('open-command-palette', handler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector('[data-selected="true"]');
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % Math.max(flatFiltered.length, 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + flatFiltered.length) % Math.max(flatFiltered.length, 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (flatFiltered[selectedIndex]) flatFiltered[selectedIndex].action();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
    },
    [flatFiltered, selectedIndex, close]
  );

  if (!open) return null;

  let runningIndex = 0;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
      onClick={close}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        style={{
          width: '100%',
          maxWidth: 560,
          background: '#111',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 14,
          overflow: 'hidden',
          fontFamily: 'var(--font-dm-sans)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
        }}
      >
        {/* Search input */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 18px', gap: 10 }}>
          <Search size={16} strokeWidth={1.8} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Suche oder Befehl eingeben..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#fff',
              fontSize: 15,
              fontFamily: 'var(--font-dm-sans)',
              padding: 0,
            }}
          />
        </div>

        {/* Separator */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

        {/* Results */}
        <div ref={listRef} style={{ maxHeight: 340, overflowY: 'auto', padding: '6px 0' }}>
          {flatFiltered.length === 0 && (
            <div
              style={{
                padding: '24px 18px',
                textAlign: 'center',
                color: 'rgba(255,255,255,0.25)',
                fontSize: 13,
              }}
            >
              Keine Ergebnisse
            </div>
          )}

          {Array.from(grouped.entries()).map(([category, categoryItems]) => {
            const startIndex = runningIndex;
            runningIndex += categoryItems.length;
            return (
              <div key={category}>
                <div
                  style={{
                    fontSize: 10,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'rgba(255,255,255,0.25)',
                    padding: '10px 18px 4px',
                    fontWeight: 500,
                  }}
                >
                  {category}
                </div>
                {categoryItems.map((item, i) => {
                  const globalIndex = startIndex + i;
                  const isSelected = globalIndex === selectedIndex;
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.id}
                      data-selected={isSelected}
                      onClick={() => item.action()}
                      onMouseEnter={() => setSelectedIndex(globalIndex)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        height: 40,
                        padding: '0 18px',
                        cursor: 'pointer',
                        background: isSelected ? 'rgba(255,255,255,0.06)' : 'transparent',
                        transition: 'background 0.1s',
                      }}
                    >
                      <Icon size={15} strokeWidth={1.8} style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 13, color: '#fff' }}>{item.title}</span>
                        {item.subtitle && (
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginLeft: 8 }}>
                            {item.subtitle}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Kuerzlich placeholder */}
          {!query.trim() && (
            <div>
              <div
                style={{
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'rgba(255,255,255,0.25)',
                  padding: '10px 18px 4px',
                  fontWeight: 500,
                }}
              >
                {'\u004b\u00fc\u0072\u007a\u006c\u0069\u0063\u0068'}
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  height: 40,
                  padding: '0 18px',
                  color: 'rgba(255,255,255,0.2)',
                  fontSize: 12,
                }}
              >
                <Clock size={14} strokeWidth={1.8} style={{ color: 'rgba(255,255,255,0.15)' }} />
                Keine letzten Aktionen
              </div>
            </div>
          )}
        </div>

        {/* Separator */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            padding: '8px 18px',
            fontSize: 10,
            color: 'rgba(255,255,255,0.2)',
          }}
        >
          <span>{'\u2191\u2193'} Navigate</span>
          <span>{'\u00b7'}</span>
          <span>Enter Select</span>
          <span>{'\u00b7'}</span>
          <span>Esc Close</span>
        </div>
      </div>
    </div>
  );
}
