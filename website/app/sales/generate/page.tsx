'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  C,
  SvgIcon,
  ICONS,
  PageHeader,
  Breadcrumbs,
  GlowButton,
  GhostButton,
  showToast,
  ProgressRing,
  GLOBAL_STYLES,
} from '../_shared';
import { useLeads, getSupabase } from '../_use-leads';
import DeepResearchTab from './DeepResearchTab';

// ─── DATA: APOLLO TITLE GROUPS ──────────────────────────────────────────────

const APOLLO_TITLE_GROUPS: { group: string; titles: string[] }[] = [
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

// ─── DATA: APOLLO LOCATION GROUPS ───────────────────────────────────────────

const APOLLO_LOCATION_GROUPS: { group: string; locations: string[] }[] = [
  {
    group: 'DACH',
    locations: ['Germany', 'Austria', 'Switzerland', 'Liechtenstein'],
  },
  {
    group: 'Western Europe',
    locations: ['France', 'Belgium', 'Netherlands', 'Luxembourg', 'United Kingdom', 'Ireland', 'Monaco'],
  },
  {
    group: 'Northern Europe',
    locations: ['Denmark', 'Sweden', 'Norway', 'Finland', 'Iceland', 'Estonia', 'Latvia', 'Lithuania'],
  },
  {
    group: 'Southern Europe',
    locations: ['Spain', 'Portugal', 'Italy', 'Greece', 'Malta', 'Cyprus', 'Andorra', 'San Marino'],
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

// ─── TYPES ──────────────────────────────────────────────────────────────────

type Profile = {
  company_name: string;
  company_description: string;
  target_customers: string;
  usp: string;
  sender_name: string;
  sender_role: string;
  services: string;
  excluded_profiles: string;
  deal_size_min: number | null;
  deal_size_max: number | null;
};

type ReasoningResult = {
  success: boolean;
  reasoning: string;
  strategy: string;
  apollo_keywords: string[];
  apollo_industries: string[];
  person_titles?: string[];
  person_locations?: string[];
  refined_employee_min: number;
  refined_employee_max: number;
  confidence: number;
  why_contact_even_if_low_score: string;
  execution_id?: string;
};

type FormData = {
  freetext: string;
};

type SearchHistoryEntry = {
  id: string;          // DB row id
  text: string;        // query
  date: string;        // last_used_at ISO
  favorite: boolean;
};

// ─── PROFILE FIELD LABELS ──────────────────────────────────────────────────

const PROFILE_FIELD_LABELS: Record<string, string> = {
  company_name: 'Firmenname',
  company_description: 'Beschreibung',
  target_customers: 'Zielkunden',
  usp: 'USP',
  sender_name: 'Absender Name',
  sender_role: 'Absender Rolle',
  services: 'Services',
};

// ─── STEP INDICATOR ─────────────────────────────────────────────────────────

type Phase = 'form' | 'analyzing' | 'strategy' | 'scoring' | 'done';

const PHASE_STEPS: { key: Phase; label: string; icon: string }[] = [
  { key: 'analyzing', label: 'Anfrage analysieren', icon: ICONS.spark },
  { key: 'scoring', label: 'Lead Scoring', icon: ICONS.chart },
];

function PhaseIndicator({ phase }: { phase: Phase }) {
  if (phase === 'form' || phase === 'done') return null;
  const phaseOrder: Phase[] = ['analyzing', 'scoring'];
  const currentIdx = phaseOrder.indexOf(phase);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0,
        padding: '20px 0 8px',
        animation: 'fadeIn 0.4s ease both',
      }}
    >
      {PHASE_STEPS.map((s, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        const color = done ? C.success : active ? C.accent : C.text3;
        const bg = done ? 'rgba(52,211,153,0.12)' : active ? C.accentGhost : 'rgba(255,255,255,0.03)';
        const borderColor = done ? 'rgba(52,211,153,0.25)' : active ? 'rgba(99,102,241,0.3)' : C.border;
        return (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: bg,
                  border: `1.5px solid ${borderColor}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease',
                  boxShadow: active ? '0 0 16px rgba(99,102,241,0.2)' : 'none',
                  animation: active ? 'progressPulse 2s ease infinite' : 'none',
                }}
              >
                {done ? (
                  <SvgIcon d={ICONS.check} size={14} color={C.success} />
                ) : (
                  <SvgIcon d={s.icon} size={14} color={color} />
                )}
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: active ? 600 : 400,
                  color,
                  letterSpacing: '0.02em',
                  transition: 'all 0.3s ease',
                }}
              >
                {s.label}
              </span>
            </div>
            {i < PHASE_STEPS.length - 1 && (
              <div
                style={{
                  width: 48,
                  height: 1,
                  background: done ? C.success : C.border,
                  margin: '0 8px',
                  marginBottom: 20,
                  transition: 'background 0.3s ease',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── CHIP INPUT ─────────────────────────────────────────────────────────────

function ChipInput({
  value,
  onChange,
  placeholder,
  chipColor = C.accent,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
  chipColor?: string;
}) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      if (!value.includes(input.trim())) {
        onChange([...value, input.trim()]);
      }
      setInput('');
    }
    if (e.key === 'Backspace' && !input && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6,
        padding: '8px 12px',
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        minHeight: 40,
        cursor: 'text',
        transition: 'border-color 0.2s',
      }}
    >
      {value.map((chip) => (
        <span
          key={chip}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 10px',
            background: `${chipColor}18`,
            border: `1px solid ${chipColor}30`,
            borderRadius: 6,
            fontSize: 12,
            color: chipColor,
            fontWeight: 500,
          }}
        >
          {chip}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onChange(value.filter((c) => c !== chip));
            }}
            style={{
              background: 'none',
              border: 'none',
              color: chipColor,
              cursor: 'pointer',
              padding: 0,
              fontSize: 14,
              lineHeight: 1,
              opacity: 0.7,
            }}
          >
            &times;
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKey}
        placeholder={value.length === 0 ? placeholder : ''}
        style={{
          background: 'none',
          border: 'none',
          outline: 'none',
          color: C.text1,
          fontSize: 13,
          flex: 1,
          minWidth: 80,
          padding: 0,
          fontFamily: 'inherit',
        }}
      />
    </div>
  );
}

// ─── MULTI-SELECT DROPDOWN (grouped) ────────────────────────────────────────

function GroupedMultiSelect({
  groups,
  selected,
  onChange,
  placeholder,
  chipColor = C.accent,
  itemKey = 'items',
}: {
  groups: { group: string; [key: string]: string | string[] }[];
  selected: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
  chipColor?: string;
  itemKey?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filteredGroups = groups
    .map((g) => ({
      group: g.group,
      items: (g[itemKey] as string[]).filter((t) => t.toLowerCase().includes(search.toLowerCase())),
    }))
    .filter((g) => g.items.length > 0);

  function toggle(item: string) {
    onChange(selected.includes(item) ? selected.filter((s) => s !== item) : [...selected, item]);
  }

  function toggleGroup(items: string[]) {
    const allSelected = items.every((i) => selected.includes(i));
    if (allSelected) {
      onChange(selected.filter((s) => !items.includes(s)));
    } else {
      const toAdd = items.filter((i) => !selected.includes(i));
      onChange([...selected, ...toAdd]);
    }
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Selected chips */}
      <div
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          padding: '8px 12px',
          background: C.surface,
          border: `1px solid ${open ? 'rgba(99,102,241,0.3)' : C.border}`,
          borderRadius: 10,
          minHeight: 40,
          cursor: 'pointer',
          transition: 'border-color 0.2s',
        }}
      >
        {selected.length === 0 && <span style={{ color: C.text3, fontSize: 13 }}>{placeholder}</span>}
        {selected.map((item) => (
          <span
            key={item}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 10px',
              background: `${chipColor}18`,
              border: `1px solid ${chipColor}30`,
              borderRadius: 6,
              fontSize: 11,
              color: chipColor,
              fontWeight: 500,
            }}
          >
            {item}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onChange(selected.filter((s) => s !== item));
              }}
              style={{
                background: 'none',
                border: 'none',
                color: chipColor,
                cursor: 'pointer',
                padding: 0,
                fontSize: 13,
                lineHeight: 1,
                opacity: 0.7,
              }}
            >
              &times;
            </button>
          </span>
        ))}
      </div>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 4,
            background: C.surface2,
            border: `1px solid ${C.borderLight}`,
            borderRadius: 10,
            maxHeight: 320,
            overflowY: 'auto',
            zIndex: 50,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            animation: 'fadeIn 0.15s ease',
          }}
        >
          {/* Search */}
          <div style={{ padding: '8px 10px', borderBottom: `1px solid ${C.border}` }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Suchen..."
              autoFocus
              style={{
                width: '100%',
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 6,
                padding: '6px 10px',
                color: C.text1,
                fontSize: 12,
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
          </div>
          {filteredGroups.map((g) => (
            <div key={g.group}>
              <div
                onClick={() => toggleGroup(g.items)}
                style={{
                  padding: '8px 12px',
                  fontSize: 11,
                  fontWeight: 600,
                  color: C.text2,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: `1px solid ${C.border}`,
                  background: 'rgba(255,255,255,0.02)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                }}
              >
                <span>{g.group}</span>
                <span style={{ fontSize: 10, color: C.text3, fontWeight: 400 }}>
                  {g.items.filter((i) => selected.includes(i)).length}/{g.items.length}
                </span>
              </div>
              {g.items.map((item) => {
                const checked = selected.includes(item);
                return (
                  <div
                    key={item}
                    onClick={() => toggle(item)}
                    style={{
                      padding: '6px 12px 6px 24px',
                      fontSize: 12,
                      color: checked ? chipColor : C.text2,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 3,
                        border: `1.5px solid ${checked ? chipColor : C.text3}`,
                        background: checked ? `${chipColor}25` : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'all 0.15s',
                      }}
                    >
                      {checked && <SvgIcon d={ICONS.check} size={10} color={chipColor} />}
                    </div>
                    {item}
                  </div>
                );
              })}
            </div>
          ))}
          {filteredGroups.length === 0 && (
            <div style={{ padding: 16, textAlign: 'center', color: C.text3, fontSize: 12 }}>Keine Ergebnisse</div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── EDITABLE SECTION ───────────────────────────────────────────────────────

function EditableSection({
  label,
  children,
  editing,
  onToggle,
}: {
  label: string;
  children: React.ReactNode;
  editing: boolean;
  onToggle: () => void;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <span
          style={{ fontSize: 11, fontWeight: 600, color: C.text2, textTransform: 'uppercase', letterSpacing: '0.05em' }}
        >
          {label}
        </span>
        <button
          onClick={onToggle}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px 6px',
            borderRadius: 4,
            color: editing ? C.success : C.text3,
            transition: 'color 0.15s',
          }}
        >
          <SvgIcon
            d={
              editing
                ? ICONS.check
                : 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z'
            }
            size={13}
          />
        </button>
      </div>
      {children}
    </div>
  );
}

// ─── ANALYZING LOADING MESSAGES ─────────────────────────────────────────────

const ANALYZING_MESSAGES = [
  'Anfrage wird analysiert...',
  'Zielmarkt wird untersucht...',
  'Suchstrategie wird entwickelt...',
  'Parameter werden optimiert...',
];

// ─── PROFILE REQUIRED FIELDS ────────────────────────────────────────────────

const PROFILE_REQUIRED = [
  'company_name',
  'company_description',
  'target_customers',
  'usp',
  'sender_name',
  'sender_role',
  'services',
] as const;

// ─── LOCAL STORAGE KEYS ─────────────────────────────────────────────────────

const LS_KEY = 'onvero_generate_last_input';

// ─── SEARCH HISTORY HELPERS (server-side via /api/sales/search-history) ────

type HistoryApiRow = { id: string; query: string; is_favorite: boolean; last_used_at: string };

function mapRow(r: HistoryApiRow): SearchHistoryEntry {
  return { id: r.id, text: r.query, favorite: r.is_favorite, date: r.last_used_at };
}

async function fetchHistory(): Promise<SearchHistoryEntry[]> {
  try {
    const res = await fetch('/api/sales/search-history', { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    const rows: HistoryApiRow[] = data.history ?? [];
    return rows.map(mapRow);
  } catch {
    return [];
  }
}

async function recordSearch(query: string): Promise<SearchHistoryEntry | null> {
  try {
    const res = await fetch('/api/sales/search-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.entry ? mapRow(data.entry) : null;
  } catch {
    return null;
  }
}

async function toggleFavoriteRemote(id: string, is_favorite: boolean): Promise<void> {
  try {
    await fetch(`/api/sales/search-history/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_favorite }),
    });
  } catch {
    /* ignore */
  }
}

async function deleteHistoryRemote(id: string): Promise<void> {
  try {
    await fetch(`/api/sales/search-history/${id}`, { method: 'DELETE' });
  } catch {
    /* ignore */
  }
}

function formatRelativeDate(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'heute';
  if (diffDays === 1) return 'gestern';
  return `vor ${diffDays} Tagen`;
}

// ─── MAIN PAGE COMPONENT ───────────────────────────────────────────────────

export default function GeneratePage() {
  const { tenantId } = useLeads();

  // Tab: 'generator' = existing, 'deep-research' = new agent tab
  const [activeTab, setActiveTab] = useState<'generator' | 'deep-research'>('generator');

  // Phase-based flow
  const [phase, setPhase] = useState<Phase>('form');

  // Form data
  const [form, setForm] = useState<FormData>({
    freetext: '',
  });

  // Tutorial collapsed
  const [tutorialOpen, setTutorialOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('onvero_generate_tutorial_open') === '1';
  });

  // Search history
  const [history, setHistory] = useState<SearchHistoryEntry[]>([]);

  // Profile
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileMissing, setProfileMissing] = useState<string[]>([]);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileDraft, setProfileDraft] = useState<Profile | null>(null);

  // Reasoning result
  const [reasoning, setReasoning] = useState<ReasoningResult | null>(null);

  // Loading animation
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);

  // Timer
  const [elapsed, setElapsed] = useState(0);

  // Lead scoring progress
  const [scoredLeads, setScoredLeads] = useState(0);
  const [totalLeads, setTotalLeads] = useState(10);
  const [requestTime, setRequestTime] = useState<string | null>(null);
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [creditBlocked, setCreditBlocked] = useState(false);
  const [scoredList, setScoredList] = useState<
    { lead_id: string; company_name?: string; fit_score?: number; is_excluded?: boolean; scored_at?: string }[]
  >([]);

  // ─── Restore form + history from localStorage on mount ─────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<FormData>;
        setForm((prev) => ({ ...prev, ...parsed }));
      }
    } catch {}
    fetchHistory().then(setHistory);
  }, []);

  // Save form to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(form));
    } catch {}
  }, [form]);

  // ─── Load profile on mount ────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/profile');
        const data = await res.json();
        if (data.profile) {
          setProfile(data.profile);
          setProfileDraft(data.profile);
          const missing = PROFILE_REQUIRED.filter((f) => !data.profile[f]);
          setProfileMissing(missing);
        } else {
          setProfileMissing([...PROFILE_REQUIRED]);
        }
      } catch {
        setProfileMissing([...PROFILE_REQUIRED]);
      } finally {
        setProfileLoading(false);
      }
    })();
  }, []);

  // ─── Loading message cycling (analyzing phase) ─────────────────────────
  useEffect(() => {
    if (phase !== 'analyzing') return;
    const interval = setInterval(() => {
      setLoadingMsgIdx((prev) => (prev + 1) % ANALYZING_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [phase]);

  // ─── Elapsed timer (all loading phases) ───────────────────────────────
  useEffect(() => {
    if (phase === 'form' || phase === 'done') return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  // ─── Poll /api/generate/progress for lead_scored callbacks ────────────
  useEffect(() => {
    if (phase !== 'strategy' && phase !== 'scoring') return;
    let cancelled = false;

    const tick = async () => {
      try {
        const res = await fetch('/api/generate/progress', { cache: 'no-store' });
        if (!res.ok || cancelled) return;
        const data = await res.json();

        const total = typeof data.total_items === 'number' && data.total_items > 0 ? data.total_items : 10;
        const count = typeof data.scored_count === 'number' ? data.scored_count : 0;

        setTotalLeads(total);
        setScoredLeads(count);
        if (Array.isArray(data.scored_leads)) {
          setScoredList(data.scored_leads);
        }

        if (data.status === 'done' || (count > 0 && count >= total)) {
          setPhase('done');
          window.dispatchEvent(new Event('vero:new-leads'));
        }
      } catch {
        /* ignore */
      }
    };

    tick();
    const poll = setInterval(tick, 2000);
    return () => {
      cancelled = true;
      clearInterval(poll);
    };
  }, [phase]);

  // ─── Resume loading state on mount (survives reload + tab switch) ─────
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/generate/progress', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        // Only resume if there's an active in-progress run
        if (
          data.status === 'in_progress' &&
          typeof data.total_items === 'number' &&
          data.total_items > 0 &&
          typeof data.scored_count === 'number' &&
          data.scored_count < data.total_items
        ) {
          setTotalLeads(data.total_items);
          setScoredLeads(data.scored_count);
          if (Array.isArray(data.scored_leads)) setScoredList(data.scored_leads);
          if (data.started_at) setRequestTime(data.started_at);
          setPhase('scoring');
        }
      } catch {
        /* ignore */
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Cancel current scoring run ────────────────────────────────────────
  const handleCancel = useCallback(async () => {
    if (!tenantId) return;
    if (!confirm('Lead-Generierung wirklich abbrechen? Bereits gefundene Leads bleiben gespeichert.')) return;
    try {
      await fetch('/api/generate/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: tenantId, status: 'reset', total_items: 0 }),
      });
    } catch {
      /* ignore */
    }
    setPhase('form');
    setScoredLeads(0);
    setTotalLeads(10);
    setScoredList([]);
    setRequestTime(null);
    setReasoning(null);
    setElapsed(0);
    showToast('Lead-Generierung abgebrochen', 'info');
  }, [tenantId]);

  // ─── Submit form: webhook → strategy → scoring ────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!tenantId) {
      showToast('Nicht angemeldet', 'error');
      return;
    }

    const now = new Date().toISOString();
    setPhase('analyzing');
    setLoadingMsgIdx(0);
    setElapsed(0);
    setReasoning(null);
    setScoredLeads(0);
    setTotalLeads(10);
    setRequestTime(now);
    setCreditBlocked(false);
    setCreditBalance(null);

    // Reset server-side progress for this tenant
    fetch('/api/generate/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenant_id: tenantId, status: 'reset', total_items: 10 }),
    }).catch(() => {});

    // Record search in server-side history (fire-and-forget, then refresh)
    if (form.freetext.trim()) {
      recordSearch(form.freetext.trim()).then(() => {
        fetchHistory().then(setHistory);
      });
    }

    try {
      const res = await fetch('/api/generate/apollo-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ freetext: form.freetext, tenant_id: tenantId }),
      });

      // 402 → Credits exhausted
      if (res.status === 402) {
        const blockedData = await res.json().catch(() => ({}));
        setCreditBalance(blockedData?._credit_summary?.balance_after ?? 0);
        setCreditBlocked(true);
        setPhase('form');
        return;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error('[generate] webhook failed', res.status, err);
        const msg =
          err?.error ||
          (typeof err?.detail === 'string' ? err.detail : null) ||
          `Webhook-Fehler (HTTP ${res.status})`;
        throw new Error(msg);
      }

      const data = await res.json();
      console.log('[generate] webhook response:', data);

      // Capture selected_count (fallback: always 10)
      const selected = typeof data.selected_count === 'number' && data.selected_count > 0 ? data.selected_count : 10;
      setTotalLeads(selected);

      // Sync total with server-side progress state
      fetch('/api/generate/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: tenantId, total_items: selected }),
      }).catch(() => {});

      // Capture credit balance
      if (data._credit_summary?.balance_after !== undefined) {
        setCreditBalance(data._credit_summary.balance_after);
      }

      // Show strategy/reasoning immediately and start scoring phase right away —
      // the progress bar + counter appear alongside the strategy cards.
      setReasoning(data);
      setPhase('scoring');
    } catch (e) {
      console.error('Submit error:', e);
      showToast(e instanceof Error ? e.message : 'Fehler bei der Analyse', 'error');
      setPhase('form');
    }
  }, [form, tenantId]);

  // ─── Save profile ─────────────────────────────────────────────────────
  const handleSaveProfile = useCallback(async () => {
    if (!profileDraft) return;
    try {
      const method = profile ? 'PATCH' : 'POST';
      const res = await fetch('/api/profile', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileDraft),
      });
      const data = await res.json();
      if (data.profile) {
        setProfile(data.profile);
        setProfileDraft(data.profile);
        const missing = PROFILE_REQUIRED.filter((f) => !data.profile[f]);
        setProfileMissing(missing);
        setEditingProfile(false);
        showToast('Profil gespeichert', 'success');
      }
    } catch {
      showToast('Fehler beim Speichern', 'error');
    }
  }, [profile, profileDraft]);

  // ─── Formatters ───────────────────────────────────────────────────────
  function formatTime(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  // ─── Card style helper ────────────────────────────────────────────────
  const cardStyle: React.CSSProperties = {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    padding: 24,
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    padding: '10px 14px',
    color: C.text1,
    fontSize: 13,
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    color: C.text2,
    marginBottom: 6,
    display: 'block',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  // ─── RENDER ───────────────────────────────────────────────────────────

  return (
    <div style={{ padding: '0 24px 60px' }}>
      <style>{GLOBAL_STYLES}</style>
      <style>{`
        @keyframes spinLoader {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeInMsg {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes progressPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes breatheGlow {
          0%, 100% { box-shadow: 0 2px 16px rgba(99,102,241,0.25), 0 0 24px rgba(99,102,241,0.1); }
          50% { box-shadow: 0 2px 24px rgba(99,102,241,0.4), 0 0 40px rgba(99,102,241,0.2); }
        }
        @keyframes sparkPulse {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.15); }
        }
        @keyframes borderGradient {
          0% { border-color: rgba(99,102,241,0.15); }
          50% { border-color: rgba(99,102,241,0.35); }
          100% { border-color: rgba(99,102,241,0.15); }
        }
        @keyframes dashFlow {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -12; }
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: ${C.accent};
          border: 2px solid ${C.surface};
          box-shadow: 0 0 8px rgba(99,102,241,0.4);
          cursor: pointer;
        }
        input[type="range"]::-webkit-slider-runnable-track {
          height: 4px;
          border-radius: 2px;
          background: ${C.border};
        }
      `}</style>

      <Breadcrumbs
        items={[
          { label: 'Onvero Sales', href: '/sales' },
          { label: 'Leads', href: '/sales/unternehmen' },
          { label: 'Lead Generator' },
        ]}
      />

      <div style={{ marginTop: 16 }}>
        <PageHeader title="Lead Generator" subtitle="Automatische Lead-Recherche" />
      </div>

      <>
      <PhaseIndicator phase={phase} />

      {/* ═══════════════════ FORM ═══════════════════ */}
      {phase === 'form' &&
        (() => {
          const profilePct = Math.round(
            ((PROFILE_REQUIRED.length - profileMissing.length) / PROFILE_REQUIRED.length) * 100
          );
          const canSubmit = form.freetext.trim().length > 0;

          return (
            <div style={{ animation: 'fadeInUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) both' }}>
              {/* Credit-warning banner */}
              {creditBlocked && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '14px 18px',
                    marginTop: 16,
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, rgba(248,113,113,0.08), rgba(248,113,113,0.03))',
                    border: '1px solid rgba(248,113,113,0.25)',
                    animation: 'fadeInUp 0.3s ease both',
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: 'rgba(248,113,113,0.12)',
                      border: '1px solid rgba(248,113,113,0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <SvgIcon
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                      size={14}
                      color="#F87171"
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#F87171' }}>Credits aufgebraucht</div>
                    <div style={{ fontSize: 12, color: C.text2, marginTop: 2 }}>
                      {creditBalance !== null ? `Verbleibendes Guthaben: ${creditBalance} Credits.` : ''} Upgrade auf einen höheren Plan, um weiter Leads zu generieren.
                    </div>
                  </div>
                  <Link
                    href="/sales/settings?section=plan"
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#fff',
                      background: 'linear-gradient(135deg, #6366F1, #818CF8)',
                      padding: '8px 16px',
                      borderRadius: 8,
                      textDecoration: 'none',
                      flexShrink: 0,
                    }}
                  >
                    Upgrade &rarr;
                  </Link>
                </div>
              )}

              {/* ── 1. Hero Section ── */}
              <div style={{ textAlign: 'center', marginTop: 28, marginBottom: 32, animation: 'fadeIn 0.5s ease both' }}>
                <h2
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    margin: 0,
                    background: 'linear-gradient(135deg, #A5B4FC 0%, #818CF8 40%, #6366F1 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  Beschreibe deine Zielgruppe
                  <span style={{ display: 'inline-flex', animation: 'sparkPulse 2.5s ease infinite' }}>
                    <SvgIcon d={ICONS.spark} size={22} color={C.accentBright} />
                  </span>
                </h2>
                <p style={{ fontSize: 14, color: C.text2, margin: '10px 0 0', fontWeight: 400 }}>
                  Finde die passenden Entscheider f&uuml;r dich
                </p>
              </div>

              {/* ── 2. Main Textarea Card ── */}
              <div
                style={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 14,
                  padding: 32,
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                  animation: 'fadeInUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(99,102,241,0.25)';
                  e.currentTarget.style.boxShadow = '0 4px 32px rgba(99,102,241,0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = C.border;
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Profile incomplete inline warning */}
                {!profileLoading && profileMissing.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      flexWrap: 'wrap',
                      padding: '8px 14px',
                      marginBottom: 20,
                      background: C.warningBg,
                      borderRadius: 8,
                      border: `1px solid ${C.warningBorder}`,
                    }}
                  >
                    <SvgIcon
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                      size={14}
                      color={C.warning}
                    />
                    <span style={{ fontSize: 12, color: C.warning, fontWeight: 500 }}>Profil unvollst&auml;ndig</span>
                    {profileMissing.map((field) => (
                      <span
                        key={field}
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          background: `${C.warning}18`,
                          border: `1px solid ${C.warning}30`,
                          borderRadius: 5,
                          fontSize: 10,
                          color: C.warning,
                          fontWeight: 500,
                        }}
                      >
                        {PROFILE_FIELD_LABELS[field] || field}
                      </span>
                    ))}
                    <Link
                      href="/sales/settings"
                      style={{
                        fontSize: 11,
                        color: C.accent,
                        textDecoration: 'none',
                        fontWeight: 500,
                        marginLeft: 'auto',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Beheben &rarr;
                    </Link>
                  </div>
                )}

                <textarea
                  value={form.freetext}
                  onChange={(e) => setForm({ ...form, freetext: e.target.value })}
                  placeholder="Beschreibe in natürlicher Sprache, wen du erreichen möchtest. z.B. 'E-Commerce Manager in mittelständischen Modeunternehmen, die ihren Online-Shop optimieren wollen' oder 'Geschäftsführer von Logistikunternehmen mit 50-500 Mitarbeitern in der DACH-Region'"
                  rows={7}
                  style={{
                    ...inputStyle,
                    resize: 'vertical',
                    minHeight: 160,
                    lineHeight: 1.7,
                    fontSize: 14,
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(99,102,241,0.35)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.08)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = C.border;
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />

                {/* Bottom row: char counter + submit */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 14,
                  }}
                >
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 11,
                      color: C.text3,
                      maxWidth: '70%',
                    }}
                  >
                    <SvgIcon d={ICONS.spark} size={11} color={C.text3} />
                    <span>
                      Mehr Kontext = <strong style={{ color: C.text2, fontWeight: 500 }}>präzisere Ergebnisse</strong> · Zielgruppe, Branche, Standort, Pain Points, Größe
                    </span>
                  </span>

                  <button
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className="s-primary-glow"
                    style={{
                      background: canSubmit ? 'linear-gradient(135deg, #6366F1, #818CF8)' : C.surface2,
                      color: canSubmit ? '#fff' : C.text3,
                      border: canSubmit ? 'none' : `1px solid ${C.border}`,
                      borderRadius: 10,
                      padding: '13px 36px',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: canSubmit ? 'pointer' : 'not-allowed',
                      fontFamily: 'inherit',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      transition: 'all 0.2s ease',
                      animation: canSubmit ? 'breatheGlow 2.5s ease infinite' : 'none',
                      boxShadow: canSubmit
                        ? '0 2px 16px rgba(99,102,241,0.25), inset 0 1px 0 rgba(255,255,255,0.15)'
                        : 'none',
                    }}
                  >
                    <SvgIcon d={ICONS.spark} size={15} />
                    Generate &rarr;
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                        padding: '2px 7px',
                        borderRadius: 999,
                        background: canSubmit ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.04)',
                        color: canSubmit ? '#fff' : C.text3,
                        border: canSubmit ? '1px solid rgba(255,255,255,0.22)' : `1px solid ${C.border}`,
                        marginLeft: 4,
                      }}
                    >
                      5 Cr
                    </span>
                  </button>
                </div>
              </div>

              {/* ── 3. "So funktioniert's" — collapsible ── */}
              <div style={{ marginTop: 36, animation: 'fadeInUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.2s both' }}>
                <button
                  onClick={() => {
                    const next = !tutorialOpen;
                    setTutorialOpen(next);
                    localStorage.setItem('onvero_generate_tutorial_open', next ? '1' : '0');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: tutorialOpen ? 18 : 0,
                    fontFamily: 'inherit',
                  }}
                >
                  <svg
                    width={12}
                    height={12}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={C.text3}
                    strokeWidth={2}
                    strokeLinecap="round"
                    style={{
                      transition: 'transform 0.2s ease',
                      transform: tutorialOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                    }}
                  >
                    <path d="M9 5l7 7-7 7" />
                  </svg>
                  <h3
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: C.text2,
                      margin: 0,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                    }}
                  >
                    So funktioniert&apos;s
                  </h3>
                </button>
                {tutorialOpen && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0, position: 'relative' }}>
                    {/* Connecting dashed line */}
                    <svg
                      style={{
                        position: 'absolute',
                        top: 20,
                        left: 'calc(16.66% + 20px)',
                        width: 'calc(66.66% - 40px)',
                        height: 2,
                        overflow: 'visible',
                        zIndex: 0,
                        pointerEvents: 'none',
                      }}
                    >
                      <line
                        x1="0"
                        y1="0"
                        x2="100%"
                        y2="0"
                        stroke={C.border}
                        strokeWidth="2"
                        strokeDasharray="6 6"
                        style={{ animation: 'dashFlow 8s linear infinite' }}
                      />
                    </svg>

                    {[
                      {
                        icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z',
                        step: '01',
                        title: 'Beschreiben',
                        desc: 'Du beschreibst in eigenen Worten wen du suchst \u2014 Branche, Rolle, Region, Technologie.',
                      },
                      {
                        icon: ICONS.spark,
                        step: '02',
                        title: 'Analyse',
                        desc: 'Deine Kriterien werden verfeinert, die optimale Suche gebaut und die Strategie angezeigt.',
                      },
                      {
                        icon: ICONS.zap,
                        step: '03',
                        title: 'Leads erscheinen',
                        desc: 'In ~2 Minuten werden deine Leads generiert, gescored und mit E-Mail-Drafts versehen.',
                      },
                    ].map((item, i) => (
                      <div
                        key={item.step}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          textAlign: 'center',
                          padding: '0 20px',
                          position: 'relative',
                          zIndex: 1,
                          animation: 'fadeInUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
                          animationDelay: `${0.3 + i * 0.12}s`,
                        }}
                      >
                        {/* Icon circle */}
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(129,140,248,0.08))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 12,
                            boxShadow: '0 0 16px rgba(99,102,241,0.12)',
                            flexShrink: 0,
                          }}
                        >
                          <SvgIcon d={item.icon} size={18} color={C.accentBright} />
                        </div>
                        {/* Step number */}
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            color: C.accent,
                            letterSpacing: '0.08em',
                            marginBottom: 4,
                          }}
                        >
                          {item.step}
                        </span>
                        {/* Title */}
                        <span style={{ fontSize: 14, fontWeight: 600, color: C.text1, marginBottom: 6 }}>
                          {item.title}
                        </span>
                        {/* Description */}
                        <span style={{ fontSize: 12, color: C.text3, lineHeight: 1.5 }}>{item.desc}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── 4. Bottom Row: History + Profile Status ── */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 20,
                  marginTop: 32,
                  animation: 'fadeInUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.4s both',
                }}
              >
                {/* Left: Letzte Suchanfragen */}
                <div
                  style={{
                    ...cardStyle,
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <h3
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: C.text1,
                      margin: '0 0 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <SvgIcon d={ICONS.clock} size={14} color={C.accent} />
                    Letzte Suchanfragen
                  </h3>

                  {history.length === 0 ? (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '28px 0',
                        gap: 10,
                      }}
                    >
                      <SvgIcon d={ICONS.clock} size={28} color={C.text3} />
                      <span style={{ fontSize: 12, color: C.text3 }}>Deine Suchanfragen erscheinen hier</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {[...history]
                        .sort((a, b) => (a.favorite === b.favorite ? 0 : a.favorite ? -1 : 1))
                        .slice(0, 5)
                        .map((entry, i) => (
                          <div
                            key={`${entry.date}-${i}`}
                            style={{
                              background: entry.favorite ? 'rgba(251,191,36,0.04)' : 'rgba(255,255,255,0.02)',
                              border: `1px solid ${entry.favorite ? 'rgba(251,191,36,0.15)' : C.border}`,
                              borderRadius: 8,
                              padding: '10px 12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              transition: 'all 0.15s ease',
                              cursor: 'pointer',
                            }}
                            onClick={() => setForm({ freetext: entry.text })}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)';
                              e.currentTarget.style.boxShadow = '0 0 12px rgba(99,102,241,0.06)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = entry.favorite ? 'rgba(251,191,36,0.15)' : C.border;
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          >
                            {/* Favorite star */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const next = !entry.favorite;
                                // Optimistic update
                                setHistory((prev) => prev.map((h) => (h.id === entry.id ? { ...h, favorite: next } : h)));
                                toggleFavoriteRemote(entry.id, next);
                              }}
                              title={entry.favorite ? 'Favorit entfernen' : 'Als Favorit markieren'}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 0,
                                flexShrink: 0,
                                display: 'flex',
                                alignItems: 'center',
                              }}
                            >
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill={entry.favorite ? '#FBBF24' : 'none'}
                                stroke={entry.favorite ? '#FBBF24' : C.text3}
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{ transition: 'all 0.15s ease' }}
                              >
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                              </svg>
                            </button>

                            <span
                              style={{
                                fontSize: 12,
                                color: C.text1,
                                lineHeight: 1.4,
                                flex: 1,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {entry.text.length > 80 ? entry.text.slice(0, 80) + '...' : entry.text}
                            </span>

                            <span style={{ fontSize: 10, color: C.text3, whiteSpace: 'nowrap', flexShrink: 0 }}>
                              {formatRelativeDate(entry.date)}
                            </span>

                            {/* Delete button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // Optimistic remove
                                setHistory((prev) => prev.filter((h) => h.id !== entry.id));
                                deleteHistoryRemote(entry.id);
                                showToast('Suchanfrage gelöscht', 'info');
                              }}
                              title="Löschen"
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 2,
                                flexShrink: 0,
                                display: 'flex',
                                alignItems: 'center',
                                opacity: 0.4,
                                transition: 'opacity 0.15s',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.opacity = '1';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.opacity = '0.4';
                              }}
                            >
                              <SvgIcon d={ICONS.x} size={12} color={C.danger} />
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Right: Profil-Status */}
                <div
                  style={{
                    ...cardStyle,
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <h3
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: C.text1,
                      margin: '0 0 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <SvgIcon
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      size={14}
                      color={C.accent}
                    />
                    Profil-Vollst&auml;ndigkeit
                  </h3>

                  {profileLoading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 0' }}>
                      <span style={{ fontSize: 12, color: C.text3 }}>Laden...</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                      <ProgressRing
                        value={profilePct}
                        max={100}
                        size={56}
                        strokeWidth={4}
                        color={profilePct === 100 ? C.success : C.accent}
                        label={`${profilePct}%`}
                      />
                      <div style={{ flex: 1 }}>
                        {profilePct === 100 ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: C.success,
                                boxShadow: `0 0 8px ${C.success}60`,
                              }}
                            />
                            <span style={{ fontSize: 13, color: C.success, fontWeight: 600 }}>Bereit</span>
                          </div>
                        ) : (
                          <div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                              {profileMissing.map((field) => (
                                <span
                                  key={field}
                                  style={{
                                    display: 'inline-block',
                                    padding: '2px 8px',
                                    background: C.warningBg,
                                    border: `1px solid ${C.warningBorder}`,
                                    borderRadius: 5,
                                    fontSize: 10,
                                    color: C.warning,
                                    fontWeight: 500,
                                  }}
                                >
                                  {PROFILE_FIELD_LABELS[field] || field}
                                </span>
                              ))}
                            </div>
                            <Link
                              href="/sales/settings"
                              style={{
                                fontSize: 11,
                                color: C.accent,
                                textDecoration: 'none',
                                fontWeight: 500,
                              }}
                            >
                              Profil vervollst&auml;ndigen &rarr;
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

      {/* ═══════════════════ ANALYZING ═══════════════════ */}
      {phase === 'analyzing' && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 400,
            gap: 24,
            animation: 'fadeIn 0.5s ease both',
          }}
        >
          <style>{`
            @keyframes drSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            @keyframes drPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
            @keyframes drFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
            @keyframes scoreBar { from { width: 0; } }
          `}</style>

          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              border: '3px solid rgba(99,102,241,0.1)',
              borderTopColor: C.accent,
              animation: 'drSpin 0.9s linear infinite',
            }}
          />

          <div style={{ fontSize: 17, fontWeight: 600, color: C.text1 }}>
            Anfrage analysieren
          </div>

          <div
            key={loadingMsgIdx}
            style={{
              fontSize: 13,
              color: C.text3,
              animation: 'drPulse 2s ease infinite',
            }}
          >
            {ANALYZING_MESSAGES[loadingMsgIdx]}
          </div>

          <div
            style={{
              fontSize: 11,
              color: C.text3,
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
              marginTop: 4,
            }}
          >
            {formatTime(elapsed)}
          </div>
        </div>
      )}

      {/* ═══════════════════ STRATEGY ═══════════════════ */}
      {phase === 'strategy' && reasoning && (
        <div
          style={{
            maxWidth: 640,
            margin: '32px auto 0',
            animation: 'fadeInUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
          }}
        >
          {/* Reasoning Card */}
          {reasoning.reasoning && (
            <div
              style={{
                ...cardStyle,
                marginBottom: 16,
                animation: 'drFadeIn 0.5s ease both',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 7,
                    background: C.accentGhost,
                    border: '1px solid rgba(99,102,241,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <SvgIcon
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    size={14}
                    color={C.accent}
                  />
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.text1 }}>Reasoning</span>
              </div>
              <div style={{ fontSize: 13, color: C.text2, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                {reasoning.reasoning}
              </div>
            </div>
          )}

          {/* Strategy Card */}
          {reasoning.strategy && (
            <div
              style={{
                ...cardStyle,
                marginBottom: 16,
                animation: 'drFadeIn 0.5s ease 0.15s both',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 7,
                    background: 'rgba(52,211,153,0.1)',
                    border: '1px solid rgba(52,211,153,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <SvgIcon d={ICONS.chart} size={14} color={C.success} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.text1 }}>Strategie</span>
              </div>
              <div style={{ fontSize: 13, color: C.text2, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                {reasoning.strategy}
              </div>
            </div>
          )}

          {/* Still loading indicator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              padding: '14px 20px',
              background: C.accentGhost,
              border: '1px solid rgba(99,102,241,0.1)',
              borderRadius: 10,
              animation: 'drFadeIn 0.5s ease 0.3s both',
            }}
          >
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                border: '2px solid rgba(99,102,241,0.15)',
                borderTopColor: C.accent,
                animation: 'drSpin 0.9s linear infinite',
              }}
            />
            <span style={{ fontSize: 12, color: C.accent, fontWeight: 500 }}>
              Lead Scoring wird vorbereitet...
            </span>
            <span
              style={{
                fontSize: 11,
                color: C.text3,
                fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                marginLeft: 'auto',
              }}
            >
              {formatTime(elapsed)}
            </span>
          </div>
        </div>
      )}

      {/* ═══════════════════ SCORING ═══════════════════ */}
      {phase === 'scoring' && (
        <div
          style={{
            maxWidth: 640,
            margin: '32px auto 0',
            animation: 'fadeInUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
          }}
        >
          {/* Full reasoning + strategy cards (shown throughout scoring) */}
          {reasoning?.reasoning && (
            <div style={{ ...cardStyle, marginBottom: 16, animation: 'drFadeIn 0.5s ease both' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div
                  style={{
                    width: 28, height: 28, borderRadius: 7,
                    background: C.accentGhost,
                    border: '1px solid rgba(99,102,241,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <SvgIcon
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    size={14}
                    color={C.accent}
                  />
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.text1 }}>Reasoning</span>
              </div>
              <div style={{ fontSize: 13, color: C.text2, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                {reasoning.reasoning}
              </div>
            </div>
          )}

          {reasoning?.strategy && (
            <div style={{ ...cardStyle, marginBottom: 20, animation: 'drFadeIn 0.5s ease 0.1s both' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div
                  style={{
                    width: 28, height: 28, borderRadius: 7,
                    background: 'rgba(52,211,153,0.1)',
                    border: '1px solid rgba(52,211,153,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <SvgIcon d={ICONS.chart} size={14} color={C.success} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.text1 }}>Strategie</span>
              </div>
              <div style={{ fontSize: 13, color: C.text2, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                {reasoning.strategy}
              </div>
            </div>
          )}

          {/* Lead Scoring Header */}
          <div style={{ textAlign: 'center', marginBottom: 20, marginTop: 8 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: C.text1, marginBottom: 4 }}>
              Lead Scoring
            </div>
            <div style={{ fontSize: 12, color: C.text3 }}>
              {scoredLeads < totalLeads
                ? 'Leads werden bewertet und qualifiziert…'
                : 'Alle Leads bewertet'}
            </div>
          </div>

          {/* Scoring Progress */}
          <div style={{ ...cardStyle, textAlign: 'center' }}>
            {/* Big number */}
            <div
              style={{
                fontSize: 48,
                fontWeight: 700,
                fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                color: C.accent,
                lineHeight: 1,
                marginBottom: 8,
              }}
            >
              {scoredLeads}
              <span style={{ fontSize: 20, color: C.text3, fontWeight: 400 }}>
                {' '}/{' '}{totalLeads || 10}
              </span>
            </div>
            <div style={{ fontSize: 12, color: C.text3, marginBottom: 20 }}>
              Leads gescored
            </div>

            {/* Progress bar */}
            <div
              style={{
                height: 8,
                borderRadius: 4,
                background: C.surface2,
                overflow: 'hidden',
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: totalLeads > 0 ? `${Math.min((scoredLeads / totalLeads) * 100, 100)}%` : '5%',
                  borderRadius: 4,
                  background: 'linear-gradient(90deg, #6366F1, #818CF8, #A5B4FC)',
                  transition: 'width 0.5s ease',
                  boxShadow: '0 0 12px rgba(99,102,241,0.3)',
                  animation: totalLeads === 0 ? 'scoreBar 1.5s ease infinite alternate' : 'none',
                }}
              />
            </div>

            {/* Timer */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 11,
                color: C.text3,
                fontFamily: 'ui-monospace, SFMono-Regular, monospace',
              }}
            >
              <span>{formatTime(elapsed)}</span>
              <span>{totalLeads > 0 ? `${Math.round((scoredLeads / totalLeads) * 100)}%` : '...'}</span>
            </div>
          </div>

          {/* Activity indicator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              marginTop: 20,
              padding: '14px 20px',
              background: C.accentGhost,
              border: '1px solid rgba(99,102,241,0.1)',
              borderRadius: 10,
            }}
          >
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                border: '2px solid rgba(99,102,241,0.15)',
                borderTopColor: C.accent,
                animation: 'drSpin 0.9s linear infinite',
              }}
            />
            <span style={{ fontSize: 12, color: C.accent, fontWeight: 500 }}>
              {scoredLeads === 0
                ? 'Leads werden gefunden und analysiert…'
                : scoredLeads < totalLeads
                  ? `Bewerte Lead ${scoredLeads + 1} von ${totalLeads}…`
                  : 'Fertig!'}
            </span>
          </div>

          {/* Cancel button */}
          {scoredLeads < totalLeads && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
              <button
                onClick={handleCancel}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 16px',
                  borderRadius: 8,
                  background: 'transparent',
                  border: `1px solid ${C.border}`,
                  color: C.text3,
                  fontSize: 11.5,
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(248,113,113,0.35)';
                  e.currentTarget.style.color = C.danger;
                  e.currentTarget.style.background = 'rgba(248,113,113,0.04)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = C.border;
                  e.currentTarget.style.color = C.text3;
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
                Abbrechen
              </button>
            </div>
          )}

          {/* Scored leads list */}
          {scoredList.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  color: C.text3,
                  textTransform: 'uppercase',
                  marginBottom: 10,
                }}
              >
                Bewertete Leads ({scoredList.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {scoredList
                  .slice()
                  .reverse()
                  .map((l, i) => {
                    const score = typeof l.fit_score === 'number' ? l.fit_score : null;
                    const scoreColor =
                      score === null
                        ? C.text3
                        : score >= 70
                          ? C.success
                          : score >= 45
                            ? C.warning
                            : C.danger;
                    return (
                      <div
                        key={l.lead_id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '10px 14px',
                          borderRadius: 9,
                          background: C.surface,
                          border: `1px solid ${C.border}`,
                          animation: i === 0 ? 'fadeInUp 0.3s cubic-bezier(0.22,1,0.36,1) both' : 'none',
                        }}
                      >
                        <SvgIcon d={ICONS.check} size={12} color={C.success} />
                        <span
                          style={{
                            flex: 1,
                            fontSize: 13,
                            color: C.text1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {l.company_name ?? 'Unbekanntes Unternehmen'}
                        </span>
                        {l.is_excluded && (
                          <span
                            style={{
                              fontSize: 9,
                              padding: '2px 7px',
                              borderRadius: 5,
                              background: 'rgba(248,113,113,0.08)',
                              border: '1px solid rgba(248,113,113,0.2)',
                              color: C.danger,
                              fontWeight: 600,
                              letterSpacing: '0.04em',
                              textTransform: 'uppercase',
                            }}
                          >
                            Excluded
                          </span>
                        )}
                        {score !== null && (
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                              color: scoreColor,
                              background: `${scoreColor}14`,
                              border: `1px solid ${scoreColor}30`,
                              padding: '3px 9px',
                              borderRadius: 7,
                              minWidth: 40,
                              textAlign: 'center',
                            }}
                          >
                            {score}
                          </span>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════ DONE ═══════════════════ */}
      {phase === 'done' && (
        <div
          style={{
            maxWidth: 520,
            margin: '80px auto 0',
            textAlign: 'center',
            animation: 'fadeInUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              margin: '0 auto 20px',
              borderRadius: '50%',
              background: 'rgba(52,211,153,0.1)',
              border: '1px solid rgba(52,211,153,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 32px rgba(52,211,153,0.15)',
            }}
          >
            <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>

          <h2 style={{ fontSize: 24, fontWeight: 700, color: C.text1, margin: '0 0 8px' }}>
            Fertig!
          </h2>
          <p style={{ fontSize: 14, color: C.text2, margin: '0 0 12px', lineHeight: 1.6 }}>
            {scoredLeads > 0
              ? `${scoredLeads} Leads wurden erfolgreich generiert und bewertet.`
              : 'Die Lead-Generierung wurde abgeschlossen.'}
          </p>
          <p style={{ fontSize: 12, color: C.text3, margin: '0 0 32px' }}>
            Dauer: {formatTime(elapsed)}
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Link
              href="/sales/unternehmen"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 28px',
                background: 'linear-gradient(135deg, #059669, #34D399)',
                color: '#fff',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                textDecoration: 'none',
                boxShadow: '0 2px 16px rgba(52,211,153,0.3)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = 'brightness(1.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = 'brightness(1)';
              }}
            >
              &rarr; Zu den Leads
            </Link>
            <button
              onClick={() => {
                setPhase('form');
                setForm({ freetext: '' });
                setReasoning(null);
                setElapsed(0);
                setScoredLeads(0);
                setTotalLeads(0);
              }}
              style={{
                padding: '12px 24px',
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                fontSize: 13,
                color: C.text2,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = C.border;
              }}
            >
              Neue Suche
            </button>
          </div>
        </div>
      )}

      </>
    </div>
  );
}
