'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useLayoutEffect, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpIcon } from 'lucide-react';
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

// ─── KpiStrip ─────────────────────────────────────────────────────────────────

function KpiStrip({ lead, c, isDark }: { lead: LeadDetail; c: ReturnType<typeof colors>; isDark: boolean }) {
  const yearFounded = lead.founded ? parseInt(lead.founded) : null;
  const yearsInBusiness = yearFounded ? new Date().getFullYear() - yearFounded : null;

  const kpis = [
    {
      label: 'Mitarbeiter',
      value: lead.employees ?? '—',
      sub: lead.employeeTrend
        ? lead.employeeTrend === 'up'
          ? 'Wachstum'
          : lead.employeeTrend === 'down'
            ? 'Rückgang'
            : 'Stabil'
        : undefined,
      trend: lead.employeeTrend ?? 'stable',
      trendColor: lead.employeeTrend === 'up' ? '#10B981' : lead.employeeTrend === 'down' ? '#EF4444' : '#94A3B8',
      accent: '#10B981',
    },
    {
      label: 'Gegründet',
      value: lead.founded ?? '—',
      sub: yearsInBusiness ? `${yearsInBusiness} Jahre` : undefined,
      trend: null,
      trendColor: '#818CF8',
      accent: '#818CF8',
    },
    {
      label: 'Branche',
      value: lead.industry ?? '—',
      sub: lead.legal_form,
      trend: null,
      trendColor: '#F97316',
      accent: '#F97316',
    },
    {
      label: 'Onvero Score',
      value: String(lead.score),
      sub: lead.fit ? `${lead.fit}% Fit` : undefined,
      trend: lead.score >= 70 ? 'up' : ('down' as const),
      trendColor: lead.score >= 70 ? '#10B981' : '#EF4444',
      accent: lead.score >= 70 ? '#10B981' : '#EF4444',
    },
  ] as const;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 12,
        marginBottom: 16,
      }}
    >
      {kpis.map((k, i) => (
        <motion.div
          key={k.label}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07, duration: 0.35, ease: 'easeOut' }}
          style={{
            ...glassCard(isDark),
            borderRadius: 14,
            padding: '16px 18px',
            borderTop: `2px solid ${k.accent}`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: c.textMuted,
                textTransform: 'uppercase' as const,
                letterSpacing: '0.08em',
              }}
            >
              {k.label}
            </span>
            {k.trend && <TrendArrow dir={k.trend} color={k.trendColor} />}
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: k.accent,
              lineHeight: 1,
              marginBottom: 4,
              letterSpacing: '-0.02em',
            }}
          >
            {k.value}
          </div>
          {k.sub && <div style={{ fontSize: 12, color: c.textMuted, fontWeight: 500 }}>{k.sub}</div>}
        </motion.div>
      ))}
    </div>
  );
}

// ─── DataSourcesBar ──────────────────────────────────────────────────────────

function DataSourcesBar({ lead, c, isDark }: { lead: LeadDetail; c: ReturnType<typeof colors>; isDark: boolean }) {
  const sources = [
    {
      label: 'Handelsregister',
      icon: '⚖',
      color: '#10B981',
      fields: [lead.founded, lead.legal_form, lead.hrb_number, lead.court, lead.representative].filter(Boolean).length,
      total: 5,
      url: 'https://www.handelsregister.de',
    },
    {
      label: 'Instagram',
      icon: '📸',
      color: '#E1306C',
      fields: [lead.instagramFollowers, lead.instagramPosts].filter((v) => v != null).length,
      total: 2,
    },
    {
      label: 'Website',
      icon: '🌐',
      color: '#818CF8',
      fields: [lead.website, lead.tech_stack?.length ? 1 : 0].filter(Boolean).length,
      total: 2,
    },
    {
      label: 'KI-Analyse',
      icon: '🤖',
      color: '#F97316',
      fields: [lead.lead_summary, lead.pitch, lead.toneOfVoice, lead.proposedOffer].filter(Boolean).length,
      total: 4,
    },
    {
      label: 'LinkedIn',
      icon: '💼',
      color: '#0077B5',
      fields: lead.contacts.filter((c) => c.source === 'linkedin').length,
      total: Math.max(lead.contacts.length, 1),
    },
  ];

  return (
    <div
      style={{
        ...glassCard(isDark),
        borderRadius: 14,
        padding: '16px 20px',
        marginBottom: 16,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          color: c.textMuted,
          textTransform: 'uppercase' as const,
          letterSpacing: '0.08em',
          marginBottom: 14,
        }}
      >
        Datenquellen
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
        {sources.map((s) => {
          const pct = Math.round((s.fields / s.total) * 100);
          return (
            <div key={s.label}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 4,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontSize: 13 }}>{s.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: c.text }}>{s.label}</span>
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: s.color,
                    background: s.color + '15',
                    padding: '1px 7px',
                    borderRadius: 99,
                  }}
                >
                  {s.fields}/{s.total} Felder
                </span>
              </div>
              <div
                style={{
                  height: 4,
                  borderRadius: 99,
                  background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)',
                  overflow: 'hidden',
                }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' }}
                  style={{
                    height: '100%',
                    borderRadius: 99,
                    background: s.color,
                    opacity: 0.8,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
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

// ─── Info Tab ─────────────────────────────────────────────────────────────────

function InfoTab({ lead, c, isDark }: { lead: LeadDetail; c: ReturnType<typeof colors>; isDark: boolean }) {
  const [scoreOpen, setScoreOpen] = useState(false);
  const [financeOpen, setFinanceOpen] = useState(false);
  const [eventsOpen, setEventsOpen] = useState(false);

  const rawHistory: { year: number; employees: number }[] = lead._empHistory ?? [];

  const sourceMap: Record<string, string> = {
    openregister: 'Handelsregister',
    instagram: 'Instagram',
    website: 'Website',
    social: 'Social Media',
    linkedin: 'LinkedIn',
    openweb: 'OpenWeb',
  };

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

  const label: React.CSSProperties = { fontSize: 12, color: c.textMuted, marginBottom: 3 };
  const value: React.CSSProperties = { fontSize: 15, fontWeight: 700, color: c.text };
  const divider: React.CSSProperties = {
    height: 1,
    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
    margin: '14px 0',
  };

  void divider;
  void card;

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

      {/* ── KPI Strip ─────────────────────────────────────────────────────── */}
      <KpiStrip lead={lead} c={c} isDark={isDark} />

      {/* ── 2. 3-Column Snapshot ──────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 16 }}>
        {/* Firma */}
        <div style={{ ...glassCard(isDark), borderRadius: 16, padding: '20px 20px' }}>
          <div style={sectionTitle}>Firma</div>
          {[
            { l: 'Gründung', v: lead.founded ? `${lead.founded}` : undefined },
            { l: 'Rechtsform', v: lead.legal_form },
            { l: 'HRB', v: lead.hrb_number },
            { l: 'Amtsgericht', v: lead.court },
            { l: 'Branche', v: lead.industry },
            { l: 'Geschäftsführung', v: lead.representative },
          ]
            .filter((r) => r.v)
            .map((row) => (
              <div key={row.l} style={{ marginBottom: 12 }}>
                <div style={label}>{row.l}</div>
                <div style={value}>{row.v}</div>
              </div>
            ))}
          {lead.website && (
            <a
              href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: '#818CF8',
                textDecoration: 'none',
                display: 'block',
                marginTop: 4,
              }}
            >
              {lead.website.replace(/^https?:\/\//, '')} ↗
            </a>
          )}
          {lead.phone && <div style={{ fontSize: 14, color: c.textSub, marginTop: 6 }}>{lead.phone}</div>}
          <div style={{ marginTop: 12 }}>
            <SourceBadge label="Handelsregister" href="https://www.handelsregister.de" />
          </div>
        </div>

        {/* Mitarbeiter */}
        <div style={{ ...glassCard(isDark), borderRadius: 16, padding: '20px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={sectionTitle}>Mitarbeiter</div>
            {lead.employeeTrend && (
              <TrendArrow
                dir={lead.employeeTrend}
                color={lead.employeeTrend === 'up' ? '#10B981' : lead.employeeTrend === 'down' ? '#EF4444' : '#94A3B8'}
              />
            )}
          </div>
          {rawHistory.length > 1 ? (
            <>
              <EmployeeAreaChart history={rawHistory} isDark={isDark} />
              {lead.employeeHistory && (
                <div style={{ fontSize: 11, color: c.textMuted, marginTop: 10, lineHeight: 1.5 }}>
                  {lead.employeeHistory}
                </div>
              )}
            </>
          ) : (
            <>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#10B981', lineHeight: 1, marginBottom: 8 }}>
                {lead.employees ?? '—'}
              </div>
              {lead.employeeHistory && (
                <div style={{ fontSize: 13, color: c.textSub, lineHeight: 1.6 }}>{lead.employeeHistory}</div>
              )}
            </>
          )}
          <div style={{ marginTop: 12 }}>
            <SourceBadge label="Handelsregister" />
          </div>
        </div>

        {/* Finanzen */}
        <div style={{ ...glassCard(isDark), borderRadius: 16, padding: '20px 20px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}
          >
            <div style={sectionTitle}>Finanzen</div>
            <button
              onClick={() => setFinanceOpen((v) => !v)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                color: '#818CF8',
                fontWeight: 700,
                fontFamily: 'inherit',
                padding: 0,
              }}
            >
              {financeOpen ? '▲' : '▼'}
            </button>
          </div>
          {lead.financials ? (
            <>
              <p style={{ fontSize: 14, color: c.text, lineHeight: 1.65, margin: '0 0 12px' }}>
                {financeOpen
                  ? lead.financials
                  : lead.financials.slice(0, 120) + (lead.financials.length > 120 ? '…' : '')}
              </p>
              <Expandable open={financeOpen}>
                <div style={{ paddingTop: 8 }}>{/* Additional finance detail when expanded */}</div>
              </Expandable>
            </>
          ) : (
            <span style={{ fontSize: 14, color: c.textMuted }}>Keine Finanzdaten verfügbar</span>
          )}
          <div style={{ marginTop: 12 }}>
            <SourceBadge label="Handelsregister" />
          </div>
        </div>
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
                      <span style={{ fontSize: 11, opacity: 0.85 }}>✓</span>
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
                      <span style={{ fontSize: 11, opacity: 0.85 }}>✗</span>
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
                  fontSize: 13,
                  color: '#818CF8',
                  fontWeight: 700,
                  fontFamily: 'inherit',
                  padding: 0,
                }}
              >
                {eventsOpen ? '▲' : '▼'}
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
                    <span style={{ color: '#10B981', fontSize: 14, flexShrink: 0 }}>→</span>
                    <span style={{ fontSize: 14, color: c.text, lineHeight: 1.5 }}>{u.text}</span>
                  </div>
                ))}
              </div>
            </Expandable>
          )}
        </div>
      )}

      {/* ── 5. KI-Score Begründung ────────────────────────────────────────── */}
      {lead.scoreReason && (
        <div
          style={{
            ...glassCard(isDark),
            borderRadius: 16,
            padding: '20px 24px',
            marginBottom: 16,
            borderLeft: `3px solid ${scoreColor(lead.score)}`,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ ...sectionTitle, marginBottom: 0 }}>Score-Begründung</div>
              <span style={{ fontSize: 22, fontWeight: 800, color: scoreColor(lead.score) }}>{lead.score}</span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <SourceBadge label="KI-Analyse" />
              <button
                onClick={() => setScoreOpen((v) => !v)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 13,
                  color: '#818CF8',
                  fontWeight: 700,
                  fontFamily: 'inherit',
                  padding: 0,
                }}
              >
                {scoreOpen ? '▲' : '▼'}
              </button>
            </div>
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: c.text, margin: 0 }}>
            {scoreOpen ? lead.scoreReason : lead.scoreReason.slice(0, 180) + (lead.scoreReason.length > 180 ? '…' : '')}
          </p>
        </div>
      )}

      {/* ── 6. Online-Präsenz ─────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 16 }}>
        {/* Social */}
        <div style={{ ...glassCard(isDark), borderRadius: 16, padding: '20px 20px' }}>
          <div style={sectionTitle}>Social Media</div>
          {[
            {
              platform: 'Instagram',
              followers: lead.instagramFollowers,
              posts: lead.instagramPosts,
            },
            { platform: 'Facebook', followers: lead.facebookFollowers, posts: undefined },
          ].map((s) => (
            <div key={s.platform} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: c.textMuted, marginBottom: 4 }}>{s.platform}</div>
              {s.followers != null ? (
                <div style={{ fontSize: 22, fontWeight: 800, color: c.text }}>
                  {s.followers.toLocaleString('de-DE')}
                </div>
              ) : (
                <div style={{ fontSize: 14, color: c.textMuted }}>—</div>
              )}
              {s.posts != null && <div style={{ fontSize: 12, color: c.textSub, marginTop: 2 }}>{s.posts} Posts</div>}
            </div>
          ))}
          {lead.lastPosted && (
            <div style={{ fontSize: 12, color: '#10B981', marginTop: 4 }}>Zuletzt: {lead.lastPosted}</div>
          )}
        </div>

        {/* Bewertungen */}
        <div style={{ ...glassCard(isDark), borderRadius: 16, padding: '20px 20px' }}>
          <div style={sectionTitle}>Bewertungen</div>
          {[
            {
              name: 'Google',
              rating: lead.google,
              count: lead.reviews?.find((r) => r.platform === 'Google')?.count,
            },
            { name: 'Kununu', rating: lead.kununu, count: undefined },
            { name: 'Trustpilot', rating: lead.trustpilot, count: undefined },
          ].map((r) => (
            <div
              key={r.name}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 0',
                borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}`,
              }}
            >
              <span style={{ fontSize: 14, color: c.textSub }}>{r.name}</span>
              <div style={{ textAlign: 'right' as const }}>
                {r.rating != null ? (
                  <span
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color: r.rating >= 4 ? '#10B981' : r.rating >= 3 ? '#F97316' : '#EF4444',
                    }}
                  >
                    {Number(r.rating).toFixed(1)} ★
                  </span>
                ) : (
                  <span style={{ fontSize: 12, color: c.textMuted }}>Kein Rating</span>
                )}
                {r.count != null && <div style={{ fontSize: 11, color: c.textMuted }}>{r.count} Bewertungen</div>}
              </div>
            </div>
          ))}
          <div style={{ marginTop: 12, fontSize: 11, color: c.textMuted, lineHeight: 1.5 }}>
            Profil-Zusammenfassungen sind KI-generiert und keine wörtlichen Zitate.
          </div>
        </div>

        {/* Tech Stack */}
        <div style={{ ...glassCard(isDark), borderRadius: 16, padding: '20px 20px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 14,
            }}
          >
            <div style={sectionTitle}>Technologie</div>
            <SourceBadge label="Website-Scan" />
          </div>
          {lead.tech_stack && lead.tech_stack.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 7 }}>
              {lead.tech_stack.map((t, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    padding: '5px 11px',
                    borderRadius: 8,
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
            <span style={{ fontSize: 14, color: c.textMuted }}>Kein Shop-System erkannt</span>
          )}
        </div>
      </div>

      {/* ── 7. KI-Profil ──────────────────────────────────────────────────── */}
      {((lead.coreServices && lead.coreServices.length > 0) ||
        (lead.usp && lead.usp.length > 0) ||
        (lead.targetCustomers && lead.targetCustomers.length > 0)) && (
        <div style={{ ...glassCard(isDark), borderRadius: 16, padding: '20px 24px', marginBottom: 16 }}>
          <div style={{ ...sectionTitle, marginBottom: 20 }}>KI-Firmenprofil</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>
            {lead.coreServices && lead.coreServices.length > 0 && (
              <div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#818CF8',
                    textTransform: 'uppercase' as const,
                    letterSpacing: '0.07em',
                    marginBottom: 10,
                  }}
                >
                  Leistungen
                </div>
                {lead.coreServices.map((s, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      gap: 8,
                      padding: '5px 0',
                      borderBottom:
                        i < lead.coreServices!.length - 1
                          ? `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`
                          : 'none',
                    }}
                  >
                    <span style={{ color: '#818CF8', flexShrink: 0 }}>·</span>
                    <span style={{ fontSize: 14, color: c.text, lineHeight: 1.5 }}>{s}</span>
                  </div>
                ))}
              </div>
            )}
            {lead.usp && lead.usp.length > 0 && (
              <div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#F97316',
                    textTransform: 'uppercase' as const,
                    letterSpacing: '0.07em',
                    marginBottom: 10,
                  }}
                >
                  USP
                </div>
                {lead.usp.map((s, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      gap: 8,
                      padding: '5px 0',
                      borderBottom:
                        i < lead.usp!.length - 1
                          ? `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`
                          : 'none',
                    }}
                  >
                    <span style={{ color: '#F97316', flexShrink: 0 }}>·</span>
                    <span style={{ fontSize: 14, color: c.text, lineHeight: 1.5 }}>{s}</span>
                  </div>
                ))}
              </div>
            )}
            {lead.targetCustomers && lead.targetCustomers.length > 0 && (
              <div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#10B981',
                    textTransform: 'uppercase' as const,
                    letterSpacing: '0.07em',
                    marginBottom: 10,
                  }}
                >
                  Zielkunden
                </div>
                {lead.targetCustomers.map((s, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      gap: 8,
                      padding: '5px 0',
                      borderBottom:
                        i < lead.targetCustomers!.length - 1
                          ? `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`
                          : 'none',
                    }}
                  >
                    <span style={{ color: '#10B981', flexShrink: 0 }}>·</span>
                    <span style={{ fontSize: 14, color: c.text, lineHeight: 1.5 }}>{s}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ marginTop: 16 }}>
            <SourceBadge label="KI-Analyse" />
          </div>
        </div>
      )}

      {/* ── 8. Personalisierungs-Hooks ────────────────────────────────────── */}
      {lead.personalizationHooks && lead.personalizationHooks.length > 0 && (
        <div style={{ ...glassCard(isDark), borderRadius: 16, padding: '20px 24px', marginBottom: 16 }}>
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

      {/* ── Datenquellen ──────────────────────────────────────────────────── */}
      <DataSourcesBar lead={lead} c={c} isDark={isDark} />
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

  const subScores = [
    { label: 'Fit', value: lead?.fit ?? 0, color: '#10B981' },
    { label: 'Vol', value: lead?.volume ?? 0, color: '#F97316' },
    { label: 'Zeit', value: lead?.timing ?? 0, color: '#94A3B8' },
  ];

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
                }}
              >
                👥 {lead.employees} Mitarbeiter
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
                }}
              >
                📅 Seit {lead.founded}
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
                }}
              >
                🌐 {lead.website.replace(/^https?:\/\//, '').replace(/\/$/, '')} ↗
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
                }}
              >
                📞 {lead.phone}
              </a>
            )}
          </div>
        </div>

        {/* Score — big badge (Screenshot 2 style) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
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

        {/* CTA */}
        <button
          style={{
            padding: '8px 18px',
            borderRadius: 9,
            background: '#10B981',
            color: '#fff',
            border: 'none',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
            flexShrink: 0,
            boxShadow: '0 4px 14px rgba(16,185,129,0.35)',
          }}
        >
          KI-Analyse
        </button>
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
