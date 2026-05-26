'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowUpIcon,
  PaperclipIcon,
  PlusIcon,
  LayersIcon,
  TelescopeIcon,
  PanelLeftIcon,
  PanelLeftCloseIcon,
  SparklesIcon,
} from 'lucide-react';
import { useTheme, colors } from '../layout';
import { useToast } from '../_toast';
import { GlassPageFilters } from '@/components/ui/liquid-glass-card';
import { GlassButton } from '@/components/ui/glass-button';

// ─── Data ─────────────────────────────────────────────────────────────────────

const SOURCES = [
  { id: 'google_maps', label: 'Google Maps' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'web', label: 'Web' },
] as const;

type SourceId = (typeof SOURCES)[number]['id'];

type DiscoveryResult = {
  name: string;
  city: string;
  industry: string;
  employees: string;
  source: string;
};

type Message = {
  id: string;
  role: 'user' | 'bot';
  text: string;
  results?: DiscoveryResult[];
  loading?: boolean;
};

type SessionGroup = 'Heute' | 'Gestern' | 'Diese Woche' | 'Früher';

type ResearchMode = 'bulk' | 'deep';

type BulkSetup = {
  angebotsProfileId: string | null;
  weitereQueries: string[];
  kriterien: string;
  orte: string[];
};

function emptyBulkSetup(): BulkSetup {
  return { angebotsProfileId: null, weitereQueries: [], kriterien: '', orte: [] };
}

type BulkOutreach = {
  absenderProfileId: string | null;
  rollen: string[];
  rollenCustom: string[];
  nachricht: string;
};

function emptyBulkOutreach(): BulkOutreach {
  return { absenderProfileId: null, rollen: [], rollenCustom: [], nachricht: '' };
}

const ROLLEN: string[] = [
  'CEO / Geschäftsführung',
  'CMO / Marketing',
  'CTO / IT',
  'CFO / Finance',
  'COO / Operations',
  'Vertriebsleitung',
  'Einkauf / Procurement',
  'HR',
];

type AngebotsProfileLite = {
  id: string;
  name: string;
  unternehmen: string;
};

type AbsenderProfileLite = {
  id: string;
  name: string;
};

const ABSENDER_STORAGE = 'onvero.settings.absenderProfile.v1';

type BulkStep = 'setup' | 'outreach';

// ─── Deep-Research types ──────────────────────────────────────────────────────

type DeepSetup = {
  angebotsProfileId: string | null;
  rechercheFokus: string;
  weitereQueries: string[];
  kriterien: string[];
  orte: string[];
};

function emptyDeepSetup(): DeepSetup {
  return { angebotsProfileId: null, rechercheFokus: '', weitereQueries: [], kriterien: [], orte: [] };
}

type DeepConfig = {
  sources: string[];
  scoringFit: number;
  scoringIntent: number;
  scoringTiming: number;
};

function emptyDeepConfig(): DeepConfig {
  return { sources: ['LinkedIn-Profile', 'Tech-Stack', 'News & Signals'], scoringFit: 50, scoringIntent: 30, scoringTiming: 20 };
}

const ENRICH_SOURCES: string[] = [
  'LinkedIn-Profile',
  'Tech-Stack',
  'Mitarbeiter & Rollen',
  'News & Signals',
  'Website-Inhalt',
  'Finanzen / Funding',
  'Job-Postings',
  'Tracker / Pixel',
];

type DeepStep = 'setup' | 'scoring';

type DeepResult = DiscoveryResult & { score?: number; url?: string };

function deepLeadKey(r: DeepResult, i: number): string {
  return r.url || `${r.name}__${r.city}__${i}`;
}

function normalizeUrl(u: string | undefined | null): string | null {
  if (!u) return null;
  const trimmed = u.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

type ChatSession = {
  id: string;
  title: string;
  preview: string;
  time: string;
  group: SessionGroup;
  messages: Message[];
  sources: Set<SourceId>;
  mode?: ResearchMode;
  bulkSetup?: BulkSetup;
  bulkResults?: DiscoveryResult[];
  bulkGenerating?: boolean;
  bulkStep?: BulkStep;
  bulkOutreach?: BulkOutreach;
  bulkLaunching?: boolean;
  bulkLaunched?: boolean;
  bulkLaunchedAt?: number;
  deepSetup?: DeepSetup;
  deepStep?: DeepStep;
  deepConfig?: DeepConfig;
  deepRawResults?: DeepResult[];
  deepResults?: DeepResult[];
  deepSelectedKeys?: string[];
  deepGenerating?: boolean;
  deepPreScoring?: boolean;
  deepLaunching?: boolean;
  deepLaunched?: boolean;
};

const DEMO_RESPONSES: { keywords: string[]; reply: string; results: DiscoveryResult[] }[] = [
  {
    keywords: ['möbel', 'einrichtung', 'furniture', 'interior', 'wohnen', 'home'],
    reply: 'Verstanden — suche nach Möbel- und Einrichtungsunternehmen über die ausgewählten Quellen.',
    results: [
      {
        name: 'Wohnwerk Hamburg GmbH',
        city: 'Hamburg',
        industry: 'Möbel & Einrichtung',
        employees: '45–80',
        source: 'Google Maps',
      },
      {
        name: 'Stilhaus Berlin AG',
        city: 'Berlin',
        industry: 'Interior Design',
        employees: '20–40',
        source: 'LinkedIn',
      },
      { name: 'Formschön München', city: 'München', industry: 'Möbelhandel', employees: '10–25', source: 'Web' },
      {
        name: 'Nordisk Living GmbH',
        city: 'Köln',
        industry: 'Skandinavisches Design',
        employees: '30–60',
        source: 'Google Maps',
      },
      {
        name: 'Lofthaus Stuttgart',
        city: 'Stuttgart',
        industry: 'Premium-Möbel',
        employees: '15–30',
        source: 'LinkedIn',
      },
    ],
  },
  {
    keywords: ['mode', 'fashion', 'kleidung', 'textil', 'bekleidung'],
    reply: 'Fashion & Mode — suche gezielt nach Händlern und Brands.',
    results: [
      {
        name: 'Stylehaus AG',
        city: 'Düsseldorf',
        industry: 'Mode & Bekleidung',
        employees: '60–120',
        source: 'LinkedIn',
      },
      { name: 'Urban Threads GmbH', city: 'Hamburg', industry: 'Streetwear', employees: '20–45', source: 'Web' },
      {
        name: 'Modekontor Nürnberg',
        city: 'Nürnberg',
        industry: 'Textilhandel',
        employees: '30–50',
        source: 'Google Maps',
      },
    ],
  },
  {
    keywords: ['software', 'saas', 'tech', 'it', 'digital', 'app'],
    reply: 'B2B-Software & SaaS — durchsuche LinkedIn und Web.',
    results: [
      {
        name: 'CloudBase Solutions GmbH',
        city: 'München',
        industry: 'B2B SaaS',
        employees: '25–60',
        source: 'LinkedIn',
      },
      { name: 'Flowmatic AG', city: 'Berlin', industry: 'Process Automation', employees: '40–80', source: 'Web' },
      {
        name: 'DataBridge GmbH',
        city: 'Frankfurt',
        industry: 'Data & Analytics',
        employees: '15–35',
        source: 'LinkedIn',
      },
    ],
  },
  {
    keywords: ['sport', 'fitness', 'outdoor', 'athletics'],
    reply: 'Sport & Outdoor — starte Suche über alle aktiven Quellen.',
    results: [
      { name: 'Sportivo GmbH', city: 'Frankfurt', industry: 'Sportartikel', employees: '30–60', source: 'Web' },
      {
        name: 'ActiveZone AG',
        city: 'München',
        industry: 'Fitness & Wellness',
        employees: '20–40',
        source: 'LinkedIn',
      },
    ],
  },
];

const FALLBACK = {
  reply: 'Starte eine breite Suche basierend auf deiner Beschreibung.',
  results: [
    { name: 'Mustermann Handel GmbH', city: 'Berlin', industry: 'E-Commerce', employees: '20–50', source: 'Web' },
    { name: 'Beispiel AG', city: 'München', industry: 'Retail', employees: '50–100', source: 'LinkedIn' },
  ],
};

function getResponse(text: string) {
  const lower = text.toLowerCase();
  return DEMO_RESPONSES.find((r) => r.keywords.some((k) => lower.includes(k))) ?? FALLBACK;
}

// ─── Webhook response → DeepResult[] (flexible parser) ──────────────────────
function extractDeepLeads(payload: unknown): DeepResult[] {
  if (!payload) return [];

  let arr: unknown[] = [];
  if (Array.isArray(payload)) {
    arr = payload;
  } else if (typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    for (const key of ['leads', 'companies', 'results', 'items', 'data']) {
      const v = obj[key];
      if (Array.isArray(v)) {
        arr = v;
        break;
      }
    }
    if (arr.length === 0 && (obj.company_name || obj.name || obj.website || obj.domain)) {
      arr = [obj];
    }
  }

  return arr.map((raw) => {
    const r = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
    const str = (v: unknown): string => (typeof v === 'string' ? v : v == null ? '' : String(v));
    const name = str(r.company_name ?? r.name ?? r.firma ?? 'Unbekannt');
    const city = str(r.city ?? r.location ?? r.standort ?? r.ort ?? '');
    const industry = str(r.industry ?? r.branche ?? r.sector ?? '');
    const employees = str(r.employees ?? r.employee_count ?? r.mitarbeiter ?? r.size ?? '');
    const source = str(r.source ?? r.quelle ?? 'Web');
    const urlRaw = str(
      r.url ?? r.website ?? r.homepage ?? r.link ?? r.domain ?? r.web ?? '',
    );
    const url = urlRaw ? (normalizeUrl(urlRaw) ?? undefined) : undefined;
    const scoreRaw = r.score ?? r.fit_score ?? r.lead_score;
    const score =
      typeof scoreRaw === 'number'
        ? Math.round(scoreRaw)
        : typeof scoreRaw === 'string' && scoreRaw.length > 0
          ? Math.round(Number(scoreRaw))
          : undefined;
    return { name, city, industry, employees, source, score, url };
  });
}

// ─── Seed sessions ─────────────────────────────────────────────────────────────

const möbelResponse = DEMO_RESPONSES[0];
const modeResponse = DEMO_RESPONSES[1];
const softwareResponse = DEMO_RESPONSES[2];
const sportResponse = DEMO_RESPONSES[3];

const SEED_SESSIONS: ChatSession[] = [
  {
    id: 'h1',
    title: 'Möbel & Einrichtung Hamburg',
    preview: möbelResponse.reply,
    time: 'vor 2 Std.',
    group: 'Heute',
    sources: new Set(['google_maps', 'linkedin'] as SourceId[]),
    messages: [
      { id: 'h1_u', role: 'user', text: 'Möbel & Einrichtung Hamburg' },
      { id: 'h1_r', role: 'bot', text: möbelResponse.reply },
      {
        id: 'h1_res',
        role: 'bot',
        text: `${möbelResponse.results.length} Unternehmen entdeckt`,
        results: möbelResponse.results,
      },
    ],
  },
  {
    id: 'h2',
    title: 'Fashion Brands Deutschland',
    preview: modeResponse.reply,
    time: 'vor 5 Std.',
    group: 'Heute',
    sources: new Set(['linkedin', 'web'] as SourceId[]),
    messages: [
      { id: 'h2_u', role: 'user', text: 'Fashion Brands Deutschland' },
      { id: 'h2_r', role: 'bot', text: modeResponse.reply },
      {
        id: 'h2_res',
        role: 'bot',
        text: `${modeResponse.results.length} Unternehmen entdeckt`,
        results: modeResponse.results,
      },
    ],
  },
  {
    id: 'y1',
    title: 'B2B SaaS Startups Berlin',
    preview: softwareResponse.reply,
    time: 'gestern',
    group: 'Gestern',
    sources: new Set(['linkedin', 'web'] as SourceId[]),
    messages: [
      { id: 'y1_u', role: 'user', text: 'B2B SaaS Startups Berlin' },
      { id: 'y1_r', role: 'bot', text: softwareResponse.reply },
      {
        id: 'y1_res',
        role: 'bot',
        text: `${softwareResponse.results.length} Unternehmen entdeckt`,
        results: softwareResponse.results,
      },
    ],
  },
  {
    id: 'w1',
    title: 'Sport & Outdoor Händler',
    preview: sportResponse.reply,
    time: 'vor 3 Tagen',
    group: 'Diese Woche',
    sources: new Set(['google_maps', 'linkedin', 'web'] as SourceId[]),
    messages: [
      { id: 'w1_u', role: 'user', text: 'Sport & Outdoor Händler' },
      { id: 'w1_r', role: 'bot', text: sportResponse.reply },
      {
        id: 'w1_res',
        role: 'bot',
        text: `${sportResponse.results.length} Unternehmen entdeckt`,
        results: sportResponse.results,
      },
    ],
  },
  {
    id: 'w2',
    title: 'Elektronik Großhandel DE',
    preview: FALLBACK.reply,
    time: 'vor 5 Tagen',
    group: 'Diese Woche',
    sources: new Set(['web', 'google_maps'] as SourceId[]),
    messages: [
      { id: 'w2_u', role: 'user', text: 'Elektronik Großhandel DE' },
      { id: 'w2_r', role: 'bot', text: FALLBACK.reply },
      {
        id: 'w2_res',
        role: 'bot',
        text: '2 Unternehmen entdeckt',
        results: [
          { name: 'TechDist AG', city: 'Hamburg', industry: 'Elektronik', employees: '40–80', source: 'Web' },
          {
            name: 'MediaBase GmbH',
            city: 'Frankfurt',
            industry: 'Großhandel',
            employees: '60–120',
            source: 'Google Maps',
          },
        ],
      },
    ],
  },
  {
    id: 'f1',
    title: 'Premium Küchen München',
    preview: FALLBACK.reply,
    time: 'vor 2 Wo.',
    group: 'Früher',
    sources: new Set(['google_maps', 'linkedin'] as SourceId[]),
    messages: [
      { id: 'f1_u', role: 'user', text: 'Premium Küchen München' },
      { id: 'f1_r', role: 'bot', text: FALLBACK.reply },
      {
        id: 'f1_res',
        role: 'bot',
        text: '3 Unternehmen entdeckt',
        results: [
          {
            name: 'Küchen Manufaktur GmbH',
            city: 'München',
            industry: 'Premium-Küchen',
            employees: '25–50',
            source: 'Google Maps',
          },
          {
            name: 'Designküchen AG',
            city: 'Augsburg',
            industry: 'Küchendesign',
            employees: '15–30',
            source: 'LinkedIn',
          },
          {
            name: 'Küchenwerk Bavaria',
            city: 'Regensburg',
            industry: 'Küchenhandel',
            employees: '10–20',
            source: 'Web',
          },
        ],
      },
    ],
  },
];

const GROUP_ORDER: SessionGroup[] = ['Heute', 'Gestern', 'Diese Woche', 'Früher'];

const GROUP_LABELS: Record<SessionGroup, string> = {
  Heute: 'HEUTE',
  Gestern: 'GESTERN',
  'Diese Woche': 'DIESE WOCHE',
  Früher: 'FRÜHER',
};

// ─── Sub-components ─────────────────────────────────────────────────────────────

function TypingDots({ c }: { c: ReturnType<typeof colors> }) {
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center', padding: '12px 16px' }}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          style={{ width: 6, height: 6, borderRadius: '50%', background: c.textMuted, display: 'block' }}
          animate={{ opacity: [0.2, 1, 0.2], scale: [0.85, 1.1, 0.85] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.18, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

function ResultCard({
  r,
  c,
  i,
  isDark,
}: {
  r: DiscoveryResult;
  c: ReturnType<typeof colors>;
  i: number;
  isDark: boolean;
}) {
  const sourceColor = r.source === 'LinkedIn' ? '#10B981' : r.source === 'Web' ? '#F97316' : '#EF4444';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.06, duration: 0.3, ease: 'easeOut' }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '11px 14px',
        background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.50)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderRadius: 12,
        border: isDark ? '1px solid rgba(255,255,255,0.09)' : '1px solid rgba(255,255,255,0.62)',
        boxShadow: isDark ? 'inset 1px 1px 1px rgba(255,255,255,0.05)' : 'inset 2px 2px 3px rgba(255,255,255,0.55)',
        marginBottom: 6,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 9,
          background: c.accent + '15',
          color: c.accent,
          fontWeight: 800,
          fontSize: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          letterSpacing: '-0.01em',
        }}
      >
        {r.name.slice(0, 2).toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: 13,
            color: c.text,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {r.name}
        </div>
        <div style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>
          {r.city} · {r.industry} · {r.employees} MA
        </div>
      </div>
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          padding: '3px 8px',
          borderRadius: 99,
          background: sourceColor + '18',
          color: sourceColor,
          flexShrink: 0,
          letterSpacing: '0.03em',
        }}
      >
        {r.source}
      </span>
    </motion.div>
  );
}

// ─── Mode Picker ──────────────────────────────────────────────────────────────

function ModeCard({
  Icon,
  title,
  description,
  onClick,
  c,
  isDark,
  delay = 0,
}: {
  Icon: React.ElementType;
  title: string;
  description: string;
  onClick: () => void;
  c: ReturnType<typeof colors>;
  isDark: boolean;
  delay?: number;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: 'easeOut' }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: '1 1 280px',
        maxWidth: 320,
        textAlign: 'left',
        cursor: 'pointer',
        background: isDark
          ? hovered
            ? 'rgba(255,255,255,0.10)'
            : 'rgba(255,255,255,0.06)'
          : hovered
            ? 'rgba(255,255,255,0.72)'
            : 'rgba(255,255,255,0.50)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        border: hovered
          ? `1px solid ${c.accent}55`
          : isDark
            ? '1px solid rgba(255,255,255,0.10)'
            : '1px solid rgba(255,255,255,0.70)',
        borderRadius: 18,
        padding: '22px 22px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        fontFamily: 'inherit',
        transition: 'transform 180ms ease-out, border-color 180ms ease-out, background 180ms ease-out, box-shadow 180ms ease-out',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hovered
          ? isDark
            ? `0 12px 32px rgba(0,0,0,0.42), 0 0 0 4px ${c.accent}14`
            : `0 12px 28px rgba(0,0,0,0.10), 0 0 0 4px ${c.accent}10`
          : isDark
            ? '0 4px 16px rgba(0,0,0,0.22)'
            : 'inset 2px 2px 3px rgba(255,255,255,0.55), 0 4px 14px rgba(0,0,0,0.05)',
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 11,
          background: hovered ? c.accent : c.accent + '18',
          color: hovered ? '#fff' : c.accent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 180ms ease-out, color 180ms ease-out',
        }}
      >
        <Icon size={20} strokeWidth={2.2} />
      </div>
      <div>
        <div style={{ fontSize: 17, fontWeight: 700, color: c.text, letterSpacing: '-0.01em', marginBottom: 6 }}>
          {title}
        </div>
        <div style={{ fontSize: 13, color: c.textSub, lineHeight: 1.5 }}>{description}</div>
      </div>
    </motion.button>
  );
}

// ─── Bulk Research Panel ──────────────────────────────────────────────────────

function BulkTagInput({
  values,
  onChange,
  placeholder,
  c,
  isDark,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  c: ReturnType<typeof colors>;
  isDark: boolean;
}) {
  const [draft, setDraft] = useState('');
  function commit() {
    const v = draft.trim();
    if (!v) return;
    if (!values.includes(v)) onChange([...values, v]);
    setDraft('');
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div
        style={{
          background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.62)',
          border: isDark ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(255,255,255,0.7)',
          borderRadius: 10,
          padding: 6,
          display: 'flex',
          alignItems: 'center',
          minHeight: 42,
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              commit();
            } else if (e.key === 'Backspace' && draft === '' && values.length > 0) {
              onChange(values.slice(0, -1));
            }
          }}
          onBlur={commit}
          placeholder={placeholder}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: 13,
            color: c.text,
            padding: '5px 6px',
            fontFamily: 'inherit',
          }}
        />
      </div>
      {values.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {values.map((tag, idx) => (
            <span
              key={`${tag}-${idx}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: c.accent + '14',
                color: c.accent,
                borderRadius: 7,
                padding: '4px 4px 4px 10px',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {tag}
              <button
                onClick={() => onChange(values.filter((_, i) => i !== idx))}
                aria-label={`${tag} entfernen`}
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 4,
                  border: 'none',
                  background: 'transparent',
                  color: c.accent,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                }}
              >
                <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M4 4l8 8M12 4l-8 8" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function BulkFieldLabel({ label, sub, c }: { label: string; sub?: string; c: ReturnType<typeof colors> }) {
  return (
    <div style={{ marginBottom: 7 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: c.text, letterSpacing: '-0.005em' }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: c.textSub, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function BulkResultCard({
  r,
  c,
  i,
  isDark,
}: {
  r: DiscoveryResult;
  c: ReturnType<typeof colors>;
  i: number;
  isDark: boolean;
}) {
  const sourceColor = r.source === 'LinkedIn' ? '#10B981' : r.source === 'Web' ? '#F97316' : '#EF4444';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.05, duration: 0.28, ease: 'easeOut' }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '11px 14px',
        background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.62)',
        borderRadius: 11,
        border: isDark ? '1px solid rgba(255,255,255,0.09)' : '1px solid rgba(255,255,255,0.72)',
        boxShadow: isDark ? 'none' : 'inset 1px 1px 2px rgba(255,255,255,0.55)',
        marginBottom: 6,
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 9,
          background: c.accent + '14',
          color: c.accent,
          fontWeight: 800,
          fontSize: 11,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {r.name.slice(0, 2).toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: 13,
            color: c.text,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {r.name}
        </div>
        <div style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>
          {r.city} · {r.industry} · {r.employees} MA
        </div>
      </div>
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          padding: '3px 8px',
          borderRadius: 99,
          background: sourceColor + '18',
          color: sourceColor,
          flexShrink: 0,
        }}
      >
        {r.source}
      </span>
    </motion.div>
  );
}

function cardStyleFor(isDark: boolean): React.CSSProperties {
  return {
    background: isDark ? 'rgba(10,12,24,0.46)' : 'rgba(255,255,255,0.54)',
    backdropFilter: 'blur(22px)',
    WebkitBackdropFilter: 'blur(22px)',
    borderRadius: 18,
    border: isDark ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(255,255,255,0.72)',
    boxShadow: isDark
      ? 'inset 1px 1px 2px rgba(255,255,255,0.06), 0 6px 28px rgba(0,0,0,0.32)'
      : 'inset 2px 2px 3px rgba(255,255,255,0.55), 0 4px 22px rgba(0,0,0,0.06)',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    overflow: 'hidden',
  };
}

function SetupCard({
  setup,
  profiles,
  onPatch,
  c,
  isDark,
}: {
  setup: BulkSetup;
  profiles: AngebotsProfileLite[];
  onPatch: (patch: Partial<BulkSetup>) => void;
  c: ReturnType<typeof colors>;
  isDark: boolean;
}) {
  return (
    <>
      <div
        style={{
          padding: '16px 20px',
          borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 800, color: c.text }}>Setup</div>
        <div style={{ fontSize: 11, color: c.textMuted, fontWeight: 600 }}>Definiere die Kampagne</div>
      </div>
      <div style={{ padding: '18px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <BulkFieldLabel label="Angebotsprofil" sub="Welches Profil triggert die Suche?" c={c} />
          {profiles.length === 0 ? (
            <div
              style={{
                fontSize: 12,
                color: c.textSub,
                background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.55)',
                border: isDark ? '1px dashed rgba(255,255,255,0.18)' : '1px dashed rgba(0,0,0,0.18)',
                borderRadius: 10,
                padding: '12px 14px',
              }}
            >
              Noch kein Angebotsprofil — lege eines unter{' '}
              <a
                href="/intelligence/settings"
                style={{ color: c.accent, fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: 2 }}
              >
                Einstellungen
              </a>{' '}
              an.
            </div>
          ) : (
            <select
              value={setup.angebotsProfileId ?? ''}
              onChange={(e) => onPatch({ angebotsProfileId: e.target.value || null })}
              style={{
                width: '100%',
                background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.62)',
                border: isDark ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(255,255,255,0.7)',
                borderRadius: 10,
                padding: '10px 12px',
                fontSize: 13,
                color: c.text,
                fontFamily: 'inherit',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="">— Bitte wählen —</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.unternehmen ? ` · ${p.unternehmen}` : ''}
                </option>
              ))}
            </select>
          )}
        </div>
        <div>
          <BulkFieldLabel
            label="Weitere Suchanfragen"
            sub="Zusätzliche Keywords oder Phrasen — Enter bestätigt"
            c={c}
          />
          <BulkTagInput
            values={setup.weitereQueries}
            onChange={(v) => onPatch({ weitereQueries: v })}
            placeholder='z.B. "Direct-to-Consumer Brand"'
            c={c}
            isDark={isDark}
          />
        </div>
        <div>
          <BulkFieldLabel label="Kriterien" sub="Harte Filter (Mitarbeiter, Umsatz, Region, etc.)" c={c} />
          <textarea
            value={setup.kriterien}
            onChange={(e) => onPatch({ kriterien: e.target.value })}
            placeholder="z.B. 20–200 Mitarbeiter, kein Konzern, eigene Marke"
            rows={3}
            style={{
              width: '100%',
              background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.62)',
              border: isDark ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(255,255,255,0.7)',
              borderRadius: 10,
              padding: '10px 12px',
              fontSize: 13,
              color: c.text,
              fontFamily: 'inherit',
              outline: 'none',
              resize: 'vertical',
              lineHeight: 1.5,
            }}
          />
        </div>
        <div>
          <BulkFieldLabel label="Ort" sub="Städte oder Regionen — Enter bestätigt" c={c} />
          <BulkTagInput
            values={setup.orte}
            onChange={(v) => onPatch({ orte: v })}
            placeholder="z.B. Hamburg, Berlin, NRW"
            c={c}
            isDark={isDark}
          />
        </div>
      </div>
    </>
  );
}

function ListeCard({
  results,
  generating,
  c,
  isDark,
}: {
  results: DiscoveryResult[] | undefined;
  generating: boolean;
  c: ReturnType<typeof colors>;
  isDark: boolean;
}) {
  const hasResults = !!results && results.length > 0;
  return (
    <>
      <div
        style={{
          padding: '16px 20px',
          borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 800, color: c.text }}>Liste</div>
        <div style={{ fontSize: 11, color: c.textMuted, fontWeight: 600 }}>
          {hasResults ? `${results!.length} Unternehmen` : 'Noch keine Treffer'}
        </div>
      </div>
      <div style={{ flex: 1, padding: '14px 14px', overflowY: 'auto', minHeight: 0 }}>
        {generating ? (
          <BulkLoadingState c={c} isDark={isDark} />
        ) : hasResults ? (
          <div>
            {results!.map((r, i) => (
              <BulkResultCard key={i} r={r} c={c} i={i} isDark={isDark} />
            ))}
          </div>
        ) : (
          <BulkEmptyState c={c} isDark={isDark} />
        )}
      </div>
    </>
  );
}

function OutreachCard({
  outreach,
  absenderProfile,
  onPatch,
  c,
  isDark,
}: {
  outreach: BulkOutreach;
  absenderProfile: AbsenderProfileLite[];
  onPatch: (patch: Partial<BulkOutreach>) => void;
  c: ReturnType<typeof colors>;
  isDark: boolean;
}) {
  function toggleRolle(r: string) {
    onPatch({
      rollen: outreach.rollen.includes(r) ? outreach.rollen.filter((x) => x !== r) : [...outreach.rollen, r],
    });
  }

  return (
    <>
      <div
        style={{
          padding: '16px 20px',
          borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 800, color: c.text }}>Outreach</div>
        <div style={{ fontSize: 11, color: c.textMuted, fontWeight: 600 }}>Wer & was erreicht die Liste</div>
      </div>
      <div style={{ padding: '18px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <BulkFieldLabel label="Absenderprofil" sub="Mit welchem Profil wird gesendet?" c={c} />
          {absenderProfile.length === 0 ? (
            <div
              style={{
                fontSize: 12,
                color: c.textSub,
                background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.55)',
                border: isDark ? '1px dashed rgba(255,255,255,0.18)' : '1px dashed rgba(0,0,0,0.18)',
                borderRadius: 10,
                padding: '12px 14px',
              }}
            >
              Noch kein Absenderprofil — lege eines unter{' '}
              <a
                href="/intelligence/settings"
                style={{ color: c.accent, fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: 2 }}
              >
                Einstellungen
              </a>{' '}
              an.
            </div>
          ) : (
            <select
              value={outreach.absenderProfileId ?? ''}
              onChange={(e) => onPatch({ absenderProfileId: e.target.value || null })}
              style={{
                width: '100%',
                background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.62)',
                border: isDark ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(255,255,255,0.7)',
                borderRadius: 10,
                padding: '10px 12px',
                fontSize: 13,
                color: c.text,
                fontFamily: 'inherit',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="">— Bitte wählen —</option>
              {absenderProfile.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <BulkFieldLabel label="Personen" sub="Welche Rollen willst Du ansprechen?" c={c} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {ROLLEN.map((r) => {
              const active = outreach.rollen.includes(r);
              return (
                <button
                  key={r}
                  onClick={() => toggleRolle(r)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 7,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: `1px solid ${active ? c.accent : isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)'}`,
                    background: active
                      ? c.accent
                      : isDark
                        ? 'rgba(255,255,255,0.04)'
                        : 'rgba(255,255,255,0.62)',
                    color: active ? '#fff' : c.textSub,
                    transition: 'all 0.12s',
                    fontFamily: 'inherit',
                  }}
                >
                  {r}
                </button>
              );
            })}
          </div>
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 11, color: c.textMuted, fontWeight: 600, marginBottom: 5 }}>
              Andere Rollen
            </div>
            <BulkTagInput
              values={outreach.rollenCustom}
              onChange={(v) => onPatch({ rollenCustom: v })}
              placeholder="z.B. Head of Logistics"
              c={c}
              isDark={isDark}
            />
          </div>
        </div>

        <div>
          <BulkFieldLabel label="Nachricht" sub="Erste Nachricht — Platzhalter wie {{name}} möglich" c={c} />
          <textarea
            value={outreach.nachricht}
            onChange={(e) => onPatch({ nachricht: e.target.value })}
            placeholder={`Hallo {{firstName}},\n\nmir ist {{unternehmen}} aufgefallen — wir helfen Unternehmen wie euch dabei, …`}
            rows={6}
            style={{
              width: '100%',
              background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.62)',
              border: isDark ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(255,255,255,0.7)',
              borderRadius: 10,
              padding: '10px 12px',
              fontSize: 13,
              color: c.text,
              fontFamily: 'inherit',
              outline: 'none',
              resize: 'vertical',
              lineHeight: 1.55,
            }}
          />
        </div>
      </div>
    </>
  );
}

function BulkPanel({
  session,
  profiles,
  absenderProfile,
  onChange,
  onGenerate,
  onChangeMode,
  onSetStep,
  onLaunch,
  onClose,
  c,
  isDark,
}: {
  session: ChatSession;
  profiles: AngebotsProfileLite[];
  absenderProfile: AbsenderProfileLite[];
  onChange: (patch: Partial<ChatSession>) => void;
  onGenerate: () => void;
  onChangeMode: () => void;
  onSetStep: (step: BulkStep) => void;
  onLaunch: () => void;
  onClose: () => void;
  c: ReturnType<typeof colors>;
  isDark: boolean;
}) {
  const setup = session.bulkSetup ?? emptyBulkSetup();
  const outreach = session.bulkOutreach ?? emptyBulkOutreach();
  const results = session.bulkResults;
  const generating = !!session.bulkGenerating;
  const hasResults = !!results && results.length > 0;
  const step: BulkStep = session.bulkStep ?? 'setup';
  const launching = !!session.bulkLaunching;
  const launched = !!session.bulkLaunched;

  function patchSetup(patch: Partial<BulkSetup>) {
    onChange({ bulkSetup: { ...setup, ...patch } });
  }
  function patchOutreach(patch: Partial<BulkOutreach>) {
    onChange({ bulkOutreach: { ...outreach, ...patch } });
  }

  const cardStyle = cardStyleFor(isDark);
  const motionTransition = { type: 'spring' as const, stiffness: 260, damping: 32, mass: 0.9 };

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        overflow: 'hidden',
        padding: '80px 32px 24px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              padding: '5px 11px',
              borderRadius: 99,
              background: launched ? '#10B98114' : c.accent + '14',
              color: launched ? '#10B981' : c.accent,
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {launched ? (
              <>
                <motion.span
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', display: 'inline-block' }}
                />
                Kampagne läuft
              </>
            ) : (
              <>
                <LayersIcon size={13} />
                Bulk-Research
              </>
            )}
          </div>
          {!launched && (
            <span style={{ fontSize: 12, color: c.textMuted, fontWeight: 600 }}>
              Schritt {step === 'setup' ? '1 / 2' : '2 / 2'} ·{' '}
              <span style={{ color: c.text }}>{step === 'setup' ? 'Setup' : 'Outreach'}</span>
            </span>
          )}
          {!launched && step === 'outreach' && (
            <button
              onClick={() => onSetStep('setup')}
              style={{
                background: 'transparent',
                border: 'none',
                color: c.textMuted,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline',
                textUnderlineOffset: 3,
              }}
            >
              Zurück zu Setup
            </button>
          )}
        </div>
        {!launched ? (
          <button
            onClick={onChangeMode}
            style={{
              background: 'transparent',
              border: 'none',
              color: c.textMuted,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline',
              textUnderlineOffset: 3,
            }}
          >
            Modus ändern
          </button>
        ) : (
          <button
            onClick={onClose}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'transparent',
              border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.10)',
              color: c.text,
              borderRadius: 8,
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
            Kampagne schließen
          </button>
        )}
      </div>

      {/* Two-column body with animated swap */}
      <motion.div
        layout
        transition={motionTransition}
        style={{
          display: 'grid',
          gridTemplateColumns: launched ? 'minmax(0, 1fr)' : 'minmax(0, 1fr) minmax(0, 1.05fr)',
          gap: 18,
          flex: 1,
          minHeight: 0,
        }}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {!launched && step === 'setup' && (
            <motion.div
              key="setup-card"
              layout
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={motionTransition}
              style={cardStyle}
            >
              <SetupCard setup={setup} profiles={profiles} onPatch={patchSetup} c={c} isDark={isDark} />
            </motion.div>
          )}
          <motion.div
            key="liste-card"
            layout
            transition={motionTransition}
            style={cardStyle}
          >
            <ListeCard results={results} generating={generating} c={c} isDark={isDark} />
          </motion.div>
          {!launched && step === 'outreach' && (
            <motion.div
              key="outreach-card"
              layout
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 80 }}
              transition={motionTransition}
              style={cardStyle}
            >
              <OutreachCard
                outreach={outreach}
                absenderProfile={absenderProfile}
                onPatch={patchOutreach}
                c={c}
                isDark={isDark}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Action row */}
      <AnimatePresence>
        {!launched && (
          <motion.div
            key="action-row"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: 18,
              alignItems: 'center',
              gap: 12,
            }}
          >
        {step === 'setup' ? (
          <>
            {hasResults && !generating && (
              <span style={{ fontSize: 12, color: c.textMuted, fontWeight: 600 }}>
                Liste aktualisieren mit aktuellen Einstellungen
              </span>
            )}
            <button
              onClick={onGenerate}
              disabled={generating}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: generating ? (isDark ? `${c.accent}77` : '#A5B4FC') : c.accent,
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                padding: '11px 22px',
                fontSize: 13,
                fontWeight: 700,
                cursor: generating ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                transition: 'background 150ms ease-out',
                boxShadow: generating ? 'none' : `0 6px 20px ${c.accent}38`,
              }}
            >
              {generating ? (
                <>
                  <motion.span
                    style={{ display: 'inline-block', width: 13, height: 13 }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
                  >
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    >
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                  </motion.span>
                  Generiere…
                </>
              ) : hasResults ? (
                <>
                  <ArrowUpIcon size={13} />
                  Erneut generieren
                </>
              ) : (
                <>
                  <ArrowUpIcon size={13} />
                  Weiter
                </>
              )}
            </button>
          </>
        ) : (
          <>
            <span style={{ fontSize: 12, color: c.textMuted, fontWeight: 600 }}>
              {(results?.length ?? 0)} Unternehmen ·{' '}
              {(outreach.rollen.length + outreach.rollenCustom.length) || 0} Rolle(n)
            </span>
            {(() => {
              const disabled = !outreach.absenderProfileId || !outreach.nachricht.trim() || launching;
              return (
                <button
                  onClick={onLaunch}
                  disabled={disabled}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    background: disabled ? (isDark ? `${c.accent}55` : '#A5B4FC') : c.accent,
                    color: '#fff',
                    border: 'none',
                    borderRadius: 10,
                    padding: '11px 26px',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                    transition: 'background 150ms ease-out',
                    boxShadow: disabled ? 'none' : `0 6px 20px ${c.accent}38`,
                    minWidth: 100,
                    justifyContent: 'center',
                  }}
                >
                  {launching ? (
                    <>
                      <motion.span
                        style={{ display: 'inline-block', width: 13, height: 13 }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
                      >
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        >
                          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                        </svg>
                      </motion.span>
                      Startet…
                    </>
                  ) : (
                    <>
                      <ArrowUpIcon size={13} />
                      Los
                    </>
                  )}
                </button>
              );
            })()}
          </>
        )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BulkEmptyState({ c, isDark }: { c: ReturnType<typeof colors>; isDark: boolean }) {
  return (
    <div
      style={{
        height: '100%',
        minHeight: 320,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '32px 24px',
        gap: 10,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)',
          border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: c.textMuted,
        }}
      >
        <LayersIcon size={24} strokeWidth={1.6} />
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: c.text, marginTop: 4 }}>Noch keine Treffer</div>
      <div style={{ fontSize: 12.5, color: c.textSub, maxWidth: 280, lineHeight: 1.5 }}>
        Konfiguriere links Dein Setup und klicke rechts unten auf „Weiter", um die Liste zu generieren.
      </div>
    </div>
  );
}

function BulkLoadingState({ c, isDark }: { c: ReturnType<typeof colors>; isDark: boolean }) {
  return (
    <div style={{ padding: '4px 0' }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0.4 }}
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.12, ease: 'easeInOut' }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 14px',
            background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.55)',
            borderRadius: 11,
            border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(255,255,255,0.6)',
            marginBottom: 6,
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div
              style={{
                height: 11,
                width: '55%',
                borderRadius: 4,
                background: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)',
              }}
            />
            <div
              style={{
                height: 9,
                width: '75%',
                borderRadius: 4,
                background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
              }}
            />
          </div>
        </motion.div>
      ))}
      <div style={{ textAlign: 'center', fontSize: 12, color: c.textMuted, marginTop: 10, fontWeight: 600 }}>
        Durchsuche Quellen…
      </div>
    </div>
  );
}

// ─── Deep-Research helpers ────────────────────────────────────────────────────

function DeepSearchCard({
  setup,
  config,
  profiles,
  onPatchSetup,
  onPatchConfig,
  c,
  isDark,
}: {
  setup: DeepSetup;
  config: DeepConfig;
  profiles: AngebotsProfileLite[];
  onPatchSetup: (patch: Partial<DeepSetup>) => void;
  onPatchConfig: (patch: Partial<DeepConfig>) => void;
  c: ReturnType<typeof colors>;
  isDark: boolean;
}) {
  return (
    <>
      <div
        style={{
          padding: '16px 20px',
          borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 800, color: c.text }}>Suche</div>
        <div style={{ fontSize: 11, color: c.textMuted, fontWeight: 600 }}>Recherche-Fokus & Filter</div>
      </div>
      <div style={{ padding: '18px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <BulkFieldLabel label="Angebotsprofil" sub="Welches Profil triggert die Recherche?" c={c} />
          {profiles.length === 0 ? (
            <div
              style={{
                fontSize: 12,
                color: c.textSub,
                background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.55)',
                border: isDark ? '1px dashed rgba(255,255,255,0.18)' : '1px dashed rgba(0,0,0,0.18)',
                borderRadius: 10,
                padding: '12px 14px',
              }}
            >
              Noch kein Angebotsprofil — lege eines unter{' '}
              <a
                href="/intelligence/settings"
                style={{ color: c.accent, fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: 2 }}
              >
                Einstellungen
              </a>{' '}
              an.
            </div>
          ) : (
            <select
              value={setup.angebotsProfileId ?? ''}
              onChange={(e) => onPatchSetup({ angebotsProfileId: e.target.value || null })}
              style={{
                width: '100%',
                background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.62)',
                border: isDark ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(255,255,255,0.7)',
                borderRadius: 10,
                padding: '10px 12px',
                fontSize: 13,
                color: c.text,
                fontFamily: 'inherit',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="">— Bitte wählen —</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.unternehmen ? ` · ${p.unternehmen}` : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <BulkFieldLabel label="Recherche-Fokus" sub="Was soll der Agent gezielt finden?" c={c} />
          <textarea
            value={setup.rechercheFokus}
            onChange={(e) => onPatchSetup({ rechercheFokus: e.target.value })}
            placeholder="z.B. Hersteller mit eigenem Online-Shop, der gerade auf neue Logistik wechselt"
            rows={3}
            style={{
              width: '100%',
              background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.62)',
              border: isDark ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(255,255,255,0.7)',
              borderRadius: 10,
              padding: '10px 12px',
              fontSize: 13,
              color: c.text,
              fontFamily: 'inherit',
              outline: 'none',
              resize: 'vertical',
              lineHeight: 1.5,
            }}
          />
        </div>

        <div>
          <BulkFieldLabel label="Weitere Suchanfragen" sub="Keywords / Phrasen — Enter bestätigt" c={c} />
          <BulkTagInput
            values={setup.weitereQueries}
            onChange={(v) => onPatchSetup({ weitereQueries: v })}
            placeholder='z.B. "Direct-to-Consumer Brand"'
            c={c}
            isDark={isDark}
          />
        </div>

        <div>
          <BulkFieldLabel label="Kriterien" sub="Harte Filter — Enter bestätigt" c={c} />
          <BulkTagInput
            values={setup.kriterien}
            onChange={(v) => onPatchSetup({ kriterien: v })}
            placeholder="z.B. 50–500 Mitarbeiter, eigene Marke, kein Konzern"
            c={c}
            isDark={isDark}
          />
        </div>

        <div>
          <BulkFieldLabel label="Ort" sub="Städte oder Regionen — Enter bestätigt" c={c} />
          <BulkTagInput
            values={setup.orte}
            onChange={(v) => onPatchSetup({ orte: v })}
            placeholder="z.B. Hamburg, Berlin, NRW"
            c={c}
            isDark={isDark}
          />
        </div>

      </div>
    </>
  );
}

function PreScoringOverlay({ c, isDark }: { c: ReturnType<typeof colors>; isDark: boolean }) {
  const stars = useMemo(
    () =>
      Array.from({ length: 14 }).map((_, i) => ({
        id: i,
        top: 6 + Math.random() * 84,
        left: 4 + Math.random() * 90,
        size: 12 + Math.random() * 16,
        delay: Math.random() * 1.6,
        duration: 1.1 + Math.random() * 0.8,
        rot: Math.random() * 360,
      })),
    [],
  );

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        borderRadius: 18,
        zIndex: 3,
      }}
    >
      {/* Soft glow sweep */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 2, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at 50% 50%, ${c.accent}24, transparent 70%)`,
        }}
      />
      {/* Sweeping shine bar */}
      <motion.div
        initial={{ x: '-100%' }}
        animate={{ x: '120%' }}
        transition={{ duration: 1.6, ease: 'easeInOut', repeat: 1 }}
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          width: '40%',
          background: `linear-gradient(90deg, transparent, ${isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.55)'}, transparent)`,
          filter: 'blur(4px)',
        }}
      />
      {stars.map((s) => (
        <motion.div
          key={s.id}
          initial={{ opacity: 0, scale: 0, rotate: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1.15, 0],
            rotate: [s.rot, s.rot + 120, s.rot + 220],
          }}
          transition={{ duration: s.duration, delay: s.delay, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            top: `${s.top}%`,
            left: `${s.left}%`,
            color: c.accent,
            filter: `drop-shadow(0 0 8px ${c.accent}66)`,
          }}
        >
          <SparklesIcon size={s.size} strokeWidth={2} />
        </motion.div>
      ))}
      {/* Center label */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          position: 'absolute',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 7,
          padding: '6px 14px',
          borderRadius: 99,
          background: isDark ? 'rgba(10,12,24,0.7)' : 'rgba(255,255,255,0.82)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: `1px solid ${c.accent}55`,
          color: c.accent,
          fontSize: 12,
          fontWeight: 700,
          boxShadow: `0 4px 14px ${c.accent}30`,
        }}
      >
        <motion.span animate={{ rotate: 360 }} transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}>
          <SparklesIcon size={13} />
        </motion.span>
        Pre-Scoring läuft…
      </motion.div>
    </div>
  );
}

function DeepListeCard({
  results,
  generating,
  preScoring,
  selectedKeys,
  onToggleSelect,
  onToggleAll,
  c,
  isDark,
}: {
  results: DeepResult[] | undefined;
  generating: boolean;
  preScoring: boolean;
  selectedKeys: string[];
  onToggleSelect: (key: string) => void;
  onToggleAll: () => void;
  c: ReturnType<typeof colors>;
  isDark: boolean;
}) {
  const hasResults = !!results && results.length > 0;
  const selectedSet = new Set(selectedKeys);
  const allSelected = hasResults && selectedSet.size === results!.length;
  return (
    <>
      <div
        style={{
          padding: '16px 20px',
          borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: c.text }}>Liste</div>
          {hasResults && !preScoring && (
            <button
              onClick={onToggleAll}
              style={{
                background: 'transparent',
                border: 'none',
                padding: 0,
                fontSize: 11,
                fontWeight: 600,
                color: c.accent,
                cursor: 'pointer',
                fontFamily: 'inherit',
                textDecoration: 'underline',
                textUnderlineOffset: 3,
              }}
            >
              {allSelected ? 'Alle abwählen' : 'Alle auswählen'}
            </button>
          )}
        </div>
        <div style={{ fontSize: 11, color: c.textMuted, fontWeight: 600 }}>
          {preScoring
            ? 'Pre-Scoring läuft…'
            : hasResults
              ? `${selectedSet.size} / ${results!.length} ausgewählt`
              : 'Noch keine Treffer'}
        </div>
      </div>
      <div style={{ flex: 1, position: 'relative', padding: '14px 14px', overflowY: 'auto', minHeight: 0 }}>
        {generating ? (
          <BulkLoadingState c={c} isDark={isDark} />
        ) : hasResults ? (
          <AnimatePresence initial={false}>
            {results!.map((r, i) => {
              const key = deepLeadKey(r, i);
              return (
                <motion.div
                  key={key}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, x: -20 }}
                  transition={{ delay: i * 0.04, duration: 0.3, ease: 'easeOut' }}
                >
                  <DeepResultCard
                    r={r}
                    c={c}
                    isDark={isDark}
                    preScoring={preScoring}
                    selected={selectedSet.has(key)}
                    onToggle={() => onToggleSelect(key)}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        ) : (
          <BulkEmptyState c={c} isDark={isDark} />
        )}
        {preScoring && <PreScoringOverlay c={c} isDark={isDark} />}
      </div>
    </>
  );
}

function DeepResultCard({
  r,
  c,
  isDark,
  preScoring,
  selected,
  onToggle,
}: {
  r: DeepResult;
  c: ReturnType<typeof colors>;
  isDark: boolean;
  preScoring: boolean;
  selected: boolean;
  onToggle: () => void;
}) {
  const sourceColor = r.source === 'LinkedIn' ? '#10B981' : r.source === 'Web' ? '#F97316' : '#EF4444';
  const url = r.url;
  const handleRowClick = (e: React.MouseEvent) => {
    if (preScoring) return;
    // Don't toggle if the click came from the website button or the checkbox.
    const target = e.target as HTMLElement;
    if (target.closest('[data-no-toggle]')) return;
    onToggle();
  };
  return (
    <div
      onClick={handleRowClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '11px 14px',
        background: selected
          ? c.accent + (isDark ? '1c' : '12')
          : isDark
            ? 'rgba(255,255,255,0.05)'
            : 'rgba(255,255,255,0.62)',
        borderRadius: 11,
        border: selected
          ? `1px solid ${c.accent}55`
          : isDark
            ? '1px solid rgba(255,255,255,0.09)'
            : '1px solid rgba(255,255,255,0.72)',
        boxShadow: isDark ? 'none' : 'inset 1px 1px 2px rgba(255,255,255,0.55)',
        marginBottom: 6,
        opacity: preScoring ? 0.6 : 1,
        filter: preScoring ? 'saturate(0.8)' : 'none',
        transition:
          'opacity 0.4s ease-out, filter 0.4s ease-out, background 0.15s ease, border-color 0.15s ease',
        cursor: preScoring ? 'default' : 'pointer',
      }}
    >
      <input
        data-no-toggle
        type="checkbox"
        checked={selected}
        onChange={onToggle}
        onClick={(e) => e.stopPropagation()}
        disabled={preScoring}
        style={{
          width: 16,
          height: 16,
          accentColor: c.accent,
          cursor: preScoring ? 'default' : 'pointer',
          flexShrink: 0,
        }}
      />
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 9,
          background: c.accent + '14',
          color: c.accent,
          fontWeight: 800,
          fontSize: 11,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {r.name.slice(0, 2).toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: 13,
            color: c.text,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {r.name}
        </div>
        <div style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>
          {[r.city, r.industry, r.employees ? `${r.employees} MA` : null].filter(Boolean).join(' · ')}
        </div>
      </div>
      {typeof r.score === 'number' && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            background: c.accent + '14',
            color: c.accent,
            fontSize: 11,
            fontWeight: 800,
            padding: '4px 8px',
            borderRadius: 99,
            flexShrink: 0,
          }}
        >
          <SparklesIcon size={10} />
          {r.score}
        </div>
      )}
      {url ? (
        <a
          data-no-toggle
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          title={url}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 10,
            fontWeight: 700,
            padding: '4px 9px',
            borderRadius: 99,
            background: sourceColor + '18',
            color: sourceColor,
            flexShrink: 0,
            textDecoration: 'none',
            fontFamily: 'inherit',
            cursor: 'pointer',
            transition: 'background 120ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = sourceColor + '28';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = sourceColor + '18';
          }}
        >
          {r.source}
          <svg
            width="10"
            height="10"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 3h7v7" />
            <path d="M13 3L4 12" />
          </svg>
        </a>
      ) : (
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: 99,
            background: sourceColor + '18',
            color: sourceColor,
            flexShrink: 0,
          }}
        >
          {r.source}
        </span>
      )}
    </div>
  );
}

function ScoringCard({
  config,
  onPatchConfig,
  c,
  isDark,
}: {
  config: DeepConfig;
  onPatchConfig: (patch: Partial<DeepConfig>) => void;
  c: ReturnType<typeof colors>;
  isDark: boolean;
}) {
  function toggleSource(s: string) {
    onPatchConfig({
      sources: config.sources.includes(s) ? config.sources.filter((x) => x !== s) : [...config.sources, s],
    });
  }
  return (
    <>
      <div
        style={{
          padding: '16px 20px',
          borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 800, color: c.text }}>Anreichern & Scoring</div>
        <div style={{ fontSize: 11, color: c.textMuted, fontWeight: 600 }}>Quellen & Gewichtung</div>
      </div>
      <div style={{ padding: '18px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <BulkFieldLabel label="Anreicherungs-Quellen" sub="Woher sollen weitere Daten geladen werden?" c={c} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {ENRICH_SOURCES.map((s) => {
              const active = config.sources.includes(s);
              return (
                <button
                  key={s}
                  onClick={() => toggleSource(s)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 7,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: `1px solid ${active ? c.accent : isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)'}`,
                    background: active ? c.accent : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.62)',
                    color: active ? '#fff' : c.textSub,
                    transition: 'all 0.12s',
                    fontFamily: 'inherit',
                  }}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <BulkFieldLabel label="Scoring-Gewichtung" sub="Welche Dimensionen zählen wie viel?" c={c} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(
              [
                { key: 'scoringFit' as const, label: 'Fit (Profilpassung)', val: config.scoringFit, color: '#6366F1' },
                {
                  key: 'scoringIntent' as const,
                  label: 'Intent (Kaufabsicht)',
                  val: config.scoringIntent,
                  color: '#10B981',
                },
                { key: 'scoringTiming' as const, label: 'Timing (Aktualität)', val: config.scoringTiming, color: '#F97316' },
              ]
            ).map((s) => (
              <div key={s.key}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 4,
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 600, color: c.text }}>{s.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: s.color }}>{s.val}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={s.val}
                  onChange={(e) => onPatchConfig({ [s.key]: Number(e.target.value) } as Partial<DeepConfig>)}
                  style={{ width: '100%', accentColor: s.color, cursor: 'pointer' }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function DeepPanel({
  session,
  profiles,
  onChange,
  onGenerate,
  onChangeMode,
  onSetStep,
  onLaunch,
  onClose,
  onToggleSelect,
  onToggleAll,
  c,
  isDark,
}: {
  session: ChatSession;
  profiles: AngebotsProfileLite[];
  onChange: (patch: Partial<ChatSession>) => void;
  onGenerate: () => void;
  onChangeMode: () => void;
  onSetStep: (step: DeepStep) => void;
  onLaunch: () => void;
  onClose: () => void;
  onToggleSelect: (key: string) => void;
  onToggleAll: () => void;
  c: ReturnType<typeof colors>;
  isDark: boolean;
}) {
  const setup = session.deepSetup ?? emptyDeepSetup();
  const config = session.deepConfig ?? emptyDeepConfig();
  const results = session.deepResults;
  const selectedKeys = session.deepSelectedKeys ?? [];
  const selectedCount = selectedKeys.length;
  const generating = !!session.deepGenerating;
  const preScoring = !!session.deepPreScoring;
  const hasResults = !!results && results.length > 0;
  const step: DeepStep = session.deepStep ?? 'setup';
  const launching = !!session.deepLaunching;
  const launched = !!session.deepLaunched;
  const busy = generating || preScoring;
  // After generation in the setup step, the list takes the full width
  // (the search card disappears). The user can return via "Neue Suche".
  const listFullWidth = (hasResults && step === 'setup') || launched;

  function patchSetup(patch: Partial<DeepSetup>) {
    onChange({ deepSetup: { ...setup, ...patch } });
  }
  function patchConfig(patch: Partial<DeepConfig>) {
    onChange({ deepConfig: { ...config, ...patch } });
  }

  const cardStyle = cardStyleFor(isDark);
  const motionTransition = { type: 'spring' as const, stiffness: 260, damping: 32, mass: 0.9 };

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        overflow: 'hidden',
        padding: '80px 32px 24px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              padding: '5px 11px',
              borderRadius: 99,
              background: launched ? '#10B98114' : c.accent + '14',
              color: launched ? '#10B981' : c.accent,
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {launched ? (
              <>
                <motion.span
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: '#10B981',
                    display: 'inline-block',
                  }}
                />
                Anreicherung läuft
              </>
            ) : (
              <>
                <TelescopeIcon size={13} />
                Deep-Research
              </>
            )}
          </div>
          {!launched && (
            <span style={{ fontSize: 12, color: c.textMuted, fontWeight: 600 }}>
              Schritt {step === 'setup' ? '1 / 2' : '2 / 2'} ·{' '}
              <span style={{ color: c.text }}>{step === 'setup' ? 'Suche' : 'Anreichern & Scoring'}</span>
            </span>
          )}
          {!launched && step === 'scoring' && (
            <button
              onClick={() => onSetStep('setup')}
              style={{
                background: 'transparent',
                border: 'none',
                color: c.textMuted,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline',
                textUnderlineOffset: 3,
              }}
            >
              Zurück zur Suche
            </button>
          )}
        </div>
        {!launched ? (
          <button
            onClick={onChangeMode}
            style={{
              background: 'transparent',
              border: 'none',
              color: c.textMuted,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline',
              textUnderlineOffset: 3,
            }}
          >
            Modus ändern
          </button>
        ) : (
          <button
            onClick={onClose}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'transparent',
              border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.10)',
              color: c.text,
              borderRadius: 8,
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
            Kampagne schließen
          </button>
        )}
      </div>

      {/* Two-column body with animated swap */}
      <motion.div
        layout
        transition={motionTransition}
        style={{
          display: 'grid',
          gridTemplateColumns: listFullWidth
            ? 'minmax(0, 1fr)'
            : 'minmax(0, 1fr) minmax(0, 1.05fr)',
          gap: 18,
          flex: 1,
          minHeight: 0,
        }}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {!launched && step === 'setup' && !hasResults && (
            <motion.div
              key="deep-search-card"
              layout
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={motionTransition}
              style={cardStyle}
            >
              <DeepSearchCard
                setup={setup}
                config={config}
                profiles={profiles}
                onPatchSetup={patchSetup}
                onPatchConfig={patchConfig}
                c={c}
                isDark={isDark}
              />
            </motion.div>
          )}
          <motion.div key="deep-liste-card" layout transition={motionTransition} style={cardStyle}>
            <DeepListeCard
              results={results}
              generating={generating}
              preScoring={preScoring}
              selectedKeys={selectedKeys}
              onToggleSelect={onToggleSelect}
              onToggleAll={onToggleAll}
              c={c}
              isDark={isDark}
            />
          </motion.div>
          {!launched && step === 'scoring' && (
            <motion.div
              key="deep-scoring-card"
              layout
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 80 }}
              transition={motionTransition}
              style={cardStyle}
            >
              <ScoringCard config={config} onPatchConfig={patchConfig} c={c} isDark={isDark} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Action row */}
      <AnimatePresence>
        {!launched && (
          <motion.div
            key="deep-action-row"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: 18,
              alignItems: 'center',
              gap: 12,
            }}
          >
            {step === 'setup' ? (
              <>
                {hasResults && !busy && (
                  <span style={{ fontSize: 12, color: c.textMuted, fontWeight: 600 }}>
                    {selectedCount} von {results!.length} Leads ausgewählt
                  </span>
                )}
                {hasResults && !busy && (
                  <button
                    onClick={onGenerate}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: 'transparent',
                      border: isDark
                        ? '1px solid rgba(255,255,255,0.12)'
                        : '1px solid rgba(0,0,0,0.10)',
                      color: c.text,
                      borderRadius: 10,
                      padding: '10px 16px',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    Neue Suche
                  </button>
                )}
                <button
                  onClick={hasResults ? () => onSetStep('scoring') : onGenerate}
                  disabled={busy || (hasResults && selectedCount === 0)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    background:
                      busy || (hasResults && selectedCount === 0)
                        ? isDark
                          ? `${c.accent}55`
                          : '#A5B4FC'
                        : c.accent,
                    color: '#fff',
                    border: 'none',
                    borderRadius: 10,
                    padding: '11px 22px',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor:
                      busy || (hasResults && selectedCount === 0) ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                    transition: 'background 150ms ease-out',
                    boxShadow:
                      busy || (hasResults && selectedCount === 0)
                        ? 'none'
                        : `0 6px 20px ${c.accent}38`,
                    minWidth: 110,
                    justifyContent: 'center',
                  }}
                >
                  {generating ? (
                    <>
                      <motion.span
                        style={{ display: 'inline-block', width: 13, height: 13 }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
                      >
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        >
                          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                        </svg>
                      </motion.span>
                      Lade Leads…
                    </>
                  ) : preScoring ? (
                    <>
                      <motion.span animate={{ rotate: 360 }} transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}>
                        <SparklesIcon size={13} />
                      </motion.span>
                      Scoring…
                    </>
                  ) : hasResults ? (
                    <>
                      <ArrowUpIcon size={13} />
                      Weiter mit {selectedCount}
                    </>
                  ) : (
                    <>
                      <ArrowUpIcon size={13} />
                      Generieren
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                <span style={{ fontSize: 12, color: c.textMuted, fontWeight: 600 }}>
                  {selectedCount} ausgewählte Leads · {config.sources.length} Quelle(n)
                </span>
                {(() => {
                  const disabled = config.sources.length === 0 || launching;
                  return (
                    <button
                      onClick={onLaunch}
                      disabled={disabled}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        background: disabled ? (isDark ? `${c.accent}55` : '#A5B4FC') : c.accent,
                        color: '#fff',
                        border: 'none',
                        borderRadius: 10,
                        padding: '11px 26px',
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        fontFamily: 'inherit',
                        transition: 'background 150ms ease-out',
                        boxShadow: disabled ? 'none' : `0 6px 20px ${c.accent}38`,
                        minWidth: 130,
                        justifyContent: 'center',
                      }}
                    >
                      {launching ? (
                        <>
                          <motion.span
                            style={{ display: 'inline-block', width: 13, height: 13 }}
                            animate={{ rotate: 360 }}
                            transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
                          >
                            <svg
                              width="13"
                              height="13"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                            >
                              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                            </svg>
                          </motion.span>
                          Startet…
                        </>
                      ) : (
                        <>
                          <SparklesIcon size={13} />
                          Anreichern starten
                        </>
                      )}
                    </button>
                  );
                })()}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function ChatSidebar({
  c,
  isDark,
  sessions,
  activeId,
  collapsed,
  onToggleCollapsed,
  onSelect,
  onNew,
}: {
  c: ReturnType<typeof colors>;
  isDark: boolean;
  sessions: ChatSession[];
  activeId: string;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onSelect: (id: string) => void;
  onNew: () => void;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const hoverBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.055)';
  const activeBg = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)';

  const grouped = GROUP_ORDER.reduce<Record<SessionGroup, ChatSession[]>>(
    (acc, g) => {
      acc[g] = sessions.filter((s) => s.group === g);
      return acc;
    },
    { Heute: [], Gestern: [], 'Diese Woche': [], Früher: [] }
  );

  function iconButton({
    onClick,
    title,
    children,
  }: {
    onClick: () => void;
    title: string;
    children: React.ReactNode;
  }) {
    return (
      <button
        onClick={onClick}
        title={title}
        aria-label={title}
        style={{
          width: 30,
          height: 30,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 7,
          border: 'none',
          background: 'transparent',
          color: c.textMuted,
          cursor: 'pointer',
          transition: 'background 100ms ease-out, color 100ms ease-out',
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = hoverBg;
          e.currentTarget.style.color = c.text;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = c.textMuted;
        }}
      >
        {children}
      </button>
    );
  }

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 56 : 220 }}
      transition={{ type: 'spring', stiffness: 320, damping: 36, mass: 0.7 }}
      style={{
        background: isDark ? 'rgba(10,12,24,0.40)' : 'rgba(255,255,255,0.42)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        borderRight: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'hidden',
        flexShrink: 0,
        height: '100%',
        position: 'relative',
        zIndex: 25,
      }}
    >
      {/* Top row */}
      <div
        style={{
          padding: collapsed ? '14px 8px 8px' : '14px 12px 10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          gap: 6,
          flexShrink: 0,
        }}
      >
        {!collapsed && (
          <span
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: c.text,
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
          >
            Lead Scout
          </span>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {!collapsed &&
            iconButton({
              onClick: onNew,
              title: 'Neue Suche',
              children: <PlusIcon size={16} />,
            })}
          {iconButton({
            onClick: onToggleCollapsed,
            title: collapsed ? 'Sidebar ausklappen' : 'Sidebar einklappen',
            children: collapsed ? <PanelLeftIcon size={16} /> : <PanelLeftCloseIcon size={16} />,
          })}
        </div>
      </div>

      {/* Collapsed body — just a "+ Neu" icon below */}
      {collapsed && (
        <div style={{ padding: '4px 8px', display: 'flex', justifyContent: 'center' }}>
          {iconButton({
            onClick: onNew,
            title: 'Neue Suche',
            children: <PlusIcon size={16} />,
          })}
        </div>
      )}

      {/* Grouped sessions — only when expanded */}
      {!collapsed && (
        <div style={{ flex: 1, padding: '0 6px 16px', overflowY: 'auto', overflowX: 'hidden' }}>
          {GROUP_ORDER.map((group) => {
            const items = grouped[group];
            if (items.length === 0) return null;
            return (
              <div key={group}>
                <div style={{ fontSize: 11, fontWeight: 600, color: c.textMuted, padding: '10px 10px 3px' }}>
                  {GROUP_LABELS[group]}
                </div>
                {items.map((session) => {
                  const isActive = session.id === activeId;
                  const isHovered = hoveredId === session.id;
                  return (
                    <button
                      key={session.id}
                      onClick={() => onSelect(session.id)}
                      onMouseEnter={() => setHoveredId(session.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 10px',
                        height: 34,
                        borderRadius: 8,
                        cursor: 'pointer',
                        background: isActive ? activeBg : isHovered ? hoverBg : 'transparent',
                        border: 'none',
                        textAlign: 'left',
                        fontFamily: 'var(--font-inter), Inter, sans-serif',
                        transition: 'background 80ms ease-out',
                        boxSizing: 'border-box',
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: isActive ? 600 : 400,
                          color: isActive ? c.text : c.textSub,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          width: '100%',
                        }}
                      >
                        {session.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </motion.aside>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DiscoveryPage() {
  const { theme } = useTheme();
  const c = colors(theme);
  const isDark = theme === 'dark';
  const { toast } = useToast();

  const [sessions, setSessions] = useState<ChatSession[]>(() => [
    {
      id: '__fresh_default__',
      title: 'Neue Suche',
      preview: '',
      time: 'gerade eben',
      group: 'Heute',
      messages: [],
      sources: new Set<SourceId>(['google_maps', 'linkedin', 'web']),
    },
    ...SEED_SESSIONS,
  ]);
  const [activeId, setActiveId] = useState<string>('__fresh_default__');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem('onvero.discovery.sidebarCollapsed');
      if (v === '1') setSidebarCollapsed(true);
    } catch {
      // ignore
    }
  }, []);

  function toggleSidebar() {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('onvero.discovery.sidebarCollapsed', next ? '1' : '0');
      } catch {
        // ignore
      }
      return next;
    });
  }
  const [selectedSources, setSelectedSources] = useState<Set<SourceId>>(new Set(['google_maps', 'linkedin', 'web']));
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevActiveIdRef = useRef<string>(activeId);

  const [angebotsProfile, setAngebotsProfile] = useState<AngebotsProfileLite[]>([]);
  const [absenderProfile, setAbsenderProfile] = useState<AbsenderProfileLite[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/angebots-profile', { cache: 'no-store' });
        const json = await res.json();
        const rows = Array.isArray(json?.profiles) ? json.profiles : [];
        if (cancelled) return;
        setAngebotsProfile(
          rows.map((p: { id: string; name?: string; unternehmen?: string }) => ({
            id: String(p.id ?? ''),
            name: String(p.name ?? '—'),
            unternehmen: String(p.unternehmen ?? ''),
          })),
        );
      } catch {
        // ignore
      }
    })();
    try {
      const rawB = localStorage.getItem(ABSENDER_STORAGE);
      if (rawB) {
        const parsed = JSON.parse(rawB);
        if (Array.isArray(parsed)) {
          setAbsenderProfile(
            parsed.map((p) => ({ id: String(p.id ?? ''), name: String(p.name ?? '—') })),
          );
        }
      }
    } catch {
      // ignore
    }
    return () => {
      cancelled = true;
    };
  }, []);

  const activeSession = sessions.find((s) => s.id === activeId);
  const activeMessages = activeSession?.messages ?? [];
  const hasMessages = activeMessages.length > 0;
  const activeMode = activeSession?.mode ?? null;
  const needsModePick = !hasMessages && !activeMode;
  const isBulkView = activeMode === 'bulk';
  const isDeepView = activeMode === 'deep';

  function pickMode(mode: ResearchMode) {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeId
          ? {
              ...s,
              mode,
              bulkSetup: mode === 'bulk' ? (s.bulkSetup ?? emptyBulkSetup()) : s.bulkSetup,
              deepSetup: mode === 'deep' ? (s.deepSetup ?? emptyDeepSetup()) : s.deepSetup,
              deepConfig: mode === 'deep' ? (s.deepConfig ?? emptyDeepConfig()) : s.deepConfig,
              deepStep: mode === 'deep' ? (s.deepStep ?? 'setup') : s.deepStep,
            }
          : s,
      ),
    );
  }

  function patchActiveSession(patch: Partial<ChatSession>) {
    setSessions((prev) => prev.map((s) => (s.id === activeId ? { ...s, ...patch } : s)));
  }

  function clearMode() {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeId
          ? {
              ...s,
              mode: undefined,
              bulkResults: undefined,
              bulkGenerating: false,
              bulkStep: undefined,
              deepResults: undefined,
              deepRawResults: undefined,
              deepGenerating: false,
              deepPreScoring: false,
              deepStep: undefined,
              deepLaunching: false,
              deepLaunched: false,
            }
          : s,
      ),
    );
  }

  function setBulkStep(step: BulkStep) {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeId
          ? {
              ...s,
              bulkStep: step,
              bulkOutreach: step === 'outreach' ? (s.bulkOutreach ?? emptyBulkOutreach()) : s.bulkOutreach,
            }
          : s,
      ),
    );
  }

  async function generateBulk() {
    if (!activeSession) return;
    const setup = activeSession.bulkSetup ?? emptyBulkSetup();
    const profile = angebotsProfile.find((p) => p.id === setup.angebotsProfileId);

    const title =
      [profile?.name, setup.orte[0], setup.weitereQueries[0]].filter(Boolean).join(' · ') || 'Bulk-Suche';
    patchActiveSession({ bulkGenerating: true, title, time: 'gerade eben' });

    await new Promise((r) => setTimeout(r, 1400));

    const seed =
      [setup.weitereQueries[0], setup.kriterien].find((v) => v && v.length > 0) ?? 'mode';
    const { results } = getResponse(String(seed));
    const padded = results.concat(FALLBACK.results).slice(0, 8);

    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeId
          ? {
              ...s,
              bulkGenerating: false,
              bulkResults: padded,
              preview: `${padded.length} Unternehmen entdeckt`,
              bulkStep: 'outreach',
              bulkOutreach: s.bulkOutreach ?? emptyBulkOutreach(),
            }
          : s,
      ),
    );
  }

  async function launchOutreach() {
    if (!activeSession) return;
    if (activeSession.bulkLaunching || activeSession.bulkLaunched) return;
    patchActiveSession({ bulkLaunching: true });
    toast('Kampagne wird gestartet…', 'info');
    await new Promise((r) => setTimeout(r, 1200));
    patchActiveSession({
      bulkLaunching: false,
      bulkLaunched: true,
      bulkLaunchedAt: Date.now(),
    });
    toast(
      `Kampagne gestartet — Outreach läuft für ${activeSession.bulkResults?.length ?? 0} Unternehmen`,
      'success',
    );
  }

  // ─── Deep-Research handlers ─────────────────────────────────────────────────

  async function generateDeep() {
    if (!activeSession) return;
    if (activeSession.deepGenerating || activeSession.deepPreScoring) return;
    const setup = activeSession.deepSetup ?? emptyDeepSetup();
    const profile = angebotsProfile.find((p) => p.id === setup.angebotsProfileId);
    const title =
      [profile?.name, setup.orte[0], setup.weitereQueries[0]].filter(Boolean).join(' · ') || 'Deep-Suche';

    // Phase 1: kick off webhook call
    patchActiveSession({
      deepGenerating: true,
      deepPreScoring: false,
      deepRawResults: undefined,
      deepResults: undefined,
      deepSelectedKeys: [],
      title,
      time: 'gerade eben',
    });

    let parsed: DeepResult[] = [];
    let error: string | null = null;

    try {
      const res = await fetch('/api/generate/discovery-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          setup: {
            angebots_profile_id: setup.angebotsProfileId,
            recherche_fokus: setup.rechercheFokus,
            weitere_queries: setup.weitereQueries,
            kriterien: setup.kriterien,
            orte: setup.orte,
          },
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);

      parsed = extractDeepLeads(json.data ?? json);
    } catch (e) {
      error = e instanceof Error ? e.message : 'Unbekannter Fehler';
    }

    if (error) {
      patchActiveSession({
        deepGenerating: false,
        deepPreScoring: false,
        deepRawResults: [],
        deepResults: [],
        preview: 'Discovery fehlgeschlagen',
      });
      toast(`Discovery-Agent: ${error}`, 'error');
      return;
    }

    // Phase 2: show raw list with pre-scoring animation
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeId
          ? {
              ...s,
              deepGenerating: false,
              deepPreScoring: true,
              deepRawResults: parsed,
              deepResults: parsed,
            }
          : s,
      ),
    );

    await new Promise((r) => setTimeout(r, 1200));

    // Phase 3: sort by score if present; otherwise keep webhook order
    const hasScores = parsed.some((r) => typeof r.score === 'number');
    const finalResults = hasScores
      ? [...parsed].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      : parsed;

    const allKeys = finalResults.map((r, i) => deepLeadKey(r, i));

    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeId
          ? {
              ...s,
              deepPreScoring: false,
              deepResults: finalResults,
              deepSelectedKeys: allKeys,
              preview:
                finalResults.length > 0
                  ? `${finalResults.length} Leads gefunden`
                  : 'Keine Leads gefunden',
            }
          : s,
      ),
    );
  }

  function toggleDeepSelect(key: string) {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== activeId) return s;
        const current = new Set(s.deepSelectedKeys ?? []);
        if (current.has(key)) current.delete(key);
        else current.add(key);
        return { ...s, deepSelectedKeys: Array.from(current) };
      }),
    );
  }

  function toggleDeepSelectAll() {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== activeId) return s;
        const all = (s.deepResults ?? []).map((r, i) => deepLeadKey(r, i));
        const current = s.deepSelectedKeys ?? [];
        const next = current.length === all.length ? [] : all;
        return { ...s, deepSelectedKeys: next };
      }),
    );
  }

  function setDeepStep(step: DeepStep) {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeId
          ? { ...s, deepStep: step, deepConfig: s.deepConfig ?? emptyDeepConfig() }
          : s,
      ),
    );
  }

  async function launchDeep() {
    if (!activeSession) return;
    if (activeSession.deepLaunching || activeSession.deepLaunched) return;
    const selectedCount = activeSession.deepSelectedKeys?.length ?? 0;
    patchActiveSession({ deepLaunching: true });
    toast('Anreicherung wird gestartet…', 'info');
    await new Promise((r) => setTimeout(r, 1200));
    patchActiveSession({ deepLaunching: false, deepLaunched: true });
    toast(`Anreicherung gestartet — Daten werden für ${selectedCount} Leads geladen`, 'success');
  }

  function closeDeepCampaign() {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeId
          ? {
              ...s,
              deepResults: undefined,
              deepRawResults: undefined,
              deepGenerating: false,
              deepPreScoring: false,
              deepStep: 'setup',
              deepLaunching: false,
              deepLaunched: false,
              title: 'Neue Suche',
              preview: '',
            }
          : s,
      ),
    );
    toast('Kampagne geschlossen', 'info');
  }

  function closeCampaign() {
    if (!activeSession) return;
    // Reset bulk state; keep mode so user lands back in setup
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeId
          ? {
              ...s,
              bulkResults: undefined,
              bulkGenerating: false,
              bulkStep: 'setup',
              bulkLaunching: false,
              bulkLaunched: false,
              bulkLaunchedAt: undefined,
              title: 'Neue Suche',
              preview: '',
            }
          : s,
      ),
    );
    toast('Kampagne geschlossen', 'info');
  }

  // Auto-resize textarea
  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = '24px';
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [input, adjustHeight]);

  // Scroll to bottom — instant on session switch, smooth on new message
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const sessionSwitched = prevActiveIdRef.current !== activeId;
    prevActiveIdRef.current = activeId;
    if (sessionSwitched) {
      el.scrollTop = el.scrollHeight;
    } else {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  }, [activeId, activeMessages]);

  function toggleSource(id: SourceId) {
    setSelectedSources((prev) => {
      const next = new Set(prev);
      if (next.has(id) && next.size > 1) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function createNewSession(): ChatSession {
    return {
      id: `new_${Date.now()}`,
      title: 'Neue Suche',
      preview: '',
      time: 'gerade eben',
      group: 'Heute',
      messages: [],
      sources: new Set(selectedSources),
    };
  }

  function handleNewSession() {
    const session = createNewSession();
    setSessions((prev) => [session, ...prev]);
    setActiveId(session.id);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = '24px';
  }

  async function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = '24px';

    const currentSession = sessions.find((s) => s.id === activeId);
    const hasExistingUserMessages = currentSession?.messages.some((m) => m.role === 'user') ?? false;

    let targetId = activeId;

    if (hasExistingUserMessages) {
      // Create a new session
      const newSession: ChatSession = {
        id: `new_${Date.now()}`,
        title: msg.slice(0, 40).trim(),
        preview: '',
        time: 'gerade eben',
        group: 'Heute',
        messages: [],
        sources: new Set(selectedSources),
      };
      setSessions((prev) => [newSession, ...prev]);
      targetId = newSession.id;
      setActiveId(newSession.id);
    } else {
      // Update existing session title
      setSessions((prev) =>
        prev.map((s) => (s.id === activeId ? { ...s, title: msg.slice(0, 40).trim(), time: 'gerade eben' } : s))
      );
    }

    const userMsg: Message = { id: `${Date.now()}_u`, role: 'user', text: msg };
    const loadMsg: Message = { id: `${Date.now()}_l`, role: 'bot', text: '', loading: true };

    setSessions((prev) =>
      prev.map((s) => (s.id === targetId ? { ...s, messages: [...s.messages, userMsg, loadMsg], preview: msg } : s))
    );
    setLoading(true);

    await new Promise((r) => setTimeout(r, 1600));
    const { reply, results } = getResponse(msg);

    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== targetId) return s;
        const filtered = s.messages.filter((m) => !m.loading);
        return {
          ...s,
          preview: reply,
          messages: [
            ...filtered,
            { id: `${Date.now()}_r`, role: 'bot' as const, text: reply },
            { id: `${Date.now()}_res`, role: 'bot' as const, text: `${results.length} Unternehmen entdeckt`, results },
          ],
        };
      })
    );
    setLoading(false);
  }

  const activeSources = SOURCES.filter((s) => selectedSources.has(s.id));

  const inputCard: React.CSSProperties = {
    background: isDark ? 'rgba(10,12,24,0.46)' : 'rgba(255,255,255,0.54)',
    backdropFilter: 'blur(22px)',
    WebkitBackdropFilter: 'blur(22px)',
    borderRadius: 24,
    border: focused
      ? `1px solid ${c.accent}60`
      : isDark
        ? '1px solid rgba(255,255,255,0.10)'
        : '1px solid rgba(255,255,255,0.72)',
    boxShadow: focused
      ? `0 0 0 3px ${c.accent}18, ${isDark ? 'inset 1px 1px 2px rgba(255,255,255,0.08), 0 8px 32px rgba(0,0,0,0.32)' : 'inset 3px 3px 4px rgba(255,255,255,0.65), 0 4px 24px rgba(0,0,0,0.07)'}`
      : isDark
        ? 'inset 1px 1px 2px rgba(255,255,255,0.08), 0 8px 32px rgba(0,0,0,0.32)'
        : 'inset 3px 3px 4px rgba(255,255,255,0.65), 0 4px 24px rgba(0,0,0,0.07)',
    transition: 'border-color 180ms ease-out, box-shadow 180ms ease-out',
  };

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'row',
        height: '100%',
        fontFamily: 'var(--font-inter), Inter, sans-serif',
      }}
    >
      <GlassPageFilters />
      {/* Left sidebar — chat history */}
      <ChatSidebar
        c={c}
        isDark={isDark}
        sessions={sessions}
        activeId={activeId}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={toggleSidebar}
        onSelect={(id) => {
          setActiveId(id);
          setInput('');
          if (textareaRef.current) textareaRef.current.style.height = '24px';
          if (scrollContainerRef.current)
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }}
        onNew={handleNewSession}
      />

      {/* Chat area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          minWidth: 0,
          overflow: 'hidden',
          paddingTop: isBulkView || isDeepView ? 0 : 84,
        }}
      >
        {isBulkView && activeSession ? (
          <BulkPanel
            session={activeSession}
            profiles={angebotsProfile}
            absenderProfile={absenderProfile}
            onChange={patchActiveSession}
            onGenerate={generateBulk}
            onChangeMode={clearMode}
            onSetStep={setBulkStep}
            onLaunch={launchOutreach}
            onClose={closeCampaign}
            c={c}
            isDark={isDark}
          />
        ) : isDeepView && activeSession ? (
          <DeepPanel
            session={activeSession}
            profiles={angebotsProfile}
            onChange={patchActiveSession}
            onGenerate={generateDeep}
            onChangeMode={clearMode}
            onSetStep={setDeepStep}
            onLaunch={launchDeep}
            onClose={closeDeepCampaign}
            onToggleSelect={toggleDeepSelect}
            onToggleAll={toggleDeepSelectAll}
            c={c}
            isDark={isDark}
          />
        ) : (
          <>
        {/* Message thread */}
        <div ref={scrollContainerRef} style={{ flex: 1, overflowY: 'auto', padding: '0 0 8px' }}>
          <AnimatePresence>
            {needsModePick && (
              <motion.div
                key={`mode-pick-${activeId}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '70vh',
                  padding: '40px 32px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    color: c.text,
                    letterSpacing: '-0.03em',
                    lineHeight: 1.15,
                    marginBottom: 8,
                  }}
                >
                  Wie willst Du suchen?
                </div>
                <div style={{ fontSize: 14, color: c.textMuted, marginBottom: 32, maxWidth: 460 }}>
                  Wähle den Modus für diese Kampagne — Du kannst danach Deine Suche beschreiben.
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: 16,
                    width: '100%',
                    maxWidth: 680,
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                  }}
                >
                  <ModeCard
                    Icon={LayersIcon}
                    title="Bulk-Research"
                    description="Perfekt für einfache Produkte und universelle Leistungen. Schnell, breit, viele Treffer."
                    onClick={() => pickMode('bulk')}
                    c={c}
                    isDark={isDark}
                    delay={0.05}
                  />
                  <ModeCard
                    Icon={TelescopeIcon}
                    title="Deep-Research"
                    description="Perfekt für spezialisierte Leistungen und langfristige Partnerschaften. Wenige, dafür präzise Treffer."
                    onClick={() => pickMode('deep')}
                    c={c}
                    isDark={isDark}
                    delay={0.12}
                  />
                </div>
              </motion.div>
            )}
            {!hasMessages && activeMode && (
              <motion.div
                key={`empty-with-mode-${activeId}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '60vh',
                  padding: '40px 32px',
                  textAlign: 'center',
                  gap: 12,
                }}
              >
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 12px',
                    borderRadius: 99,
                    background: c.accent + '14',
                    color: c.accent,
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {activeMode === 'bulk' ? <LayersIcon size={13} /> : <TelescopeIcon size={13} />}
                  {activeMode === 'bulk' ? 'Bulk-Research' : 'Deep-Research'}
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: c.text, letterSpacing: '-0.02em' }}>
                  Beschreibe Deine Zielgruppe
                </div>
                <div style={{ fontSize: 13, color: c.textMuted, maxWidth: 420 }}>
                  Branche, Region oder Unternehmensgröße — ich suche über alle aktiven Quellen.
                </div>
                <button
                  onClick={() =>
                    setSessions((prev) => prev.map((s) => (s.id === activeId ? { ...s, mode: undefined } : s)))
                  }
                  style={{
                    marginTop: 4,
                    background: 'transparent',
                    border: 'none',
                    color: c.textMuted,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    textUnderlineOffset: 3,
                  }}
                >
                  Modus ändern
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Messages */}
          {hasMessages && (
            <div style={{ padding: '0 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <AnimatePresence initial={false}>
                {activeMessages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28, ease: 'easeOut' }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    }}
                  >
                    {msg.loading ? (
                      <div
                        style={{
                          background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.52)',
                          backdropFilter: 'blur(16px)',
                          WebkitBackdropFilter: 'blur(16px)',
                          border: isDark ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(255,255,255,0.65)',
                          borderRadius: '16px 16px 16px 4px',
                          boxShadow: isDark
                            ? 'inset 1px 1px 2px rgba(255,255,255,0.06)'
                            : 'inset 2px 2px 3px rgba(255,255,255,0.55)',
                        }}
                      >
                        <TypingDots c={c} />
                      </div>
                    ) : msg.results ? (
                      <div style={{ width: '100%', maxWidth: 540 }}>
                        <div
                          style={{
                            fontSize: 13,
                            color: isDark ? '#a5b4fc' : c.accent,
                            fontWeight: 700,
                            marginBottom: 12,
                            padding: '10px 14px',
                            background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.52)',
                            backdropFilter: 'blur(16px)',
                            WebkitBackdropFilter: 'blur(16px)',
                            borderRadius: '16px 16px 16px 4px',
                            border: isDark ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(255,255,255,0.65)',
                            boxShadow: isDark
                              ? 'inset 1px 1px 2px rgba(255,255,255,0.06)'
                              : 'inset 2px 2px 3px rgba(255,255,255,0.55)',
                          }}
                        >
                          {msg.results.length} Unternehmen entdeckt — ins Archiv übertragen
                        </div>
                        {msg.results.map((r, i) => (
                          <ResultCard key={i} r={r} c={c} i={i} isDark={isDark} />
                        ))}
                      </div>
                    ) : (
                      <div
                        style={{
                          maxWidth: 480,
                          padding: '11px 16px',
                          borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                          backdropFilter: 'blur(16px)',
                          WebkitBackdropFilter: 'blur(16px)',
                          ...(msg.role === 'user'
                            ? {
                                background: isDark ? 'rgba(99,102,241,0.28)' : 'rgba(79,70,229,0.13)',
                                border: isDark ? '1px solid rgba(124,58,237,0.45)' : '1px solid rgba(79,70,229,0.28)',
                                boxShadow: isDark
                                  ? 'inset 1px 1px 2px rgba(124,58,237,0.18)'
                                  : 'inset 2px 2px 3px rgba(255,255,255,0.45)',
                                color: isDark ? '#c4b5fd' : '#3730a3',
                              }
                            : {
                                background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.52)',
                                border: isDark
                                  ? '1px solid rgba(255,255,255,0.10)'
                                  : '1px solid rgba(255,255,255,0.65)',
                                boxShadow: isDark
                                  ? 'inset 1px 1px 2px rgba(255,255,255,0.06)'
                                  : 'inset 2px 2px 3px rgba(255,255,255,0.55)',
                                color: c.text,
                              }),
                          fontSize: 14,
                          lineHeight: 1.55,
                          fontWeight: msg.role === 'user' ? 600 : 400,
                        }}
                      >
                        {msg.text}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Input area */}
        <div
          style={{
            padding: '12px 32px 28px',
            flexShrink: 0,
            display: needsModePick ? 'none' : 'block',
          }}
        >
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            <div style={inputCard}>
              {/* Source toggles */}
              <div
                style={{
                  display: 'flex',
                  gap: 6,
                  padding: '12px 16px 0',
                  alignItems: 'center',
                }}
              >
                <span
                  style={{ fontSize: 11, fontWeight: 700, color: c.textMuted, letterSpacing: '0.06em', marginRight: 2 }}
                >
                  QUELLEN
                </span>
                {SOURCES.map((s) => {
                  const active = selectedSources.has(s.id);
                  return (
                    <GlassButton
                      key={s.id}
                      size="sm"
                      isDark={isDark}
                      onClick={() => toggleSource(s.id)}
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        background: active ? c.accent : undefined,
                        color: active ? '#fff' : c.textMuted,
                        fontFamily: 'inherit',
                      }}
                    >
                      {s.label}
                    </GlassButton>
                  );
                })}
              </div>

              {/* Textarea */}
              <div style={{ padding: '10px 16px 4px' }}>
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder="Beschreibe welche Unternehmen du suchst…"
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    resize: 'none',
                    fontSize: 15,
                    color: c.text,
                    fontFamily: 'inherit',
                    lineHeight: 1.55,
                    height: 24,
                    minHeight: 24,
                    maxHeight: 140,
                    overflow: 'hidden',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Footer row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px 12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <button
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      border: 'none',
                      background: 'transparent',
                      color: c.textMuted,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <PaperclipIcon size={16} />
                  </button>
                </div>
                <GlassButton
                  size="sm"
                  isDark={isDark}
                  onClick={() => send()}
                  disabled={!input.trim() || loading}
                  contentClassName="flex items-center gap-1.5"
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    fontFamily: 'inherit',
                    background: input.trim() && !loading ? c.accent : undefined,
                    color: input.trim() && !loading ? '#fff' : c.textMuted,
                  }}
                >
                  <ArrowUpIcon size={13} />
                  <span>Suchen</span>
                </GlassButton>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: 10, fontSize: 11, color: c.textMuted }}>
              {activeSources.map((s) => s.label).join(' · ')} · Enter zum Senden
            </div>
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  );
}
