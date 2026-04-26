'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';

// Apollo-compatible person_locations. Country names in English as Apollo expects.
export const APOLLO_LOCATION_GROUPS: { group: string; locations: string[] }[] = [
  {
    group: 'DACH',
    locations: ['Germany', 'Austria', 'Switzerland', 'Liechtenstein'],
  },
  {
    group: 'Western Europe',
    locations: [
      'France',
      'Belgium',
      'Netherlands',
      'Luxembourg',
      'United Kingdom',
      'Ireland',
      'Monaco',
    ],
  },
  {
    group: 'Northern Europe',
    locations: [
      'Denmark',
      'Sweden',
      'Norway',
      'Finland',
      'Iceland',
      'Estonia',
      'Latvia',
      'Lithuania',
    ],
  },
  {
    group: 'Southern Europe',
    locations: [
      'Spain',
      'Portugal',
      'Italy',
      'Greece',
      'Malta',
      'Cyprus',
      'Andorra',
      'San Marino',
    ],
  },
  {
    group: 'Central & Eastern Europe',
    locations: [
      'Poland',
      'Czech Republic',
      'Slovakia',
      'Hungary',
      'Slovenia',
      'Croatia',
      'Romania',
      'Bulgaria',
      'Serbia',
      'Bosnia and Herzegovina',
      'North Macedonia',
      'Montenegro',
      'Albania',
      'Kosovo',
      'Moldova',
      'Ukraine',
    ],
  },
  {
    group: 'North America',
    locations: ['United States', 'Canada', 'Mexico'],
  },
  {
    group: 'Latin America',
    locations: [
      'Brazil',
      'Argentina',
      'Chile',
      'Colombia',
      'Peru',
      'Uruguay',
      'Costa Rica',
      'Panama',
      'Dominican Republic',
      'Ecuador',
    ],
  },
  {
    group: 'Middle East',
    locations: [
      'United Arab Emirates',
      'Saudi Arabia',
      'Qatar',
      'Kuwait',
      'Bahrain',
      'Oman',
      'Israel',
      'Turkey',
      'Jordan',
      'Lebanon',
    ],
  },
  {
    group: 'Asia',
    locations: [
      'China',
      'Hong Kong',
      'Taiwan',
      'Japan',
      'South Korea',
      'India',
      'Singapore',
      'Malaysia',
      'Indonesia',
      'Thailand',
      'Vietnam',
      'Philippines',
      'Pakistan',
      'Bangladesh',
    ],
  },
  {
    group: 'Oceania',
    locations: ['Australia', 'New Zealand', 'Fiji'],
  },
  {
    group: 'Africa',
    locations: [
      'South Africa',
      'Nigeria',
      'Kenya',
      'Egypt',
      'Morocco',
      'Tunisia',
      'Ghana',
      'Ethiopia',
      'Tanzania',
      'Uganda',
      'Algeria',
    ],
  },
];

const ALL_LOCATIONS = APOLLO_LOCATION_GROUPS.flatMap((g) => g.locations);

interface Props {
  values: string[];
  onChange: (v: string[]) => void;
}

export default function LocationsMultiSelect({ values, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const toggle = (loc: string) => {
    if (values.includes(loc)) onChange(values.filter((v) => v !== loc));
    else onChange([...values, loc]);
  };

  const addCustom = () => {
    const v = query.trim();
    if (v && !values.includes(v)) {
      onChange([...values, v]);
      setQuery('');
    }
  };

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return APOLLO_LOCATION_GROUPS;
    return APOLLO_LOCATION_GROUPS.map((g) => ({
      group: g.group,
      locations: g.locations.filter((l) => l.toLowerCase().includes(q)),
    })).filter((g) => g.locations.length > 0);
  }, [query]);

  const queryHasExactMatch = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return ALL_LOCATIONS.some((l) => l.toLowerCase() === q);
  }, [query]);

  return (
    <div ref={containerRef} style={{ flex: 1, position: 'relative' }}>
      {/* Selected chips + trigger */}
      <div
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 4,
          background: '#0a0a0a',
          border: `0.5px solid ${open ? '#332440' : '#2a2a2a'}`,
          borderRadius: 6,
          padding: '4px 6px',
          minHeight: 28,
          cursor: 'pointer',
        }}
      >
        {values.length === 0 && (
          <span style={{ fontSize: 11, color: '#555', padding: '2px 4px' }}>Länder auswählen…</span>
        )}
        {values.map((l) => (
          <span
            key={l}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              background: '#221a2a',
              border: '0.5px solid #332440',
              color: '#c084fc',
              padding: '2px 4px 2px 8px',
              borderRadius: 6,
            }}
          >
            {l}
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onChange(values.filter((x) => x !== l));
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#666',
                cursor: 'pointer',
                fontSize: 11,
                padding: '0 2px',
                lineHeight: 1,
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              <X size={10} />
            </button>
          </span>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 10, color: '#444', padding: '2px 4px' }}>
          {open ? '▲' : '▼'}
        </span>
      </div>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: '#0d0d0d',
            border: '0.5px solid #2a2a2a',
            borderRadius: 8,
            boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
            zIndex: 50,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: 360,
          }}
        >
          {/* Search */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 10px',
              borderBottom: '0.5px solid #1a1a1a',
              background: '#0a0a0a',
            }}
          >
            <Search size={12} color="#555" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && query.trim() && !queryHasExactMatch) {
                  e.preventDefault();
                  addCustom();
                }
                if (e.key === 'Escape') setOpen(false);
              }}
              placeholder="Search or add custom country…"
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontSize: 12,
                color: '#e0e0e0',
                fontFamily: 'var(--font-dm-sans)',
              }}
            />
            {query && !queryHasExactMatch && (
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  addCustom();
                }}
                style={{
                  background: '#221a2a',
                  border: '0.5px solid #332440',
                  color: '#c084fc',
                  fontSize: 10,
                  padding: '2px 8px',
                  borderRadius: 4,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                + „{query.trim()}"
              </button>
            )}
          </div>

          {/* Groups */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {filteredGroups.length === 0 ? (
              <div style={{ padding: 16, fontSize: 11, color: '#555', textAlign: 'center' }}>
                No matches. Press Enter to add.
              </div>
            ) : (
              filteredGroups.map((g) => (
                <div key={g.group}>
                  <div
                    style={{
                      fontSize: 9,
                      color: '#444',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      padding: '8px 12px 4px',
                      background: '#0a0a0a',
                      position: 'sticky',
                      top: 0,
                    }}
                  >
                    {g.group}
                  </div>
                  {g.locations.map((l) => {
                    const selected = values.includes(l);
                    return (
                      <button
                        key={l}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          toggle(l);
                        }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          background: selected ? '#15101a' : 'transparent',
                          border: 'none',
                          padding: '6px 12px',
                          fontSize: 12,
                          color: selected ? '#c084fc' : '#bbb',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          fontFamily: 'var(--font-dm-sans)',
                        }}
                        onMouseEnter={(e) => {
                          if (!selected) e.currentTarget.style.background = '#141414';
                        }}
                        onMouseLeave={(e) => {
                          if (!selected) e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 14,
                            height: 14,
                            borderRadius: 3,
                            border: `0.5px solid ${selected ? '#c084fc' : '#333'}`,
                            background: selected ? '#c084fc' : 'transparent',
                            flexShrink: 0,
                          }}
                        >
                          {selected && (
                            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                              <path
                                d="M2 6L5 9L10 3"
                                stroke="#0a0a0a"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </span>
                        {l}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 12px',
              borderTop: '0.5px solid #1a1a1a',
              background: '#0a0a0a',
              fontSize: 10,
              color: '#555',
            }}
          >
            <span>{values.length} selected</span>
            {values.length > 0 && (
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange([]);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#666',
                  fontSize: 10,
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                Clear all
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
