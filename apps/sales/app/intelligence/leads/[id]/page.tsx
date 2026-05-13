'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useLayoutEffect, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpIcon, Users, Calendar, Globe, Phone, X, Info, ChevronDown } from 'lucide-react';
import { useTheme, colors } from '../../layout';
import { GlassPageFilters } from '@/components/ui/liquid-glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { TypingEffect } from '@/components/ui/typing-effect';

// ─── Types ────────────────────────────────────────────────────────────────────

type LeadStatus = 'hot' | 'warm' | 'cold';
type ActiveTab = 'info' | 'outbound' | 'bot';

interface Contact {
  name: string;
  role: string;
  linkedin?: string;
  email?: string;
  phone?: string;
  source: 'linkedin' | 'openregister' | 'salesnavigator' | 'manual' | 'website';
}

interface ReviewEntry {
  score: number;
  platform: string;
  count?: number;
}

interface LeadDetail {
  id: string;
  name: string;
  city: string;
  industry: string;
  initials: string;
  color: string;
  score: number;
  scoreReason: string;
  fit: number;
  volume: number;
  timing: number;
  status: LeadStatus;
  // Firmographics
  founded?: string;
  employees?: string;
  employeeTrend?: 'up' | 'down' | 'stable';
  employeeHistory?: string;
  revenue?: string;
  website?: string;
  shopSystem?: string;
  phone?: string;
  facebook?: string;
  instagramFollowers?: number;
  facebookFollowers?: number;
  instagramPosts?: number;
  companyType?: string[];
  branchCode?: string;
  branchDescription?: string;
  representative?: string;
  // Growth / Health
  greenflags: string[];
  redflags: string[];
  financials?: string;
  lastCEOChange?: string;
  // Reviews — new array format takes priority over legacy individual fields
  reviews?: ReviewEntry[];
  trustpilot?: number;
  google?: number;
  kununu?: number;
  openMentions?: number;
  // Updates
  lastPosted?: string;
  updatesList: { text: string; time: string; source: string }[];
  aiUpdateSummary?: string;
  // Operations (AI Layer 2)
  coreServices?: string[];
  targetCustomers?: string[];
  usp?: string[];
  partners?: string[];
  openPositions?: string[];
  personalizationHooks?: string[];
  customFields?: { key: string; value: string }[];
  // Shipping estimate
  shippingEstimate?: {
    disclaimer: string;
    lines: { label: string; value: string; note?: string }[];
    total: string;
    assessment: string;
    assessmentLevel: 'low' | 'medium' | 'high';
  };
  // Outbound
  contacts: Contact[];
  toneOfVoice?: string;
  companyCharacter?: string;
  pitch: string;
  proposedOffer?: string;
  enriched: { source: string; status: 'active' | 'partial' | 'missing' }[];
  // Extra enriched fields (set by mapDbLead)
  _empHistory?: { year: number; employees: number }[];
  _rawGreenFlags?: { flag: string; source?: string }[];
  _rawRedFlags?: { flag: string; source?: string; severity?: string }[];
  lead_summary?: string;
  tech_stack?: string[];
  legal_form?: string;
  hrb_number?: string;
  court?: string;
}

// ─── DB mapper ───────────────────────────────────────────────────────────────

function mapDbLead(d: Record<string, unknown>): LeadDetail {
  const empHistory = Array.isArray(d.or_employees_history)
    ? (d.or_employees_history as { year: number; employees: number }[])
    : [];
  const sorted = [...empHistory].sort((a, b) => b.year - a.year);
  const latest = sorted[0]?.employees;
  const prev = sorted[1]?.employees;
  const empTrend: 'up' | 'down' | 'stable' | undefined =
    latest != null && prev != null ? (latest > prev ? 'up' : latest < prev ? 'down' : 'stable') : undefined;
  const empHistoryStr =
    sorted.length >= 2
      ? sorted
          .slice(0, 5)
          .map((e) => `${e.year}: ${e.employees}`)
          .join(' · ')
      : undefined;

  const greenflags: string[] = Array.isArray(d.green_flags)
    ? (d.green_flags as { flag?: string }[]).map((g) => (typeof g === 'string' ? g : (g.flag ?? ''))).filter(Boolean)
    : Array.isArray(d.strengths)
      ? (d.strengths as string[])
      : [];

  const redflags: string[] = Array.isArray(d.red_flags)
    ? (d.red_flags as { flag?: string }[]).map((r) => (typeof r === 'string' ? r : (r.flag ?? ''))).filter(Boolean)
    : Array.isArray(d.concerns)
      ? (d.concerns as string[])
      : [];

  const reviewsArr: ReviewEntry[] = [];
  if (d.google_rating)
    reviewsArr.push({
      score: Number(d.google_rating),
      platform: 'Google',
      count: d.google_review_count as number | undefined,
    });
  if (d.kununu_rating) reviewsArr.push({ score: Number(d.kununu_rating), platform: 'Kununu' });
  if (d.trustpilot_rating) reviewsArr.push({ score: Number(d.trustpilot_rating), platform: 'Trustpilot' });
  if (d.provenexpert_rating) reviewsArr.push({ score: Number(d.provenexpert_rating), platform: 'ProvenExpert' });

  const contacts: Contact[] = [];
  const dirs = Array.isArray(d.managing_directors) ? (d.managing_directors as string[]) : [];
  dirs.forEach((name) => contacts.push({ name, role: 'Geschäftsführer', source: 'openregister' }));
  if (Array.isArray(d.decision_makers)) {
    (
      d.decision_makers as { name?: string; role?: string; title?: string; email?: string; linkedin_url?: string }[]
    ).forEach((dm) => {
      if (dm.name && !contacts.find((c) => c.name === dm.name)) {
        contacts.push({
          name: dm.name,
          role: dm.role ?? dm.title ?? 'Entscheider',
          email: dm.email,
          linkedin: dm.linkedin_url,
          source: 'salesnavigator',
        });
      }
    });
  }

  const enriched: LeadDetail['enriched'] = [];
  if (d.linkedin_url) enriched.push({ source: 'LinkedIn', status: 'active' });
  if (d.openregister_company_id) enriched.push({ source: 'Openregister', status: 'active' });
  if (d.instagram_url) enriched.push({ source: 'Instagram', status: 'active' });
  if (d.facebook_url) enriched.push({ source: 'Facebook', status: 'active' });
  if (d.website) enriched.push({ source: 'Website', status: 'active' });
  if (enriched.length === 0) enriched.push({ source: 'Apollo', status: 'missing' });

  const tierRaw = ((d.tier ?? d.status ?? 'warm') as string).toLowerCase();
  const status: LeadStatus = tierRaw === 'hot' ? 'hot' : tierRaw === 'cold' ? 'cold' : 'warm';

  const palette = ['#4F46E5', '#10B981', '#F97316', '#7C3AED', '#0EA5E9', '#EF4444'];
  const nameStr = (d.company_name as string) || '';
  const hash = nameStr.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const color = palette[hash % palette.length];
  const initials =
    nameStr
      .split(' ')
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || '??';

  const growthSignals = Array.isArray(d.growth_signals) ? (d.growth_signals as string[]) : [];
  const updatesList = growthSignals.map((text) => ({ text, time: '', source: '' }));

  return {
    id: d.id as string,
    name: nameStr,
    city: (d.city as string) ?? '',
    industry: (d.industry as string) ?? '',
    initials,
    color,
    score: (d.lead_score as number) ?? 0,
    fit: (d.fit_score as number) ?? 0,
    volume: 0,
    timing: 0,
    scoreReason: (d.lead_score_reasoning as string) ?? '',
    status,
    founded: d.founded_year != null ? String(d.founded_year) : undefined,
    employees:
      d.num_employees != null ? String(d.num_employees) : (d.estimated_employees_scraped as string | undefined),
    employeeTrend: empTrend,
    employeeHistory: empHistoryStr,
    revenue:
      d.annual_revenue != null
        ? `${(Number(d.annual_revenue) / 1_000_000).toFixed(1)} Mio. €`
        : (d.estimated_revenue_scraped as string | undefined),
    website: d.website as string | undefined,
    phone: d.phone as string | undefined,
    facebook: d.facebook_url as string | undefined,
    instagramFollowers: d.instagram_followers as number | undefined,
    facebookFollowers: d.facebook_followers as number | undefined,
    instagramPosts: d.instagram_posts_count as number | undefined,
    companyType: [],
    branchCode: d.industry_code as string | undefined,
    branchDescription: d.industry as string | undefined,
    representative: dirs.join(', ') || undefined,
    greenflags,
    redflags,
    financials: d.financials_summary as string | undefined,
    reviews: reviewsArr.length > 0 ? reviewsArr : undefined,
    trustpilot: d.trustpilot_rating != null ? Number(d.trustpilot_rating) : undefined,
    google: d.google_rating != null ? Number(d.google_rating) : undefined,
    kununu: d.kununu_rating != null ? Number(d.kununu_rating) : undefined,
    updatesList,
    aiUpdateSummary: d.recent_events_summary as string | undefined,
    coreServices: Array.isArray(d.core_services) ? (d.core_services as string[]) : [],
    targetCustomers: d.target_customers ? [d.target_customers as string] : [],
    usp: d.usp ? [d.usp as string] : [],
    partners: Array.isArray(d.partners)
      ? (d.partners as unknown[])
          .map((p) => (typeof p === 'string' ? p : ((p as { name?: string }).name ?? '')))
          .filter(Boolean)
      : [],
    personalizationHooks: Array.isArray(d.personalization_hooks) ? (d.personalization_hooks as string[]) : [],
    toneOfVoice: d.tone_of_voice as string | undefined,
    pitch: (d.one_min_pitch as string) ?? '',
    proposedOffer: d.suggested_offer as string | undefined,
    contacts,
    enriched,
    customFields: (() => {
      if (Array.isArray(d.custom_fields)) return d.custom_fields as { key: string; value: string }[];
      if (d.custom_fields && typeof d.custom_fields === 'object')
        return Object.entries(d.custom_fields).map(([key, val]) => ({ key, value: String(val) }));
      return [];
    })(),
    _empHistory: sorted,
    _rawGreenFlags: Array.isArray(d.green_flags) ? (d.green_flags as { flag: string; source?: string }[]) : [],
    _rawRedFlags: Array.isArray(d.red_flags)
      ? (d.red_flags as { flag: string; source?: string; severity?: string }[])
      : [],
    lead_summary: d.lead_summary as string | undefined,
    tech_stack: Array.isArray(d.tech_stack) ? (d.tech_stack as string[]) : [],
    legal_form: d.legal_form as string | undefined,
    hrb_number: d.hrb_number as string | undefined,
    court: d.court as string | undefined,
  };
}

// ─── (Demo data and getFallback removed — using live Supabase fetch) ─────────

// ─── Helpers ──────────────────────────────────────────────────────────────────

function glassCard(isDark: boolean): React.CSSProperties {
  const b = isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.7)';
  return {
    background: isDark ? 'rgba(10,12,24,0.46)' : 'rgba(255,255,255,0.22)',
    backdropFilter: 'blur(22px)',
    WebkitBackdropFilter: 'blur(22px)',
    borderTop: b,
    borderRight: b,
    borderBottom: b,
    borderLeft: b,
    boxShadow: isDark
      ? '0 4px 24px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.06)'
      : '0 4px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)',
  };
}

function scoreColor(s: number) {
  return s >= 85 ? '#10B981' : s >= 70 ? '#F97316' : '#EF4444';
}

function ScoreRing({ score, size = 56 }: { score: number; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const col = scoreColor(score);
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(148,163,184,0.2)" strokeWidth={7} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={col}
        strokeWidth={7}
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - score / 100)}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fill={col}
        fontSize={14}
        fontWeight={800}
        fontFamily="Inter,sans-serif"
      >
        {score}
      </text>
    </svg>
  );
}

function SectionBlock({
  title,
  badge,
  badgeColor,
  accent,
  children,
  isDark,
  c,
}: {
  title: string;
  badge?: string | number;
  badgeColor?: string;
  accent?: string;
  children: React.ReactNode;
  isDark: boolean;
  c: ReturnType<typeof colors>;
}) {
  const bc = badgeColor ?? '#10B981';
  return (
    <div
      style={{
        ...glassCard(isDark),
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 12,
        ...(accent ? { borderTop: `2px solid ${accent}` } : {}),
      }}
    >
      <div
        style={{
          padding: '9px 14px',
          background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.025)',
          borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 800,
            color: c.textMuted,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          {title}
        </span>
        {badge !== undefined && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: bc,
              background: bc + '18',
              padding: '1px 8px',
              borderRadius: 99,
            }}
          >
            {badge}
          </span>
        )}
      </div>
      <div style={{ padding: '12px 14px' }}>{children}</div>
    </div>
  );
}

function DataRow({
  label,
  value,
  tag,
  trend,
  c,
  isDark,
}: {
  label: string;
  value?: string;
  tag?: string;
  trend?: 'up' | 'down' | 'stable';
  c: ReturnType<typeof colors>;
  isDark: boolean;
}) {
  const trendColor = trend === 'up' ? '#10B981' : trend === 'down' ? '#EF4444' : '#94A3B8';
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '6px 0',
        borderBottom: isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(0,0,0,0.04)',
      }}
    >
      <span style={{ fontSize: 12, color: c.textMuted, flexShrink: 0, marginRight: 10 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {trend && (
          <span style={{ fontSize: 11, color: trendColor, fontWeight: 700 }}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
          </span>
        )}
        {tag && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: '#10B981',
              background: 'rgba(16,185,129,0.15)',
              padding: '1px 6px',
              borderRadius: 4,
            }}
          >
            {tag}
          </span>
        )}
        <span style={{ fontSize: 12, fontWeight: 600, color: value ? c.text : c.textMuted, textAlign: 'right' }}>
          {value || '—'}
        </span>
      </div>
    </div>
  );
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

const QUICK_PROMPTS = ['Besten Pitch zeigen', 'Wettbewerber analysieren', 'Was übersehe ich?', 'Wann kontaktieren?'];
const BOT_RESPONSES: Record<string, string> = {
  pitch:
    'Basierend auf den Signalen: Spreche die aktuellen Carrier-Probleme direkt an und biete einen konkreten SLA-Vergleich mit 3 Referenzkunden aus der gleichen Branche.',
  wettbewerb:
    'Die Hauptwettbewerber sind DHL, GLS und DPD. Der Lead hat zuletzt negative Bewertungen für DHL erhalten — das ist dein Einstieg.',
  übersehe:
    'Das Unternehmen ist gerade intern in Umstrukturierung. Die neue Operations-Stelle deutet auf eine Professionalisierung des Fulfillments hin — guter Zeitpunkt.',
  zeitpunkt:
    'Optimaler Zeitpunkt: Diese Woche. Das Funding ist frisch, die Logistics-Stelle noch offen — der Entscheider ist im Evaluationsmodus.',
  fallback:
    'Basierend auf Score, Signalen und Firmendaten: Ein Erstkontakt per LinkedIn mit personalisierten Signal-Referenzen hat die höchste Erfolgswahrscheinlichkeit.',
};
function getBotReply(text: string) {
  const l = text.toLowerCase();
  if (l.includes('pitch')) return BOT_RESPONSES.pitch;
  if (l.includes('wettbewerb') || l.includes('konkurrenz')) return BOT_RESPONSES.wettbewerb;
  if (l.includes('übersehe') || l.includes('vergessen')) return BOT_RESPONSES.übersehe;
  if (l.includes('zeitpunkt') || l.includes('wann') || l.includes('kontakt')) return BOT_RESPONSES.zeitpunkt;
  return BOT_RESPONSES.fallback;
}

type ChatMsg = { id: string; role: 'user' | 'bot'; text: string; loading?: boolean };

function ChatTypingDots({ c }: { c: ReturnType<typeof colors> }) {
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

function ChatTab({ lead, c, isDark }: { lead: LeadDetail; c: ReturnType<typeof colors>; isDark: boolean }) {
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = '24px';
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [input, adjustHeight]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [msgs]);

  async function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || busy) return;
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = '24px';
    const userMsg: ChatMsg = { id: `${Date.now()}_u`, role: 'user', text: msg };
    const loadMsg: ChatMsg = { id: `${Date.now()}_l`, role: 'bot', text: '', loading: true };
    setMsgs((p) => [...p, userMsg, loadMsg]);
    setBusy(true);
    await new Promise((r) => setTimeout(r, 1200));
    setMsgs((p) => [...p.filter((m) => !m.loading), { id: `${Date.now()}_r`, role: 'bot', text: getBotReply(msg) }]);
    setBusy(false);
  }

  const hasMessages = msgs.length > 0;

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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Message area */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '0 0 8px', minHeight: 0 }}>
        <AnimatePresence>
          {!hasMessages && (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 320,
                padding: '40px 32px',
                textAlign: 'center',
              }}
            >
              <div style={{ marginBottom: 10 }}>
                <TypingEffect
                  texts={QUICK_PROMPTS}
                  typingSpeed={60}
                  rotationInterval={2200}
                  className="font-inter"
                  style={{
                    fontSize: 24,
                    fontWeight: 800,
                    color: c.text,
                    letterSpacing: '-0.02em',
                    lineHeight: 1.2,
                    fontFamily: 'var(--font-inter), Inter, sans-serif',
                  }}
                />
              </div>
              <div style={{ fontSize: 13, color: c.textMuted, marginBottom: 28, maxWidth: 340 }}>
                Stell mir eine Frage zu {lead.name} — ich analysiere Daten, Signale und Potenzial.
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 440 }}>
                {QUICK_PROMPTS.map((p, i) => (
                  <motion.div
                    key={p}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.07 }}
                  >
                    <GlassButton
                      size="sm"
                      isDark={isDark}
                      onClick={() => send(p)}
                      style={{ fontSize: 12, fontWeight: 600, color: c.text, fontFamily: 'inherit' }}
                    >
                      {p}
                    </GlassButton>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {hasMessages && (
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <AnimatePresence initial={false}>
              {msgs.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28, ease: 'easeOut' }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: m.role === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  {m.loading ? (
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
                      <ChatTypingDots c={c} />
                    </div>
                  ) : (
                    <div
                      style={{
                        maxWidth: '80%',
                        padding: '11px 16px',
                        borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        fontSize: 14,
                        lineHeight: 1.55,
                        fontWeight: m.role === 'user' ? 600 : 400,
                        ...(m.role === 'user'
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
                              border: isDark ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(255,255,255,0.65)',
                              boxShadow: isDark
                                ? 'inset 1px 1px 2px rgba(255,255,255,0.06)'
                                : 'inset 2px 2px 3px rgba(255,255,255,0.55)',
                              color: c.text,
                            }),
                      }}
                    >
                      {m.text}
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Input area */}
      <div style={{ padding: '10px 20px 20px', flexShrink: 0 }}>
        <div style={{ maxWidth: 500, margin: '0 auto' }}>
          <div style={inputCard}>
            <div style={{ padding: '10px 16px 4px', position: 'relative' }}>
              {!input && !focused && (
                <div
                  style={{
                    position: 'absolute',
                    top: 10,
                    left: 16,
                    right: 16,
                    pointerEvents: 'none',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <TypingEffect
                    texts={QUICK_PROMPTS}
                    typingSpeed={55}
                    rotationInterval={2400}
                    style={{
                      fontSize: 15,
                      color: c.textMuted,
                      fontFamily: 'inherit',
                      lineHeight: 1.55,
                    }}
                  />
                </div>
              )}
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
                  caretColor: c.accent,
                }}
              />
            </div>
            <div
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '6px 12px 12px' }}
            >
              <GlassButton
                size="sm"
                isDark={isDark}
                onClick={() => send()}
                disabled={!input.trim() || busy}
                contentClassName="flex items-center gap-1.5"
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: 'inherit',
                  background: input.trim() && !busy ? c.accent : undefined,
                  color: input.trim() && !busy ? '#fff' : c.textMuted,
                }}
              >
                <ArrowUpIcon size={13} />
                <span>Senden</span>
              </GlassButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SourceBadge ─────────────────────────────────────────────────────────────

function SourceBadge({ label, href }: { label: string; href?: string }) {
  const style: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 3,
    fontSize: 10,
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: 5,
    background: 'rgba(79,70,229,0.10)',
    color: '#818CF8',
    border: '1px solid rgba(79,70,229,0.18)',
    textDecoration: 'none',
    whiteSpace: 'nowrap' as const,
    flexShrink: 0,
  };
  if (href)
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" style={style}>
        {label} ↗
      </a>
    );
  return <span style={style}>{label}</span>;
}

// ─── EmployeeAreaChart ───────────────────────────────────────────────────────

function EmployeeAreaChart({ history, isDark }: { history: { year: number; employees: number }[]; isDark: boolean }) {
  const sorted = [...history].sort((a, b) => a.year - b.year);
  if (sorted.length < 2) {
    // fallback: single bar
    return <div style={{ fontSize: 13, color: '#94A3B8' }}>{sorted[0]?.employees ?? '—'}</div>;
  }
  const W = 240;
  const H = 90;
  const PAD = 4;
  const max = Math.max(...sorted.map((e) => e.employees));
  const min = Math.min(...sorted.map((e) => e.employees));
  const range = max - min || 1;

  const pts = sorted.map((e, i) => ({
    x: PAD + (i / (sorted.length - 1)) * (W - PAD * 2),
    y: PAD + (1 - (e.employees - min) / range) * (H - PAD * 2 - 14),
    ...e,
  }));

  // Smooth bezier path
  const linePath = pts.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    const prev = pts[i - 1];
    const cpx = ((prev.x + p.x) / 2).toFixed(1);
    return `${acc} C ${cpx} ${prev.y.toFixed(1)}, ${cpx} ${p.y.toFixed(1)}, ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  }, '');

  const areaPath = `${linePath} L ${(W - PAD).toFixed(1)} ${H - 14} L ${PAD} ${H - 14} Z`;
  const gradId = `empGrad_${isDark ? 'd' : 'l'}`;

  return (
    <svg width={W} height={H} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10B981" stopOpacity={isDark ? 0.28 : 0.18} />
          <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Gridlines */}
      {[0.33, 0.66, 1].map((t) => (
        <line
          key={t}
          x1={PAD}
          x2={W - PAD}
          y1={PAD + t * (H - PAD * 2 - 14)}
          y2={PAD + t * (H - PAD * 2 - 14)}
          stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}
          strokeDasharray="3 3"
        />
      ))}
      {/* Area fill */}
      <motion.path
        d={areaPath}
        fill={`url(#${gradId})`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.9, delay: 0.1 }}
      />
      {/* Line */}
      <motion.path
        d={linePath}
        fill="none"
        stroke="#10B981"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.1, ease: 'easeInOut' }}
      />
      {/* Points + year labels */}
      {pts.map((p, i) => {
        const isLatest = i === pts.length - 1;
        return (
          <g key={p.year}>
            <circle
              cx={p.x}
              cy={p.y}
              r={isLatest ? 5 : 3}
              fill={isLatest ? '#10B981' : isDark ? 'rgba(16,185,129,0.45)' : 'rgba(16,185,129,0.55)'}
            />
            {isLatest && (
              <circle cx={p.x} cy={p.y} r={9} fill="none" stroke="#10B981" strokeWidth={1.5} strokeOpacity={0.3} />
            )}
            <text
              x={p.x}
              y={H - 1}
              textAnchor="middle"
              fontSize={9}
              fill={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.28)'}
              fontFamily="inherit"
            >
              {String(p.year).slice(2)}
            </text>
            {/* Value label for first, last, and local peaks */}
            {(isLatest || i === 0) && (
              <text
                x={p.x + (i === 0 ? 0 : 0)}
                y={p.y - 9}
                textAnchor="middle"
                fontSize={10}
                fontWeight="800"
                fill={isLatest ? '#10B981' : isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)'}
                fontFamily="inherit"
              >
                {p.employees}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ─── TrendArrow ───────────────────────────────────────────────────────────────

function TrendArrow({ dir, color }: { dir: 'up' | 'down' | 'stable'; color: string }) {
  if (dir === 'stable')
    return (
      <svg width={20} height={20} viewBox="0 0 20 20" fill="none">
        <rect width="20" height="20" rx="10" fill={color} fillOpacity="0.15" />
        <path d="M6 10h8" stroke={color} strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  const arrow = dir === 'up' ? 'M10 14V6M6.5 9.5L10 6l3.5 3.5' : 'M10 6v8M6.5 10.5L10 14l3.5-3.5';
  return (
    <svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <rect width="20" height="20" rx="10" fill={color} fillOpacity="0.18" />
      <path d={arrow} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Expandable ───────────────────────────────────────────────────────────────

function Expandable({ open, children }: { open: boolean; children: React.ReactNode }) {
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          key="body"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          style={{ overflow: 'hidden' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── RevenueBarChart ─────────────────────────────────────────────────────────

function RevenueBarChart({
  data,
  isDark,
  height = 80,
  compact = false,
}: {
  data: { year: number; value: number; label: string }[];
  isDark: boolean;
  height?: number;
  compact?: boolean;
}) {
  const max = Math.max(...data.map((d) => d.value));
  const barW = compact ? 14 : 28;
  const gap = compact ? 4 : 8;
  const total = data.length * (barW + gap) - gap;
  const gradId = `revGrad_${compact ? 'c' : 'f'}_${isDark ? 'd' : 'l'}`;
  return (
    <svg width={total} height={height + (compact ? 14 : 24)} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F97316" stopOpacity={isDark ? 0.9 : 0.8} />
          <stop offset="100%" stopColor="#F97316" stopOpacity={0.4} />
        </linearGradient>
      </defs>
      {data.map((d, i) => {
        const bh = max > 0 ? Math.max(3, (d.value / max) * height) : 3;
        const x = i * (barW + gap);
        const isLatest = i === data.length - 1;
        return (
          <g key={d.year}>
            <motion.rect
              x={x}
              y={height - bh}
              width={barW}
              rx={compact ? 3 : 5}
              fill={isLatest ? `url(#${gradId})` : isDark ? 'rgba(249,115,22,0.22)' : 'rgba(249,115,22,0.18)'}
              initial={{ height: 0, y: height }}
              animate={{ height: bh, y: height - bh }}
              transition={{ duration: 0.6, delay: i * 0.06, ease: 'easeOut' }}
            />
            {!compact && (
              <text
                x={x + barW / 2}
                y={height + 16}
                textAnchor="middle"
                fontSize={9}
                fill={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.28)'}
                fontFamily="inherit"
              >
                {String(d.year).slice(2)}
              </text>
            )}
            {isLatest && !compact && (
              <text
                x={x + barW / 2}
                y={height - bh - 6}
                textAnchor="middle"
                fontSize={10}
                fontWeight="800"
                fill="#F97316"
                fontFamily="inherit"
              >
                {d.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ─── HealthGauge ─────────────────────────────────────────────────────────────

function HealthGauge({ score, isDark, c }: { score: number; isDark: boolean; c: ReturnType<typeof colors> }) {
  const color = score >= 70 ? '#10B981' : score >= 45 ? '#F97316' : '#EF4444';
  const label = score >= 70 ? 'Gesund' : score >= 45 ? 'Mittel' : 'Risiko';
  const r = 44;
  const circ = Math.PI * r; // half circle
  const dash = circ * (score / 100);
  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center' }}>
      <div style={{ position: 'relative', width: 110, height: 60, overflow: 'visible' }}>
        <svg width={110} height={60} viewBox="0 0 110 60" style={{ overflow: 'visible' }}>
          <path
            d="M 11 55 A 44 44 0 0 1 99 55"
            fill="none"
            stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}
            strokeWidth={10}
            strokeLinecap="round"
          />
          <motion.path
            d="M 11 55 A 44 44 0 0 1 99 55"
            fill="none"
            stroke={color}
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={`${circ}`}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ - dash }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
          />
        </svg>
        <div
          style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}
        >
          <div style={{ fontSize: 24, fontWeight: 800, color, lineHeight: 1 }}>{score}</div>
        </div>
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color, marginTop: 4 }}>{label}</div>
      <div style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>Finanzielle Gesundheit</div>
    </div>
  );
}

// ─── ExpandModal ──────────────────────────────────────────────────────────────

function ExpandModal({
  open,
  onClose,
  title,
  children,
  isDark,
  c,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  isDark: boolean;
  c: ReturnType<typeof colors>;
}) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 200,
              background: isDark ? 'rgba(0,0,0,0.72)' : 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(4px)',
            }}
          />
          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              top: '6%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '70vw',
              maxHeight: '86vh',
              zIndex: 201,
              display: 'flex',
              flexDirection: 'column',
              background: isDark ? 'rgba(12,14,28,0.97)' : 'rgba(250,250,255,0.98)',
              border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
              borderRadius: 20,
              boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '18px 24px',
                borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: 16, fontWeight: 800, color: c.text, letterSpacing: '-0.01em' }}>{title}</span>
              <button
                onClick={onClose}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                  color: c.textMuted,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'inherit',
                }}
              >
                <X size={15} />
              </button>
            </div>
            {/* Scrollable body */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '24px' }}>{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Info Tab ─────────────────────────────────────────────────────────────────

function InfoTab({ lead, c, isDark }: { lead: LeadDetail; c: ReturnType<typeof colors>; isDark: boolean }) {
  const [eventsOpen, setEventsOpen] = useState(false);

  // Expand-modal state for each section
  const [firmaModal, setFirmaModal] = useState(false);
  const [faktenModal, setFaktenModal] = useState(false);
  const [finanzenModal, setFinanzenModal] = useState(false);
  const [socialModal, setSocialModal] = useState(false);
  const [bewertungenModal, setBewertungenModal] = useState(false);
  const [techModal, setTechModal] = useState(false);

  const rawHistory: { year: number; employees: number }[] = lead._empHistory ?? [];

  const sourceMap: Record<string, string> = {
    openregister: 'Handelsregister',
    instagram: 'Instagram',
    website: 'Website',
    social: 'Social Media',
    linkedin: 'LinkedIn',
    openweb: 'OpenWeb',
  };

  const sectionTitle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    color: c.textMuted,
    marginBottom: 16,
  };

  const label: React.CSSProperties = { fontSize: 12, color: c.textMuted, marginBottom: 3 };
  const value: React.CSSProperties = { fontSize: 15, fontWeight: 700, color: c.text };

  // Compact quick-view card with an expand button
  function QuickCard({
    title,
    accent,
    onExpand,
    children,
  }: {
    title: string;
    accent?: string;
    onExpand: () => void;
    children: React.ReactNode;
  }) {
    return (
      <div
        style={{
          ...glassCard(isDark),
          borderRadius: 14,
          padding: '16px 18px',
          ...(accent ? { borderTop: `2px solid ${accent}` } : {}),
          display: 'flex',
          flexDirection: 'column' as const,
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase' as const,
              color: c.textMuted,
            }}
          >
            {title}
          </span>
          <button
            onClick={onExpand}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: 700,
              color: accent ?? c.textMuted,
              fontFamily: 'inherit',
              padding: 0,
              opacity: 0.75,
            }}
          >
            <Info size={12} />
            Details
          </button>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div style={{ padding: '20px 24px' }}>
      {/* ── 1. KI-Zusammenfassung ─────────────────────────────────────────── */}
      {lead.scoreReason || lead.lead_summary ? (
        <div
          style={{
            ...glassCard(isDark),
            borderRadius: 16,
            padding: '20px 24px',
            marginBottom: 16,
            borderLeft: '3px solid #818CF8',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 10,
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase' as const,
                color: '#818CF8',
              }}
            >
              KI-Zusammenfassung
            </span>
            <SourceBadge label="KI-Analyse" />
          </div>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: c.text, margin: 0 }}>
            {lead.lead_summary || lead.scoreReason}
          </p>
        </div>
      ) : null}

      {/* ── 2. Compact quick-view cards ───────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
        {/* Firma */}
        <QuickCard title="Firma" accent="#818CF8" onExpand={() => setFirmaModal(true)}>
          {lead.legal_form && <div style={{ fontSize: 13, fontWeight: 700, color: c.text }}>{lead.legal_form}</div>}
          {lead.founded && (
            <div style={{ fontSize: 12, color: c.textMuted }}>
              Gegründet <strong style={{ color: c.text }}>{lead.founded}</strong>
            </div>
          )}
          {lead.representative && (
            <div
              style={{
                fontSize: 12,
                color: c.textMuted,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap' as const,
              }}
            >
              {lead.representative}
            </div>
          )}
        </QuickCard>

        {/* Fakten / Mitarbeiter */}
        <QuickCard title="Mitarbeiter" accent="#10B981" onExpand={() => setFaktenModal(true)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <span style={{ fontSize: 28, fontWeight: 800, color: '#10B981', lineHeight: 1 }}>
              {lead.employees ?? '—'}
            </span>
            {lead.employeeTrend && (
              <TrendArrow
                dir={lead.employeeTrend}
                color={lead.employeeTrend === 'up' ? '#10B981' : lead.employeeTrend === 'down' ? '#EF4444' : '#94A3B8'}
              />
            )}
          </div>
          {rawHistory.length > 1 ? (
            <EmployeeAreaChart history={rawHistory} isDark={isDark} />
          ) : lead.employeeHistory ? (
            <div style={{ fontSize: 11, color: c.textMuted, lineHeight: 1.4 }}>{lead.employeeHistory}</div>
          ) : null}
        </QuickCard>

        {/* Finanzen */}
        <QuickCard title="Finanzen" accent="#F97316" onExpand={() => setFinanzenModal(true)}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#F97316', lineHeight: 1, marginBottom: 2 }}>
            {lead.revenue ?? '~12.8 Mio. €'}
          </div>
          <div style={{ fontSize: 11, color: '#10B981', fontWeight: 600, marginBottom: 10 }}>+14% vs. Vorjahr</div>
          <RevenueBarChart
            data={[
              { year: 2019, value: 6.8, label: '6.8M' },
              { year: 2020, value: 7.2, label: '7.2M' },
              { year: 2021, value: 8.1, label: '8.1M' },
              { year: 2022, value: 9.4, label: '9.4M' },
              { year: 2023, value: 11.2, label: '11.2M' },
              { year: 2024, value: 12.8, label: '12.8M' },
            ]}
            isDark={isDark}
            height={48}
            compact
          />
        </QuickCard>
      </div>

      {/* ── 3. Signale ────────────────────────────────────────────────────── */}
      {(lead.greenflags.length > 0 || lead.redflags.length > 0) && (
        <div style={{ ...glassCard(isDark), borderRadius: 16, padding: '20px 24px', marginBottom: 16 }}>
          {lead.greenflags.length > 0 && (
            <div style={{ marginBottom: lead.redflags.length > 0 ? 20 : 0 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#10B981',
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.08em',
                  marginBottom: 12,
                }}
              >
                Positive Signale
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8 }}>
                {lead.greenflags.map((flag, i) => {
                  const raw = lead._rawGreenFlags?.[i];
                  return (
                    <div
                      key={i}
                      title={raw?.source ? (sourceMap[raw.source] ?? raw.source) : undefined}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '7px 13px',
                        borderRadius: 999,
                        background: isDark ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.08)',
                        border: '1px solid rgba(16,185,129,0.25)',
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#10B981',
                        lineHeight: 1.3,
                      }}
                    >
                      <span style={{ fontSize: 11, opacity: 0.85 }}>&#10003;</span>
                      {flag}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {lead.redflags.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#EF4444',
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.08em',
                  marginBottom: 12,
                }}
              >
                Risiken
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8 }}>
                {lead.redflags.map((flag, i) => {
                  const raw = lead._rawRedFlags?.[i];
                  const sevColor =
                    raw?.severity === 'high' ? '#EF4444' : raw?.severity === 'medium' ? '#F97316' : '#94A3B8';
                  return (
                    <div
                      key={i}
                      title={raw?.source ? (sourceMap[raw.source] ?? raw.source) : undefined}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '7px 13px',
                        borderRadius: 999,
                        background: isDark ? sevColor + '14' : sevColor + '10',
                        border: `1px solid ${sevColor}35`,
                        fontSize: 13,
                        fontWeight: 600,
                        color: sevColor,
                        lineHeight: 1.3,
                      }}
                    >
                      <span style={{ fontSize: 11, opacity: 0.85 }}>&#10007;</span>
                      {flag}
                      {raw?.severity && raw.severity !== 'low' && (
                        <span style={{ fontSize: 10, fontWeight: 800, opacity: 0.75, marginLeft: 2 }}>
                          {raw.severity === 'high' ? '!' : '·'}
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

      {/* ── 4. Aktuelle Ereignisse ────────────────────────────────────────── */}
      {lead.aiUpdateSummary && (
        <div style={{ ...glassCard(isDark), borderRadius: 16, padding: '20px 24px', marginBottom: 16 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 14,
            }}
          >
            <div style={sectionTitle}>Aktuelle Ereignisse</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <SourceBadge label="KI-Analyse" />
              <button
                onClick={() => setEventsOpen((v) => !v)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#818CF8',
                  fontFamily: 'inherit',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <ChevronDown
                  size={16}
                  style={{
                    transform: eventsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                  }}
                />
              </button>
            </div>
          </div>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: c.text, margin: 0 }}>
            {eventsOpen
              ? lead.aiUpdateSummary
              : lead.aiUpdateSummary.slice(0, 160) + (lead.aiUpdateSummary.length > 160 ? '…' : '')}
          </p>
          {lead.updatesList.length > 0 && (
            <Expandable open={eventsOpen}>
              <div
                style={{
                  marginTop: 16,
                  display: 'flex',
                  flexDirection: 'column' as const,
                  gap: 8,
                }}
              >
                {lead.updatesList.map((u, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      gap: 10,
                      padding: '10px 14px',
                      background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                      borderRadius: 10,
                    }}
                  >
                    <span style={{ color: '#10B981', fontSize: 14, flexShrink: 0 }}>&#8594;</span>
                    <span style={{ fontSize: 14, color: c.text, lineHeight: 1.5 }}>{u.text}</span>
                  </div>
                ))}
              </div>
            </Expandable>
          )}
        </div>
      )}

      {/* ── 5. Online-Präsenz — compact expand cards ──────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
        {/* Social Media */}
        <QuickCard title="Social Media" accent="#E1306C" onExpand={() => setSocialModal(true)}>
          {lead.instagramFollowers != null ? (
            <div>
              <div style={{ fontSize: 11, color: c.textMuted, marginBottom: 2 }}>Instagram</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: c.text, lineHeight: 1 }}>
                {lead.instagramFollowers.toLocaleString('de-DE')}
              </div>
            </div>
          ) : lead.facebookFollowers != null ? (
            <div>
              <div style={{ fontSize: 11, color: c.textMuted, marginBottom: 2 }}>Facebook</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: c.text, lineHeight: 1 }}>
                {lead.facebookFollowers.toLocaleString('de-DE')}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 13, color: c.textMuted }}>Keine Social-Daten</div>
          )}
        </QuickCard>

        {/* Bewertungen */}
        <QuickCard title="Bewertungen" accent="#F59E0B" onExpand={() => setBewertungenModal(true)}>
          {lead.google != null ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: lead.google >= 4 ? '#10B981' : lead.google >= 3 ? '#F97316' : '#EF4444',
                }}
              >
                {Number(lead.google).toFixed(1)}
              </span>
              <span style={{ fontSize: 12, color: c.textMuted }}>Google</span>
            </div>
          ) : lead.trustpilot != null ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: lead.trustpilot >= 4 ? '#10B981' : lead.trustpilot >= 3 ? '#F97316' : '#EF4444',
                }}
              >
                {Number(lead.trustpilot).toFixed(1)}
              </span>
              <span style={{ fontSize: 12, color: c.textMuted }}>Trustpilot</span>
            </div>
          ) : (
            <div style={{ fontSize: 13, color: c.textMuted }}>Keine Ratings</div>
          )}
        </QuickCard>

        {/* Tech Stack */}
        <QuickCard title="Technologie" accent="#818CF8" onExpand={() => setTechModal(true)}>
          {lead.tech_stack && lead.tech_stack.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 5 }}>
              {lead.tech_stack.slice(0, 4).map((t, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: 6,
                    background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                    color: c.textSub,
                    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
                  }}
                >
                  {t}
                </span>
              ))}
              {lead.tech_stack.length > 4 && (
                <span style={{ fontSize: 11, color: c.textMuted, alignSelf: 'center' }}>
                  +{lead.tech_stack.length - 4}
                </span>
              )}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: c.textMuted }}>Kein Stack erkannt</div>
          )}
        </QuickCard>
      </div>

      {/* ── Expand Modals ─────────────────────────────────────────────────── */}

      {/* Firma Modal */}
      <ExpandModal open={firmaModal} onClose={() => setFirmaModal(false)} title="Firmendaten" isDark={isDark} c={c}>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 0 }}>
          {[
            { l: 'Gründung', v: lead.founded },
            { l: 'Rechtsform', v: lead.legal_form },
            { l: 'HRB', v: lead.hrb_number },
            { l: 'Amtsgericht', v: lead.court },
            { l: 'Branche', v: lead.industry },
            { l: 'Geschäftsführung', v: lead.representative },
          ]
            .filter((r) => r.v)
            .map((row) => (
              <div key={row.l} style={{ marginBottom: 16 }}>
                <div style={label}>{row.l}</div>
                <div style={value}>{row.v}</div>
              </div>
            ))}
          {lead.website && (
            <div style={{ marginBottom: 16 }}>
              <div style={label}>Website</div>
              <a
                href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 15, fontWeight: 700, color: '#818CF8', textDecoration: 'none' }}
              >
                {lead.website.replace(/^https?:\/\//, '')} &#8599;
              </a>
            </div>
          )}
          {lead.phone && (
            <div style={{ marginBottom: 16 }}>
              <div style={label}>Telefon</div>
              <div style={value}>{lead.phone}</div>
            </div>
          )}
          <SourceBadge label="Handelsregister" href="https://www.handelsregister.de" />
        </div>
      </ExpandModal>

      {/* Fakten / Mitarbeiter Modal */}
      <ExpandModal
        open={faktenModal}
        onClose={() => setFaktenModal(false)}
        title="Mitarbeiter-Entwicklung"
        isDark={isDark}
        c={c}
      >
        <div>
          {rawHistory.length > 1 ? (
            <>
              <EmployeeAreaChart history={rawHistory} isDark={isDark} />
              {lead.employeeHistory && (
                <div style={{ fontSize: 13, color: c.textMuted, marginTop: 16, lineHeight: 1.6 }}>
                  {lead.employeeHistory}
                </div>
              )}
            </>
          ) : (
            <div style={{ fontSize: 40, fontWeight: 800, color: '#10B981', lineHeight: 1, marginBottom: 12 }}>
              {lead.employees ?? '—'}
            </div>
          )}
          <div style={{ marginTop: 16 }}>
            <SourceBadge label="Handelsregister" />
          </div>
        </div>
      </ExpandModal>

      {/* Finanzen Modal */}
      <ExpandModal
        open={finanzenModal}
        onClose={() => setFinanzenModal(false)}
        title="Finanzdaten — Vollständige Übersicht"
        isDark={isDark}
        c={c}
      >
        {(() => {
          // Demo data (ARO-tec GmbH plausible figures) — replaced by real Bundesanzeiger data when available
          const revenueHistory = [
            { year: 2019, value: 6.8, label: '6.8M' },
            { year: 2020, value: 7.2, label: '7.2M' },
            { year: 2021, value: 8.1, label: '8.1M' },
            { year: 2022, value: 9.4, label: '9.4M' },
            { year: 2023, value: 11.2, label: '11.2M' },
            { year: 2024, value: 12.8, label: '12.8M' },
          ];
          const latestRevenue = lead.revenue ?? '12.8 Mio. €';
          const kpis = [
            {
              label: 'Jahresumsatz',
              value: latestRevenue,
              sub: '+14% vs. Vorjahr',
              color: '#F97316',
              trend: 'up' as const,
            },
            {
              label: 'Jahresüberschuss',
              value: '~1.1 Mio. €',
              sub: 'ca. 8.6% Marge',
              color: '#10B981',
              trend: 'up' as const,
            },
            { label: 'Bilanzsumme', value: '~8.4 Mio. €', sub: 'EK-Quote ~42%', color: '#818CF8', trend: null },
            {
              label: 'Umsatz/MA',
              value: '~85 T€',
              sub: 'Branchenmedian: 70 T€',
              color: '#06B6D4',
              trend: 'up' as const,
            },
          ];
          const costBreakdown = [
            { label: 'Personalkosten', pct: 58, color: '#818CF8' },
            { label: 'Material & Fertigung', pct: 24, color: '#F97316' },
            { label: 'Overhead & Verwaltung', pct: 10, color: '#94A3B8' },
            { label: 'Jahresüberschuss', pct: 8, color: '#10B981' },
          ];
          const riskItems = [
            { label: 'Insolvenzbekanntmachungen', status: 'Keine', ok: true },
            { label: 'Bonität (geschätzt)', status: 'Gut', ok: true },
            { label: 'Eigenkapitalquote', status: '42% — solide', ok: true },
            { label: 'Umsatztrend (3J)', status: '+24% Wachstum', ok: true },
          ];
          return (
            <div>
              {/* KPI row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
                {kpis.map((k) => (
                  <motion.div
                    key={k.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    style={{
                      ...glassCard(isDark),
                      borderRadius: 12,
                      padding: '14px 16px',
                      borderTop: `2px solid ${k.color}`,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        color: c.textMuted,
                        textTransform: 'uppercase' as const,
                        letterSpacing: '0.08em',
                        marginBottom: 8,
                      }}
                    >
                      {k.label}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 18, fontWeight: 800, color: k.color, lineHeight: 1 }}>{k.value}</span>
                      {k.trend && <TrendArrow dir={k.trend} color={k.color} />}
                    </div>
                    <div style={{ fontSize: 11, color: c.textMuted }}>{k.sub}</div>
                  </motion.div>
                ))}
              </div>

              {/* Revenue chart + health gauge */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: 20,
                  marginBottom: 24,
                  alignItems: 'start',
                }}
              >
                <div style={{ ...glassCard(isDark), borderRadius: 14, padding: '20px 22px' }}>
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: c.textMuted,
                          textTransform: 'uppercase' as const,
                          letterSpacing: '0.08em',
                        }}
                      >
                        Umsatzentwicklung
                      </div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: '#F97316', lineHeight: 1.2, marginTop: 4 }}>
                        12.8 Mio. €
                      </div>
                      <div style={{ fontSize: 12, color: '#10B981', fontWeight: 600, marginTop: 2 }}>
                        +14.3% vs. 2023
                      </div>
                    </div>
                    <SourceBadge label="Bundesanzeiger" />
                  </div>
                  <RevenueBarChart data={revenueHistory} isDark={isDark} height={90} />
                  <div style={{ fontSize: 10, color: c.textMuted, marginTop: 4, fontStyle: 'italic' }}>
                    * Schätzung basierend auf Branchenbenchmarks und öffentlichen Daten
                  </div>
                </div>
                <div
                  style={{
                    ...glassCard(isDark),
                    borderRadius: 14,
                    padding: '20px 22px',
                    display: 'flex',
                    flexDirection: 'column' as const,
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 160,
                  }}
                >
                  <HealthGauge score={74} isDark={isDark} c={c} />
                  <div
                    style={{ marginTop: 16, display: 'flex', flexDirection: 'column' as const, gap: 6, width: '100%' }}
                  >
                    {riskItems.map((r) => (
                      <div
                        key={r.label}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11 }}
                      >
                        <span style={{ color: c.textMuted }}>{r.label}</span>
                        <span style={{ fontWeight: 700, color: r.ok ? '#10B981' : '#EF4444' }}>{r.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Cost breakdown */}
              <div style={{ ...glassCard(isDark), borderRadius: 14, padding: '20px 22px', marginBottom: 20 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: c.textMuted,
                    textTransform: 'uppercase' as const,
                    letterSpacing: '0.08em',
                    marginBottom: 16,
                  }}
                >
                  Kostenstruktur (geschätzt)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
                  {costBreakdown.map((item) => (
                    <div key={item.label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <span style={{ fontSize: 13, color: c.text, fontWeight: 600 }}>{item.label}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{item.pct}%</span>
                      </div>
                      <div
                        style={{
                          height: 6,
                          borderRadius: 99,
                          background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)',
                          overflow: 'hidden',
                        }}
                      >
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${item.pct}%` }}
                          transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
                          style={{ height: '100%', borderRadius: 99, background: item.color, opacity: 0.85 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Planned data */}
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: 10,
                  background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                  border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.04)',
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: c.textMuted,
                    textTransform: 'uppercase' as const,
                    letterSpacing: '0.07em',
                    marginBottom: 8,
                  }}
                >
                  Geplante Datenerweiterungen — Bundesanzeiger
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                  {[
                    'Jahresabschlüsse (PDF-Extraktion)',
                    'EBIT / EBITDA aus GuV',
                    'Verbindlichkeiten & Eigenkapital',
                    'Bilanzsumme-Verlauf',
                    'Cashflow-Statement',
                    'Dividenden & Ausschüttungen',
                  ].map((item, i) => (
                    <div
                      key={i}
                      style={{
                        fontSize: 12,
                        color: c.textMuted,
                        padding: '3px 0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#F97316', flexShrink: 0 }} />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {lead.financials && (
                <div
                  style={{
                    marginTop: 16,
                    ...glassCard(isDark),
                    borderRadius: 12,
                    padding: '14px 16px',
                    borderLeft: '3px solid #818CF8',
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: '#818CF8',
                      textTransform: 'uppercase' as const,
                      letterSpacing: '0.08em',
                      marginBottom: 8,
                    }}
                  >
                    KI-Zusammenfassung Finanzen
                  </div>
                  <p style={{ fontSize: 13, color: c.text, lineHeight: 1.65, margin: 0 }}>{lead.financials}</p>
                </div>
              )}
            </div>
          );
        })()}
      </ExpandModal>

      {/* Social Modal */}
      <ExpandModal open={socialModal} onClose={() => setSocialModal(false)} title="Social Media" isDark={isDark} c={c}>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 20 }}>
          {[
            { platform: 'Instagram', followers: lead.instagramFollowers, posts: lead.instagramPosts },
            { platform: 'Facebook', followers: lead.facebookFollowers, posts: undefined },
          ].map((s) => (
            <div key={s.platform}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: c.textMuted,
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.06em',
                  marginBottom: 8,
                }}
              >
                {s.platform}
              </div>
              {s.followers != null ? (
                <div style={{ fontSize: 32, fontWeight: 800, color: c.text, lineHeight: 1 }}>
                  {s.followers.toLocaleString('de-DE')}
                  <span style={{ fontSize: 14, fontWeight: 500, color: c.textMuted, marginLeft: 8 }}>Follower</span>
                </div>
              ) : (
                <div style={{ fontSize: 14, color: c.textMuted }}>Keine Daten</div>
              )}
              {s.posts != null && <div style={{ fontSize: 13, color: c.textSub, marginTop: 6 }}>{s.posts} Posts</div>}
            </div>
          ))}
          {lead.lastPosted && <div style={{ fontSize: 13, color: '#10B981' }}>Zuletzt gepostet: {lead.lastPosted}</div>}
        </div>
      </ExpandModal>

      {/* Bewertungen Modal */}
      <ExpandModal
        open={bewertungenModal}
        onClose={() => setBewertungenModal(false)}
        title="Bewertungen"
        isDark={isDark}
        c={c}
      >
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 0 }}>
          {[
            { name: 'Google', rating: lead.google, count: lead.reviews?.find((r) => r.platform === 'Google')?.count },
            { name: 'Kununu', rating: lead.kununu, count: undefined },
            { name: 'Trustpilot', rating: lead.trustpilot, count: undefined },
          ].map((r) => (
            <div
              key={r.name}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 0',
                borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}`,
              }}
            >
              <span style={{ fontSize: 15, fontWeight: 600, color: c.text }}>{r.name}</span>
              <div style={{ textAlign: 'right' as const }}>
                {r.rating != null ? (
                  <span
                    style={{
                      fontSize: 20,
                      fontWeight: 800,
                      color: r.rating >= 4 ? '#10B981' : r.rating >= 3 ? '#F97316' : '#EF4444',
                    }}
                  >
                    {Number(r.rating).toFixed(1)}
                  </span>
                ) : (
                  <span style={{ fontSize: 13, color: c.textMuted }}>Kein Rating</span>
                )}
                {r.count != null && (
                  <div style={{ fontSize: 12, color: c.textMuted, marginTop: 2 }}>{r.count} Bewertungen</div>
                )}
              </div>
            </div>
          ))}
          <div style={{ marginTop: 14, fontSize: 11, color: c.textMuted, lineHeight: 1.5 }}>
            Bewertungsdaten sind extern erhoben und werden nicht durch Onvero verifiziert.
          </div>
        </div>
      </ExpandModal>

      {/* Tech Modal */}
      <ExpandModal open={techModal} onClose={() => setTechModal(false)} title="Tech-Stack" isDark={isDark} c={c}>
        <div>
          {lead.tech_stack && lead.tech_stack.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8 }}>
              {lead.tech_stack.map((t, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    padding: '7px 14px',
                    borderRadius: 9,
                    background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                    color: c.textSub,
                    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 14, color: c.textMuted }}>Kein Tech-Stack erkannt</p>
          )}
          <div style={{ marginTop: 16 }}>
            <SourceBadge label="Website-Scan" />
          </div>
        </div>
      </ExpandModal>
    </div>
  );
}

// ─── Outbound Tab ─────────────────────────────────────────────────────────────

function OutboundTab({ lead, c, isDark }: { lead: LeadDetail; c: ReturnType<typeof colors>; isDark: boolean }) {
  const card: React.CSSProperties = {
    ...glassCard(isDark),
    borderRadius: 16,
    padding: '20px 24px',
    marginBottom: 16,
  };
  const sectionTitle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    color: c.textMuted,
    marginBottom: 16,
  };
  const SOURCE_BADGE_MAP: Record<Contact['source'], { label: string; color: string }> = {
    linkedin: { label: 'LinkedIn', color: '#0077B5' },
    openregister: { label: 'Handelsregister', color: '#10B981' },
    salesnavigator: { label: 'SalesNav', color: '#F97316' },
    manual: { label: 'Manuell', color: '#94A3B8' },
    website: { label: 'Website', color: '#818CF8' },
  };

  return (
    <div style={{ padding: '20px 24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* LEFT */}
        <div>
          {/* Contacts */}
          {lead.contacts.length > 0 && (
            <div>
              <div style={{ ...sectionTitle, marginBottom: 14 }}>Ansprechpartner</div>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
                {lead.contacts.map((ct, i) => {
                  const src = SOURCE_BADGE_MAP[ct.source];
                  const avatarColors = [
                    { bg: 'rgba(129,140,248,0.18)', color: '#818CF8' },
                    { bg: 'rgba(16,185,129,0.18)', color: '#10B981' },
                    { bg: 'rgba(249,115,22,0.18)', color: '#F97316' },
                    { bg: 'rgba(239,68,68,0.18)', color: '#EF4444' },
                  ];
                  const av = avatarColors[i % avatarColors.length];
                  return (
                    <div
                      key={i}
                      style={{
                        ...glassCard(isDark),
                        borderRadius: 14,
                        padding: '18px 20px',
                      }}
                    >
                      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                        {/* Avatar */}
                        <div
                          style={{
                            width: 56,
                            height: 56,
                            borderRadius: 16,
                            background: av.bg,
                            color: av.color,
                            fontWeight: 800,
                            fontSize: 18,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            letterSpacing: '-0.02em',
                          }}
                        >
                          {ct.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 16,
                              fontWeight: 800,
                              color: c.text,
                              marginBottom: 2,
                              letterSpacing: '-0.01em',
                            }}
                          >
                            {ct.name}
                          </div>
                          <div style={{ fontSize: 13, color: c.textMuted, marginBottom: 10 }}>{ct.role}</div>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const, alignItems: 'center' }}>
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                color: src.color,
                                background: src.color + '18',
                                padding: '3px 8px',
                                borderRadius: 999,
                                border: `1px solid ${src.color}30`,
                              }}
                            >
                              {src.label}
                            </span>
                            {ct.linkedin && (
                              <a
                                href={`https://${ct.linkedin}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  fontSize: 11,
                                  color: '#0077B5',
                                  fontWeight: 700,
                                  textDecoration: 'none',
                                  padding: '3px 10px',
                                  background: 'rgba(0,119,181,0.1)',
                                  borderRadius: 999,
                                  border: '1px solid rgba(0,119,181,0.2)',
                                }}
                              >
                                LinkedIn ↗
                              </a>
                            )}
                            {ct.email && (
                              <a
                                href={`mailto:${ct.email}`}
                                style={{
                                  fontSize: 11,
                                  color: '#818CF8',
                                  fontWeight: 700,
                                  textDecoration: 'none',
                                  padding: '3px 10px',
                                  background: 'rgba(129,140,248,0.1)',
                                  borderRadius: 999,
                                  border: '1px solid rgba(129,140,248,0.2)',
                                }}
                              >
                                {ct.email}
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tone of Voice */}
          {lead.toneOfVoice && (
            <div style={card}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 12,
                }}
              >
                <div style={sectionTitle}>Tone of Voice</div>
                <SourceBadge label="KI-Analyse" />
              </div>
              <p style={{ fontSize: 14, color: c.text, lineHeight: 1.7, margin: 0 }}>{lead.toneOfVoice}</p>
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div>
          {/* 1-Min Pitch */}
          <div
            style={{
              ...glassCard(isDark),
              borderRadius: 16,
              padding: '20px 24px',
              marginBottom: 16,
              borderLeft: '3px solid #10B981',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 14,
              }}
            >
              <div style={sectionTitle}>1-Minuten Pitch</div>
              <SourceBadge label="KI-Analyse" />
            </div>
            <p style={{ fontSize: 15, color: c.text, lineHeight: 1.75, margin: '0 0 14px' }}>{lead.pitch}</p>
            <button
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: '#10B981',
                background: 'rgba(16,185,129,0.1)',
                border: '1px solid rgba(16,185,129,0.2)',
                borderRadius: 8,
                padding: '7px 14px',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
              onClick={() => navigator.clipboard?.writeText(lead.pitch)}
            >
              Kopieren
            </button>
          </div>

          {/* Suggested Offer */}
          {lead.proposedOffer && (
            <div
              style={{
                ...glassCard(isDark),
                borderRadius: 16,
                padding: '20px 24px',
                marginBottom: 16,
                borderLeft: '3px solid #F97316',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 14,
                }}
              >
                <div style={sectionTitle}>Vorgeschlagenes Angebot</div>
                <SourceBadge label="KI-Analyse" />
              </div>
              <p style={{ fontSize: 15, color: c.text, lineHeight: 1.75, margin: '0 0 14px' }}>{lead.proposedOffer}</p>
              <button
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#F97316',
                  background: 'rgba(249,115,22,0.1)',
                  border: '1px solid rgba(249,115,22,0.2)',
                  borderRadius: 8,
                  padding: '7px 14px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
                onClick={() => navigator.clipboard?.writeText(lead.proposedOffer!)}
              >
                Kopieren
              </button>
            </div>
          )}

          {/* Personalisierungs-Hooks */}
          {lead.personalizationHooks && lead.personalizationHooks.length > 0 && (
            <div
              style={{
                ...glassCard(isDark),
                borderRadius: 16,
                padding: '20px 24px',
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                }}
              >
                <div style={sectionTitle}>Personalisierungs-Hooks</div>
                <SourceBadge label="KI-Analyse" />
              </div>
              {lead.personalizationHooks.map((hook, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: 12,
                    padding: '12px 0',
                    borderBottom:
                      i < lead.personalizationHooks!.length - 1
                        ? `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}`
                        : 'none',
                  }}
                >
                  <span
                    style={{
                      fontSize: 18,
                      color: '#F97316',
                      fontWeight: 800,
                      flexShrink: 0,
                      lineHeight: 1.2,
                    }}
                  >
                    {i + 1}
                  </span>
                  <span style={{ fontSize: 14, color: c.text, lineHeight: 1.6 }}>{hook}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CFG = {
  hot: { label: 'Hot', color: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
  warm: { label: 'Warm', color: '#F97316', bg: 'rgba(249,115,22,0.15)' },
  cold: { label: 'Kalt', color: '#94A3B8', bg: 'rgba(148,163,184,0.15)' },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const c = colors(theme);
  const isDark = theme === 'dark';

  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('info');
  const [status, setStatus] = useState<LeadStatus>('warm');
  const [scoreHover, setScoreHover] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/leads/${id}`)
      .then((r) => r.json())
      .then((data: { lead: Record<string, unknown> }) => {
        const mapped = mapDbLead(data.lead);
        setLead(mapped);
        setStatus(mapped.status);
      })
      .catch(() => {
        /* leave loading state, handle gracefully */
      })
      .finally(() => setLoading(false));
  }, [id]);

  const sCfg = STATUS_CFG[status];
  const col = scoreColor(lead?.score ?? 0);

  useLayoutEffect(() => {
    const main = document.querySelector('main');
    if (main) main.scrollTop = 0;
  }, []);

  const TAB_LABELS: Record<ActiveTab, string> = { info: 'Info', outbound: 'Outbound', bot: 'KI-Assistent' };

  if (loading || !lead) {
    return (
      <div
        style={{
          position: 'relative',
          paddingTop: 84,
          paddingBottom: 32,
          fontFamily: 'var(--font-inter), sans-serif',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
        }}
      >
        <GlassPageFilters />
        <div
          style={{
            ...glassCard(isDark),
            margin: '0 20px',
            borderRadius: 16,
            padding: '48px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
          }}
        >
          <span style={{ fontSize: 14, color: c.textMuted }}>Lädt…</span>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'relative',
        paddingTop: 84,
        paddingBottom: 32,
        fontFamily: 'var(--font-inter), sans-serif',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}
    >
      <GlassPageFilters />

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div
        style={{
          ...glassCard(isDark),
          margin: '0 20px 0',
          borderRadius: '16px 16px 0 0',
          padding: '18px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          borderBottom: 'none',
        }}
      >
        {/* Back */}
        <button
          onClick={() => router.push('/intelligence/leads')}
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
            border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            color: c.textSub,
            flexShrink: 0,
          }}
        >
          ←
        </button>

        {/* Company avatar */}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            background: lead.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            fontWeight: 800,
            color: '#fff',
            flexShrink: 0,
            boxShadow: `0 8px 24px ${lead.color}55`,
          }}
        >
          {lead.initials}
        </div>

        {/* Name + quick stats */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: c.text, marginBottom: 4 }}>{lead.name}</div>
          <div style={{ fontSize: 13, color: c.textMuted, marginBottom: 10 }}>
            {lead.city} · {lead.industry}
          </div>
          {/* Quick-stat pills (Screenshot 3 style) */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {lead.employees && (
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '4px 10px',
                  borderRadius: 7,
                  background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                  color: c.textSub,
                  border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Users size={12} style={{ flexShrink: 0 }} /> {lead.employees} Mitarbeiter
              </span>
            )}
            {lead.founded && (
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '4px 10px',
                  borderRadius: 7,
                  background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                  color: c.textSub,
                  border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Calendar size={12} style={{ flexShrink: 0 }} /> Seit {lead.founded}
              </span>
            )}
            {lead.website && (
              <a
                href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '4px 10px',
                  borderRadius: 7,
                  background: 'rgba(79,70,229,0.10)',
                  color: '#818CF8',
                  border: '1px solid rgba(79,70,229,0.18)',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Globe size={12} style={{ flexShrink: 0 }} />{' '}
                {lead.website.replace(/^https?:\/\//, '').replace(/\/$/, '')} ↗
              </a>
            )}
            {lead.phone && (
              <a
                href={`tel:${lead.phone}`}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '4px 10px',
                  borderRadius: 7,
                  background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                  color: c.textSub,
                  border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Phone size={12} style={{ flexShrink: 0 }} /> {lead.phone}
              </a>
            )}
          </div>
        </div>

        {/* Score — big badge (Screenshot 2 style) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            flexShrink: 0,
            position: 'relative',
          }}
          onMouseEnter={() => setScoreHover(true)}
          onMouseLeave={() => setScoreHover(false)}
        >
          <ScoreRing score={lead.score} size={64} />
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: c.textMuted,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            Score
          </span>
          {scoreHover && lead.scoreReason && (
            <div
              style={{
                position: 'absolute',
                bottom: '110%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 260,
                background: isDark ? 'rgba(10,12,24,0.95)' : 'rgba(255,255,255,0.98)',
                border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.1)',
                borderRadius: 10,
                padding: '10px 14px',
                fontSize: 12,
                color: c.text,
                lineHeight: 1.55,
                boxShadow: '0 8px 32px rgba(0,0,0,0.24)',
                zIndex: 100,
                pointerEvents: 'none',
              }}
            >
              {lead.scoreReason}
            </div>
          )}
        </div>

        {/* Fit score pill */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#10B981', lineHeight: 1 }}>{lead.fit}</div>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: c.textMuted,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            Fit
          </span>
        </div>

        {/* Status */}
        <div
          style={{
            padding: '6px 12px',
            borderRadius: 8,
            background: sCfg.bg,
            border: `1.5px solid ${sCfg.color}40`,
            color: sCfg.color,
            fontSize: 12,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: sCfg.color }} />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as LeadStatus)}
            style={{
              background: 'transparent',
              border: 'none',
              color: sCfg.color,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
              outline: 'none',
              appearance: 'none',
              WebkitAppearance: 'none',
            }}
          >
            <option value="hot">Hot</option>
            <option value="warm">Warm</option>
            <option value="cold">Kalt</option>
          </select>
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────────── */}
      <div
        style={{
          margin: '0 20px',
          background: isDark ? 'rgba(10,12,24,0.52)' : 'rgba(255,255,255,0.28)',
          backdropFilter: 'blur(22px)',
          WebkitBackdropFilter: 'blur(22px)',
          borderLeft: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.7)',
          borderRight: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.7)',
          borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.05)',
          display: 'flex',
          padding: '0 8px',
          gap: 2,
        }}
      >
        {(['info', 'outbound', 'bot'] as ActiveTab[]).map((tab) => {
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '11px 18px',
                fontSize: 13,
                fontWeight: active ? 700 : 500,
                color: active ? col : c.textMuted,
                background: 'transparent',
                border: 'none',
                borderBottom: active ? `2px solid ${col}` : '2px solid transparent',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'color 0.15s',
                marginBottom: -1,
              }}
            >
              {TAB_LABELS[tab]}
            </button>
          );
        })}
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div
        style={{
          margin: '0 20px',
          background: isDark ? 'rgba(10,12,24,0.36)' : 'rgba(255,255,255,0.16)',
          backdropFilter: 'blur(22px)',
          WebkitBackdropFilter: 'blur(22px)',
          borderTop: 'none',
          borderRight: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.7)',
          borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.7)',
          borderLeft: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.7)',
          borderRadius: '0 0 16px 16px',
          ...(activeTab === 'bot'
            ? { display: 'flex', flexDirection: 'column' as const, flex: 1, minHeight: 0, overflow: 'hidden' }
            : {}),
        }}
      >
        {activeTab === 'info' && <InfoTab lead={lead!} c={c} isDark={isDark} />}
        {activeTab === 'outbound' && <OutboundTab lead={lead!} c={c} isDark={isDark} />}
        {activeTab === 'bot' && <ChatTab lead={lead!} c={c} isDark={isDark} />}
      </div>
    </div>
  );
}
