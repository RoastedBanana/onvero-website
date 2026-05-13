'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpIcon, PaperclipIcon, PlusIcon, SearchIcon } from 'lucide-react';
import { useTheme, colors } from '../layout';
import { GlassPageFilters } from '@/components/ui/liquid-glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { TypingEffect } from '@/components/ui/typing-effect';

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

type ChatSession = {
  id: string;
  title: string;
  preview: string;
  time: string;
  group: SessionGroup;
  messages: Message[];
  sources: Set<SourceId>;
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

const SUGGESTIONS = [
  'Möbel & Einrichtung, 20–80 MA',
  'Fashion Brands in Deutschland',
  'B2B SaaS Startups',
  'Sport & Outdoor Händler',
];

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

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function ChatSidebar({
  c,
  isDark,
  sessions,
  activeId,
  onSelect,
  onNew,
}: {
  c: ReturnType<typeof colors>;
  isDark: boolean;
  sessions: ChatSession[];
  activeId: string;
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

  return (
    <aside
      style={{
        width: 220,
        minWidth: 220,
        background: isDark ? 'rgba(10,12,24,0.40)' : 'rgba(255,255,255,0.42)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        borderRight: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        flexShrink: 0,
        height: '100%',
        position: 'relative',
        zIndex: 25,
      }}
    >
      {/* New chat button */}
      <div
        style={{ padding: '14px 12px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <span style={{ fontSize: 15, fontWeight: 700, color: c.text, letterSpacing: '-0.01em' }}>Lead Scout</span>
        <button
          onClick={onNew}
          title="Neue Suche"
          style={{
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 7,
            border: 'none',
            background: 'transparent',
            color: c.textMuted,
            cursor: 'pointer',
            transition: 'background 100ms ease-out, color 100ms ease-out',
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
          <PlusIcon size={16} />
        </button>
      </div>

      {/* Grouped sessions */}
      <div style={{ flex: 1, padding: '0 6px 16px', overflowY: 'auto' }}>
        {GROUP_ORDER.map((group) => {
          const items = grouped[group];
          if (items.length === 0) return null;
          return (
            <div key={group}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: c.textMuted,
                  padding: '10px 10px 3px',
                }}
              >
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
    </aside>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DiscoveryPage() {
  const { theme } = useTheme();
  const c = colors(theme);
  const isDark = theme === 'dark';

  const [sessions, setSessions] = useState<ChatSession[]>(SEED_SESSIONS);
  const [activeId, setActiveId] = useState<string>('h1');
  const [selectedSources, setSelectedSources] = useState<Set<SourceId>>(new Set(['google_maps', 'linkedin', 'web']));
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevActiveIdRef = useRef<string>(activeId);

  const activeSession = sessions.find((s) => s.id === activeId);
  const activeMessages = activeSession?.messages ?? [];
  const hasMessages = activeMessages.length > 0;

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
          paddingTop: 84,
        }}
      >
        {/* Message thread */}
        <div ref={scrollContainerRef} style={{ flex: 1, overflowY: 'auto', padding: '0 0 8px' }}>
          <AnimatePresence>
            {!hasMessages && (
              <motion.div
                key={`empty-${activeId}`}
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
                }}
              >
                <div style={{ marginBottom: 12 }}>
                  <TypingEffect
                    texts={[
                      'Möbel & Einrichtung',
                      'Fashion Brands DE',
                      'B2B SaaS Startups',
                      'Sport & Outdoor',
                      'Premium Küchen',
                      'Elektronik Handel',
                    ]}
                    typingSpeed={60}
                    rotationInterval={2200}
                    className="font-inter"
                    style={{
                      fontSize: 32,
                      fontWeight: 800,
                      color: c.text,
                      letterSpacing: '-0.03em',
                      lineHeight: 1.15,
                      fontFamily: 'var(--font-inter), Inter, sans-serif',
                    }}
                  />
                </div>
                <div style={{ fontSize: 14, color: c.textMuted, marginBottom: 36, maxWidth: 380 }}>
                  Beschreibe Branche, Region oder Unternehmensgrösse — ich suche über alle aktiven Quellen.
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 480 }}>
                  {SUGGESTIONS.map((s, i) => (
                    <motion.div
                      key={s}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.07 }}
                    >
                      <GlassButton
                        size="sm"
                        isDark={isDark}
                        onClick={() => send(s)}
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: c.text,
                          fontFamily: 'inherit',
                        }}
                      >
                        {s}
                      </GlassButton>
                    </motion.div>
                  ))}
                </div>
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
        <div style={{ padding: '12px 32px 28px', flexShrink: 0 }}>
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
      </div>
    </div>
  );
}
