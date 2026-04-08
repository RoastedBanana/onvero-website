'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';

// Apollo-compatible person_titles. Grouped for browsing, but flattened for search.
// These match the values Apollo accepts in its `person_titles` filter.
export const APOLLO_TITLE_GROUPS: { group: string; titles: string[] }[] = [
  {
    group: 'C-Level / Geschäftsführung',
    titles: [
      'CEO',
      'Chief Executive Officer',
      'Founder',
      'Co-Founder',
      'Owner',
      'President',
      'Managing Director',
      'Geschäftsführer',
      'Inhaber',
      'Gründer',
      'COO',
      'Chief Operating Officer',
      'CFO',
      'Chief Financial Officer',
      'CTO',
      'Chief Technology Officer',
      'CIO',
      'Chief Information Officer',
      'CMO',
      'Chief Marketing Officer',
      'CRO',
      'Chief Revenue Officer',
      'CSO',
      'Chief Strategy Officer',
      'CPO',
      'Chief Product Officer',
      'CHRO',
      'Chief People Officer',
    ],
  },
  {
    group: 'VP / Vice President',
    titles: [
      'VP Sales',
      'VP Marketing',
      'VP Engineering',
      'VP Product',
      'VP Operations',
      'VP Finance',
      'VP HR',
      'VP People',
      'VP Customer Success',
      'VP Business Development',
      'SVP Sales',
      'SVP Marketing',
      'EVP Sales',
    ],
  },
  {
    group: 'Direktoren',
    titles: [
      'Director',
      'Director of Sales',
      'Director of Marketing',
      'Director of Operations',
      'Director of Engineering',
      'Director of Product',
      'Director of Finance',
      'Director of HR',
      'Director of Customer Success',
      'Director of Business Development',
      'Sales Director',
      'Marketing Director',
      'Operations Director',
      'Finance Director',
      'HR Director',
    ],
  },
  {
    group: 'Head of',
    titles: [
      'Head of Sales',
      'Head of Marketing',
      'Head of Growth',
      'Head of Operations',
      'Head of Engineering',
      'Head of Product',
      'Head of Finance',
      'Head of HR',
      'Head of People',
      'Head of Customer Success',
      'Head of Business Development',
      'Head of IT',
      'Head of Procurement',
      'Head of Logistics',
    ],
  },
  {
    group: 'Manager',
    titles: [
      'Sales Manager',
      'Marketing Manager',
      'Operations Manager',
      'Product Manager',
      'Project Manager',
      'Account Manager',
      'Key Account Manager',
      'Business Development Manager',
      'Customer Success Manager',
      'HR Manager',
      'Finance Manager',
      'IT Manager',
      'Office Manager',
      'Procurement Manager',
      'Logistics Manager',
      'Supply Chain Manager',
      'E-Commerce Manager',
      'Vertriebsleiter',
      'Marketingleiter',
      'Einkaufsleiter',
      'Personalleiter',
    ],
  },
  {
    group: 'Sales / Vertrieb',
    titles: [
      'Sales Representative',
      'Sales Executive',
      'Sales Development Representative',
      'SDR',
      'Business Development Representative',
      'BDR',
      'Account Executive',
      'AE',
      'Inside Sales',
      'Outside Sales',
      'Field Sales',
      'Sales Engineer',
    ],
  },
  {
    group: 'Marketing',
    titles: [
      'Marketing Specialist',
      'Marketing Coordinator',
      'Content Marketing Manager',
      'Performance Marketing Manager',
      'SEO Manager',
      'SEO Specialist',
      'PPC Manager',
      'Social Media Manager',
      'Brand Manager',
      'Demand Generation Manager',
      'Growth Marketer',
    ],
  },
  {
    group: 'Engineering / IT',
    titles: [
      'Software Engineer',
      'Senior Software Engineer',
      'Staff Engineer',
      'Engineering Manager',
      'DevOps Engineer',
      'Site Reliability Engineer',
      'Data Engineer',
      'Data Scientist',
      'ML Engineer',
      'Solutions Architect',
      'IT Administrator',
      'Systemadministrator',
      'CISO',
      'IT-Leiter',
    ],
  },
  {
    group: 'Operations / Logistik',
    titles: [
      'Operations Specialist',
      'Operations Coordinator',
      'Logistics Coordinator',
      'Supply Chain Analyst',
      'Procurement Specialist',
      'Warehouse Manager',
      'Fulfillment Manager',
      'Lagerleiter',
    ],
  },
  {
    group: 'Finanzen / HR',
    titles: [
      'Controller',
      'Financial Analyst',
      'Accountant',
      'Accounting Manager',
      'HR Business Partner',
      'Recruiter',
      'Talent Acquisition Manager',
      'People Operations Manager',
      'Payroll Specialist',
    ],
  },
];

const ALL_TITLES = APOLLO_TITLE_GROUPS.flatMap((g) => g.titles);

interface Props {
  values: string[];
  onChange: (v: string[]) => void;
}

export default function TitlesMultiSelect({ values, onChange }: Props) {
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

  const toggle = (title: string) => {
    if (values.includes(title)) onChange(values.filter((v) => v !== title));
    else onChange([...values, title]);
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
    if (!q) return APOLLO_TITLE_GROUPS;
    return APOLLO_TITLE_GROUPS.map((g) => ({
      group: g.group,
      titles: g.titles.filter((t) => t.toLowerCase().includes(q)),
    })).filter((g) => g.titles.length > 0);
  }, [query]);

  const queryHasExactMatch = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return ALL_TITLES.some((t) => t.toLowerCase() === q);
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
          border: `0.5px solid ${open ? '#3a2a14' : '#2a2a2a'}`,
          borderRadius: 6,
          padding: '4px 6px',
          minHeight: 28,
          cursor: 'pointer',
        }}
      >
        {values.length === 0 && (
          <span style={{ fontSize: 11, color: '#555', padding: '2px 4px' }}>Titel auswählen…</span>
        )}
        {values.map((t) => (
          <span
            key={t}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              background: '#2a1f10',
              border: '0.5px solid #3a2a14',
              color: '#f59e0b',
              padding: '2px 4px 2px 8px',
              borderRadius: 6,
            }}
          >
            {t}
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onChange(values.filter((x) => x !== t));
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
              placeholder="Suchen oder eigenen Titel eingeben…"
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
                  background: '#2a1f10',
                  border: '0.5px solid #3a2a14',
                  color: '#f59e0b',
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
                Keine Treffer. Enter zum Hinzufügen.
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
                  {g.titles.map((t) => {
                    const selected = values.includes(t);
                    return (
                      <button
                        key={t}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          toggle(t);
                        }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          background: selected ? '#1a1410' : 'transparent',
                          border: 'none',
                          padding: '6px 12px',
                          fontSize: 12,
                          color: selected ? '#f59e0b' : '#bbb',
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
                            border: `0.5px solid ${selected ? '#f59e0b' : '#333'}`,
                            background: selected ? '#f59e0b' : 'transparent',
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
                        {t}
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
            <span>{values.length} ausgewählt</span>
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
                Alle entfernen
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
