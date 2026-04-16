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
  text: string;
  date: string;
  favorite?: boolean;
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

const STEPS = [
  {
    label: 'Beschreiben',
    icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z',
  },
  { label: 'KI-Analyse', icon: ICONS.spark },
  { label: 'Überprüfen', icon: ICONS.check },
  { label: 'Generieren', icon: ICONS.zap },
];

function StepIndicator({ current }: { current: number }) {
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
      {STEPS.map((step, i) => {
        const done = i < current;
        const active = i === current;
        const color = done ? C.success : active ? C.accent : C.text3;
        const bg = done ? 'rgba(52,211,153,0.12)' : active ? C.accentGhost : 'rgba(255,255,255,0.03)';
        const borderColor = done ? 'rgba(52,211,153,0.25)' : active ? 'rgba(99,102,241,0.3)' : C.border;
        return (
          <div key={step.label} style={{ display: 'flex', alignItems: 'center' }}>
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
                  boxShadow: active ? `0 0 16px rgba(99,102,241,0.2)` : 'none',
                }}
              >
                <SvgIcon d={step.icon} size={14} color={color} />
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
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
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

// ─── LOADING MESSAGES ───────────────────────────────────────────────────────

const LOADING_MESSAGES = [
  'KI analysiert deine Suchkriterien...',
  'Branchen und Zielgruppen werden identifiziert...',
  'Suchstrategie wird optimiert...',
  'Suchparameter werden optimiert...',
  'Fast fertig...',
];

// ─── GENERATING STEP MESSAGES ───────────────────────────────────────────────

const GENERATING_STEPS = [
  { label: 'KI-Analyse', icon: ICONS.spark },
  { label: 'Datenbank-Suche', icon: ICONS.search },
  { label: 'Website-Analyse', icon: ICONS.globe },
  { label: 'KI-Scoring', icon: ICONS.chart },
  { label: 'Ergebnisse', icon: ICONS.check },
];

const GENERATING_MESSAGES = [
  { time: 0, text: 'Lead-Generierung gestartet...' },
  { time: 5, text: 'Datenbank wird durchsucht...' },
  { time: 15, text: 'Unternehmensdaten werden angereichert...' },
  { time: 30, text: 'Websites werden analysiert...' },
  { time: 50, text: 'KI bewertet Lead-Qualität...' },
  { time: 70, text: 'Ergebnisse werden zusammengestellt...' },
  { time: 85, text: 'Finalisierung...' },
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
const LS_HISTORY_KEY = 'onvero_generate_history';

// ─── SEARCH HISTORY HELPERS ─────────────────────────────────────────────────

function loadHistory(): SearchHistoryEntry[] {
  try {
    const raw = localStorage.getItem(LS_HISTORY_KEY);
    if (raw) return (JSON.parse(raw) as SearchHistoryEntry[]).filter((e) => typeof e.text === 'string');
  } catch {}
  return [];
}

function saveHistory(entries: SearchHistoryEntry[]) {
  try {
    localStorage.setItem(LS_HISTORY_KEY, JSON.stringify(entries.slice(0, 10)));
  } catch {}
}

function addToHistory(text: string): SearchHistoryEntry[] {
  const existing = loadHistory();
  const entry: SearchHistoryEntry = { text, date: new Date().toISOString() };
  // Remove duplicate if exists
  const filtered = existing.filter((e) => e.text !== text);
  const updated = [entry, ...filtered].slice(0, 10);
  saveHistory(updated);
  return updated;
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

  // Wizard step
  const [step, setStep] = useState(0);

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
  const [showReasoning, setShowReasoning] = useState(false);

  // Editable reasoning fields
  const [editKeywords, setEditKeywords] = useState(false);
  const [editIndustries, setEditIndustries] = useState(false);
  const [editTitles, setEditTitles] = useState(false);
  const [editLocations, setEditLocations] = useState(false);
  const [editEmployees, setEditEmployees] = useState(false);

  const [rKeywords, setRKeywords] = useState<string[]>([]);
  const [rIndustries, setRIndustries] = useState<string[]>([]);
  const [rTitles, setRTitles] = useState<string[]>([]);
  const [rLocations, setRLocations] = useState<string[]>([]);
  const [rEmployeeMin, setREmployeeMin] = useState(1);
  const [rEmployeeMax, setREmployeeMax] = useState(10000);

  // Lead count
  const [leadCount, setLeadCount] = useState(50);

  // Loading
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);

  // Generating
  const [genProgress, setGenProgress] = useState(0);
  const [genElapsed, setGenElapsed] = useState(0);
  const [genDone, setGenDone] = useState(false);
  const [genStep, setGenStep] = useState(0);
  const genTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Restore form + history from localStorage on mount ─────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<FormData>;
        setForm((prev) => ({ ...prev, ...parsed }));
      }
    } catch {}
    setHistory(loadHistory());
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

  // ─── Loading message cycling ──────────────────────────────────────────
  useEffect(() => {
    if (step !== 1) return;
    const interval = setInterval(() => {
      setLoadingMsgIdx((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [step]);

  // ─── Generating progress timer ────────────────────────────────────────
  useEffect(() => {
    if (step !== 3) return;
    const start = Date.now();
    const totalDuration = 90; // seconds

    genTimerRef.current = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      setGenElapsed(Math.floor(elapsed));
      const progress = Math.min((elapsed / totalDuration) * 100, 100);
      setGenProgress(progress);

      // Update generating step
      if (elapsed < 10) setGenStep(0);
      else if (elapsed < 25) setGenStep(1);
      else if (elapsed < 45) setGenStep(2);
      else if (elapsed < 70) setGenStep(3);
      else setGenStep(4);

      if (elapsed >= totalDuration) {
        setGenDone(true);
        if (genTimerRef.current) clearInterval(genTimerRef.current);
      }
    }, 250);

    return () => {
      if (genTimerRef.current) clearInterval(genTimerRef.current);
    };
  }, [step]);

  // ─── Submit form (step 0 → 1 → 2) ────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!tenantId) {
      showToast('Nicht angemeldet', 'error');
      return;
    }
    setStep(1);
    setLoadingMsgIdx(0);

    // Add to search history
    if (form.freetext.trim()) {
      const updated = addToHistory(form.freetext.trim());
      setHistory(updated);
    }

    try {
      const body: Record<string, unknown> = {
        freetext: form.freetext,
        employee_min: 1,
        employee_max: 10000,
        lead_source: 'apollo',
        tenant_id: tenantId,
      };

      const res = await fetch('/api/generate/reasoning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      console.log('[generate] reasoning response:', data);

      setReasoning(data);
      setRKeywords(data.apollo_keywords || []);
      setRIndustries(data.apollo_industries || []);
      setRTitles(data.person_titles || []);
      setRLocations(data.person_locations || []);
      setREmployeeMin(data.refined_employee_min || 1);
      setREmployeeMax(data.refined_employee_max || 10000);
      setStep(2);
    } catch {
      // Fallback: use freetext as base so the user can still proceed
      setReasoning({
        success: true,
        reasoning: `Suche basierend auf: "${form.freetext.slice(0, 100)}"`,
        strategy: 'Standard Apollo-Suche mit deinen Kriterien.',
        apollo_keywords: [],
        apollo_industries: [],
        person_titles: [],
        person_locations: [],
        refined_employee_min: 1,
        refined_employee_max: 10000,
        confidence: 50,
        why_contact_even_if_low_score: 'Auch Leads mit niedrigerem Score können wertvolle Kontakte sein.',
      });
      setStep(2);
    }
  }, [form, tenantId]);

  // ─── Trigger generation (step 2 → 3) ─────────────────────────────────
  const handleGenerate = useCallback(async () => {
    if (!reasoning?.execution_id) {
      showToast('Keine Execution-ID', 'error');
      return;
    }

    // Update execution params if edited
    try {
      const upd = await fetch(`/api/generate/execution/${reasoning.execution_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apollo_keywords: rKeywords,
          apollo_industries: rIndustries,
          person_titles: rTitles,
          person_locations: rLocations,
          refined_employee_min: rEmployeeMin,
          refined_employee_max: rEmployeeMax,
          lead_count: leadCount,
        }),
      });
      if (!upd.ok) {
        const err = await upd.json().catch(() => ({}));
        console.error('Execution update failed:', err);
        showToast(err.error ?? 'Anpassungen konnten nicht gespeichert werden', 'error');
        return;
      }
    } catch (e) {
      console.error('Execution update error:', e);
      showToast('Netzwerkfehler beim Speichern', 'error');
      return;
    }

    setStep(3);
    setGenProgress(0);
    setGenElapsed(0);
    setGenDone(false);
    setGenStep(0);

    try {
      const triggerRes = await fetch('/api/generate/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          profile_id: 'default',
          execution_id: reasoning.execution_id,
          lead_count: leadCount,
          on_demand: {
            execution_id: reasoning.execution_id,
            apollo_industries: rIndustries,
            apollo_keywords: rKeywords,
            person_titles: rTitles,
            person_locations: rLocations,
            refined_employee_min: rEmployeeMin,
            refined_employee_max: rEmployeeMax,
            lead_count: leadCount,
          },
        }),
      });
      if (!triggerRes.ok) {
        const err = await triggerRes.json().catch(() => ({}));
        console.error('Trigger failed:', err);
        showToast(err.error ?? 'Workflow konnte nicht gestartet werden', 'error');
        setStep(2);
        return;
      }
    } catch {
      // Generation continues in background even if request times out
    }
  }, [reasoning, rKeywords, rIndustries, rTitles, rLocations, rEmployeeMin, rEmployeeMax, leadCount, tenantId]);

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

  function getGenMessage(): string {
    let msg = GENERATING_MESSAGES[0].text;
    for (const m of GENERATING_MESSAGES) {
      if (genElapsed >= m.time) msg = m.text;
    }
    return msg;
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
          { label: 'Leads', href: '/sales/leads' },
          { label: 'Lead Generator' },
        ]}
      />

      <div style={{ marginTop: 16 }}>
        <PageHeader title="Lead Generator" subtitle="KI-gestützte Lead-Recherche" />
      </div>

      {/* ─── TAB SWITCHER ─── */}
      <div
        style={{
          display: 'flex',
          gap: 2,
          marginTop: 20,
          marginBottom: 8,
          background: 'rgba(255,255,255,0.03)',
          borderRadius: 10,
          padding: 3,
          border: `1px solid ${C.border}`,
          width: 'fit-content',
        }}
      >
        {([
          { key: 'generator' as const, label: 'Lead Generator', icon: ICONS.zap },
          { key: 'deep-research' as const, label: 'Deep Research', icon: ICONS.spark },
        ]).map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '8px 18px',
                borderRadius: 8,
                border: 'none',
                background: active ? 'rgba(255,255,255,0.07)' : 'transparent',
                color: active ? C.text1 : C.text3,
                fontSize: 12.5,
                fontWeight: active ? 600 : 400,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.2s ease',
                boxShadow: active ? '0 1px 4px rgba(0,0,0,0.2)' : 'none',
              }}
            >
              <SvgIcon d={tab.icon} size={13} color={active ? (tab.key === 'deep-research' ? '#34D399' : C.accent) : C.text3} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'deep-research' ? (
        <DeepResearchTab tenantId={tenantId} />
      ) : (
      <>
      <StepIndicator current={step} />

      {/* ═══════════════════ STEP 0: FORM ═══════════════════ */}
      {step === 0 &&
        (() => {
          const profilePct = Math.round(
            ((PROFILE_REQUIRED.length - profileMissing.length) / PROFILE_REQUIRED.length) * 100
          );
          const canSubmit = form.freetext.length >= 100;

          return (
            <div style={{ animation: 'fadeInUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) both' }}>
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
                  Unsere KI findet die passenden Entscheider f&uuml;r dich
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
                  <span style={{ fontSize: 11, color: C.text3 }}>{form.freetext.length}/100 Zeichen minimum</span>

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
                    KI-Analyse starten &rarr;
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
                        desc: 'Du sagst der KI in eigenen Worten wen du suchst \u2014 Branche, Rolle, Region, Technologie.',
                      },
                      {
                        icon: ICONS.spark,
                        step: '02',
                        title: 'KI analysiert',
                        desc: 'Die KI verfeinert deine Kriterien, baut die optimale Suche und zeigt dir die Strategie.',
                      },
                      {
                        icon: ICONS.zap,
                        step: '03',
                        title: 'Leads erscheinen',
                        desc: 'In ~2 Minuten werden deine Leads generiert, KI-gescored und mit E-Mail-Drafts versehen.',
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
                                const updated = history.map((h) =>
                                  h.date === entry.date && h.text === entry.text ? { ...h, favorite: !h.favorite } : h
                                );
                                setHistory(updated);
                                saveHistory(updated);
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
                                const updated = history.filter(
                                  (h) => !(h.date === entry.date && h.text === entry.text)
                                );
                                setHistory(updated);
                                saveHistory(updated);
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

      {/* ═══════════════════ STEP 1: LOADING ═══════════════════ */}
      {step === 1 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 400,
            gap: 32,
            animation: 'fadeIn 0.5s ease both',
          }}
        >
          {/* Spinner */}
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              border: `3px solid ${C.border}`,
              borderTopColor: C.accent,
              animation: 'spinLoader 1s linear infinite',
            }}
          />

          {/* Cycling message */}
          <div
            key={loadingMsgIdx}
            style={{
              fontSize: 15,
              color: C.text1,
              fontWeight: 500,
              animation: 'fadeInMsg 0.4s ease both',
              textAlign: 'center',
            }}
          >
            {LOADING_MESSAGES[loadingMsgIdx]}
          </div>

          {/* Dot indicators */}
          <div style={{ display: 'flex', gap: 8 }}>
            {LOADING_MESSAGES.map((_, i) => (
              <div
                key={i}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: i === loadingMsgIdx ? C.accent : C.text3,
                  transition: 'all 0.3s ease',
                  transform: i === loadingMsgIdx ? 'scale(1.3)' : 'scale(1)',
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════ STEP 2: REASONING (Review & Edit) ═══════════════════ */}
      {step === 2 && reasoning && (
        <div style={{ animation: 'fadeInUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) both', marginTop: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Left: KI-Analyse */}
            <div style={cardStyle}>
              <h3
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: C.text1,
                  margin: '0 0 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <SvgIcon d={ICONS.spark} size={14} color={C.accent} />
                KI-Analyse
              </h3>

              {/* Reasoning text (collapsible) */}
              <button
                onClick={() => setShowReasoning(!showReasoning)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  marginBottom: showReasoning ? 8 : 16,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 11,
                  color: C.text3,
                  fontFamily: 'inherit',
                  letterSpacing: '0.03em',
                }}
              >
                <span style={{ transform: showReasoning ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', display: 'inline-block', fontSize: 9 }}>▶</span>
                Reasoning
              </button>
              {showReasoning && (
                <div style={{ fontSize: 11, color: C.text3, lineHeight: 1.65, marginBottom: 16, whiteSpace: 'pre-wrap' }}>
                  {reasoning.reasoning}
                </div>
              )}

              {/* Strategy */}
              <div
                style={{
                  background: C.accentGhost,
                  border: `1px solid rgba(99,102,241,0.15)`,
                  borderRadius: 8,
                  padding: '10px 14px',
                  marginBottom: 20,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: C.accent,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Strategie
                </span>
                <p style={{ fontSize: 12, color: C.text2, margin: '6px 0 0', lineHeight: 1.6 }}>{reasoning.strategy}</p>
              </div>

              {/* Editable: Keywords */}
              <EditableSection label="Keywords" editing={editKeywords} onToggle={() => setEditKeywords(!editKeywords)}>
                {editKeywords ? (
                  <ChipInput
                    value={rKeywords}
                    onChange={setRKeywords}
                    placeholder="Keyword hinzufügen"
                    chipColor={C.accent}
                  />
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {rKeywords.map((kw) => (
                      <span
                        key={kw}
                        style={{
                          padding: '4px 10px',
                          background: `${C.accent}18`,
                          border: `1px solid ${C.accent}30`,
                          borderRadius: 6,
                          fontSize: 11,
                          color: C.accent,
                          fontWeight: 500,
                        }}
                      >
                        {kw}
                      </span>
                    ))}
                    {rKeywords.length === 0 && <span style={{ fontSize: 12, color: C.text3 }}>Keine Keywords</span>}
                  </div>
                )}
              </EditableSection>

              {/* Editable: Industries */}
              <EditableSection
                label="Branchen"
                editing={editIndustries}
                onToggle={() => setEditIndustries(!editIndustries)}
              >
                {editIndustries ? (
                  <ChipInput
                    value={rIndustries}
                    onChange={setRIndustries}
                    placeholder="Branche hinzufügen"
                    chipColor={C.success}
                  />
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {rIndustries.map((ind) => (
                      <span
                        key={ind}
                        style={{
                          padding: '4px 10px',
                          background: `${C.success}18`,
                          border: `1px solid ${C.success}30`,
                          borderRadius: 6,
                          fontSize: 11,
                          color: C.success,
                          fontWeight: 500,
                        }}
                      >
                        {ind}
                      </span>
                    ))}
                    {rIndustries.length === 0 && <span style={{ fontSize: 12, color: C.text3 }}>Keine Branchen</span>}
                  </div>
                )}
              </EditableSection>

              {/* Editable: Titles */}
              <EditableSection label="Jobtitel" editing={editTitles} onToggle={() => setEditTitles(!editTitles)}>
                {editTitles ? (
                  <GroupedMultiSelect
                    groups={APOLLO_TITLE_GROUPS}
                    selected={rTitles}
                    onChange={setRTitles}
                    placeholder="Titel auswählen..."
                    chipColor={C.warning}
                    itemKey="titles"
                  />
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {rTitles.map((t) => (
                      <span
                        key={t}
                        style={{
                          padding: '4px 10px',
                          background: `${C.warning}18`,
                          border: `1px solid ${C.warning}30`,
                          borderRadius: 6,
                          fontSize: 11,
                          color: C.warning,
                          fontWeight: 500,
                        }}
                      >
                        {t}
                      </span>
                    ))}
                    {rTitles.length === 0 && <span style={{ fontSize: 12, color: C.text3 }}>Keine Titel</span>}
                  </div>
                )}
              </EditableSection>

              {/* Editable: Locations */}
              <EditableSection
                label="Standorte"
                editing={editLocations}
                onToggle={() => setEditLocations(!editLocations)}
              >
                {editLocations ? (
                  <GroupedMultiSelect
                    groups={APOLLO_LOCATION_GROUPS}
                    selected={rLocations}
                    onChange={setRLocations}
                    placeholder="Standorte auswählen..."
                    chipColor={C.purple}
                    itemKey="locations"
                  />
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {rLocations.map((l) => (
                      <span
                        key={l}
                        style={{
                          padding: '4px 10px',
                          background: `${C.purple}18`,
                          border: `1px solid ${C.purple}30`,
                          borderRadius: 6,
                          fontSize: 11,
                          color: C.purple,
                          fontWeight: 500,
                        }}
                      >
                        {l}
                      </span>
                    ))}
                    {rLocations.length === 0 && <span style={{ fontSize: 12, color: C.text3 }}>Keine Standorte</span>}
                  </div>
                )}
              </EditableSection>

              {/* Editable: Employees */}
              <EditableSection
                label="Mitarbeiterzahl"
                editing={editEmployees}
                onToggle={() => setEditEmployees(!editEmployees)}
              >
                {editEmployees ? (
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <input
                      type="number"
                      value={rEmployeeMin}
                      onChange={(e) => setREmployeeMin(parseInt(e.target.value) || 1)}
                      min={1}
                      style={{ ...inputStyle, width: 100 }}
                    />
                    <span style={{ color: C.text3, fontSize: 12 }}>bis</span>
                    <input
                      type="number"
                      value={rEmployeeMax}
                      onChange={(e) => setREmployeeMax(parseInt(e.target.value) || 10000)}
                      min={1}
                      style={{ ...inputStyle, width: 100 }}
                    />
                  </div>
                ) : (
                  <span style={{ fontSize: 13, color: C.text1 }}>
                    {rEmployeeMin.toLocaleString('de-DE')} – {rEmployeeMax.toLocaleString('de-DE')} Mitarbeiter
                  </span>
                )}
              </EditableSection>


              {/* Low score info */}
              {reasoning.why_contact_even_if_low_score && (
                <div
                  style={{
                    background: C.infoBg,
                    border: `1px solid ${C.infoBorder}`,
                    borderRadius: 8,
                    padding: '10px 14px',
                    marginTop: 16,
                    display: 'flex',
                    gap: 10,
                    alignItems: 'flex-start',
                  }}
                >
                  <SvgIcon d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" size={14} color={C.info} />
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: C.info }}>Auch bei niedrigem Score</span>
                    <p style={{ fontSize: 12, color: C.text2, margin: '4px 0 0', lineHeight: 1.5 }}>
                      {reasoning.why_contact_even_if_low_score}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Unternehmensprofil */}
            <div style={cardStyle}>
              <h3
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: C.text1,
                  margin: '0 0 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <SvgIcon d={ICONS.settings} size={14} color={C.accent} />
                Unternehmensprofil
              </h3>

              {profileLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      border: `2px solid ${C.border}`,
                      borderTopColor: C.accent,
                      animation: 'spinLoader 1s linear infinite',
                    }}
                  />
                </div>
              ) : !profile && !editingProfile ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <p style={{ fontSize: 13, color: C.text3, marginBottom: 12 }}>Kein Profil vorhanden</p>
                  <button
                    onClick={() => {
                      setProfileDraft({
                        company_name: '',
                        company_description: '',
                        target_customers: '',
                        usp: '',
                        sender_name: '',
                        sender_role: '',
                        services: '',
                        excluded_profiles: '',
                        deal_size_min: null,
                        deal_size_max: null,
                      });
                      setEditingProfile(true);
                    }}
                    style={{
                      background: C.accentGhost,
                      border: `1px solid rgba(99,102,241,0.2)`,
                      borderRadius: 8,
                      padding: '8px 16px',
                      color: C.accent,
                      fontSize: 12,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    Profil erstellen
                  </button>
                </div>
              ) : (
                <div>
                  {!editingProfile ? (
                    <>
                      {/* Read-only profile fields */}
                      {[
                        { label: 'Firmenname', key: 'company_name' },
                        { label: 'Beschreibung', key: 'company_description' },
                        { label: 'Zielkunden', key: 'target_customers' },
                        { label: 'USP', key: 'usp' },
                        { label: 'Services', key: 'services' },
                        { label: 'Ausgeschlossene Profile', key: 'excluded_profiles' },
                        { label: 'Absender Name', key: 'sender_name' },
                        { label: 'Absender Rolle', key: 'sender_role' },
                      ].map((f) => (
                        <div key={f.key} style={{ marginBottom: 12 }}>
                          <span style={{ ...labelStyle, marginBottom: 2 }}>{f.label}</span>
                          <p
                            style={{
                              fontSize: 13,
                              color: (profile as Record<string, unknown>)?.[f.key] ? C.text1 : C.text3,
                              margin: 0,
                              lineHeight: 1.5,
                            }}
                          >
                            {((profile as Record<string, unknown>)?.[f.key] as string) || '—'}
                          </p>
                        </div>
                      ))}
                      <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                        <div>
                          <span style={{ ...labelStyle, marginBottom: 2 }}>Deal Min</span>
                          <p style={{ fontSize: 13, color: profile?.deal_size_min ? C.text1 : C.text3, margin: 0 }}>
                            {profile?.deal_size_min ? `${profile.deal_size_min.toLocaleString('de-DE')} €` : '—'}
                          </p>
                        </div>
                        <div>
                          <span style={{ ...labelStyle, marginBottom: 2 }}>Deal Max</span>
                          <p style={{ fontSize: 13, color: profile?.deal_size_max ? C.text1 : C.text3, margin: 0 }}>
                            {profile?.deal_size_max ? `${profile.deal_size_max.toLocaleString('de-DE')} €` : '—'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setEditingProfile(true)}
                        style={{
                          background: 'none',
                          border: `1px solid ${C.border}`,
                          borderRadius: 8,
                          padding: '6px 14px',
                          color: C.text2,
                          fontSize: 12,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)';
                          e.currentTarget.style.color = C.accentBright;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = C.border;
                          e.currentTarget.style.color = C.text2;
                        }}
                      >
                        <SvgIcon
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          size={12}
                        />
                        Bearbeiten
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Editable profile fields */}
                      {[
                        { label: 'Firmenname', key: 'company_name', type: 'text' },
                        { label: 'Beschreibung', key: 'company_description', type: 'textarea' },
                        { label: 'Zielkunden', key: 'target_customers', type: 'textarea' },
                        { label: 'USP', key: 'usp', type: 'textarea' },
                        { label: 'Services', key: 'services', type: 'textarea' },
                        { label: 'Ausgeschlossene Profile', key: 'excluded_profiles', type: 'textarea' },
                        { label: 'Absender Name', key: 'sender_name', type: 'text' },
                        { label: 'Absender Rolle', key: 'sender_role', type: 'text' },
                      ].map((f) => (
                        <div key={f.key} style={{ marginBottom: 12 }}>
                          <label style={labelStyle}>{f.label}</label>
                          {f.type === 'textarea' ? (
                            <textarea
                              value={((profileDraft as Record<string, unknown>)?.[f.key] as string) || ''}
                              onChange={(e) =>
                                setProfileDraft((prev) => (prev ? { ...prev, [f.key]: e.target.value } : prev))
                              }
                              rows={3}
                              style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }}
                            />
                          ) : (
                            <input
                              value={((profileDraft as Record<string, unknown>)?.[f.key] as string) || ''}
                              onChange={(e) =>
                                setProfileDraft((prev) => (prev ? { ...prev, [f.key]: e.target.value } : prev))
                              }
                              style={inputStyle}
                            />
                          )}
                        </div>
                      ))}
                      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                        <div style={{ flex: 1 }}>
                          <label style={labelStyle}>Deal Min (€)</label>
                          <input
                            type="number"
                            value={profileDraft?.deal_size_min ?? ''}
                            onChange={(e) =>
                              setProfileDraft((prev) =>
                                prev
                                  ? { ...prev, deal_size_min: e.target.value ? parseInt(e.target.value) : null }
                                  : prev
                              )
                            }
                            style={inputStyle}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={labelStyle}>Deal Max (€)</label>
                          <input
                            type="number"
                            value={profileDraft?.deal_size_max ?? ''}
                            onChange={(e) =>
                              setProfileDraft((prev) =>
                                prev
                                  ? { ...prev, deal_size_max: e.target.value ? parseInt(e.target.value) : null }
                                  : prev
                              )
                            }
                            style={inputStyle}
                          />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                        <button
                          onClick={handleSaveProfile}
                          className="s-primary"
                          style={{
                            background: 'linear-gradient(135deg, #6366F1, #818CF8)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 8,
                            padding: '8px 18px',
                            fontSize: 12,
                            fontWeight: 500,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                          }}
                        >
                          Speichern
                        </button>
                        <button
                          onClick={() => {
                            setEditingProfile(false);
                            setProfileDraft(profile);
                          }}
                          style={{
                            background: 'none',
                            border: `1px solid ${C.border}`,
                            borderRadius: 8,
                            padding: '8px 18px',
                            fontSize: 12,
                            color: C.text2,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                          }}
                        >
                          Abbrechen
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Lead count slider */}
          <div style={{ ...cardStyle, marginTop: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>Anzahl Leads</label>
              <span
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: C.accent,
                  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                }}
              >
                {leadCount}
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              step={5}
              value={leadCount}
              onChange={(e) => setLeadCount(parseInt(e.target.value))}
              style={{
                width: '100%',
                appearance: 'none',
                WebkitAppearance: 'none',
                height: 4,
                borderRadius: 2,
                background: `linear-gradient(to right, ${C.accent} 0%, ${C.accent} ${((leadCount - 10) / 90) * 100}%, ${C.border} ${((leadCount - 10) / 90) * 100}%, ${C.border} 100%)`,
                outline: 'none',
                cursor: 'pointer',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontSize: 10, color: C.text3 }}>10</span>
              <span style={{ fontSize: 10, color: C.text3 }}>100</span>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
            <button
              onClick={() => setStep(0)}
              className="s-ghost"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${C.border}`,
                color: C.text2,
                borderRadius: 10,
                padding: '12px 24px',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              &larr; Anpassen
            </button>
            <button
              onClick={handleGenerate}
              className="s-primary-glow"
              style={{
                background: 'linear-gradient(135deg, #6366F1, #818CF8)',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                padding: '12px 28px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                boxShadow: '0 2px 16px rgba(99,102,241,0.25), inset 0 1px 0 rgba(255,255,255,0.15)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <SvgIcon d={ICONS.zap} size={14} />
              Leads generieren &rarr;
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════ STEP 3: GENERATING ═══════════════════ */}
      {step === 3 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingTop: 40,
            animation: 'fadeIn 0.5s ease both',
          }}
        >
          {/* Progress bar */}
          <div style={{ width: '100%', maxWidth: 480 }}>
            <div
              style={{
                height: 8,
                borderRadius: 4,
                background: C.surface2,
                overflow: 'hidden',
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${genProgress}%`,
                  borderRadius: 4,
                  background: genDone ? C.success : 'linear-gradient(90deg, #6366F1, #818CF8, #A5B4FC)',
                  transition: 'width 0.5s ease',
                  boxShadow: genDone ? `0 0 12px ${C.success}40` : '0 0 12px rgba(99,102,241,0.3)',
                }}
              />
            </div>

            {/* Timer + percentage */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
              <span style={{ fontSize: 13, color: C.text2, fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}>
                {formatTime(genElapsed)}
              </span>
              <span
                style={{
                  fontSize: 13,
                  color: C.text2,
                  fontWeight: 600,
                  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                }}
              >
                {Math.round(genProgress)}%
              </span>
            </div>
          </div>

          {/* Status message */}
          <div
            key={getGenMessage()}
            style={{
              fontSize: 15,
              color: C.text1,
              fontWeight: 500,
              marginBottom: 40,
              animation: 'fadeInMsg 0.4s ease both',
              textAlign: 'center',
            }}
          >
            {genDone ? 'Lead-Generierung abgeschlossen!' : getGenMessage()}
          </div>

          {/* Step tracker */}
          <div style={{ ...cardStyle, width: '100%', maxWidth: 480 }}>
            {GENERATING_STEPS.map((s, i) => {
              const done = i < genStep || genDone;
              const active = i === genStep && !genDone;
              return (
                <div
                  key={s.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 0',
                    borderBottom: i < GENERATING_STEPS.length - 1 ? `1px solid ${C.border}` : 'none',
                  }}
                >
                  {/* Icon */}
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: done ? 'rgba(52,211,153,0.12)' : active ? C.accentGhost : 'rgba(255,255,255,0.03)',
                      border: `1.5px solid ${
                        done ? 'rgba(52,211,153,0.3)' : active ? 'rgba(99,102,241,0.3)' : C.border
                      }`,
                      flexShrink: 0,
                      animation: active ? 'progressPulse 2s ease infinite' : 'none',
                    }}
                  >
                    {done ? (
                      <SvgIcon d={ICONS.check} size={12} color={C.success} />
                    ) : (
                      <SvgIcon d={s.icon} size={12} color={active ? C.accent : C.text3} />
                    )}
                  </div>

                  {/* Label */}
                  <span
                    style={{
                      fontSize: 13,
                      color: done ? C.success : active ? C.text1 : C.text3,
                      fontWeight: active ? 600 : 400,
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {s.label}
                  </span>

                  {/* Status */}
                  {done && <span style={{ marginLeft: 'auto', fontSize: 11, color: C.success }}>Fertig</span>}
                  {active && (
                    <span
                      style={{
                        marginLeft: 'auto',
                        fontSize: 11,
                        color: C.accent,
                        animation: 'progressPulse 2s ease infinite',
                      }}
                    >
                      Läuft...
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Done link */}
          {genDone && (
            <Link
              href="/sales/leads"
              style={{
                marginTop: 32,
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
                animation: 'fadeInUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = 'brightness(1.15)';
                e.currentTarget.style.boxShadow = '0 4px 24px rgba(52,211,153,0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = 'brightness(1)';
                e.currentTarget.style.boxShadow = '0 2px 16px rgba(52,211,153,0.3)';
              }}
            >
              &rarr; Zu den Leads
            </Link>
          )}
        </div>
      )}
      </>
      )}
    </div>
  );
}
